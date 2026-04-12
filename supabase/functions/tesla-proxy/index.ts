import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const FLEET_API = 'https://fleet-api.prd.na.vn.cloud.tesla.com/api/1';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { endpoint, method, token, body } = await req.json();

    // Internal endpoint: save notification preferences
    if (endpoint === '_internal/save-prefs') {
      return await handleSavePrefs(body);
    }

    if (!endpoint || !token) {
      return new Response(JSON.stringify({ error: 'Missing endpoint or token' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const fetchOptions: RequestInit = {
      method: method || 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    };

    if (body && method !== 'GET') {
      fetchOptions.body = JSON.stringify(body);
    }

    const res = await fetch(`${FLEET_API}/${endpoint}`, fetchOptions);
    const data = await res.text();

    return new Response(data, {
      status: res.status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('Proxy error:', e);
    return new Response(JSON.stringify({ error: 'Proxy error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function handleSavePrefs(body: { tesla_user_id: string; vehicle_id: string; notification_prefs: Record<string, boolean> }) {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const db = createClient(supabaseUrl, supabaseKey);

    const { error } = await db.from('tesla_users').update({
      vehicle_id: body.vehicle_id,
      notification_prefs: body.notification_prefs,
      updated_at: new Date().toISOString(),
    }).eq('tesla_user_id', body.tesla_user_id);

    if (error) throw error;

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('Save prefs error:', e);
    return new Response(JSON.stringify({ error: 'Failed to save' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}
