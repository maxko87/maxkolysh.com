import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as turf from "https://esm.sh/@turf/turf@7";

// --- Config ---
const DATA_BASE_URL = "https://raw.githubusercontent.com/kaushalpartani/sf-street-cleaning/refs/heads/main/data";
const NOTIFY_WITHIN_DAYS = 7;

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// --- Types ---
interface TeslaUser {
  id: string;
  tesla_user_id: string;
  last_latitude: number | null;
  last_longitude: number | null;
  notify_telegram_chat_id: string | null;
  email: string | null;
  notification_prefs: Record<string, boolean> | null;
  last_reminders_sent: Record<string, string> | null;
  vehicle_name: string | null;
}

interface CleaningSide {
  NextCleaning: string | null;
  NextNextCleaning: string | null;
  NextCleaningEnd: string | null;
  NextNextCleaningEnd: string | null;
  NextCleaningCalendarLink: string | null;
  NextNextCleaningCalendarLink: string | null;
}

// Reminder windows: [minMs, maxMs] before cleaning start
// Using wide windows so 5-min polling doesn't miss them
const REMINDER_WINDOWS: Record<string, { minMs: number; maxMs: number; label: string }> = {
  "1h": { minMs: 30 * 60 * 1000, maxMs: 90 * 60 * 1000, label: "1 hour" },
  "3h": { minMs: 2.5 * 60 * 60 * 1000, maxMs: 3.5 * 60 * 60 * 1000, label: "3 hours" },
  "1d": { minMs: 22 * 60 * 60 * 1000, maxMs: 26 * 60 * 60 * 1000, label: "1 day" },
  "2d": { minMs: 46 * 60 * 60 * 1000, maxMs: 50 * 60 * 60 * 1000, label: "2 days" },
};

// --- Helpers ---

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
  return `${dateStr}, ${startTime} – ${endTime}`;
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

