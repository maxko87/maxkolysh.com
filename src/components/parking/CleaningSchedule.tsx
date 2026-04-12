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
  const [showHelp, setShowHelp] = useState(false);
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <button
              onClick={() => setShowHelp(true)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.85rem',
                opacity: 0.35,
                transition: 'opacity 0.2s',
                padding: '4px',
              }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '0.7')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '0.35')}
            >
              ❓
            </button>
            <button
              onClick={onRefresh}
              disabled={refreshing}
              title="Refresh location"
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

      {/* Help modal */}
      {showHelp && (
        <div
          onClick={() => setShowHelp(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#1C1C1E',
              border: '1px solid #3A3A3C',
              borderRadius: '20px',
              padding: '1.75rem',
              maxWidth: '380px',
              width: '100%',
            }}
          >
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', margin: '0 0 1rem 0' }}>
              How it works
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', color: '#ccc', fontSize: '0.9rem', lineHeight: 1.5 }}>
              <p style={{ margin: 0 }}>
                <strong style={{ color: '#fff' }}>📍 We find your car.</strong> Using your Tesla's GPS, we detect which street and side you're parked on.
              </p>
              <p style={{ margin: 0 }}>
                <strong style={{ color: '#fff' }}>🧹 We check the schedule.</strong> SF cleans every street on a set schedule — usually twice a month. We look up the next cleaning for your exact spot.
              </p>
              <p style={{ margin: 0 }}>
                <strong style={{ color: '#fff' }}>📧 We remind you.</strong> Turn on email reminders and we'll notify you before cleaning starts — so you never get a ticket.
              </p>
              <p style={{ margin: 0 }}>
                <strong style={{ color: '#fff' }}>🔄 Refresh</strong> re-checks your car's current location if you've moved.
              </p>
              <p style={{ margin: 0 }}>
                <strong style={{ color: '#fff' }}>🔋 Won't drain your battery.</strong> Our server checks every 15 minutes — if your car is awake (e.g. you just drove somewhere), we automatically update your location. If it's asleep, we use your last known spot. We never wake your car or send commands.
              </p>
            </div>
            <button
              onClick={() => setShowHelp(false)}
              style={{
                width: '100%',
                marginTop: '1.25rem',
                padding: '0.7rem',
                background: '#2C2C2E',
                color: '#fff',
                border: '1px solid #3A3A3C',
                borderRadius: '12px',
                fontSize: '0.9rem',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              Got it
            </button>
          </div>
        </div>
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
            {label}{!label.toLowerCase().includes('side') && ' Side'}
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
