import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const FLEET_API = 'https://fleet-api.prd.na.vn.cloud.tesla.com/api/1';
const CLEANING_DATA_BASE = 'https://raw.githubusercontent.com/kaushalpartani/sf-street-cleaning/main/data';

serve(async (req) => {
  // Allow manual trigger via POST or cron via GET
  if (req.method !== 'GET' && req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const resendKey = Deno.env.get('RESEND_API_KEY');
  const clientId = Deno.env.get('TESLA_CLIENT_ID') || '39a99319-b708-4245-a29f-6907373f37ad';
  const clientSecret = Deno.env.get('TESLA_CLIENT_SECRET');
  const db = createClient(supabaseUrl, supabaseKey);

  const results: string[] = [];

  try {
    // Get all users with notification prefs
    const { data: users, error } = await db
      .from('tesla_users')
      .select('*')
      .not('notification_prefs', 'is', null)
      .not('email', 'is', null);

    if (error) throw error;
    if (!users || users.length === 0) {
      return new Response(JSON.stringify({ message: 'No users to check', results }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    for (const user of users) {
      try {
        // Refresh token if expired
        let accessToken = user.access_token;
        const expiresAt = new Date(user.token_expires_at);

        if (expiresAt < new Date()) {
          if (!clientSecret) {
            results.push(`${user.email}: skipped — no client secret for refresh`);
            continue;
          }

          const refreshRes = await fetch('https://fleet-auth.prd.vn.cloud.tesla.com/oauth2/v3/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
              grant_type: 'refresh_token',
              client_id: clientId,
              client_secret: clientSecret,
              refresh_token: user.refresh_token,
            }),
          });

          if (!refreshRes.ok) {
            results.push(`${user.email}: token refresh failed`);
            continue;
          }

          const newTokens = await refreshRes.json();
          accessToken = newTokens.access_token;

          await db.from('tesla_users').update({
            access_token: newTokens.access_token,
            refresh_token: newTokens.refresh_token || user.refresh_token,
            token_expires_at: new Date(Date.now() + newTokens.expires_in * 1000).toISOString(),
            updated_at: new Date().toISOString(),
          }).eq('id', user.id);
        }

        // Get vehicle location (don't wake — only check if already online)
        const vehicleId = user.vehicle_id;
        if (!vehicleId) {
          results.push(`${user.email}: no vehicle selected`);
          continue;
        }

        // Check vehicle state without waking
        let location;
        try {
          const dataRes = await fetch(
            `${FLEET_API}/vehicles/${vehicleId}/vehicle_data?endpoints=location_data`,
            { headers: { Authorization: `Bearer ${accessToken}` } }
          );

          if (dataRes.status === 408) {
            // Car is asleep — use last known location if available
            if (user.last_location) {
              location = user.last_location;
            } else {
              results.push(`${user.email}: car asleep, no cached location`);
              continue;
            }
          } else if (!dataRes.ok) {
            results.push(`${user.email}: vehicle API error ${dataRes.status}`);
            continue;
          } else {
            const vehicleData = await dataRes.json();
            const ds = vehicleData.response?.drive_state;
            if (!ds?.latitude || !ds?.longitude) {
              results.push(`${user.email}: no location data`);
              continue;
            }
            location = { latitude: ds.latitude, longitude: ds.longitude };

            // Cache location
            await db.from('tesla_users').update({
              last_location: location,
              updated_at: new Date().toISOString(),
            }).eq('id', user.id);
          }
        } catch (e) {
          // Use cached location
          if (user.last_location) {
            location = user.last_location;
          } else {
            results.push(`${user.email}: ${e}`);
            continue;
          }
        }

        // Find cleaning schedule
        const cleaning = await findNearestCleaning(location.latitude, location.longitude);
        if (!cleaning || !cleaning.nextCleaning) {
          results.push(`${user.email}: no cleaning found at location`);
          continue;
        }

        // Check if we should send notification based on user prefs
        const prefs = user.notification_prefs as Record<string, boolean>;
        const nextClean = new Date(cleaning.nextCleaning);
        const now = new Date();
        const hoursUntil = (nextClean.getTime() - now.getTime()) / (1000 * 60 * 60);

        // Check cooldown (12hrs since last notification for same spot)
        if (user.last_notified_at) {
          const lastNotified = new Date(user.last_notified_at);
          const hoursSinceNotif = (now.getTime() - lastNotified.getTime()) / (1000 * 60 * 60);
          if (hoursSinceNotif < 12) {
            results.push(`${user.email}: cooldown active (${Math.round(hoursSinceNotif)}h since last)`);
            continue;
          }
        }

        let shouldNotify = false;
        let leadTime = '';

        if (prefs['2d'] && hoursUntil <= 48 && hoursUntil > 24) {
          shouldNotify = true;
          leadTime = '2 days';
        } else if (prefs['1d'] && hoursUntil <= 24 && hoursUntil > 3) {
          shouldNotify = true;
          leadTime = '1 day';
        } else if (prefs['3h'] && hoursUntil <= 3 && hoursUntil > 1) {
          shouldNotify = true;
          leadTime = '3 hours';
        } else if (prefs['1h'] && hoursUntil <= 1 && hoursUntil > 0) {
          shouldNotify = true;
          leadTime = '1 hour';
        }

        if (!shouldNotify) {
          results.push(`${user.email}: cleaning in ${Math.round(hoursUntil)}h — not in notification window`);
          continue;
        }

        // Send email via Resend
        if (resendKey && user.email) {
          const calUrl = buildCalendarUrl(cleaning);
          const emailRes = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${resendKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from: 'SF Parking <parking@maxkolysh.com>',
              to: user.email,
              subject: `🚗 Street cleaning in ${leadTime} — move your car!`,
              html: `
                <div style="font-family: -apple-system, sans-serif; max-width: 500px; margin: 0 auto;">
                  <h2>Street Cleaning Alert</h2>
                  <p>Your Tesla is parked on <strong>${cleaning.streetName}</strong> (${cleaning.side} side) in ${cleaning.neighborhoodName}.</p>
                  <p>Street cleaning starts in <strong>${leadTime}</strong>:</p>
                  <p style="font-size: 18px; font-weight: bold;">
                    ${nextClean.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                    at ${nextClean.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                  </p>
                  <a href="${calUrl}" style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-top: 12px;">
                    📅 Add to Calendar
                  </a>
                  <p style="color: #999; font-size: 12px; margin-top: 24px;">
                    From <a href="https://maxkolysh.com/parking">SF Street Cleaning Notifier</a>
                  </p>
                </div>
              `,
            }),
          });

          if (emailRes.ok) {
            await db.from('tesla_users').update({
              last_notified_at: now.toISOString(),
              last_cleaning_info: cleaning,
              updated_at: now.toISOString(),
            }).eq('id', user.id);

            results.push(`${user.email}: ✅ notified — cleaning in ${leadTime}`);
          } else {
            const emailErr = await emailRes.text();
            results.push(`${user.email}: email send failed — ${emailErr}`);
          }
        } else {
          results.push(`${user.email}: no resend key or email`);
        }
      } catch (e) {
        results.push(`${user.email}: error — ${e}`);
      }
    }

    return new Response(JSON.stringify({ message: 'Check complete', results }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e), results }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});

