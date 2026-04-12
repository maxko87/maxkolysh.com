import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { code, redirect_uri } = await req.json();

    if (!code) {
      return new Response(JSON.stringify({ error: 'Missing code' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const clientId = Deno.env.get('TESLA_CLIENT_ID') || '39a99319-b708-4245-a29f-6907373f37ad';
    const clientSecret = Deno.env.get('TESLA_CLIENT_SECRET');

    if (!clientSecret) {
      return new Response(JSON.stringify({ error: 'Server misconfigured: missing client secret' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Exchange code for tokens — MUST use fleet-auth endpoint, NOT auth.tesla.com
    const tokenRes = await fetch('https://fleet-auth.prd.vn.cloud.tesla.com/oauth2/v3/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirect_uri || 'https://maxkolysh.com/parking',
        audience: 'https://fleet-api.prd.na.vn.cloud.tesla.com',
      }),
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      console.error('Token exchange failed:', errText);
      return new Response(JSON.stringify({ error: 'Token exchange failed', details: errText }), {
        status: tokenRes.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const tokenData = await tokenRes.json();

    // Fetch user profile to get email
    let email: string | undefined;
    let teslaUserId: string | undefined;

    try {
      const profileRes = await fetch('https://fleet-api.prd.na.vn.cloud.tesla.com/api/1/users/me', {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });

      if (profileRes.ok) {
        const profile = await profileRes.json();
        email = profile.response?.email;
        teslaUserId = profile.response?.id || profile.response?.user_id;
      }
    } catch (e) {
      console.error('Failed to fetch profile:', e);
    }

    // Also try to get user ID from the token's id_token if available
    if (!teslaUserId && tokenData.id_token) {
      try {
        const payload = JSON.parse(atob(tokenData.id_token.split('.')[1]));
        teslaUserId = payload.sub;
        if (!email) email = payload.email;
      } catch {
        // ignore
      }
    }

    // Persist to DB
    if (teslaUserId) {
      try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const db = createClient(supabaseUrl, supabaseKey);

        const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000).toISOString();

        await db.from('tesla_users').upsert({
          tesla_user_id: teslaUserId,
          email,
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          token_expires_at: expiresAt,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'tesla_user_id' });
      } catch (e) {
        console.error('DB persist failed:', e);
        // Non-fatal — still return tokens
      }
    }

    return new Response(JSON.stringify({
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_in: tokenData.expires_in,
      email,
      tesla_user_id: teslaUserId,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('Error:', e);
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
