import { useState, useCallback, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import allTweetsData from '../data/tweets.json';
import { supabase, getSessionId } from '../utils/supabase';

const tweetsData = (allTweetsData as any[]).filter((t: any) => !t.disabled);
import TweetCard, { type Tweet } from '../components/tweetlibs/TweetCard';
import Confetti from '../components/tweetlibs/Confetti';

const ROUND_SIZE = 10;

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
}: {
  score: number;
  total: number;
  onPlayAgain: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [shareHover, setShareHover] = useState(false);
  const [playHover, setPlayHover] = useState(false);

  const shareText = `I got ${score}/${total} on TweetLibs 🧠🐦 maxkolysh.com/tweetlibs`;

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
        <p style={{ color: '#9ca3af', fontSize: '14px', fontFamily: 'monospace', margin: 0, wordBreak: 'break-word' }}>
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
    </div>
  );
}

export default function TweetLibsPage() {
  const [tweets, setTweets] = useState<Tweet[]>(() =>
    pickRandom(tweetsData as Tweet[], ROUND_SIZE)
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [_streak, setStreak] = useState(0);
  const [guess, setGuess] = useState('');
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [gameState, setGameState] = useState<'playing' | 'ended'>('playing');
  const [confettiKey, setConfettiKey] = useState(0);
  const [confettiActive, setConfettiActive] = useState(false);
  const [backHover, setBackHover] = useState(false);
  const [voted, setVoted] = useState<Record<number, 1 | -1>>({});

  const currentTweet = tweets[currentIndex];

  // Block next-advance until user releases Enter and presses it again
  const canAdvance = useRef(false);

  const handleSkip = useCallback(() => {
    if (feedback !== null) return;
    setFeedback('incorrect');
    canAdvance.current = false;
    setStreak(0);
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
      setStreak((s) => s + 1);
      setConfettiKey((k) => k + 1);
      setConfettiActive(true);
    } else {
      setStreak(0);
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
    setTweets(pickRandom(tweetsData as Tweet[], ROUND_SIZE));
    setCurrentIndex(0);
    setScore(0);
    setStreak(0);
    setGuess('');
    setFeedback(null);
    setGameState('playing');
    setConfettiActive(false);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: C.bg,
        color: C.text,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        lineHeight: 1.5,
      }}
    >
      <Confetti key={confettiKey} active={confettiActive} />

      <div
        style={{
          maxWidth: '600px',
          margin: '0 auto',
          padding: '24px 16px 48px',
        }}
      >
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
            <p style={{ color: C.dim, fontSize: '12px', margin: '2px 0 0', fontFamily: 'inherit' }}>
              guess the missing word
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
          <EndScreen score={score} total={ROUND_SIZE} onPlayAgain={handlePlayAgain} />
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
                      title="Good tweet"
                    >
                      👍
                    </button>
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
                      title="Bad tweet"
                    >
                      👎
                    </button>
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
      </div>
    </div>
  );
}
