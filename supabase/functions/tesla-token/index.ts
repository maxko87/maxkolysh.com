import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const TESLA_CLIENT_ID = "39a99319-b708-4245-a29f-6907373f37ad";
const TESLA_CLIENT_SECRET="ta-secret.2MFoIX!OCjup0Nr5";
const TESLA_TOKEN_URL="https://fleet-auth.prd.vn.cloud.tesla.com/oauth2/v3/token";
const TESLA_AUDIENCE = "https://fleet-api.prd.na.vn.cloud.tesla.com";

const DEFAULT_TELEGRAM_CHAT_ID = "-1003751523166";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "https://maxkolysh.com",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

function decodeJwtPayload(token: string): Record<string, unknown> {
  const parts = token.split(".");
  const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
  return JSON.parse(atob(payload));
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    );
  }

  try {
    const { code, redirect_uri } = await req.json();

    if (!code || !redirect_uri) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: code, redirect_uri" }),
        { status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    console.log("Exchanging Tesla auth code for tokens...");

    const tokenResponse = await fetch(TESLA_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grant_type: "authorization_code",
        client_id: TESLA_CLIENT_ID,
        client_secret: TESLA_CLIENT_SECRET,
        code,
        redirect_uri,
        audience: TESLA_AUDIENCE,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      console.error("Tesla token exchange failed:", JSON.stringify(tokenData));
      return new Response(
        JSON.stringify({ error: "Token exchange failed", details: tokenData }),
        { status: tokenResponse.status, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    // Decode JWT to get tesla_user_id (sub claim)
    let teslaUserId: string | null = null;
    try {
      const payload = decodeJwtPayload(tokenData.access_token);
      teslaUserId = payload.sub as string;
      console.log("Token scopes:", JSON.stringify(payload.scp));
      console.log("Token audience:", JSON.stringify(payload.aud));
      console.log("Tesla user ID (sub):", teslaUserId);
    } catch (e) {
      console.log("Could not decode token:", e);
    }

    // Upsert into tesla_users table
    if (teslaUserId) {
      try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const supabase = createClient(supabaseUrl, serviceRoleKey);

        const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000).toISOString();

        const { error: upsertError } = await supabase
          .from("tesla_users")
          .upsert(
            {
              tesla_user_id: teslaUserId,
              access_token: tokenData.access_token,
              refresh_token: tokenData.refresh_token,
              token_expires_at: expiresAt,
              notify_telegram_chat_id: DEFAULT_TELEGRAM_CHAT_ID,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "tesla_user_id" }
          );

        if (upsertError) {
          console.error("Failed to upsert tesla_users:", upsertError);
        } else {
          console.log("Successfully upserted tesla_users for:", teslaUserId);
        }
      } catch (e) {
        console.error("Error upserting tesla_users:", e);
      }
    }

    console.log("Tesla token exchange successful");

    return new Response(
      JSON.stringify(tokenData),
      { status: 200, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    );
  }
});