// Simplified version of street cleaning lookup for edge function
interface CleaningInfo {
  streetName: string;
  side: string;
  nextCleaning: string;
  neighborhoodName: string;
  recurringPattern?: string;
}

async function findNearestCleaning(lat: number, lng: number): Promise<CleaningInfo | null> {
  // Load neighborhood index
  const indexRes = await fetch(`${CLEANING_DATA_BASE}/neighborhoods.json`);
  if (!indexRes.ok) return null;
  const neighborhoods = await indexRes.json();

  // Try nearby neighborhoods
  const priority = ['NoeValley', 'TheCastro', 'MissionDolores', 'Mission', 'GlenPark', 'BernalHeights', 'Eureka', 'Corona'];
  const sorted = [
    ...neighborhoods.filter((n: { FileName: string }) => priority.includes(n.FileName)),
    ...neighborhoods.filter((n: { FileName: string }) => !priority.includes(n.FileName)),
  ];

  let bestDist = Infinity;
  let bestResult: CleaningInfo | null = null;

  for (const hood of sorted.slice(0, 8)) {
    try {
      const res = await fetch(`${CLEANING_DATA_BASE}/neighborhoods/${hood.FileName}.geojson`);
      if (!res.ok) continue;
      const geojson = await res.json();

      for (const feature of geojson.features) {
        if (feature.geometry.type !== 'LineString') continue;
        const coords = feature.geometry.coordinates as number[][];
        if (coords.length < 2) continue;

        // Simple distance check — nearest point on line
        const dist = pointToLineDistance(lng, lat, coords);
        if (dist < bestDist && dist < 0.001) { // ~100m in degrees
          bestDist = dist;

          const props = feature.properties;
          if (!props?.Sides) continue;

          const side = determineStreetSide(lat, lng, coords);
          const sideKey = side as keyof typeof props.Sides;
          const sideData = props.Sides[sideKey];

          if (sideData?.NextCleaning) {
            bestResult = {
              streetName: props.StreetName || 'Unknown',
              side,
              nextCleaning: sideData.NextCleaning,
              neighborhoodName: hood.NeighborhoodName,
            };
          }
        }
      }

      if (bestDist < 0.0003) break; // Close enough
    } catch {
      continue;
    }
  }

  return bestResult;
}

