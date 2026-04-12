import { useState } from 'react';
import type { NearestSegmentResult } from '../../utils/streetCleaning';
import { getCleaningStatus } from '../../utils/streetCleaning';

interface CleaningScheduleProps {
  result: NearestSegmentResult;
  onRefresh?: () => void;
  refreshing?: boolean;
}

function getOrdinal(n: number): string {
  const suffixes: Record<number, string> = { 1: '1st', 2: '2nd', 3: '3rd', 4: '4th', 5: '5th' };
  return suffixes[n] || `${n}th`;
}

function getRecurringPattern(startStr: string, nextStartStr: string | null, _endStr: string): string | null {
  if (!nextStartStr) return null;

  const start = new Date(startStr);
  const nextStart = new Date(nextStartStr);

  const dayOfWeek = start.toLocaleDateString('en-US', { weekday: 'long' });
  const weekOfMonth1 = Math.ceil(start.getDate() / 7);
  const weekOfMonth2 = Math.ceil(nextStart.getDate() / 7);

  const gapDays = Math.round((nextStart.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

  if (gapDays >= 25) {
    return `${getOrdinal(weekOfMonth1)} ${dayOfWeek}`;
  } else {
    const weeks = [weekOfMonth1, weekOfMonth2].sort();
    return `${getOrdinal(weeks[0])} & ${getOrdinal(weeks[1])} ${dayOfWeek}`;
  }
}

function getDaysUntil(dateStr: string): number {
  const now = new Date();
  const target = new Date(dateStr);
  return Math.max(0, Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function parseLimits(streetId: string | undefined): string | null {
  if (!streetId) return null;
  const match = streetId.match(/between\s+(.+)\s+and\s+(.+)/i);
  if (match) return `${match[1]} – ${match[2]}`;
  return null;
}

export default function CleaningSchedule({ result, onRefresh, refreshing }: CleaningScheduleProps) {
  const [showOtherSide, setShowOtherSide] = useState(false);
  const { feature, sides, parkedSide } = result;
  const { Corridor, StreetIdentifier } = feature.properties;

  const limits = parseLimits(StreetIdentifier);

  // Split into parked side and other side
  const parkedSides = sides.filter(s => parkedSide === null || s.label === parkedSide);
  const otherSides = sides.filter(s => parkedSide !== null && s.label !== parkedSide);

  return (
    <div style={{ width: '100%', maxWidth: '32rem' }}>
      {/* Header: vehicle + street */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1rem' }}>🚗</span>
            <span style={{ fontSize: '0.95rem', color: '#8A8A8E' }}>Tesla</span>
          </div>
          <button
            onClick={onRefresh}
            disabled={refreshing}
            style={{
              background: 'none',
              border: 'none',
              cursor: refreshing ? 'default' : 'pointer',
              fontSize: '1.1rem',
              opacity: refreshing ? 0.4 : 0.5,
              transition: 'opacity 0.2s',
              padding: '4px',
            }}
          >
            🔄
          </button>
        </div>
        <h1 style={{
          fontSize: '1.75rem',
          fontWeight: 700,
          color: '#fff',
          margin: '0.25rem 0 0 0',
          lineHeight: 1.2,
        }}>
          {Corridor}
        </h1>
        {limits && (
          <p style={{
            fontSize: '0.95rem',
            color: '#8A8A8E',
            margin: '0.25rem 0 0 0',
          }}>
            {limits}
          </p>
        )}
      </div>

      {/* Cleaning cards */}
      {sides.length === 0 ? (
        <Card>
          <p style={{ color: '#8A8A8E', margin: 0, textAlign: 'center' }}>
            No upcoming cleaning scheduled for this block.
          </p>
        </Card>
      ) : (
        <>
          {parkedSides.map(({ label, relevant }) => {
            if (!relevant) return null;
            return (
              <SideCard
                key={label}
                label={label}
                relevant={relevant}
                isParked={parkedSide !== null && label === parkedSide}
              />
            );
          })}

          {/* Show other side toggle */}
          {otherSides.length > 0 && (
            <>
              <button
                onClick={() => setShowOtherSide(!showOtherSide)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.35rem',
                  width: '100%',
                  background: 'none',
                  border: 'none',
                  color: '#8A8A8E',
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  padding: '1rem 0',
                }}
              >
                {showOtherSide ? 'Hide' : 'Show'} other side
                <span style={{
                  fontSize: '0.75rem',
                  transform: showOtherSide ? 'rotate(180deg)' : 'none',
                  transition: 'transform 0.2s',
                }}>
                  ▾
                </span>
              </button>

              {showOtherSide && otherSides.map(({ label, relevant }) => {
                if (!relevant) return null;
                return (
                  <SideCard
                    key={label}
                    label={label}
                    relevant={relevant}
                    isParked={false}
                  />
                );
              })}
            </>
          )}
        </>
      )}
    </div>
  );
}

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: '#141414',
      border: '1px solid #2C2C2E',
      borderRadius: '16px',
      padding: '1.25rem',
      ...style,
    }}>
      {children}
    </div>
  );
}

