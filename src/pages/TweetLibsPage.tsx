import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import tweetsData from '../data/tweets.json';
import TweetCard, { type Tweet } from '../components/tweetlibs/TweetCard';
import Confetti from '../components/tweetlibs/Confetti';

const ROUND_SIZE = 10;

function pickRandom(arr: Tweet[], n: number): Tweet[] {
  return [...arr].sort(() => Math.random() - 0.5).slice(0, n);
}

function ScoreBar({
  current,
  total,
  streak,
}: {
  current: number;
  total: number;
  streak: number;
}) {
  return (
    <div className="flex items-center justify-between mb-4 text-sm">
      <div className="flex items-center gap-3">
        <span className="text-gray-400">
          Question{' '}
          <span className="text-white font-semibold">
            {current}/{total}
          </span>
        </span>
        {streak >= 2 && (
          <span className="text-orange-400 font-semibold text-xs bg-orange-950/50 border border-orange-800 rounded-full px-2 py-0.5">
            🔥 {streak} streak
          </span>
        )}
      </div>
      <div className="flex gap-1">
        {Array.from({ length: total }).map((_, i) => (
          <div
            key={i}
            className={`h-1.5 w-5 rounded-full transition-colors duration-300 ${
              i < current - 1
                ? 'bg-blue-500'
                : i === current - 1
                  ? 'bg-blue-400 animate-pulse'
                  : 'bg-gray-700'
            }`}
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

  const shareText = `I got ${score}/${total} on TweetLibs 🧠🐦 maxkolysh.com/tweetlibs`;

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback: select text
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
    <div className="text-center py-6">
      <div className="text-6xl mb-4">{emoji}</div>
      <div className="text-4xl font-bold text-white mb-2">
        {score}/{total}
      </div>
      <p className="text-gray-400 text-lg mb-8">{message}</p>

      <div className="bg-gray-800/60 border border-gray-700 rounded-xl p-4 mb-6 text-left">
        <p className="text-gray-300 text-sm font-mono">{shareText}</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <button
          onClick={handleShare}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-colors duration-200"
        >
          {copied ? (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Copied!
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              Share result
            </>
          )}
        </button>
        <button
          onClick={onPlayAgain}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-xl transition-colors duration-200"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
  const [streak, setStreak] = useState(0);
  const [guess, setGuess] = useState('');
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [gameState, setGameState] = useState<'playing' | 'ended'>('playing');
  const [confettiKey, setConfettiKey] = useState(0);
  const [confettiActive, setConfettiActive] = useState(false);

  const currentTweet = tweets[currentIndex];

  const handleSubmit = useCallback(() => {
    if (feedback !== null || !guess.trim()) return;

    const isCorrect =
      guess.trim().toLowerCase() === currentTweet.blank_word.toLowerCase();

    setFeedback(isCorrect ? 'correct' : 'incorrect');

    if (isCorrect) {
      setScore((s) => s + 1);
      setStreak((s) => s + 1);
      setConfettiKey((k) => k + 1);
      setConfettiActive(true);
    } else {
      setStreak(0);
    }

    const delay = isCorrect ? 1500 : 2000;
    setTimeout(() => {
      setConfettiActive(false);
      setFeedback(null);
      setGuess('');
      const nextIndex = currentIndex + 1;
      if (nextIndex >= ROUND_SIZE) {
        setGameState('ended');
      } else {
        setCurrentIndex(nextIndex);
      }
    }, delay);
  }, [feedback, guess, currentTweet, currentIndex]);

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
    <div className="min-h-screen" style={{ backgroundColor: '#030712', color: '#ffffff', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', lineHeight: '1.5' }}>
      <Confetti key={confettiKey} active={confettiActive} />

      <div className="max-w-[600px] mx-auto px-4 py-6 sm:py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Link
            to="/"
            className="text-gray-400 hover:text-white transition-colors text-sm flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </Link>
          <div className="text-center">
            <h1 className="text-xl font-bold text-white tracking-tight">TweetLibs</h1>
            <p className="text-gray-500 text-xs">guess the missing word</p>
          </div>
          <div className="text-right text-sm">
            <span className="text-gray-400">Score </span>
            <span className="text-white font-bold">{score}/{gameState === 'ended' ? ROUND_SIZE : currentIndex + (feedback ? 1 : 0)}</span>
          </div>
        </div>

        {gameState === 'ended' ? (
          <EndScreen score={score} total={ROUND_SIZE} onPlayAgain={handlePlayAgain} />
        ) : (
          <>
            <ScoreBar
              current={currentIndex + 1}
              total={ROUND_SIZE}
              streak={streak}
            />

            {/* Tweet card */}
            <div className="mb-4">
              <TweetCard
                tweet={currentTweet}
                guess={guess}
                onGuessChange={setGuess}
                onSubmit={handleSubmit}
                feedback={feedback}
                disabled={feedback !== null}
              />
            </div>

            {/* Submit / feedback */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button
                onClick={handleSubmit}
                disabled={feedback !== null || !guess.trim()}
                style={{
                  flex: 1,
                  padding: '12px 24px',
                  background: (feedback !== null || !guess.trim()) ? '#1e2028' : '#1d9bf0',
                  color: (feedback !== null || !guess.trim()) ? '#555' : '#ffffff',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '15px',
                  fontWeight: 600,
                  cursor: (feedback !== null || !guess.trim()) ? 'not-allowed' : 'pointer',
                  transition: 'background 0.2s',
                  fontFamily: 'inherit',
                }}
              >
                Submit
              </button>
              {feedback === 'correct' && (
                <span style={{ color: '#4ade80', fontWeight: 600, fontSize: '14px' }}>
                  ✓ Correct!
                </span>
              )}
              {feedback === 'incorrect' && (
                <span style={{ color: '#f87171', fontWeight: 600, fontSize: '14px' }}>
                  ✗ Nope
                </span>
              )}
            </div>

            <p style={{ color: '#3f4450', fontSize: '12px', textAlign: 'center', marginTop: '12px' }}>
              Press Enter to submit
            </p>
          </>
        )}
      </div>
    </div>
  );
}
