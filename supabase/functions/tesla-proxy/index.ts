// Proxies Tesla Fleet API requests to avoid CORS issues
// Browser -> this function -> Tesla Fleet API -> back to browser

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
    // The Tesla API path is passed as a query param: ?path=/api/1/vehicles
    const teslaPath = url.searchParams.get("path");

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
      const body = await req.text();
      if (body) fetchOptions.body = body;
    }

    // Decode JWT to check scopes
    try {
      const parts = teslaToken.split('.');
      const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
      console.log(`Token scopes: ${JSON.stringify(payload.scp)}, aud: ${JSON.stringify(payload.aud)}`);
    } catch (e) {
      console.log('Could not decode token');
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