function pointToLineDistance(px: number, py: number, coords: number[][]): number {
  let minDist = Infinity;
  for (let i = 0; i < coords.length - 1; i++) {
    const dist = pointToSegmentDistance(px, py, coords[i][0], coords[i][1], coords[i + 1][0], coords[i + 1][1]);
    if (dist < minDist) minDist = dist;
  }
  return minDist;
}

function pointToSegmentDistance(px: number, py: number, x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.sqrt((px - x1) ** 2 + (py - y1) ** 2);

  let t = ((px - x1) * dx + (py - y1) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));

  const nearX = x1 + t * dx;
  const nearY = y1 + t * dy;
  return Math.sqrt((px - nearX) ** 2 + (py - nearY) ** 2);
}

function determineStreetSide(lat: number, lng: number, coords: number[][]): string {
  let minDist = Infinity;
  let closestIdx = 0;

  for (let i = 0; i < coords.length - 1; i++) {
    const dist = pointToSegmentDistance(lng, lat, coords[i][0], coords[i][1], coords[i + 1][0], coords[i + 1][1]);
    if (dist < minDist) {
      minDist = dist;
      closestIdx = i;
    }
  }

  const p1 = coords[closestIdx];
  const p2 = coords[closestIdx + 1];
  const dx = p2[0] - p1[0];
  const dy = p2[1] - p1[1];
  const cx = lng - p1[0];
  const cy = lat - p1[1];
  const cross = dx * cy - dy * cx;

  const bearing = Math.atan2(dx, dy) * 180 / Math.PI;
  const absBearing = Math.abs(bearing);

  if (absBearing < 45 || absBearing > 135) {
    return cross > 0 ? 'East' : 'West';
  } else {
    return cross > 0 ? 'North' : 'South';
  }
}

function buildCalendarUrl(cleaning: CleaningInfo): string {
  const date = new Date(cleaning.nextCleaning);
  const endDate = new Date(date.getTime() + 2 * 60 * 60 * 1000);
  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: `🚗 Move Car — Street Cleaning (${cleaning.streetName})`,
    dates: `${fmt(date)}/${fmt(endDate)}`,
    details: `Street cleaning on ${cleaning.streetName} (${cleaning.side} side) in ${cleaning.neighborhoodName}.`,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
