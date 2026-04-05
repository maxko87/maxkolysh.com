import { useState } from 'react';
import { Link } from 'react-router-dom';
import tweetsData from '../data/tweets.json';

interface Tweet {
  id: number;
  author: string;
  handle: string;
  text: string;
  blank_word: string;
  date: string;
  likes: number;
  retweets: number;
}

const C = {
  bg: '#030712',
  card: '#16181c',
  text: '#e7e9ea',
  secondary: '#71767b',
  border: '#2f3336',
  blue: '#1d9bf0',
  red: '#f4212e',
  green: '#00ba7c',
  dim: '#3f4450',
};

export default function TweetLibsAdminPage() {
  const [tweets, setTweets] = useState<Tweet[]>(tweetsData as Tweet[]);
  const [filter, setFilter] = useState('');
  const [deletedIds, setDeletedIds] = useState<Set<number>>(new Set());

  const filtered = tweets.filter((t) => {
    if (deletedIds.has(t.id)) return false;
    if (!filter) return true;
    const q = filter.toLowerCase();
    return (
      t.author.toLowerCase().includes(q) ||
      t.handle.toLowerCase().includes(q) ||
      t.text.toLowerCase().includes(q) ||
      t.blank_word.toLowerCase().includes(q)
    );
  });

  const handleDelete = (id: number) => {
    setDeletedIds((prev) => new Set(prev).add(id));
  };

  const handleExport = () => {
    const remaining = tweets.filter((t) => !deletedIds.has(t.id));
    const blob = new Blob([JSON.stringify(remaining, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tweets.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Highlight the blank word in the tweet text
  const renderTweetWithBlank = (tweet: Tweet) => {
    const idx = tweet.text.toLowerCase().indexOf(tweet.blank_word.toLowerCase());
    if (idx === -1) return <span>{tweet.text}</span>;
    return (
      <span>
        {tweet.text.slice(0, idx)}
        <span
          style={{
            background: 'rgba(29, 155, 240, 0.2)',
            color: C.blue,
            fontWeight: 700,
            padding: '1px 4px',
            borderRadius: '3px',
            borderBottom: `2px solid ${C.blue}`,
          }}
        >
          {tweet.text.slice(idx, idx + tweet.blank_word.length)}
        </span>
        {tweet.text.slice(idx + tweet.blank_word.length)}
      </span>
    );
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: C.bg,
        color: C.text,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        lineHeight: 1.5,
      }}
    >
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '24px 16px 48px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <Link to="/tweetlibs" style={{ color: C.secondary, textDecoration: 'none', fontSize: '14px' }}>
            ← Back to game
          </Link>
          <h1 style={{ fontSize: '20px', fontWeight: 700, margin: 0 }}>TweetLibs Admin</h1>
          <div style={{ fontSize: '14px', color: C.secondary }}>
            {filtered.length}/{tweets.length - deletedIds.size} shown
            {deletedIds.size > 0 && (
              <span style={{ color: C.red, marginLeft: '8px' }}>
                ({deletedIds.size} deleted)
              </span>
            )}
          </div>
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <input
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter by author, handle, text, or blank word..."
            style={{
              flex: 1,
              minWidth: '200px',
              padding: '10px 14px',
              background: C.card,
              border: `1px solid ${C.border}`,
              borderRadius: '8px',
              color: C.text,
              fontSize: '14px',
              outline: 'none',
              fontFamily: 'inherit',
            }}
          />
          {deletedIds.size > 0 && (
            <button
              onClick={handleExport}
              style={{
                padding: '10px 20px',
                background: C.green,
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              Export remaining JSON
            </button>
          )}
        </div>

        {/* Tweet list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {filtered.map((tweet) => (
            <div
              key={tweet.id}
              style={{
                background: C.card,
                border: `1px solid ${C.border}`,
                borderRadius: '12px',
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 700, fontSize: '14px', color: C.text }}>{tweet.author}</span>
                  <span style={{ fontSize: '13px', color: C.secondary }}>{tweet.handle}</span>
                  <span style={{ fontSize: '12px', color: C.dim }}>· {tweet.date}</span>
                  <span style={{ fontSize: '11px', color: C.dim, marginLeft: 'auto' }}>id:{tweet.id}</span>
                </div>
                <div style={{ fontSize: '14px', color: C.text, lineHeight: '20px' }}>
                  {renderTweetWithBlank(tweet)}
                </div>
                <div style={{ fontSize: '12px', color: C.dim, marginTop: '4px' }}>
                  ♡ {tweet.likes.toLocaleString()} · ↺ {tweet.retweets.toLocaleString()} · blank: <span style={{ color: C.blue, fontWeight: 600 }}>{tweet.blank_word}</span>
                </div>
              </div>
              <button
                onClick={() => handleDelete(tweet.id)}
                style={{
                  background: 'transparent',
                  border: `1px solid ${C.border}`,
                  borderRadius: '8px',
                  color: C.red,
                  fontSize: '13px',
                  fontWeight: 600,
                  padding: '6px 12px',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  fontFamily: 'inherit',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(244, 33, 46, 0.1)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
