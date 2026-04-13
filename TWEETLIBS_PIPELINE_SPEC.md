# TweetLibs Weekly Pipeline — Full Spec

## Concept

**"How online were you this week?"**

Every week, TweetLibs auto-curates the most viral/notable tweets from the past 7 days. Players guess the missing word — not because it's clever, but because they would've seen it if they were paying attention. Tests cultural awareness, not vocabulary.

## Architecture

```
┌─────────────────┐     ┌──────────────┐     ┌───────────────┐
│  X API (weekly)  │────▶│  Scorer/AI   │────▶│   Supabase    │
│  Pull tweets     │     │  Pick blanks │     │  tweetlibs_   │
│  from 81 accts   │     │  Score 1-10  │     │  weekly_tweets │
└─────────────────┘     └──────────────┘     └───────────────┘
                                                     │
                                               ┌─────▼─────┐
                                               │  Frontend  │
                                               │  "This     │
                                               │   Week"    │
                                               │   mode     │
                                               └───────────┘
```

### Cron Schedule

- **When:** Every Sunday 9am PT (Monday morning content ready)
- **What:** Pull past 7 days of tweets from monitored accounts
- **Output:** 25-35 scored tweets → top 20 go live as that week's rotation

### Game Modes

1. **Classic** (existing) — 128 iconic tweets from all time. Random 5 per round.
2. **This Week** (new) — 20 curated tweets from the past 7 days. Random 5 per round. Refreshed weekly.

Players choose mode on splash screen. "This Week" shows the date range.

---

## Account List (108 accounts, 12 categories)

Focus: **comedy, jokes, memes, funny observations, brand humor.** NOT news, NOT politics, NOT corporate announcements. The goal is tweets where the missing word makes you laugh, not tweets where the missing word is a news event.

### Late Night / TV Comedy (8)
@jimmyfallon, @ConanOBrien, @StephenAtHome, @rickygervais, @Trevornoah, @funnyordie, @jimmykimmel, @nbcsnl

### Standup Comedians (7)
@kevinhart4real, @SarahKSilverman, @mindykaling, @chelseahandler, @chrisrock, @pattonoswalt, @kumailn

### Celebrities Who Are Funny (10)
@VancityReynolds, @SnoopDogg, @TheRock, @SHAQ, @aplusk, @RealHughJackman, @50cent, @GordonRamsay, @tonyhawk, @jackblack

### Music Artists (11)
@theweeknd, @tylerthecreator, @Pharrell, @LilNasX, @chancetherapper, @PostMalone, @21savage, @oliviarodrigo, @lizzo, @macklemore, @jackharlow

### Twitter-Native Comedians (14)
@TheTweetOfGod, @dril, @robdelaney, @meganamram, @desusnice, @XplodingUnicorn, @sosadtoday, @jaboukie, @jonnysun, @iamdevloper, @existentialcoms, @shutupmikeginn, @robfee, @bridger_w

### Meme / Viral Aggregators (12)
@TheOnion, @dog_rates, @InternetH0F, @DiscussingFilm, @BoredElonMusk, @FilmUpdates, @SarcasticRover, @NOTSportsCenter, @ClickHole, @KenJennings, @Seinfeld2000, @BadLegalTakes

### Brand Humor (9)
@McDonalds, @Wendys, @BurgerKing, @tacobell, @Duolingo, @Oreo, @Skittles, @drpepper, @MoonPie

### Sports Comedy (8)
@barstoolsports, @JJWatt, @BillSimmons, @PatMcAfeeShow, @ochocinco, @PFTCommenter, @PardonMyTake, @LeBatardShow

### Tech Founders (for flavor, 9)
@elonmusk, @sama, @pmarca, @paulg, @garrytan, @tobi, @dhh, @chamath, @levelsio

### Creators / Podcasters (7)
@MrBeast, @LoganPaul, @h3h3productions, @adultswim, @Asmongold, @PhillyD, @CollegeHumor

### Platforms / Cultural (5)
@Netflix, @Minecraft, @SoVeryBritish, @Lin_Manuel, @github

### UK Comedy (6)
@JamesBlunt, @MichaelDapaah, @TechnicallyRon, @bignarstie, @LeeMack, @ArfMeasures

