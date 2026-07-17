import { format } from 'date-fns';
import type { HeatmapDay } from '../../lib/stats';
import AccessibleDataTable from './AccessibleDataTable';

interface StreakCardProps {
  streak: number;
  heatmap: HeatmapDay[];
}

/** `day.date` is a plain yyyy-MM-dd string; `new Date(str)` would parse it as
 * UTC midnight and can shift a day backward once formatted in a timezone
 * behind UTC. Building the Date from local year/month/day parts avoids that. */
function toLocalDate(yyyyMmDd: string): Date {
  const [year, month, day] = yyyyMmDd.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function StreakCard({ streak, heatmap }: StreakCardProps) {
  return (
    <div className="rounded-column border border-line bg-surface p-4 md:col-span-2">
      <h3 className="mb-3 text-sm font-semibold">Streak</h3>

      <p className="font-mono text-3xl font-semibold" style={{ color: 'var(--action)' }}>
        {streak}
        <span className="ml-2 text-sm font-normal text-muted">
          day{streak === 1 ? '' : 's'}
        </span>
      </p>

      <div
        role="img"
        aria-label={`Activity over the last ${heatmap.length} days: ${heatmap.filter((d) => d.active).length} active days`}
        className="mt-3 flex flex-wrap gap-1"
      >
        {heatmap.map((day) => (
          <span
            key={day.date}
            title={`${day.date}${day.active ? ' — active' : ''}`}
            className="h-3 w-3 rounded-sm"
            style={{ backgroundColor: day.active ? 'var(--action)' : 'var(--line)' }}
          />
        ))}
      </div>

      <AccessibleDataTable
        caption={`Daily activity for the last ${heatmap.length} days`}
        headers={['Date', 'Active']}
        rows={heatmap.map((d) => [format(toLocalDate(d.date), 'MMM d, yyyy'), d.active ? 'Yes' : 'No'])}
      />
    </div>
  );
}

export default StreakCard;
