import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const BARK_URL = Deno.env.get("BARK_URL")!;

const TARGET_URL = "https://fred.stlouisfed.org/series/IHLIDXUSTPSOFTDEVE";

// Extract visible text content from HTML, stripping all markup
function extractVisibleText(html: string): string {
  let text = html;

  // Remove script and style tags with their content
  text = text.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
  text = text.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '');

  // Remove HTML comments
  text = text.replace(/<!--[\s\S]*?-->/g, '');

  // Remove all HTML tags
  text = text.replace(/<[^>]+>/g, ' ');

  // Decode common HTML entities
  text = text.replace(/&nbsp;/g, ' ');
  text = text.replace(/&amp;/g, '&');
  text = text.replace(/&lt;/g, '<');
  text = text.replace(/&gt;/g, '>');
  text = text.replace(/&quot;/g, '"');
  text = text.replace(/&#39;/g, "'");

  // Normalize whitespace
  text = text.replace(/\s+/g, ' ').trim();

  return text;
}

async function hashContent(content: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

function extractKeyData(html: string): { latestValue?: string; latestDate?: string; title?: string } {
  const result: { latestValue?: string; latestDate?: string; title?: string } = {};

  // Try to extract the latest observation value and date from FRED page
  const valueMatch = html.match(/"value":\s*"([\d.]+)"/i) ||
                     html.match(/class="[^"]*observation-value[^"]*"[^>]*>([\d.,]+)/i) ||
                     html.match(/>([0-9,]+\.?\d*)\s*<\/span>\s*<span[^>]*>Index/i);
  if (valueMatch) result.latestValue = valueMatch[1];

  // Extract latest date
  const dateMatch = html.match(/"date":\s*"(\d{4}-\d{2}-\d{2})"/i) ||
                    html.match(/class="[^"]*observation-date[^"]*"[^>]*>([^<]+)/i);
  if (dateMatch) result.latestDate = dateMatch[1];

  // Extract title
  const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
  if (titleMatch) result.title = titleMatch[1].split('|')[0].trim();

  return result;
}

interface DiffResult {
  summary: string;
  hasMeaningfulChanges: boolean;
}

function generateDiffSummary(oldHtml: string, newHtml: string): DiffResult {
  const oldText = extractVisibleText(oldHtml);
  const newText = extractVisibleText(newHtml);

  // If visible text is identical, no meaningful change
  if (oldText === newText) {
    return { summary: "No visible text changes", hasMeaningfulChanges: false };
  }

  // Text changed - try to extract specific details for a nicer message
  const oldData = extractKeyData(oldHtml);
  const newData = extractKeyData(newHtml);
  const changes: string[] = [];

  if (oldData.latestValue !== newData.latestValue) {
    if (oldData.latestValue && newData.latestValue) {
      changes.push(`Value: ${oldData.latestValue} → ${newData.latestValue}`);
    } else if (newData.latestValue) {
      changes.push(`New value: ${newData.latestValue}`);
    }
  }

  if (oldData.latestDate !== newData.latestDate) {
    if (oldData.latestDate && newData.latestDate) {
      changes.push(`Date: ${oldData.latestDate} → ${newData.latestDate}`);
    } else if (newData.latestDate) {
      changes.push(`New date: ${newData.latestDate}`);
    }
  }

  // If we found specific changes, report them; otherwise just say text changed
  if (changes.length > 0) {
    return { summary: changes.join(', '), hasMeaningfulChanges: true };
  }

  return { summary: "Page text updated", hasMeaningfulChanges: true };
}

async function sendNotification(title: string, message: string): Promise<void> {
  const url = `${BARK_URL}/${encodeURIComponent(title)}/${encodeURIComponent(message)}?url=${encodeURIComponent(TARGET_URL)}`;
  await fetch(url);
}

Deno.serve(async (req) => {
  try {
    const authHeader = req.headers.get("Authorization");
    const expectedKey = Deno.env.get("CRON_SECRET");
    if (expectedKey && authHeader !== `Bearer ${expectedKey}`) {
      return new Response("Unauthorized", { status: 401 });
    }

    console.log(`Fetching ${TARGET_URL}...`);
    const pageResponse = await fetch(TARGET_URL, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; FREDMonitor/1.0; +https://maxkolysh.com)",
      },
    });

    if (!pageResponse.ok) {
      throw new Error(`Failed to fetch page: ${pageResponse.status}`);
    }

    const htmlContent = await pageResponse.text();
    // Hash only the visible text content to ignore HTML/script changes
    const visibleText = extractVisibleText(htmlContent);
    const contentHash = await hashContent(visibleText);

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: lastSnapshot, error: fetchError } = await supabase
      .from("website_snapshots")
      .select("content_hash, created_at, html_content")
      .eq("url", TARGET_URL)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (fetchError && fetchError.code !== "PGRST116") {
      throw new Error(`Database fetch error: ${fetchError.message}`);
    }

    const isChanged = !lastSnapshot || lastSnapshot.content_hash !== contentHash;
    const isFirstRun = !lastSnapshot;

    // Generate diff summary before storing new snapshot
    let diffResult: DiffResult = { summary: "", hasMeaningfulChanges: false };
    if (isChanged && !isFirstRun && lastSnapshot.html_content) {
      diffResult = generateDiffSummary(lastSnapshot.html_content, htmlContent);
    }

    const { error: insertError } = await supabase
      .from("website_snapshots")
      .insert({
        url: TARGET_URL,
        content_hash: contentHash,
        html_content: htmlContent,
      });

    if (insertError) {
      throw new Error(`Database insert error: ${insertError.message}`);
    }

    // Only send notification if there are meaningful changes
    const shouldNotify = isChanged && !isFirstRun && diffResult.hasMeaningfulChanges;
    if (shouldNotify) {
      console.log("Meaningful change detected! Sending notification...");
      await sendNotification(
        "FRED Data Updated",
        diffResult.summary || "Page content changed"
      );
    } else if (isChanged && !isFirstRun) {
      console.log(`Change detected but not meaningful: ${diffResult.summary}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        changed: isChanged,
        isFirstRun,
        notificationSent: shouldNotify,
        diffSummary: diffResult.summary || null,
        hasMeaningfulChanges: diffResult.hasMeaningfulChanges,
        timestamp: new Date().toISOString(),
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
