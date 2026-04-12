import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as turf from "https://esm.sh/@turf/turf@7";

// --- Config ---
const TESLA_CLIENT_ID = "39a99319-b708-4245-a29f-6907373f37ad";
const TESLA_CLIENT_SECRET = "ta-secret.2MFoIX!OCjup0Nr5";
const TESLA_TOKEN_URL = "https://fleet-auth.prd.vn.cloud.tesla.com/oauth2/v3/token";
const FLEET_API_BASE = "https://fleet-api.prd.na.vn.cloud.tesla.com";
const DATA_BASE_URL = "https://raw.githubusercontent.com/kaushalpartani/sf-street-cleaning/refs/heads/main/data";

// Location tolerance: if car moved less than 50m, consider it same spot
const LOCATION_TOLERANCE_M = 50;
// Only notify about cleaning within 7 days
const NOTIFY_WITHIN_DAYS = 7;
// Don't re-notify about same location within 12 hours
const RENOTIFY_COOLDOWN_MS = 12 * 60 * 60 * 1000;

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// --- Types ---
interface TeslaUser {
  id: string;
  tesla_user_id: string;
  access_token: string;
  refresh_token: string;
  token_expires_at: string;
  last_checked_at: string | null;
  last_shift_state: string | null;
  last_latitude: number | null;
  last_longitude: number | null;
  last_notification_at: string | null;
  notify_telegram_chat_id: string | null;
}

interface CleaningSide {
  NextCleaning: string | null;
  NextNextCleaning: string | null;
  NextCleaningEnd: string | null;
  NextNextCleaningEnd: string | null;
  NextCleaningCalendarLink: string | null;
  NextNextCleaningCalendarLink: string | null;
}

// --- Helpers ---

function decodeJwtPayload(token: string): Record<string, unknown> {
  const parts = token.split(".");
  const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
  return JSON.parse(atob(payload));
}

async function refreshTeslaToken(refreshToken: string): Promise<{ access_token: string; refresh_token: string; expires_in: number } | null> {
  try {
    const resp = await fetch(TESLA_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grant_type: "refresh_token",
        client_id: TESLA_CLIENT_ID,
        client_secret: TESLA_CLIENT_SECRET,
        refresh_token: refreshToken,
      }),
    });
    if (!resp.ok) {
      console.error("Token refresh failed:", resp.status, await resp.text());
      return null;
    }
    return await resp.json();
  } catch (e) {
    console.error("Token refresh error:", e);
    return null;
  }
}

async function teslaGet(path: string, token: string): Promise<any> {
  const resp = await fetch(`${FLEET_API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Tesla API ${path} failed (${resp.status}): ${text}`);
  }
  return resp.json();
}

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const pt1 = turf.point([lon1, lat1]);
  const pt2 = turf.point([lon2, lat2]);
  return turf.distance(pt1, pt2, { units: "meters" });
}

function getRelevantCleaning(side: CleaningSide): { start: string; end: string; calendarLink: string | null } | null {
  const now = new Date();
  const withinLimit = new Date(now.getTime() + NOTIFY_WITHIN_DAYS * 24 * 60 * 60 * 1000);

  if (side.NextCleaning) {
    const nextEnd = side.NextCleaningEnd ? new Date(side.NextCleaningEnd) : new Date(side.NextCleaning);
    const nextStart = new Date(side.NextCleaning);
    if (nextEnd > now && nextStart < withinLimit) {
      return { start: side.NextCleaning, end: side.NextCleaningEnd || side.NextCleaning, calendarLink: side.NextCleaningCalendarLink || null };
    }
  }

  if (side.NextNextCleaning) {
    const nextStart = new Date(side.NextNextCleaning);
    if (nextStart < withinLimit) {
      return { start: side.NextNextCleaning, end: side.NextNextCleaningEnd || side.NextNextCleaning, calendarLink: side.NextNextCleaningCalendarLink || null };
    }
  }

  return null;
}