interface SideCardProps {
  label: string;
  relevant: {
    start: string;
    end: string;
    nextStart: string | null;
    calendarLink: string | null;
  };
  isParked: boolean;
}

function SideCard({ label, relevant, isParked }: SideCardProps) {
  const status = getCleaningStatus(relevant.start, relevant.end);
  const daysUntil = getDaysUntil(relevant.start);
  const dateStr = formatDate(relevant.start);
  const recurringPattern = getRecurringPattern(relevant.start, relevant.nextStart, relevant.end);

  const startTime = new Date(relevant.start).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  const endTime = new Date(relevant.end).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  const timeRange = `${startTime} – ${endTime}`;

  const isUrgent = status.color === 'red';
  const badgeColor = isUrgent ? '#f87171' : '#34C759';

  return (
    <Card style={{ marginBottom: '0rem' }}>
      {/* Top row: side label + days badge */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span style={{ color: badgeColor, fontSize: '0.95rem' }}>📍</span>
          <span style={{
            fontSize: '0.8rem',
            fontWeight: 600,
            color: '#8A8A8E',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
          }}>
            {label}
            {isParked && ' side'}
          </span>
        </div>

        <span style={{
          fontSize: '0.8rem',
          fontWeight: 500,
          color: badgeColor,
          border: `1.5px solid ${badgeColor}`,
          borderRadius: '999px',
          padding: '0.2rem 0.7rem',
        }}>
          {status.label === 'Happening Now' ? 'NOW' : `${daysUntil} day${daysUntil !== 1 ? 's' : ''}`}
        </span>
      </div>

      {/* Date */}
      <p style={{
        fontSize: '1.5rem',
        fontWeight: 700,
        color: '#fff',
        margin: '0 0 0.25rem 0',
      }}>
        {dateStr}
      </p>

      {/* Time + recurring */}
      <p style={{
        fontSize: '0.9rem',
        color: '#8A8A8E',
        margin: '0 0 1rem 0',
      }}>
        {timeRange}{recurringPattern ? ` · ${recurringPattern}` : ''}
      </p>

      {/* Calendar button */}
      {relevant.calendarLink && (
        <a
          href={relevant.calendarLink}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            fontSize: '0.9rem',
            fontWeight: 500,
            color: '#E0E0E0',
            background: '#2C2C2E',
            border: '1px solid #3A3A3C',
            borderRadius: '10px',
            padding: '0.55rem 0.85rem',
            textDecoration: 'none',
            transition: 'background 0.2s',
          }}
        >
          📅 Add to Calendar
        </a>
      )}

      {/* Urgent warning */}
      {isUrgent && isParked && (
        <p style={{
          fontSize: '1rem',
          color: '#ef4444',
          fontWeight: 700,
          margin: '0.75rem 0 0 0',
        }}>
          🚨 MOVE YOUR CAR!
        </p>
      )}
    </Card>
  );
}
