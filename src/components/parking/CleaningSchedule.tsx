import type { NearestSegmentResult } from '../../utils/streetCleaning';
import { getCleaningStatus, formatCleaningTime } from '../../utils/streetCleaning';

interface CleaningScheduleProps {
  result: NearestSegmentResult;
  onRefresh?: () => void;
  refreshing?: boolean;
}

export default function CleaningSchedule({ result, onRefresh, refreshing }: CleaningScheduleProps) {
  const { feature, distance, sides } = result;
  const { Corridor, Limits } = feature.properties;

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-lg">
      {/* Street info header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-white">{Corridor}</h2>
        <p className="text-zinc-400">{Limits}</p>
        <p className="text-xs text-zinc-600">{Math.round(distance)}m from your car</p>
      </div>

      {/* Cleaning sides */}
      {sides.length === 0 ? (
        <div className="p-6 bg-white/5 border border-white/10 rounded-xl text-center">
          <p className="text-zinc-400">No upcoming cleaning scheduled for this block.</p>
        </div>
      ) : (
        <div className="w-full space-y-4">
          {sides.map(({ label, data }) => {
            const status = data.NextCleaning ? getCleaningStatus(data.NextCleaning) : null;

            return (
              <div
                key={label}
                className="p-5 bg-white/5 border border-white/10 rounded-xl space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-zinc-400 uppercase tracking-wide">
                    {label}
                  </span>
                  {status && (
                    <span
                      className={`text-sm font-medium px-2.5 py-0.5 rounded-full ${
                        status.color === 'red'
                          ? 'bg-red-500/20 text-red-400'
                          : status.color === 'yellow'
                          ? 'bg-yellow-500/20 text-yellow-400'
                          : 'bg-green-500/20 text-green-400'
                      }`}
                    >
                      {status.emoji} {status.label}
                    </span>
                  )}
                </div>

                {data.NextCleaning && (
                  <>
                    <div>
                      <p className="text-white text-lg font-semibold">
                        {formatCleaningTime(data.NextCleaning)}
                      </p>
                      <p className="text-sm text-zinc-400">
                        {data.FromHour} – {data.ToHour} • {data.WeekDay}s
                      </p>
                    </div>

                    {status && (
                      <p className={`text-sm ${
                        status.color === 'red' ? 'text-red-400' : 'text-zinc-500'
                      }`}>
                        {status.timeUntil}
                      </p>
                    )}

                    <div className="flex gap-3 pt-1">
                      {data.NextCleaningCalendarLink && (
                        <a
                          href={data.NextCleaningCalendarLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm px-3 py-1.5 bg-white/10 hover:bg-white/15 rounded-lg text-white transition-colors"
                        >
                          📅 Add to Calendar
                        </a>
                      )}
                    </div>

                    {data.NextNextCleaning && (
                      <p className="text-xs text-zinc-600">
                        Following: {formatCleaningTime(data.NextNextCleaning)}
                      </p>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={onRefresh}
          disabled={refreshing}
          className="px-4 py-2 bg-white/10 hover:bg-white/15 text-white text-sm rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
        >
          {refreshing ? 'Refreshing...' : '🔄 Refresh Location'}
        </button>
      </div>
    </div>
  );
}
