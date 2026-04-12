const TESLA_CLIENT_ID = "39a99319-b708-4245-a29f-6907373f37ad";
const TESLA_CLIENT_SECRET = "ta-secret.2MFoIX!OCjup0Nr5";
const TESLA_TOKEN_URL = "https://auth.tesla.com/oauth2/v3/token";
const TESLA_AUDIENCE = "https://fleet-api.prd.na.vn.cloud.tesla.com";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "https://maxkolysh.com",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

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
