import { useRef, useEffect } from 'react';

export interface Tweet {
  id: number;
  author: string;
  handle: string;
  text: string;
  blank_word: string;
  date: string;
  likes: number;
  retweets: number;
}

interface TweetCardProps {
  tweet: Tweet;
  guess: string;
  onGuessChange: (val: string) => void;
  onSubmit: () => void;
  feedback: 'correct' | 'incorrect' | null;
  disabled: boolean;
}

function escapeRegex(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  return n.toString();
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

// Deterministic avatar color based on author name
const AVATAR_COLORS = [
  'from-purple-500 to-blue-500',
  'from-pink-500 to-orange-400',
  'from-green-500 to-teal-400',
  'from-blue-500 to-cyan-400',
  'from-orange-500 to-yellow-400',
  'from-red-500 to-pink-500',
];

function avatarColor(name: string) {
  const idx = name.charCodeAt(0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx];
}

export default function TweetCard({
  tweet,
  guess,
  onGuessChange,
  onSubmit,
  feedback,
  disabled,
}: TweetCardProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!disabled) {
      inputRef.current?.focus();
    }
  }, [disabled, tweet.id]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !disabled) {
      onSubmit();
    }
  };

  // Split tweet text around the blank word (first occurrence, word-boundary aware)
  const regex = new RegExp(`(${escapeRegex(tweet.blank_word)})`, 'i');
  const parts = tweet.text.split(regex);
  const inputWidth = Math.max(80, tweet.blank_word.length * 11 + 24);

  const cardBorder =
    feedback === 'correct'
      ? 'border-green-500 shadow-lg shadow-green-900/20'
      : feedback === 'incorrect'
        ? 'border-red-500 shadow-lg shadow-red-900/20'
        : 'border-gray-700 hover:border-gray-600';

  const inputClasses =
    feedback === 'correct'
      ? 'bg-green-900/60 border-green-400 text-green-300'
      : 'bg-gray-800 border-gray-500 text-white focus:border-blue-400';

  return (
    <div
      className={`rounded-2xl border bg-gray-900 p-5 transition-all duration-300 ${cardBorder}`}
    >
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <div
          className={`w-11 h-11 rounded-full bg-gradient-to-br ${avatarColor(tweet.author)} flex items-center justify-center text-white font-bold text-sm flex-shrink-0 select-none`}
        >
          {getInitials(tweet.author)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 flex-wrap">
            <span className="font-bold text-white text-[15px] leading-tight">
              {tweet.author}
            </span>
            {/* Verified badge */}
            <svg
              className="w-[18px] h-[18px] text-blue-400 flex-shrink-0"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-label="Verified"
            >
              <path d="M8.52 3.59a4.49 4.49 0 016.96 0l.42.49.63-.07a4.49 4.49 0 014.91 4.91l-.07.63.49.42a4.49 4.49 0 010 6.96l-.49.42.07.63a4.49 4.49 0 01-4.91 4.91l-.63-.07-.42.49a4.49 4.49 0 01-6.96 0l-.42-.49-.63.07a4.49 4.49 0 01-4.91-4.91l.07-.63-.49-.42a4.49 4.49 0 010-6.96l.49-.42-.07-.63a4.49 4.49 0 014.91-4.91l.63.07.42-.49zm4.46 10.43l4.25-4.25-1.06-1.06-3.72 3.72-1.72-1.72-1.06 1.06 2.25 2.25.53.53.53-.53z" />
            </svg>
          </div>
          <div className="text-gray-400 text-sm leading-tight">
            {tweet.handle} · {tweet.date}
          </div>
        </div>
        {/* X logo */}
        <svg
          className="w-5 h-5 text-white flex-shrink-0 mt-0.5"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      </div>

      {/* Tweet text with inline input */}
      <p className="text-white text-[17px] leading-relaxed mb-4 font-normal break-words">
        {parts.map((part, i) => {
          const isBlank = part.toLowerCase() === tweet.blank_word.toLowerCase();
          if (!isBlank) return <span key={i}>{part}</span>;

          if (feedback === 'incorrect') {
            return (
              <span
                key={i}
                className="inline-block bg-green-900/50 text-green-300 border-b-2 border-green-400 px-1 rounded-sm font-semibold"
              >
                {tweet.blank_word}
              </span>
            );
          }

          return (
            <input
              key={i}
              ref={inputRef}
              type="text"
              value={feedback === 'correct' ? tweet.blank_word : guess}
              onChange={(e) => onGuessChange(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={disabled}
              style={{ width: `${inputWidth}px` }}
              className={`inline border-0 border-b-2 ${inputClasses} px-1 py-0 text-[17px] leading-relaxed focus:outline-none rounded-none transition-colors duration-200 bg-transparent`}
              placeholder={'_'.repeat(Math.min(tweet.blank_word.length, 8))}
              spellCheck={false}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
            />
          );
        })}
      </p>

      {/* Footer */}
      <div className="flex items-center gap-6 text-gray-500 text-sm pt-3 border-t border-gray-800">
        <button className="flex items-center gap-1.5 hover:text-pink-400 transition-colors group">
          <svg
            className="w-[18px] h-[18px] group-hover:scale-110 transition-transform"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
          <span>{formatCount(tweet.likes)}</span>
        </button>
        <button className="flex items-center gap-1.5 hover:text-green-400 transition-colors group">
          <svg
            className="w-[18px] h-[18px] group-hover:scale-110 transition-transform"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          <span>{formatCount(tweet.retweets)}</span>
        </button>
      </div>
    </div>
  );
}