### TPOT / AI Practitioner (36)
@sama, @emollick, @theo, @omarsar0, @elder_plinius, @simonw, @kimmonismus, @natolambert, @Teknium, @apples_jimmy, @testingcatalog, @fofrAI, @AndrewCurran_, @aidan_mclau, @reach_vb, @scaling01, @chatgpt21, @btibor91, @mark_k, @TheRealAdamG, @chetaslua, @koltregaskes, @adonis_singh, @MattVidPro, @TheoMediaAI, @Angaisb_, @petergostev, @flavioAd, @shaunralston, @AILeaksAndNews, @JasonBotterill, @Liam06972452, @HarshithLucky3, @R2Cdev_, @braunch

### TPOT / Postrat-adjacent (11)
@eigenrobot, @visakanv, @embryosophy, @pragueyerrr, @touchmoonflower, @crystalxduan, @flowerornament, @coladaclan, @CoachAhalya, @curzthetics, @peakexperiments, @DrStrib

**Total: 155 accounts** skewed toward humor, memes, AI/TPOT twitter, and jokes.

Easy to add more. Just append to the account list. Target: 200+ over time.

---

## Pipeline Steps

### Step 1: Pull Tweets (X API)

For each account, fetch last 7 days of non-reply, non-RT tweets:

```
GET /2/tweets/search/recent
  ?query=from:{handle} -is:retweet -is:reply
  &max_results=20
  &sort_order=relevancy
  &tweet.fields=text,public_metrics,created_at,author_id
  &expansions=author_id
  &user.fields=name,username
```

**Cost:** 81 accounts × 1 request each = 81 requests × $0.005 = **$0.41/week**

**Rate limit:** Recent search = 450 req/15min. 81 requests = well within limits.

### Step 2: Filter

Discard tweets that:
- Have < 2,000 likes (not viral enough)
- Are shorter than 40 chars (nothing to blank)
- Are mostly URLs (text before first `https://` < 30 chars)
- Start with "RT @" (retweet leak)
- Are exact duplicates of tweets already in the database

Keep tweets that:
- Have standalone readable text
- Are about a specific THING (event, product, person, place)
- Would be recognizable to someone "online" that week

Expected yield: ~150-200 tweets pass filter out of ~1,600 pulled.

### Step 3: AI Scoring & Blank Selection

For each filtered tweet, use Claude to:

1. **Pick the blank word** — the word that represents "the thing that happened"
   - Prefer proper nouns (Artemis, Codex, Cybertruck)
   - Prefer nouns over verbs
   - The blank should be the NEWS, not a filler word
   - The remaining text should still make grammatical sense

2. **Score "how online" factor (1-10)**
   - 9-10: Everyone on the internet saw this (Artemis landing, major celeb drama)
   - 7-8: If you're on Twitter, you definitely saw this (Elon hot takes, Sam Altman announcements)
   - 5-6: Niche but engaged communities saw it (tech twitter, sports twitter)
   - 3-4: Only deep insiders would know (VC drama, dev tool launches)
   - 1-2: Nobody would guess this

3. **Score difficulty (1-10)**
   - 1-3: Too easy (blank is obvious from context alone)
   - 4-7: Sweet spot (need to have seen the tweet or followed the story)
   - 8-10: Too hard (even people who saw it might not remember the exact word)

4. **Flag categories:** tech, politics, sports, entertainment, news, culture

**Prompt template:**
```
You are scoring tweets for TweetLibs, a game where players guess
the missing word from viral tweets. The game tests "how online
were you this week?"

For each tweet, return:
{
  "blank_word": "the word to remove",
  "online_score": 7,     // 1-10, how widely seen
  "difficulty": 5,        // 1-10, how hard to guess
  "category": "tech",     // tech|politics|sports|entertainment|news|culture
  "skip_reason": null     // or "too short" / "no good blank" / "offensive"
}

Rules:
- The blank word should be THE THING THAT HAPPENED (a noun, name, product)
- NOT a filler word (the, a, is, and)
- The tweet must still be grammatically readable with a blank
- Skip tweets where no single word removal creates a fun guess
```

**Cost:** ~200 tweets × ~100 tokens each = ~20K tokens. Under $0.10 with Haiku.

### Step 4: Select Top 20

From scored tweets:
1. Filter: online_score >= 6, difficulty between 3-8
2. Sort by: online_score DESC, likes DESC
3. Ensure category diversity: max 5 from any single category
4. Ensure author diversity: max 3 from any single author
5. Take top 20

