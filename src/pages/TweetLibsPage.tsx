import { useState, useCallback, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { supabase, getSessionId } from '../utils/supabase';
import TweetCard, { type Tweet } from '../components/tweetlibs/TweetCard';
import Confetti from '../components/tweetlibs/Confetti';

type GameMode = 'classic' | 'weekly';
type QuestionResult = 'correct' | 'incorrect';

interface LeaderboardEntry {
  id: number;
  player_name: string | null;
  score: number;
  total: number;
  results: string;
  created_at: string;
  session_id: string;
  mode?: string;
}

function generateEmojiGrid(results: QuestionResult[]): string {
  return results.map(r => r === 'correct' ? '🟩' : '⬛').join('');
}

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function getCurrentWeekRange(): { monday: string; sunday: string; displayRange: string } {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? -6 : 1 - day; // Monday
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const isoDate = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  return {
    monday: isoDate(monday),
    sunday: isoDate(sunday),
    displayRange: `${fmt(monday)} – ${fmt(sunday)}`,
  };
}

async function fetchLeaderboard(limit: number = 10): Promise<LeaderboardEntry[]> {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data } = await supabase
    .from('tweetlibs_scores')
    .select('*')
    .gte('created_at', sevenDaysAgo)
    .order('score', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(limit);
  return (data as LeaderboardEntry[] | null) ?? [];
}

async function submitScore(score: number, total: number, results: QuestionResult[], mode: GameMode, playerName?: string): Promise<void> {
  try {
    const emojiGrid = generateEmojiGrid(results);
    await supabase.from('tweetlibs_scores').insert({
      player_name: playerName || null,
      score,
      total,
      results: emojiGrid,
      session_id: getSessionId(),
      mode,
    });
  } catch {
    // silently fail if RLS blocks insert
  }
}

async function fetchWeeklyTweets(): Promise<Tweet[]> {
  const { monday } = getCurrentWeekRange();
  const { data } = await supabase
    .from('tweetlibs_weekly_tweets')
    .select('*')
    .eq('week_start', monday)
    .eq('disabled', false);
  return (data as Tweet[] | null) ?? [];
}

function Leaderboard({ entries, compact }: { entries: LeaderboardEntry[]; compact?: boolean }) {
  if (entries.length === 0) return null;
  return (
    <div style={{ width: '100%' }}>
      <h3 style={{
        color: C.text,
        fontSize: compact ? '15px' : '17px',
        fontWeight: 700,
        margin: `0 0 ${compact ? '8' : '12'}px`,
        fontFamily: 'inherit',
        textAlign: 'center',
      }}>
        {compact ? '🏆 Recent Scores' : '🏆 Leaderboard (7 days)'}
      </h3>
      <div style={{
        background: 'rgba(255,255,255,0.04)',
        border: `1px solid ${C.border}`,
        borderRadius: '12px',
        overflow: 'hidden',
      }}>
        {entries.map((entry, i) => (
          <div
            key={entry.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: compact ? '8px 12px' : '10px 14px',
              borderBottom: i < entries.length - 1 ? `1px solid ${C.border}` : 'none',
              fontSize: compact ? '13px' : '14px',
              fontFamily: 'inherit',
            }}
          >
            <span style={{
              color: i < 3 ? ['#FFD700', '#C0C0C0', '#CD7F32'][i] : C.secondary,
              fontWeight: 700,
              minWidth: '20px',
              textAlign: 'center',
            }}>
              {i + 1}
            </span>
            <span style={{ color: C.text, fontWeight: 600, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {entry.player_name || 'Anonymous'}
            </span>
            {/* Mode badge */}
            <span style={{
              fontSize: '10px',
              fontWeight: 700,
              padding: '1px 5px',
              borderRadius: '4px',
              background: entry.mode === 'weekly' ? 'rgba(29, 155, 240, 0.15)' : 'rgba(113, 118, 123, 0.15)',
              color: entry.mode === 'weekly' ? '#1d9bf0' : '#71767b',
              letterSpacing: '0.5px',
            }}>
              {entry.mode === 'weekly' ? 'TW' : 'CL'}
            </span>
            {!compact && (
              <span style={{ fontSize: '12px', letterSpacing: '1px' }}>
                {entry.results}
              </span>
            )}
            <span style={{ color: C.green, fontWeight: 700, whiteSpace: 'nowrap' }}>
              {entry.score}/{entry.total}
            </span>
            <span style={{ color: C.secondary, fontSize: '12px', whiteSpace: 'nowrap' }}>
              {timeAgo(entry.created_at)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

const ROUND_SIZE = 5;

const C = {
  bg: '#000000',
  card: '#16181c',
  text: '#e7e9ea',
  secondary: '#71767b',
  blue: '#1d9bf0',
  border: '#2f3336',
  green: '#4ade80',
  red: '#f87171',
  dim: '#3f4450',
};

function pickRandom(arr: Tweet[], n: number): Tweet[] {
  return [...arr].sort(() => Math.random() - 0.5).slice(0, n);
}

function ScoreBar({ current, total }: { current: number; total: number }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '16px',
        fontSize: '14px',
        fontFamily: 'inherit',
      }}
    >
      <span style={{ color: C.secondary }}>
        Question{' '}
        <span style={{ color: C.text, fontWeight: 600 }}>
          {current}/{total}
        </span>
      </span>
      <div style={{ display: 'flex', gap: '4px' }}>
        {Array.from({ length: total }).map((_, i) => (
          <div
            key={i}
            style={{
              height: '6px',
              width: '20px',
              borderRadius: '3px',
              transition: 'background-color 0.3s',
              backgroundColor:
                i < current - 1
                  ? C.blue
                  : i === current - 1
                    ? C.blue
                    : '#2f3336',
              opacity: i === current - 1 ? 0.7 : 1,
            }}
          />
        ))}
      </div>
    </div>
  );
}

function EndScreen({
  score,
  total,
  onPlayAgain,
  results,
  gameMode,
}: {
  score: number;
  total: number;
  onPlayAgain: () => void;
  results: QuestionResult[];
  gameMode: GameMode;
}) {
  const [copied, setCopied] = useState(false);
  const [shareHover, setShareHover] = useState(false);
  const [playHover, setPlayHover] = useState(false);
  const [xHover, setXHover] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [nameSubmitted, setNameSubmitted] = useState(false);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const scoreSubmitted = useRef(false);

  const emojiGrid = generateEmojiGrid(results);
  const modeLabel = gameMode === 'weekly' ? ' This Week' : '';
  const shareText = `TweetLibs 🐦${modeLabel} ${score}/${total}\n\n${emojiGrid}\n\nmaxkolysh.com/tweetlibs`;

  // Auto-submit score and fetch leaderboard on mount
  useEffect(() => {
    if (!scoreSubmitted.current) {
      scoreSubmitted.current = true;
      submitScore(score, total, results, gameMode).then(() => {
        fetchLeaderboard(10).then(setLeaderboard);
      });
    }
  }, [score, total, results, gameMode]);

  const handleNameSubmit = async () => {
    if (!playerName.trim()) return;
    setNameSubmitted(true);
    try {
      const sessionId = getSessionId();
      await supabase
        .from('tweetlibs_scores')
        .update({ player_name: playerName.trim() })
        .eq('session_id', sessionId)
        .order('created_at', { ascending: false })
        .limit(1);
      const fresh = await fetchLeaderboard(10);
      setLeaderboard(fresh);
    } catch {
      // ignore
    }
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable
    }
  };

  const pct = score / total;
  const emoji = pct === 1 ? '🏆' : pct >= 0.8 ? '🎉' : pct >= 0.5 ? '💪' : '📚';
  const message =
    pct === 1
      ? 'Perfect score! You might be too online.'
      : pct >= 0.8
        ? 'Strong work. Very chronically online.'
        : pct >= 0.5
          ? 'Not bad. Keep lurking.'
          : 'Touch grass, then come back.';

  return (
    <div style={{ textAlign: 'center', padding: '24px 0', fontFamily: 'inherit' }}>
      <div style={{ fontSize: '64px', marginBottom: '16px', lineHeight: 1 }}>{emoji}</div>
      <div
        style={{
          fontSize: '40px',
          fontWeight: 700,
          color: C.text,
          marginBottom: '8px',
          letterSpacing: '-0.02em',
        }}
      >
        {score}/{total}
      </div>
      {gameMode === 'weekly' && (
        <span style={{
          display: 'inline-block',
          background: 'rgba(29, 155, 240, 0.15)',
          color: C.blue,
          fontSize: '12px',
          fontWeight: 700,
          padding: '3px 10px',
          borderRadius: '10px',
          marginBottom: '8px',
        }}>
          This Week
        </span>
      )}
      <p style={{ color: C.secondary, fontSize: '17px', marginBottom: '32px' }}>{message}</p>

      <div
        style={{
          background: 'rgba(255,255,255,0.04)',
          border: `1px solid ${C.border}`,
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '24px',
          textAlign: 'left',
        }}
      >
        <p style={{ color: '#9ca3af', fontSize: '14px', fontFamily: 'monospace', margin: 0, wordBreak: 'break-word', whiteSpace: 'pre-line' }}>
          {shareText}
        </p>
      </div>

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '12px',
          justifyContent: 'center',
        }}
      >
        <button
          onClick={handleShare}
          onMouseEnter={() => setShareHover(true)}
          onMouseLeave={() => setShareHover(false)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '12px 24px',
            background: shareHover ? '#1a8cd8' : C.blue,
            color: '#ffffff',
            border: 'none',
            borderRadius: '12px',
            fontSize: '15px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'background 0.15s',
            fontFamily: 'inherit',
            minWidth: '160px',
          }}
        >
          {copied ? (
            <>
              <svg style={{ width: '16px', height: '16px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Copied!
            </>
          ) : (
            <>
              <svg style={{ width: '16px', height: '16px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              Share result
            </>
          )}
        </button>
        <button
          onClick={() => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`, '_blank')}
          onMouseEnter={() => setXHover(true)}
          onMouseLeave={() => setXHover(false)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '12px 24px',
            background: xHover ? '#272727' : '#000000',
            color: '#ffffff',
            border: '1px solid #536471',
            borderRadius: '12px',
            fontSize: '15px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'background 0.15s',
            fontFamily: 'inherit',
            minWidth: '160px',
          }}
        >
          <svg style={{ width: '16px', height: '16px' }} viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
          Share on X
        </button>
        <button
          onClick={onPlayAgain}
          onMouseEnter={() => setPlayHover(true)}
          onMouseLeave={() => setPlayHover(false)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '12px 24px',
            background: playHover ? '#374151' : '#1f2937',
            color: C.text,
            border: `1px solid ${C.border}`,
            borderRadius: '12px',
            fontSize: '15px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'background 0.15s',
            fontFamily: 'inherit',
            minWidth: '160px',
          }}
        >
          <svg style={{ width: '16px', height: '16px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Play again
        </button>
      </div>

      {/* Name input for leaderboard */}
      <div style={{ marginTop: '24px', textAlign: 'center' }}>
        {!nameSubmitted ? (
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', alignItems: 'center' }}>
            <input
              type="text"
              placeholder="Your name (optional)"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleNameSubmit(); }}
              maxLength={20}
              style={{
                padding: '8px 14px',
                background: C.card,
                color: C.text,
                border: `1px solid ${C.border}`,
                borderRadius: '8px',
                fontSize: '14px',
                fontFamily: 'inherit',
                outline: 'none',
                width: '180px',
              }}
            />
            <button
              onClick={handleNameSubmit}
              style={{
                padding: '8px 16px',
                background: playerName.trim() ? C.blue : C.card,
                color: playerName.trim() ? '#fff' : C.secondary,
                border: `1px solid ${playerName.trim() ? C.blue : C.border}`,
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: playerName.trim() ? 'pointer' : 'default',
                fontFamily: 'inherit',
                transition: 'all 0.15s',
              }}
            >
              Save
            </button>
          </div>
        ) : (
          <p style={{ color: C.green, fontSize: '14px', margin: 0 }}>✓ Name saved!</p>
        )}
      </div>

      {/* Leaderboard */}
      <div style={{ marginTop: '24px' }}>
        <Leaderboard entries={leaderboard} />
      </div>
    </div>
  );
}

export default function TweetLibsPage() {
  const [allTweets, setAllTweets] = useState<Tweet[]>([]);
  const [loading, setLoading] = useState(true);
  const [tweets, setTweets] = useState<Tweet[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);

  const [guess, setGuess] = useState('');
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);

  const [confettiKey, setConfettiKey] = useState(0);
  const [confettiActive, setConfettiActive] = useState(false);
  const [backHover, setBackHover] = useState(false);
  const [voted, setVoted] = useState<Record<number, 1 | -1>>({});
  const [gameState, setGameState] = useState<'splash' | 'playing' | 'ended'>('splash');
  const [splashVisible, setSplashVisible] = useState(false);
  const [results, setResults] = useState<QuestionResult[]>([]);
  const [splashLeaderboard, setSplashLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [gameMode, setGameMode] = useState<GameMode>('classic');
  const [weeklyTweets, setWeeklyTweets] = useState<Tweet[]>([]);
  const [weeklyLoading, setWeeklyLoading] = useState(true);

  // Trigger splash fade-in after mount
  useEffect(() => {
    requestAnimationFrame(() => setSplashVisible(true));
  }, []);

  useEffect(() => {
    (async () => {
      // Fetch classic tweets
      const { data } = await supabase
        .from('tweetlibs_tweets')
        .select('*')
        .eq('disabled', false);
      if (data) {
        setAllTweets(data as Tweet[]);
        setTweets(pickRandom(data as Tweet[], ROUND_SIZE));
      }
      setLoading(false);
    })();

    // Fetch weekly tweets
    (async () => {
      const weekly = await fetchWeeklyTweets();
      setWeeklyTweets(weekly);
      setWeeklyLoading(false);
    })();

    // Fetch splash leaderboard
    fetchLeaderboard(5).then(setSplashLeaderboard);
  }, []);

  const currentTweet = tweets[currentIndex];

  // Block next-advance until user releases Enter and presses it again
  const canAdvance = useRef(false);

  const handleSkip = useCallback(() => {
    if (feedback !== null) return;
    setFeedback('incorrect');
    setResults(prev => [...prev, 'incorrect']);
    canAdvance.current = false;
  }, [feedback]);

  const handleSubmit = useCallback(() => {
    if (feedback !== null || !guess.trim()) return;

    // Fuzzy matching: lowercase, strip punctuation, handle plurals
    const normalize = (s: string) => s.trim().toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/s$/, '');
    const guessNorm = normalize(guess);
    const answerNorm = normalize(currentTweet.blank_word);
    const isCorrect = guessNorm === answerNorm
      || guessNorm === answerNorm + 's' || answerNorm === guessNorm + 's'
      || currentTweet.blank_word.toLowerCase().includes(guess.trim().toLowerCase())
      || guess.trim().toLowerCase().includes(currentTweet.blank_word.toLowerCase());

    setFeedback(isCorrect ? 'correct' : 'incorrect');
    canAdvance.current = false; // block until keyup

    if (isCorrect) {
      setScore((s) => s + 1);
      setConfettiKey((k) => k + 1);
      setConfettiActive(true);
      setResults(prev => [...prev, 'correct']);
    } else {
      setResults(prev => [...prev, 'incorrect']);
    }
  }, [feedback, guess, currentTweet]);

  const handleNext = useCallback(() => {
    if (feedback === null) return;
    setConfettiActive(false);
    setFeedback(null);
    setGuess('');
    canAdvance.current = false;
    const nextIndex = currentIndex + 1;
    if (nextIndex >= ROUND_SIZE) {
      setGameState('ended');
    } else {
      setCurrentIndex(nextIndex);
    }
  }, [feedback, currentIndex]);

  // Enter keyup unlocks advance; next Enter keydown advances
  useEffect(() => {
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && feedback !== null) {
        canAdvance.current = true;
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && feedback !== null && canAdvance.current) {
        handleNext();
      }
    };
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [feedback, handleNext]);

  const handleVote = async (tweetId: number, vote: 1 | -1) => {
    if (voted[tweetId]) return;
    setVoted((prev) => ({ ...prev, [tweetId]: vote }));
    const sessionId = getSessionId();
    await supabase.from('tweetlibs_votes').upsert(
      { tweet_id: tweetId, session_id: sessionId, vote },
      { onConflict: 'tweet_id,session_id' }
    );
  };

  const handlePlayAgain = () => {
    const pool = gameMode === 'weekly' ? weeklyTweets : allTweets;
    setTweets(pickRandom(pool, ROUND_SIZE));
    setCurrentIndex(0);
    setScore(0);
    setGuess('');
    setFeedback(null);
    setGameState('playing');
    setConfettiActive(false);
    setResults([]);
  };

  const handleStartGame = (mode: GameMode) => {
    setGameMode(mode);
    const pool = mode === 'weekly' ? weeklyTweets : allTweets;
    setTweets(pickRandom(pool, ROUND_SIZE));
    setCurrentIndex(0);
    setScore(0);
    setGuess('');
    setFeedback(null);
    setResults([]);
    setGameState('playing');
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: C.bg, color: C.secondary, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>
        Loading tweets…
      </div>
    );
  }

  const weekRange = getCurrentWeekRange();
  const hasWeeklyTweets = !weeklyLoading && weeklyTweets.length >= ROUND_SIZE;

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: C.bg,
        color: C.text,
        display: 'flex',
        flexDirection: 'column' as const,
        justifyContent: 'center',
        alignItems: 'center',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        lineHeight: 1.5,
      }}
    >
      <Confetti key={confettiKey} active={confettiActive} />
      <div
        style={{
          maxWidth: '600px',
          width: '100%',
          padding: '24px 16px 48px',
        }}
      >
        {gameState === 'splash' ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column' as const,
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              padding: '48px 16px',
              opacity: splashVisible ? 1 : 0,
              transform: splashVisible ? 'translateY(0)' : 'translateY(16px)',
              transition: 'opacity 0.6s ease, transform 0.6s ease',
            }}
          >
            <h1
              style={{
                fontSize: '48px',
                fontWeight: 800,
                color: C.text,
                margin: '0 0 12px',
                letterSpacing: '-0.03em',
                fontFamily: 'inherit',
              }}
            >
              TweetLibs
            </h1>
            <p
              style={{
                fontSize: '18px',
                color: '#9ca3af',
                margin: '0 0 32px',
                fontFamily: 'inherit',
                maxWidth: '360px',
                lineHeight: 1.5,
              }}
            >
              Guess the missing word
            </p>

            {/* This Week mode card */}
            <button
              onClick={() => hasWeeklyTweets && handleStartGame('weekly')}
              disabled={!hasWeeklyTweets}
              style={{
                width: '100%',
                maxWidth: '380px',
                background: hasWeeklyTweets ? 'rgba(29, 155, 240, 0.06)' : 'rgba(255,255,255,0.02)',
                border: hasWeeklyTweets ? '1.5px solid rgba(29, 155, 240, 0.4)' : `1px solid ${C.border}`,
                borderRadius: '16px',
                padding: '20px 24px',
                cursor: hasWeeklyTweets ? 'pointer' : 'default',
                transition: 'all 0.2s',
                fontFamily: 'inherit',
                textAlign: 'center',
                marginBottom: '12px',
                boxShadow: hasWeeklyTweets ? '0 0 20px rgba(29, 155, 240, 0.08)' : 'none',
                opacity: hasWeeklyTweets ? 1 : 0.5,
              }}
              onMouseEnter={(e) => {
                if (hasWeeklyTweets) {
                  e.currentTarget.style.borderColor = 'rgba(29, 155, 240, 0.7)';
                  e.currentTarget.style.boxShadow = '0 0 30px rgba(29, 155, 240, 0.15)';
                  e.currentTarget.style.transform = 'scale(1.02)';
                }
              }}
              onMouseLeave={(e) => {
                if (hasWeeklyTweets) {
                  e.currentTarget.style.borderColor = 'rgba(29, 155, 240, 0.4)';
                  e.currentTarget.style.boxShadow = '0 0 20px rgba(29, 155, 240, 0.08)';
                  e.currentTarget.style.transform = 'scale(1)';
                }
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '6px' }}>
                <span style={{ fontSize: '20px' }}>📅</span>
                <span style={{
                  fontSize: '20px',
                  fontWeight: 700,
                  color: hasWeeklyTweets ? C.text : C.secondary,
                }}>
                  This Week
                </span>
                {!hasWeeklyTweets && (
                  <span style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    background: 'rgba(113, 118, 123, 0.2)',
                    color: C.secondary,
                    padding: '2px 8px',
                    borderRadius: '8px',
                  }}>
                    Coming Soon
                  </span>
                )}
              </div>
              <div style={{
                fontSize: '14px',
                color: hasWeeklyTweets ? C.blue : C.secondary,
                fontWeight: 500,
                marginBottom: '4px',
              }}>
                {weekRange.displayRange}
              </div>
              <div style={{
                fontSize: '13px',
                color: C.secondary,
              }}>
                {hasWeeklyTweets ? 'How online were you?' : 'Weekly tweets drop every Monday'}
              </div>
            </button>

            {/* Classic mode card */}
            <button
              onClick={() => handleStartGame('classic')}
              style={{
                width: '100%',
                maxWidth: '380px',
                background: 'rgba(255,255,255,0.03)',
                border: `1px solid ${C.border}`,
                borderRadius: '16px',
                padding: '16px 24px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                fontFamily: 'inherit',
                textAlign: 'center',
                marginBottom: '20px',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#555';
                e.currentTarget.style.transform = 'scale(1.02)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = C.border;
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '4px' }}>
                <span style={{ fontSize: '18px' }}>🏛️</span>
                <span style={{
                  fontSize: '18px',
                  fontWeight: 700,
                  color: C.text,
                }}>
                  Classic
                </span>
              </div>
              <div style={{
                fontSize: '13px',
                color: C.secondary,
              }}>
                Iconic tweets of all time
              </div>
            </button>

            <p
              style={{
                fontSize: '14px',
                color: C.secondary,
                margin: '0 0 0',
                fontFamily: 'inherit',
              }}
            >
              {ROUND_SIZE} rounds
            </p>

            {/* Mini leaderboard on splash */}
            <div style={{ marginTop: '24px', width: '100%', maxWidth: '400px' }}>
              <Leaderboard entries={splashLeaderboard} compact />
            </div>
          </div>
        ) : (
        <>
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '24px',
          }}
        >
          <Link
            to="/"
            onMouseEnter={() => setBackHover(true)}
            onMouseLeave={() => setBackHover(false)}
            style={{
              color: backHover ? C.text : C.secondary,
              textDecoration: 'none',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              transition: 'color 0.15s',
              fontFamily: 'inherit',
            }}
          >
            <svg style={{ width: '16px', height: '16px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </Link>

          <div style={{ textAlign: 'center' }}>
            <h1
              style={{
                fontSize: '20px',
                fontWeight: 700,
                color: C.text,
                margin: 0,
                letterSpacing: '-0.02em',
                fontFamily: 'inherit',
              }}
            >
              TweetLibs
            </h1>
            <p style={{ color: '#9ca3af', fontSize: '15px', margin: '4px 0 0', fontFamily: 'inherit' }}>
              {gameMode === 'weekly' ? 'This Week' : 'Guess the missing word'}
            </p>
          </div>

          <div style={{ textAlign: 'right', fontSize: '14px', fontFamily: 'inherit' }}>
            <span style={{ color: C.secondary }}>Score </span>
            <span style={{ color: C.text, fontWeight: 700 }}>
              {score}/{gameState === 'ended' ? ROUND_SIZE : currentIndex + (feedback ? 1 : 0)}
            </span>
          </div>
        </div>

        {gameState === 'ended' ? (
          <EndScreen score={score} total={ROUND_SIZE} onPlayAgain={handlePlayAgain} results={results} gameMode={gameMode} />
        ) : (
          <>
            <ScoreBar current={currentIndex + 1} total={ROUND_SIZE} />

            {/* Tweet card with fade-in on tweet change */}
            <div key={currentIndex} style={{ marginBottom: '16px', animation: 'tweetFadeIn 0.3s ease' }}>
              <TweetCard
                tweet={currentTweet}
                guess={guess}
                onGuessChange={setGuess}
                onSubmit={feedback !== null ? handleNext : handleSubmit}
                feedback={feedback}
                disabled={feedback !== null}
              />
            </div>

            {/* Submit / Next + feedback */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {feedback === null ? (
                <>
                  <button
                    onClick={handleSkip}
                    style={{
                      flex: '0 0 30%',
                      padding: '12px 16px',
                      background: 'transparent',
                      color: C.secondary,
                      border: `1px solid ${C.border}`,
                      borderRadius: '24px',
                      fontSize: '14px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      transition: 'all 0.15s',
                    }}
                  >
                    Skip
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={!guess.trim()}
                    style={{
                      flex: 1,
                      padding: '12px 24px',
                      background: !guess.trim() ? '#1a1d21' : C.blue,
                      color: !guess.trim() ? '#555b65' : '#ffffff',
                      border: `1px solid ${!guess.trim() ? '#2f3336' : C.blue}`,
                      borderRadius: '24px',
                      fontSize: '15px',
                      fontWeight: 700,
                      cursor: !guess.trim() ? 'not-allowed' : 'pointer',
                      transition: 'background 0.2s, color 0.2s',
                      fontFamily: 'inherit',
                    }}
                  >
                    Submit
                  </button>
                </>
              ) : (
                <>
                  <span style={{ color: feedback === 'correct' ? C.green : C.red, fontWeight: 700, fontSize: '15px', whiteSpace: 'nowrap' }}>
                    {feedback === 'correct' ? '✓ Correct!' : '✗ Nope'}
                  </span>
                  {/* Vote buttons */}
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <span className="tl-tooltip-wrap" style={{ position: 'relative' }}>
                      <button
                        onClick={() => handleVote(currentTweet.id, 1)}
                        style={{
                          padding: '6px 10px',
                          background: voted[currentTweet.id] === 1 ? 'rgba(0,186,124,0.15)' : 'transparent',
                          border: `1px solid ${voted[currentTweet.id] === 1 ? C.green : C.border}`,
                          borderRadius: '8px',
                          color: voted[currentTweet.id] === 1 ? C.green : C.secondary,
                          fontSize: '16px',
                          cursor: voted[currentTweet.id] ? 'default' : 'pointer',
                          fontFamily: 'inherit',
                          transition: 'all 0.15s',
                          opacity: voted[currentTweet.id] === -1 ? 0.3 : 1,
                        }}
                        aria-label="Good tweet"
                      >
                        👍
                      </button>
                      <span className="tl-tooltip">Good tweet</span>
                    </span>
                    <span className="tl-tooltip-wrap" style={{ position: 'relative' }}>
                      <button
                        onClick={() => handleVote(currentTweet.id, -1)}
                        style={{
                          padding: '6px 10px',
                          background: voted[currentTweet.id] === -1 ? 'rgba(244,33,46,0.15)' : 'transparent',
                          border: `1px solid ${voted[currentTweet.id] === -1 ? C.red : C.border}`,
                          borderRadius: '8px',
                          color: voted[currentTweet.id] === -1 ? C.red : C.secondary,
                          fontSize: '16px',
                          cursor: voted[currentTweet.id] ? 'default' : 'pointer',
                          fontFamily: 'inherit',
                          transition: 'all 0.15s',
                          opacity: voted[currentTweet.id] === 1 ? 0.3 : 1,
                        }}
                        aria-label="Bad tweet"
                      >
                        👎
                      </button>
                      <span className="tl-tooltip">Bad tweet</span>
                    </span>
                  </div>
                  <button
                    onClick={handleNext}
                    autoFocus
                    style={{
                      flex: 1,
                      padding: '12px 24px',
                      background: C.blue,
                      color: '#ffffff',
                      border: `1px solid ${C.blue}`,
                      borderRadius: '24px',
                      fontSize: '15px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'background 0.2s',
                      fontFamily: 'inherit',
                    }}
                  >
                    Next →
                  </button>
                </>
              )}
            </div>

            <p
              style={{
                color: C.dim,
                fontSize: '12px',
                textAlign: 'center',
                marginTop: '10px',
                fontFamily: 'inherit',
              }}
            >
              Press Enter to {feedback !== null ? 'continue' : 'submit'}
            </p>
          </>
        )}
        </>
        )}
      </div>
    </div>
  );
}
