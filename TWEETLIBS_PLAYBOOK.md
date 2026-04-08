# TweetLibs — Adding New Tweets Playbook

## Overview
TweetLibs is a madlibs guessing game at maxkolysh.com/tweetlibs. Users see a tweet with one word blanked out and try to guess it. Tweets are stored in Supabase (`tweetlibs_tweets` table).

## Current Stats
- **Active tweets:** ~120
- **Supabase project:** `vjnkdpovepqlsrdzqowd`
- **Table:** `tweetlibs_tweets`
- **Service role key needed for inserts** (anon key is read-only due to RLS)

## What Makes a Good TweetLibs Tweet

### The Tweet Itself
- ✅ **Viral/iconic** — went mega-viral, became a meme, or is a cultural moment
- ✅ **Funny/clever** — standalone funny, doesn't need context to appreciate
- ✅ **Quotable** — people screenshot and share it
- ✅ **Self-contained** — makes sense without seeing replies or a thread
- ❌ **Too niche** — only funny if you follow a specific community drama
- ❌ **Thread tweets** — dependent on other tweets for context
- ❌ **Reply tweets** — needs the original to make sense
- ❌ **Image/video tweets** — the game is text-only
- ❌ **Too short** — under ~30 chars doesn't fill a card well
- ❌ **Too somber** — deaths, tragedies, etc. aren't fun for a game

### The Blank Word — THIS IS THE HARDEST PART

**Only add tweets rated A or A+. Nothing below.**

**Rating system:**
- **A+** — Completely unexpected, hilarious when revealed (e.g., "meatball", "raccoon", "TRIANGLE", "carousel", "Sex Rain")
- **A** — Surprising, multiple plausible guesses (e.g., "Barbados", "Kyle", "golf", "biblical")
- **B+ or below** — Don't add it. If you're on the fence, skip it. The game is only as good as its worst tweet.

**Good blank words are:**
- ✅ Proper nouns (specific names, places, brands)
- ✅ Unexpected adjectives or nouns that are the punchline
- ✅ Specific numbers or amounts
- ✅ Words where 3+ alternatives are equally plausible
- ✅ The "twist" word that makes the tweet funny

**Bad blank words are:**
- ❌ The ONLY logical word (e.g., "headphone ___" → "jack")
- ❌ Words repeated elsewhere in the tweet
- ❌ Generic words anyone could guess from context
- ❌ Common function words (the, is, and)
- ❌ Words in such famous quotes that everyone knows them

### Quick Smell Test
Read the tweet with the blank. If you can guess the word in <2 seconds, pick a different word or skip the tweet.

### The 8/10 Rule
Every tweet you add must be an 8/10 or higher. Ask yourself:
1. Is the tweet genuinely funny on its own? (not just "heh" but actually good)
2. Is the blank word a genuine surprise when revealed?
3. Would you text this tweet to a friend? If not, skip it.
4. When in doubt, don't add it. 130 great tweets > 200 mid tweets.

## How to Find New Tweets

### Search Queries
```
"most viral tweets of all time"
"best tweets ever"
"iconic tweets twitter history"
"funniest tweets compilation [year]"
"best tech twitter tweets"
"best tpot tweets"
"legendary tweets thread"
"tweets that became memes"
```

### Good Sources
- BuzzFeed "best tweets" listicles
- Vice/Vulture tweet roundups  
- Reddit threads: r/popculturechat, r/Fauxmoi, r/NonPoliticalTwitter
- "What's the best tweet of all time?" viral threads on X
- Thorsten Ball's funny tweets collection (thorstenball.com/funny_tweets/)

### Categories to Cover
1. **Tech/startup twitter** — VCs, founders, engineers
2. **Shitpost accounts** — @dril, weird twitter
3. **Celebrity** — athletes, musicians, actors, politicians
4. **Comedy twitter** — professional comedians, comedy writers
5. **Brand accounts** — Wendy's, Denny's, MoonPie
6. **One-hit wonders** — random people who went mega-viral once

## How to Insert Tweets

### 1. Prepare your data
Each tweet needs:
```json
{
  "author": "Display Name",
  "handle": "@username",
  "text": "exact tweet text",
  "blank_word": "word to blank",
  "date": "Mon YYYY",
  "likes": 50000,
  "retweets": 15000,
  "disabled": false
}
```

### 2. Quality check
For each tweet, verify:
- [ ] Blank word doesn't appear more than once in the tweet
- [ ] Blank word is surprising (A or B+ rating)
- [ ] Tweet is self-contained and funny
- [ ] Author isn't already in the database (check first!)

### 3. Insert via Supabase API
```bash
SERVICE_KEY="[service role key]"
curl -X POST "https://vjnkdpovepqlsrdzqowd.supabase.co/rest/v1/tweetlibs_tweets" \
  -H "apikey: $SERVICE_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=minimal" \
  -d '[{"id": 500, "author": "...", "handle": "...", "text": "...", "blank_word": "...", "date": "...", "likes": 0, "retweets": 0, "disabled": false}]'
```

**Note:** Use explicit IDs (check max ID first) because the auto-increment sequence is out of sync.

### 4. Check max ID before inserting
```bash
curl -s "https://vjnkdpovepqlsrdzqowd.supabase.co/rest/v1/tweetlibs_tweets?select=id&order=id.desc&limit=1" \
  -H "apikey: $SERVICE_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY"
```

### 5. Verify count after insert
```bash
curl -s "https://vjnkdpovepqlsrdzqowd.supabase.co/rest/v1/tweetlibs_tweets?select=id&disabled=eq.false" \
  -H "apikey: $SERVICE_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -H "Prefer: count=exact" \
  -H "Range: 0-0"
# Check content-range header for total
```

## Disabling Bad Tweets
If a tweet is too easy or unfun:
```bash
curl -X PATCH "https://vjnkdpovepqlsrdzqowd.supabase.co/rest/v1/tweetlibs_tweets?id=eq.TWEET_ID" \
  -H "apikey: $SERVICE_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"disabled": true}'
```

## Admin Panel
There's an admin page at maxkolysh.com/tweetlibs/admin (password: 7070) for toggling tweets on/off and seeing vote data.

## Existing Authors (don't duplicate)
Check the database before adding — run:
```bash
curl -s "https://vjnkdpovepqlsrdzqowd.supabase.co/rest/v1/tweetlibs_tweets?select=author&disabled=eq.false" \
  -H "apikey: $SERVICE_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY" | python3 -c "import json,sys; print(sorted(set(t['author'] for t in json.load(sys.stdin))))"
```
