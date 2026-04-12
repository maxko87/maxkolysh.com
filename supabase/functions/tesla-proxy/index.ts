// Proxies Tesla Fleet API requests to avoid CORS issues
// Browser -> this function -> Tesla Fleet API -> back to browser

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const FLEET_API_BASE = "https://fleet-api.prd.na.vn.cloud.tesla.com";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "https://maxkolysh.com",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Tesla-Token",
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  try {
    const url = new URL(req.url);
    const teslaPath = url.searchParams.get("path");

    // Handle internal endpoints (JSON body with endpoint field)
    if (req.method === "POST" && !teslaPath) {
      let body;
      try {
        body = await req.json();
      } catch {
        // Not JSON — fall through to require path
      }

      if (body?.endpoint?.startsWith("_internal/")) {
        return await handleInternal(body.endpoint, body.body);
      }

      if (!body?.endpoint && !teslaPath) {
        return new Response(
          JSON.stringify({ error: "Missing 'path' query parameter" }),
          { status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
        );
      }
    }

    if (!teslaPath) {
      return new Response(
        JSON.stringify({ error: "Missing 'path' query parameter" }),
        { status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    // Get the Tesla access token from the request header
    const teslaToken = req.headers.get("X-Tesla-Token");
    if (!teslaToken) {
      return new Response(
        JSON.stringify({ error: "Missing X-Tesla-Token header" }),
        { status: 401, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    // Build the Tesla API request
    const teslaUrl = `${FLEET_API_BASE}${teslaPath}`;
    const teslaHeaders: Record<string, string> = {
      "Authorization": `Bearer ${teslaToken}`,
      "Content-Type": "application/json",
    };

    const fetchOptions: RequestInit = {
      method: req.method,
      headers: teslaHeaders,
    };

    // Forward body for POST requests
    if (req.method === "POST") {
      const bodyText = await req.text();
      if (bodyText) fetchOptions.body = bodyText;
    }

    console.log(`Proxying ${req.method} ${teslaPath}`);

    const teslaResponse = await fetch(teslaUrl, fetchOptions);
    const responseText = await teslaResponse.text();

    return new Response(responseText, {
      status: teslaResponse.status,
      headers: {
        ...CORS_HEADERS,
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Proxy error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    );
  }
});

async function handleInternal(endpoint: string, body: any): Promise<Response> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const db = createClient(supabaseUrl, serviceRoleKey);

  try {
    if (endpoint === "_internal/save-prefs") {
      const { tesla_user_id, notification_prefs } = body;
      if (!tesla_user_id || !notification_prefs) {
        return new Response(
          JSON.stringify({ error: "Missing tesla_user_id or notification_prefs" }),
          { status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
        );
      }

      const { error } = await db.from("tesla_users").update({
        notification_prefs,
        updated_at: new Date().toISOString(),
      }).eq("tesla_user_id", tesla_user_id);

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    if (endpoint === "_internal/get-prefs") {
      const { tesla_user_id } = body;
      if (!tesla_user_id) {
        return new Response(
          JSON.stringify({ error: "Missing tesla_user_id" }),
          { status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
        );
      }

      const { data, error } = await db.from("tesla_users")
        .select("notification_prefs")
        .eq("tesla_user_id", tesla_user_id)
        .single();

      if (error) throw error;

      return new Response(
        JSON.stringify(data || {}),
        { headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Unknown internal endpoint" }),
      { status: 404, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("Internal endpoint error:", e);
    return new Response(
      JSON.stringify({ error: e.message || "Internal error" }),
      { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    );
  }
}