function determineSide(lat: number, lng: number, lineCoords: number[][], sideKeys: string[]): string | null {
  if (lineCoords.length < 2 || sideKeys.length === 0) return null;

  const pt = turf.point([lng, lat]);
  const line = turf.lineString(lineCoords);
  const snapped = turf.nearestPointOnLine(line, pt);
  const idx = snapped.properties.index ?? 0;

  const segStart = lineCoords[Math.min(idx, lineCoords.length - 2)];
  const segEnd = lineCoords[Math.min(idx + 1, lineCoords.length - 1)];

  const dx = segEnd[0] - segStart[0];
  const dy = segEnd[1] - segStart[1];
  const nearPt = snapped.geometry.coordinates;
  const px = lng - nearPt[0];
  const py = lat - nearPt[1];
  const cross = dx * py - dy * px;
  const absDx = Math.abs(dx);
  const absDy = Math.abs(dy);

  let detectedSide: string | null = null;
  if (absDx >= absDy) {
    detectedSide = (dx >= 0 ? (cross > 0 ? "North" : "South") : (cross > 0 ? "South" : "North"));
  } else {
    detectedSide = (dy >= 0 ? (cross > 0 ? "West" : "East") : (cross > 0 ? "East" : "West"));
  }

  if (detectedSide && sideKeys.includes(detectedSide)) return detectedSide;

  if (sideKeys.length === 2) {
    const sorted = [...sideKeys].sort();
    return cross > 0 ? sorted[0] : sorted[1];
  }

  return sideKeys[0] || null;
}

function formatCleaningRange(startStr: string, endStr: string): string {
  const start = new Date(startStr);
  const end = new Date(endStr);
  const dateStr = start.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "America/Los_Angeles" });
  const startTime = start.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: "America/Los_Angeles" });
  const endTime = end.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: "America/Los_Angeles" });
  return `${dateStr}, ${startTime} - ${endTime}`;
}

function getTimeUntil(startStr: string): string {
  const now = new Date();
  const start = new Date(startStr);
  const diffMs = start.getTime() - now.getTime();
  if (diffMs < 0) return "NOW";
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  if (hours >= 48) return `in ${Math.floor(hours / 24)} days`;
  if (hours >= 24) return `in 1 day, ${hours - 24} hrs`;
  const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  if (hours >= 1) return `in ${hours}h ${mins}m`;
  return `in ${mins} min`;
}

async function sendTelegramMessage(chatId: string, text: string): Promise<void> {
  const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN");
  if (!botToken) {
    console.error("TELEGRAM_BOT_TOKEN not set");
    return;
  }
  try {
    const resp = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    });
    if (!resp.ok) {
      console.error("Telegram send failed:", resp.status, await resp.text());
    }
  } catch (e) {
    console.error("Telegram error:", e);
  }
}

