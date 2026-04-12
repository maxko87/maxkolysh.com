import { useState } from 'react';
import type { NearestSegmentResult } from '../../utils/streetCleaning';
import { getCleaningStatus, formatCleaningRange } from '../../utils/streetCleaning';

interface CleaningScheduleProps {
  result: NearestSegmentResult;
  onRefresh?: () => void;
  refreshing?: boolean;
}

const statusColors: Record<string, { bg: string; text: string; border: string }> = {
  red: { bg: 'rgba(239, 68, 68, 0.15)', text: '#f87171', border: 'rgba(239, 68, 68, 0.3)' },
  yellow: { bg: 'rgba(234, 179, 8, 0.15)', text: '#facc15', border: 'rgba(234, 179, 8, 0.3)' },
  green: { bg: 'rgba(74, 222, 128, 0.15)', text: '#4ade80', border: 'rgba(74, 222, 128, 0.3)' },
};

function getOrdinal(n: number): string {
  const suffixes: Record<number, string> = { 1: '1st', 2: '2nd', 3: '3rd', 4: '4th', 5: '5th' };
  return suffixes[n] || `${n}th`;
}

function getRecurringPattern(startStr: string, nextStartStr: string | null, endStr: string): string | null {
  if (!nextStartStr) return null;

  const start = new Date(startStr);
  const nextStart = new Date(nextStartStr);
  const end = new Date(endStr);

  const dayOfWeek = start.toLocaleDateString('en-US', { weekday: 'long' });
  const weekOfMonth1 = Math.ceil(start.getDate() / 7);
  const weekOfMonth2 = Math.ceil(nextStart.getDate() / 7);

  const startTime = start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  const endTime = end.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  const timeRange = `${startTime} – ${endTime}`;

  const gapDays = Math.round((nextStart.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

  if (gapDays >= 25) {
    // Once a month
    return `Every ${getOrdinal(weekOfMonth1)} ${dayOfWeek}, ${timeRange}`;
  } else {
    // Twice a month
    const weeks = [weekOfMonth1, weekOfMonth2].sort();
    return `Every ${getOrdinal(weeks[0])} and ${getOrdinal(weeks[1])} ${dayOfWeek}, ${timeRange}`;
  }
}

function parseStreetIdentifier(streetId: string | undefined, corridor: string): string | null {
  if (!streetId) return null;
  // StreetIdentifier looks like "Elizabeth St, between Diamond St and Douglass St"
  const betweenMatch = streetId.match(/,?\s*(between\s+.+)/i);
  if (betweenMatch) return betweenMatch[1];
  // If it's different from corridor, show it; otherwise null
  if (streetId !== corridor) return streetId;
  return null;
}

export default function CleaningSchedule({ result, onRefresh, refreshing }: CleaningScheduleProps) {
  const [refreshHovered, setRefreshHovered] = useState(false);
  const { feature, sides, parkedSide } = result;
  const { Corridor, StreetIdentifier } = feature.properties;

  const subtitle = parseStreetIdentifier(StreetIdentifier, Corridor);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', width: '100%', maxWidth: '32rem' }}>
      {/* Street info header */}
      <div style={{ textAlign: 'center' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#fff', margin: 0 }}>
          You're parked on {Corridor}
        </h2>
        {subtitle && (
          <p style={{ color: 'rgba(255,255,255,0.5)', margin: '0.35rem 0 0 0', fontSize: '0.85rem' }}>
            {subtitle}
          </p>
        )}
      </div>

      {/* Cleaning sides */}
      {sides.length === 0 ? (
        <div style={{
          padding: '1.5rem',
          background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '16px',
          textAlign: 'center',
        }}>
          <p style={{ color: 'rgba(255,255,255,0.6)', margin: 0 }}>No upcoming cleaning scheduled for this block.</p>
        </div>
      ) : (
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {sides.map(({ label, relevant }) => {
            if (!relevant) return null;
            const status = getCleaningStatus(relevant.start, relevant.end);
            const colors = statusColors[status.color] || statusColors.green;
            const isParkedHere = parkedSide !== null && label === parkedSide;
            const isOtherSide = parkedSide !== null && label !== parkedSide;
            const isHappeningNow = status.label === 'Happening Now';

            const recurringPattern = getRecurringPattern(relevant.start, relevant.nextStart, relevant.end);

            return (
              <div
                key={label}
                style={{
                  padding: '1.25rem',
                  background: isParkedHere
                    ? 'rgba(59, 130, 246, 0.08)'
                    : 'rgba(255,255,255,0.06)',
                  border: isParkedHere
                    ? '1px solid rgba(59, 130, 246, 0.3)'
                    : '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                  opacity: isOtherSide ? 0.55 : 1,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      color: isParkedHere ? 'rgba(147, 197, 253, 0.9)' : 'rgba(255,255,255,0.4)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}>
                      {label}
                    </span>
                    {isParkedHere && (
                      <span style={{
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        padding: '0.15rem 0.5rem',
                        borderRadius: '999px',
                        background: 'rgba(59, 130, 246, 0.2)',
                        color: '#93c5fd',
                        border: '1px solid rgba(59, 130, 246, 0.3)',
                      }}>
                        📍 You're here
                      </span>
                    )}
                    {isOtherSide && (
                      <span style={{
                        fontSize: '0.65rem',
                        color: 'rgba(255,255,255,0.3)',
                      }}>
                        Other side
                      </span>
                    )}
                  </div>
                  <span style={{
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    padding: '0.25rem 0.75rem',
                    borderRadius: '999px',
                    background: colors.bg,
                    color: colors.text,
                    border: `1px solid ${colors.border}`,
                  }}>
                    {status.emoji} {status.label}
                  </span>
                </div>

                {/* Main cleaning time */}
                <div>
                  <p style={{ color: '#fff', fontSize: '1.05rem', fontWeight: 600, margin: 0 }}>
                    {formatCleaningRange(relevant.start, relevant.end)}
                  </p>
                  {isHappeningNow && isParkedHere ? (
                    <p style={{
                      fontSize: '1rem',
                      color: '#ef4444',
                      margin: '0.5rem 0 0 0',
                      fontWeight: 700,
                      letterSpacing: '0.02em',
                    }}>
                      🚨 MOVE YOUR CAR!
                    </p>
                  ) : (
                    <p style={{
                      fontSize: '0.95rem',
                      color: status.color === 'red' ? '#f87171' : isParkedHere ? '#93c5fd' : 'rgba(255,255,255,0.45)',
                      margin: '0.4rem 0 0 0',
                      fontWeight: 600,
                    }}>
                      {status.timeUntil}
                    </p>
                  )}
                </div>

                {/* Recurring schedule pattern */}
                {recurringPattern && (
                  <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', margin: 0 }}>
                    Recurring: {recurringPattern}
                  </p>
                )}

                {/* Calendar link */}
                {relevant.calendarLink && (
                  <div style={{ display: 'flex', gap: '0.75rem', paddingTop: '0.25rem' }}>
                    <a
                      href={relevant.calendarLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        fontSize: '0.8rem',
                        padding: '0.4rem 0.75rem',
                        background: 'rgba(255,255,255,0.08)',
                        borderRadius: '10px',
                        color: '#fff',
                        textDecoration: 'none',
                        border: '1px solid rgba(255,255,255,0.1)',
                        transition: 'background 0.2s',
                      }}
                    >
                      📅 Add to Calendar
                    </a>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <button
          onClick={onRefresh}
          disabled={refreshing}
          onMouseEnter={() => setRefreshHovered(true)}
          onMouseLeave={() => setRefreshHovered(false)}
          style={{
            padding: '0.6rem 1.25rem',
            background: refreshHovered ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.06)',
            color: '#fff',
            fontSize: '0.875rem',
            borderRadius: '12px',
            border: '1px solid rgba(255,255,255,0.1)',
            transition: 'all 0.2s',
            opacity: refreshing ? 0.5 : 1,
            cursor: refreshing ? 'default' : 'pointer',
          }}
        >
          {refreshing ? 'Refreshing...' : '🔄 Refresh Location'}
        </button>
      </div>
    </div>
  );
}
