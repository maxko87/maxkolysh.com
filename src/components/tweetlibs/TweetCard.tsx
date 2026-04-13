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
  disabled?: boolean;
  humor_score?: number;
  tweet_id?: string;
  category?: string;
  online_score?: number;
  week_start?: string;
  week_end?: string;
  difficulty?: number;
  image_url?: string;
}

interface TweetCardProps {
  tweet: Tweet;
  guess: string;
  onGuessChange: (val: string) => void;
  onSubmit: () => void;
  feedback: 'correct' | 'incorrect' | null;
  disabled: boolean;
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

const AVATAR_COLORS = [
  ['#a855f7', '#3b82f6'],
  ['#ec4899', '#fb923c'],
  ['#22c55e', '#2dd4bf'],
  ['#3b82f6', '#06b6d4'],
  ['#f97316', '#facc15'],
  ['#ef4444', '#ec4899'],
];

function avatarGradient(name: string) {
  const idx = name.charCodeAt(0) % AVATAR_COLORS.length;
  const [from, to] = AVATAR_COLORS[idx];
  return `linear-gradient(135deg, ${from}, ${to})`;
}

function getTweetUrl(tweet: Tweet): string {
  if (tweet.tweet_id) {
    const handle = tweet.handle.replace('@', '');
    return `https://x.com/${handle}/status/${tweet.tweet_id}`;
  }
  return `https://www.google.com/search?q=site:x.com+${encodeURIComponent(tweet.handle.replace('@', ''))}+${encodeURIComponent('"' + tweet.text.slice(0, 40) + '"')}`;
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
      e.stopPropagation(); // prevent global listener from catching this
      e.preventDefault();
      onSubmit();
    }
  };

  // Strip t.co URLs from display text (they look ugly, image is shown separately)
  const displayText = tweet.text.replace(/\s*https?:\/\/t\.co\/\S+/g, '').trim();

  // Only blank the FIRST occurrence of the word
  const idx = displayText.toLowerCase().indexOf(tweet.blank_word.toLowerCase());
  let parts: string[];
  if (idx === -1) {
    parts = [displayText];
  } else {
    parts = [
      displayText.slice(0, idx),
      displayText.slice(idx, idx + tweet.blank_word.length),
      displayText.slice(idx + tweet.blank_word.length),
    ];
  }
  const inputWidth = 140;

  const borderColor =
    feedback === 'correct'
      ? '#22c55e'
      : feedback === 'incorrect'
        ? '#ef4444'
        : '#2f3336';

  return (
    <div
      style={{
        background: '#16181c',
        border: `1px solid ${borderColor}`,
        borderRadius: '16px',
        padding: '16px',
        transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
        boxShadow:
          feedback === 'correct'
            ? '0 0 24px rgba(34, 197, 94, 0.12)'
            : feedback === 'incorrect'
              ? '0 0 24px rgba(239, 68, 68, 0.12)'
              : 'none',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        position: 'relative' as const,
      }}
    >
      {/* Category badge */}
      {tweet.category && (
        <span
          style={{
            position: 'absolute',
            top: '12px',
            right: '48px',
            background: 'rgba(29, 155, 240, 0.15)',
            color: '#1d9bf0',
            fontSize: '11px',
            fontWeight: 600,
            padding: '2px 8px',
            borderRadius: '10px',
            textTransform: 'capitalize',
          }}
        >
          {tweet.category}
        </span>
      )}

      {/* Header row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '12px',
          marginBottom: '12px',
        }}
      >
        {/* Avatar */}
        <div
          style={{
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            background: avatarGradient(tweet.author),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 700,
            fontSize: '15px',
            flexShrink: 0,
            userSelect: 'none',
            letterSpacing: '0',
          }}
        >
          {getInitials(tweet.author)}
        </div>

        {/* Name / handle */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
            <span
              style={{
                fontWeight: 700,
                color: '#e7e9ea',
                fontSize: '15px',
                lineHeight: '20px',
              }}
            >
              {tweet.author}
            </span>
            {/* Verified badge */}
            <svg
              style={{ width: '18px', height: '18px', color: '#1d9bf0', flexShrink: 0 }}
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M8.52 3.59a4.49 4.49 0 016.96 0l.42.49.63-.07a4.49 4.49 0 014.91 4.91l-.07.63.49.42a4.49 4.49 0 010 6.96l-.49.42.07.63a4.49 4.49 0 01-4.91 4.91l-.63-.07-.42.49a4.49 4.49 0 01-6.96 0l-.42-.49-.63.07a4.49 4.49 0 01-4.91-4.91l.07-.63-.49-.42a4.49 4.49 0 010-6.96l.49-.42-.07-.63a4.49 4.49 0 014.91-4.91l.63.07.42-.49zm4.46 10.43l4.25-4.25-1.06-1.06-3.72 3.72-1.72-1.72-1.06 1.06 2.25 2.25.53.53.53-.53z" />
            </svg>
          </div>
          <div style={{ color: '#71767b', fontSize: '14px', lineHeight: '20px' }}>
            {tweet.handle} · {tweet.date}
          </div>
        </div>

        {/* X logo */}
        <svg
          style={{ width: '20px', height: '20px', color: '#e7e9ea', flexShrink: 0, marginTop: '2px' }}
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      </div>

      {/* Tweet body */}
      <div
        style={{
          color: '#e7e9ea',
          fontSize: '17px',
          lineHeight: '26px',
          marginBottom: '16px',
          wordBreak: 'break-word',
        }}
      >
        {parts.map((part, i) => {
          const isBlank = i === 1 && idx !== -1;
          if (!isBlank) return <span key={i}>{part}</span>;

          // After incorrect: reveal the correct answer
          if (feedback === 'incorrect') {
            return (
              <span
                key={i}
                style={{
                  display: 'inline',
                  background: 'rgba(34, 197, 94, 0.12)',
                  color: '#4ade80',
                  borderBottom: '2px solid #22c55e',
                  padding: '0 3px',
                  fontWeight: 700,
                  borderRadius: '3px',
                }}
              >
                {tweet.blank_word}
              </span>
            );
          }

          // Correct: show the guessed word highlighted
          if (feedback === 'correct') {
            return (
              <input
                key={i}
                ref={inputRef}
                type="text"
                value={tweet.blank_word}
                readOnly
                style={{
                  display: 'inline',
                  width: `${inputWidth}px`,
                  background: 'rgba(34, 197, 94, 0.12)',
                  border: 'none',
                  borderTop: 'none',
                  borderLeft: 'none',
                  borderRight: 'none',
                  borderBottom: '2px solid #22c55e',
                  color: '#4ade80',
                  fontSize: '17px',
                  lineHeight: '26px',
                  padding: '0 3px',
                  outline: 'none',
                  borderRadius: 0,
                  fontFamily: 'inherit',
                  fontWeight: 700,
                  verticalAlign: 'baseline',
                  caretColor: 'transparent',
                  textDecoration: 'none',
                  boxShadow: 'none',
                  WebkitAppearance: 'none' as const,
                }}
              />
            );
          }

         // Waiting for guess: simple underlined span with input
         return (
            <span
              key={i}
              style={{
                display: 'inline-block',
                background: 'rgba(29, 155, 240, 0.08)',
                border: '2px solid #1d9bf0',
                borderRadius: '8px',
                minWidth: '140px',
                padding: '4px 8px',
                verticalAlign: 'baseline',
              }}
            >
              <input
                ref={inputRef}
                type="text"
                inputMode="text"
                enterKeyHint="done"
                value={guess}
                onChange={(e) => onGuessChange(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={disabled}
                style={{
                  width: '100%',
                  background: 'transparent',
                  border: 'none',
                  color: '#e7e9ea',
                  fontSize: '17px',
                  lineHeight: '24px',
                  padding: 0,
                  margin: 0,
                  outline: 'none',
                  fontFamily: 'inherit',
                  caretColor: '#1d9bf0',
                }}
                placeholder="type your guess..."
                spellCheck={false}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                autoFocus
              />
            </span>
          );
        })}
      </div>

      {/* Tweet image */}
      {tweet.image_url && (
        <div
          style={{
            marginBottom: '12px',
            borderRadius: '12px',
            overflow: 'hidden',
            border: '1px solid #2f3336',
          }}
        >
          <img
            src={tweet.image_url}
            alt=""
            style={{
              width: '100%',
              display: 'block',
              maxHeight: '300px',
              objectFit: 'cover',
            }}
            loading="lazy"
          />
        </div>
      )}

      {/* Footer: likes / retweets / link */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '20px',
          color: '#71767b',
          fontSize: '13px',
          paddingTop: '12px',
          borderTop: '1px solid #2f3336',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <svg style={{ width: '16px', height: '16px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          {formatCount(tweet.likes)}
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <svg style={{ width: '16px', height: '16px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {formatCount(tweet.retweets)}
        </span>
        {feedback !== null && (
          <a
            href={getTweetUrl(tweet)}
            target="_blank"
            rel="noopener noreferrer"
            style={{ marginLeft: 'auto', color: '#71767b', display: 'flex', alignItems: 'center', transition: 'color 0.15s' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#a1a5ab')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#71767b')}
          >
            <svg style={{ width: '15px', height: '15px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" />
            </svg>
          </a>
        )}
      </div>
    </div>
  );
}
