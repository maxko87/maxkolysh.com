import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://vjnkdpovepqlsrdzqowd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZqbmtkcG92ZXBxbHNyZHpxb3dkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjczNzEzMDksImV4cCI6MjA4Mjk0NzMwOX0.XvSX6nUk6Tjyx16cKrb9NvtlXExBzzKILUP8kKdnKsQ';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Get or create a persistent session ID for voting
export function getSessionId(): string {
  let id = localStorage.getItem('tweetlibs_session');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('tweetlibs_session', id);
  }
  return id;
}