### Step 5: Insert to Supabase

New table: `tweetlibs_weekly_tweets`

```sql
CREATE TABLE tweetlibs_weekly_tweets (
  id SERIAL PRIMARY KEY,
  tweet_id TEXT NOT NULL,          -- X tweet ID for direct linking
  author TEXT NOT NULL,
  handle TEXT NOT NULL,
  text TEXT NOT NULL,
  blank_word TEXT NOT NULL,
  likes INTEGER,
  retweets INTEGER,
  date TEXT,                       -- human-readable date
  created_at TIMESTAMPTZ,         -- tweet creation time
  week_start DATE NOT NULL,        -- Monday of the week this belongs to
  week_end DATE NOT NULL,          -- Sunday
  online_score INTEGER,            -- 1-10
  difficulty INTEGER,              -- 1-10
  category TEXT,                   -- tech, politics, sports, etc.
  disabled BOOLEAN DEFAULT false,
  pipeline_created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast weekly queries
CREATE INDEX idx_weekly_tweets_week ON tweetlibs_weekly_tweets(week_start, disabled);

-- RLS: anyone can read, only service_role can write
ALTER TABLE tweetlibs_weekly_tweets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read" ON tweetlibs_weekly_tweets FOR SELECT USING (true);
```

### Step 6: Frontend Changes

**Splash screen:**
```
         TweetLibs
  Guess the missing word

  ┌─────────────────────────┐
  │        ▶ Classic         │  ← existing 128 iconic tweets
  │   Iconic tweets of all   │
  │          time             │
  └─────────────────────────┘

  ┌─────────────────────────┐
  │     ▶ This Week          │  ← new weekly rotation
  │    Apr 7 – Apr 13        │
  │  How online were you?    │
  └─────────────────────────┘

         5 rounds
       🏆 Recent Scores
```

**Tweet card changes for "This Week" mode:**
- Show actual tweet date (e.g., "2 days ago")
- After reveal, link directly to tweet via `x.com/{handle}/status/{tweet_id}`
- Show category badge (tech, sports, politics, etc.)

**End screen changes:**
- Share text: `TweetLibs 🐦 This Week 4/5\n🟩🟩⬛🟩🟩\nmaxkolysh.com/tweetlibs`
- Separate leaderboards for Classic vs This Week

---

## Cost Summary

| Item | Weekly Cost |
|------|------------|
| X API: pull tweets | $0.41 |
| AI scoring (Haiku) | ~$0.10 |
| Supabase | Free tier |
| **Total** | **~$0.50/week** |
| **Monthly** | **~$2/month** |

$10 in X API credits = ~24 weeks = ~6 months of pipeline.

---

## Implementation Plan

### Phase 1: Pipeline Script (backend)
1. Python script that runs the full pipeline (pull → filter → score → insert)
2. Set up as Hermes cron job (Sunday 9am PT)
3. Manual approval step: script outputs candidates, human confirms before insert
   (Can be removed later once confidence is high)

### Phase 2: Frontend "This Week" Mode
1. Add mode selector to splash screen
2. New query: fetch from `tweetlibs_weekly_tweets` WHERE `week_start = current_week`
3. Direct tweet links (have tweet_id)
4. Category badges on cards
5. Separate leaderboard

### Phase 3: Polish
1. "Archive" mode — play past weeks
2. Daily streak tracking
3. Category filtering ("just show me tech tweets")
4. Difficulty indicator on each question

---

## Edge Cases

- **Deleted tweets:** Tweet might get deleted between curation and play. Show "Tweet unavailable" and skip to next.
- **Slow news week:** If < 10 tweets pass the filter, lower the like threshold to 1,000.
- **Controversial content:** AI scorer flags offensive content. Manual review catches edge cases.
- **X API downtime:** Cache last successful pull. Reuse previous week if pull fails.
- **Account changes:** Quarterly audit of account list. Remove deactivated, add trending new accounts.

---

## Success Metrics

- **Engagement:** Do "This Week" players share more than Classic players?
- **Retention:** Do players come back weekly for fresh content?
- **Difficulty calibration:** Are most players getting 2-4 out of 5? (sweet spot)
- **Content quality:** Track thumbs up/down votes per mode