// --- Main handler ---

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  try {
    // 1. Get all tesla users
    const { data: users, error: fetchError } = await supabase
      .from("tesla_users")
      .select("*");

    if (fetchError) throw new Error(`DB fetch error: ${fetchError.message}`);
    if (!users || users.length === 0) {
      return new Response(JSON.stringify({ message: "No users to check" }), {
        status: 200,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    console.log(`Processing ${users.length} user(s)...`);
    const results: string[] = [];

    for (const user of users as TeslaUser[]) {
      try {
        let accessToken = user.access_token;

        // 2. Check if token expired, refresh if needed
        const tokenExpiry = new Date(user.token_expires_at);
        if (tokenExpiry < new Date(Date.now() + 5 * 60 * 1000)) {
          console.log(`Refreshing token for user ${user.tesla_user_id}...`);
          const refreshed = await refreshTeslaToken(user.refresh_token);
          if (!refreshed) {
            results.push(`${user.tesla_user_id}: token refresh failed`);
            continue;
          }
          accessToken = refreshed.access_token;
          const newExpiry = new Date(Date.now() + refreshed.expires_in * 1000).toISOString();

          await supabase.from("tesla_users").update({
            access_token: refreshed.access_token,
            refresh_token: refreshed.refresh_token,
            token_expires_at: newExpiry,
            updated_at: new Date().toISOString(),
          }).eq("id", user.id);
        }

        // 3. Get vehicles
        const vehiclesResp = await teslaGet("/api/1/vehicles", accessToken);
        const vehicles = vehiclesResp.response || [];
        console.log(`User ${user.tesla_user_id}: ${vehicles.length} vehicle(s)`);

        for (const vehicle of vehicles) {
          try {
            // Only check online vehicles — don't wake them up (battery drain)
            if (vehicle.state !== "online") {
              console.log(`Vehicle ${vehicle.display_name} is ${vehicle.state}, skipping`);
              continue;
            }

            // 4. Get vehicle data
            const vdResp = await teslaGet(
              `/api/1/vehicles/${vehicle.id}/vehicle_data?endpoints=location_data;drive_state`,
              accessToken
            );
            const vd = vdResp.response;
            const driveState = vd?.drive_state;

            if (!driveState) {
              console.log(`No drive_state for ${vehicle.display_name}`);
              continue;
            }

            const shiftState = driveState.shift_state || "P"; // null usually means P
            const lat = driveState.latitude;
            const lng = driveState.longitude;

            console.log(`Vehicle ${vehicle.display_name}: shift=${shiftState}, lat=${lat}, lng=${lng}`);

            // Update DB with latest state
            await supabase.from("tesla_users").update({
              last_checked_at: new Date().toISOString(),
              last_shift_state: shiftState,
              last_latitude: lat,
              last_longitude: lng,
              updated_at: new Date().toISOString(),
            }).eq("id", user.id);

            // Only check if parked
            if (shiftState !== "P" && shiftState !== null) {
              results.push(`${vehicle.display_name}: driving (${shiftState})`);
              continue;
            }

            // 5. Check if same location as last check (within tolerance)
            if (user.last_latitude && user.last_longitude) {
              const dist = haversineDistance(lat, lng, user.last_latitude, user.last_longitude);
              if (dist < LOCATION_TOLERANCE_M) {
                // Same spot — check cooldown
                if (user.last_notification_at) {
                  const sinceNotify = Date.now() - new Date(user.last_notification_at).getTime();
                  if (sinceNotify < RENOTIFY_COOLDOWN_MS) {
                    results.push(`${vehicle.display_name}: same location, already notified`);
                    continue;
                  }
                }
              }
            }

            // 6. Look up street cleaning data
            if (!user.notify_telegram_chat_id) {
              results.push(`${vehicle.display_name}: no telegram chat_id configured`);
              continue;
            }

            console.log(`Looking up street cleaning for (${lat}, ${lng})...`);

            // Fetch neighborhood boundaries
            const nhoodResp = await fetch(`${DATA_BASE_URL}/neighborhoods.geojson`);
            if (!nhoodResp.ok) throw new Error("Failed to fetch neighborhoods");
            const neighborhoods = await nhoodResp.json();

            // Find neighborhood via point-in-polygon
            const pt = turf.point([lng, lat]);
            let neighborhoodName: string | null = null;

            for (const feature of neighborhoods.features) {
              if (turf.booleanPointInPolygon(pt, feature)) {
                const props = feature.properties || {};
                neighborhoodName = props.FileName || props.NeighborhoodName || props.nhood || props.name || props.NEIGHBORHOOD;
                break;
              }
            }

            if (!neighborhoodName) {
              results.push(`${vehicle.display_name}: not in SF (${lat}, ${lng})`);
              continue;
            }

            console.log(`Neighborhood: ${neighborhoodName}`);

            // Fetch neighborhood street data
            const streetResp = await fetch(`${DATA_BASE_URL}/neighborhoods/${encodeURIComponent(neighborhoodName)}.geojson`);
            if (!streetResp.ok) {
              results.push(`${vehicle.display_name}: no street data for ${neighborhoodName}`);
              continue;
            }
            const streetData = await streetResp.json();

            // Find nearest segment
            let nearestFeature: any = null;
            let nearestDistance = Infinity;

            for (const feature of streetData.features) {
              try {
                const coords = feature.geometry.type === "MultiLineString"
                  ? feature.geometry.coordinates[0]
                  : feature.geometry.coordinates;
                const line = turf.lineString(coords);
                const snapped = turf.nearestPointOnLine(line, pt, { units: "meters" });
                const dist = snapped.properties.dist ?? Infinity;
                if (dist < nearestDistance) {
                  nearestDistance = dist;
                  nearestFeature = feature;
                }
              } catch {
                continue;
              }
            }

            if (!nearestFeature || nearestDistance > 100) {
              results.push(`${vehicle.display_name}: no nearby street segment (${nearestDistance}m)`);
              continue;
            }

            const props = nearestFeature.properties;
            const corridor = props.Corridor || "Unknown Street";
            const limits = props.Limits || "";
            const sidesObj = props.Sides || {};
            const sideKeys = Object.keys(sidesObj).filter((k: string) => sidesObj[k]);

            // Determine which side of street
            const geom = nearestFeature.geometry;
            const lineCoords = geom.type === "MultiLineString" ? geom.coordinates[0] : geom.coordinates;
            const parkedSide = determineSide(lat, lng, lineCoords, sideKeys);

            // Check cleaning schedules
            const notifications: string[] = [];

            for (const sideKey of sideKeys) {
              const sideData = sidesObj[sideKey];
              if (!sideData) continue;
              const cleaning = getRelevantCleaning(sideData);
              if (!cleaning) continue;

              const isParkedSide = parkedSide === sideKey;
              const status = getTimeUntil(cleaning.start);
              const range = formatCleaningRange(cleaning.start, cleaning.end);

              // Only notify about the side they're parked on, or both if uncertain
              if (parkedSide && !isParkedSide) continue;

              const urgencyEmoji = status === "NOW" ? "🚨" :
                status.includes("min") || (status.includes("h") && !status.includes("day")) ? "⚠️" : "📋";

              let msg = `${urgencyEmoji} <b>Street Cleaning Alert</b>\n\n`;
              msg += `🚗 <b>${vehicle.display_name}</b>\n`;
              msg += `📍 ${corridor}`;
              if (limits) msg += ` (${limits})`;
              msg += `\n`;
              msg += `↔️ ${sideKey} Side`;
              if (isParkedSide) msg += ` (your side)`;
              msg += `\n\n`;
              msg += `🧹 <b>${range}</b>\n`;
              msg += `⏰ ${status}\n`;

              if (cleaning.calendarLink) {
                msg += `\n📅 <a href="${cleaning.calendarLink}">Add to Google Calendar</a>`;
              }

              notifications.push(msg);
            }

            if (notifications.length > 0) {
              for (const msg of notifications) {
                await sendTelegramMessage(user.notify_telegram_chat_id, msg);
              }
              await supabase.from("tesla_users").update({
                last_notification_at: new Date().toISOString(),
              }).eq("id", user.id);
              results.push(`${vehicle.display_name}: sent ${notifications.length} notification(s)`);
            } else {
              results.push(`${vehicle.display_name}: parked on ${corridor}, no upcoming cleaning`);
            }
          } catch (vErr: any) {
            console.error(`Vehicle error:`, vErr);
            results.push(`Vehicle ${vehicle.display_name}: ${vErr.message}`);
          }
        }
      } catch (uErr: any) {
        console.error(`User error:`, uErr);
        results.push(`User ${user.tesla_user_id}: ${uErr.message}`);
      }
    }

    console.log("Results:", results);

    return new Response(
      JSON.stringify({ success: true, results }),
      { status: 200, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Fatal error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    );
  }
});
