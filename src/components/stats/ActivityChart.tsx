import { format } from 'date-fns';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { WeeklyActivityBucket } from '../../lib/stats';
import { usePrefersReducedMotion } from '../ui/usePrefersReducedMotion';
import AccessibleDataTable from './AccessibleDataTable';

interface ActivityChartProps {
  buckets: WeeklyActivityBucket[];
}

/** `weekStart` is a plain yyyy-MM-dd string; `new Date(str)` parses it as UTC
 * midnight and can shift a day backward once formatted in a timezone behind
 * UTC. Building the Date from local year/month/day parts avoids that. */
function toLocalDate(yyyyMmDd: string): Date {
  const [year, month, day] = yyyyMmDd.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function ActivityChart({ buckets }: ActivityChartProps) {
  const prefersReducedMotion = usePrefersReducedMotion();

  return (
    <div className="rounded-column border border-line bg-surface p-4">
      <h3 className="mb-3 text-sm font-semibold">Applications over time</h3>

      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={buckets} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" vertical={false} />
          <XAxis
            dataKey="weekStart"
            tickFormatter={(v: string) => format(toLocalDate(v), 'MMM d')}
            stroke="var(--muted)"
            fontSize={11}
          />
          <YAxis allowDecimals={false} stroke="var(--muted)" fontSize={12} width={28} />
          <Tooltip
            labelFormatter={(v) =>
              typeof v === 'string' ? `Week of ${format(toLocalDate(v), 'MMM d, yyyy')}` : ''
            }
          />
          <Bar
            dataKey="count"
            fill="var(--stage-applied)"
            radius={4}
            isAnimationActive={!prefersReducedMotion}
          />
        </BarChart>
      </ResponsiveContainer>

      <AccessibleDataTable
        caption="Applications created per week, last 12 weeks"
        headers={['Week of', 'Applications']}
        rows={buckets.map((b) => [format(toLocalDate(b.weekStart), 'MMM d, yyyy'), b.count])}
      />
    </div>
  );
}

export default ActivityChart;