async function sendEmailNotification(email: string, subject: string, htmlBody: string): Promise<void> {
  const resendKey = Deno.env.get("RESEND_API_KEY");
  if (!resendKey) {
    console.error("RESEND_API_KEY not set");
    return;
  }
  try {
    const resp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "SF Parking <parking@maxkolysh.com>",
        to: email,
        subject,
        html: htmlBody,
      }),
    });
    if (!resp.ok) {
      console.error("Resend send failed:", resp.status, await resp.text());
    }
  } catch (e) {
    console.error("Email error:", e);
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
    // 1. Get all tesla users with location and notification prefs
    const { data: users, error: fetchError } = await supabase
      .from("tesla_users")
      .select("id, tesla_user_id, last_latitude, last_longitude, notify_telegram_chat_id, email, notification_prefs, last_reminders_sent, vehicle_name");

    if (fetchError) throw new Error(`DB fetch error: ${fetchError.message}`);
    if (!users || users.length === 0) {
      return new Response(JSON.stringify({ message: "No users to check" }), {
        status: 200,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    console.log(`Processing ${users.length} user(s) for reminders...`);
    const results: string[] = [];

    for (const user of users as TeslaUser[]) {
      try {
        const prefs = user.notification_prefs || {};
        const enabledPrefs = Object.entries(prefs).filter(([key, val]) => val && REMINDER_WINDOWS[key]);
        
        if (enabledPrefs.length === 0) {
          results.push(`${user.tesla_user_id}: no reminder prefs enabled`);
          continue;
        }

        if (!user.last_latitude || !user.last_longitude) {
          results.push(`${user.tesla_user_id}: no stored location`);
          continue;
        }

        if (!user.notify_telegram_chat_id && !user.email) {
          results.push(`${user.tesla_user_id}: no notification channel`);
          continue;
        }

        const lat = user.last_latitude;
        const lng = user.last_longitude;

        // 2. Look up street cleaning for stored location
        const pt = turf.point([lng, lat]);

        // Fetch neighborhood boundaries
        const nhoodResp = await fetch(`${DATA_BASE_URL}/neighborhoods.geojson`);
        if (!nhoodResp.ok) throw new Error("Failed to fetch neighborhoods");
        const neighborhoods = await nhoodResp.json();

        let neighborhoodName: string | null = null;
        for (const feature of neighborhoods.features) {
          if (turf.booleanPointInPolygon(pt, feature)) {
            const props = feature.properties || {};
            neighborhoodName = props.FileName || props.NeighborhoodName || props.nhood || props.name || props.NEIGHBORHOOD;
            break;
          }
        }

        if (!neighborhoodName) {
          results.push(`${user.tesla_user_id}: not in SF`);
          continue;
        }

        const streetResp = await fetch(`${DATA_BASE_URL}/neighborhoods/${encodeURIComponent(neighborhoodName)}.geojson`);
        if (!streetResp.ok) {
          results.push(`${user.tesla_user_id}: no street data for ${neighborhoodName}`);
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
          results.push(`${user.tesla_user_id}: no nearby street segment`);
          continue;
        }

        const props = nearestFeature.properties;
        const corridor = props.Corridor || "Unknown Street";
        const sidesObj = props.Sides || {};
        const sideKeys = Object.keys(sidesObj).filter((k: string) => sidesObj[k]);

        const geom = nearestFeature.geometry;
        const lineCoords = geom.type === "MultiLineString" ? geom.coordinates[0] : geom.coordinates;
        const parkedSide = determineSide(lat, lng, lineCoords, sideKeys);

        // Find cleaning info for parked side
        let cleaningInfo: { start: string; end: string; calendarLink: string | null } | null = null;
        let cleaningSideKey: string | null = null;

        for (const sideKey of sideKeys) {
          if (parkedSide && parkedSide !== sideKey) continue;
          const sideData = sidesObj[sideKey];
          if (!sideData) continue;
          const cleaning = getRelevantCleaning(sideData);
          if (cleaning) {
            cleaningInfo = cleaning;
            cleaningSideKey = sideKey;
            break;
          }
        }

        if (!cleaningInfo) {
          results.push(`${user.tesla_user_id}: no upcoming cleaning`);
          continue;
        }

        // 3. Check each enabled pref against the window
        const now = new Date();
        const cleaningStart = new Date(cleaningInfo.start);
        const timeUntilMs = cleaningStart.getTime() - now.getTime();
        const remindersSent = user.last_reminders_sent || {};
        let updatedReminders = { ...remindersSent };
        let sentCount = 0;

        for (const [prefKey] of enabledPrefs) {
          const window = REMINDER_WINDOWS[prefKey];
          if (!window) continue;

          // Already sent this reminder for current location?
          if (remindersSent[prefKey]) continue;

          // Check if we're within the window
          if (timeUntilMs >= window.minMs && timeUntilMs <= window.maxMs) {
            const sideLabel = cleaningSideKey ? `${cleaningSideKey.toLowerCase()} side` : "";
            const range = formatCleaningRange(cleaningInfo.start, cleaningInfo.end);

            // Build Telegram message — urgent tone
            const carName = user.vehicle_name || "your car";
            // Build Telegram message — urgent tone
            let telegramMsg = `⚠️ <b>Move ${carName} — street cleaning in ${window.label}</b>\n\n`;
            telegramMsg += `Street cleaning starts in about ${window.label} where ${carName} is parked on ${corridor}${sideLabel ? ` (${sideLabel})` : ""}.\n\n`;
            telegramMsg += `${range}\n\n`;
            telegramMsg += `Move ${carName} to avoid a ticket.`;
            // Build email HTML — urgent tone
            const emailSubject = `Move ${carName} — street cleaning in ${window.label}`;
            let emailHtml = `<div style="font-family: -apple-system, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">`;
            emailHtml += `<p>Street cleaning starts in about <strong>${window.label}</strong> where ${carName} is parked on ${corridor}${sideLabel ? ` (${sideLabel})` : ""}.</p>`;
            emailHtml += `<p><strong>${range}</strong></p>`;
            emailHtml += `<p>Move ${carName} to avoid a ticket.</p>`;
            emailHtml += `<hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;">`;
            emailHtml += `<p style="color: #999; font-size: 12px;">SF Street Cleaning Notifier<br><a href="https://maxkolysh.com/parking">maxkolysh.com/parking</a></p>`;
            emailHtml += `</div>`;

            // Send email notification
            if (user.email) {
              await sendEmailNotification(user.email, emailSubject, emailHtml);
            }

            updatedReminders[prefKey] = now.toISOString();
            sentCount++;
            console.log(`Sent ${prefKey} reminder to ${user.tesla_user_id} for ${corridor}`);
          }
        }

        // Update DB if we sent any reminders
        if (sentCount > 0) {
          await supabase.from("tesla_users").update({
            last_reminders_sent: updatedReminders,
          }).eq("id", user.id);
          results.push(`${user.tesla_user_id}: sent ${sentCount} reminder(s)`);
        } else {
          results.push(`${user.tesla_user_id}: no reminders due`);
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
