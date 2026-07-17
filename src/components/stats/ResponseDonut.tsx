import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import type { ResponseBreakdown } from '../../lib/stats';
import { usePrefersReducedMotion } from '../ui/usePrefersReducedMotion';
import AccessibleDataTable from './AccessibleDataTable';

interface ResponseDonutProps {
  breakdown: ResponseBreakdown;
}

function ResponseDonut({ breakdown }: ResponseDonutProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const data = [
    { name: 'Progressed', value: breakdown.progressed, color: 'var(--win)' },
    { name: 'Rejected', value: breakdown.rejected, color: 'var(--danger)' },
    { name: 'Ghosted (>21d)', value: breakdown.ghosted, color: 'var(--flag)' },
    { name: 'Waiting', value: breakdown.waiting, color: 'var(--muted)' },
  ];
  const total = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="rounded-column border border-line bg-surface p-4">
      <h3 className="mb-3 text-sm font-semibold">Response breakdown</h3>

      {total === 0 ? (
        <p className="py-8 text-center text-sm text-muted">
          No applications have left Wishlist yet.
        </p>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                innerRadius={50}
                outerRadius={80}
                isAnimationActive={!prefersReducedMotion}
              >
                {data.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>

          <ul className="mt-2 flex flex-wrap justify-center gap-x-3 gap-y-1 text-xs text-muted">
            {data.map((entry) => (
              <li key={entry.name} className="flex items-center gap-1.5">
                <span
                  aria-hidden
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                {entry.name}: {entry.value}
              </li>
            ))}
          </ul>

          {breakdown.rejected > 0 && (
            <p className="mt-2 text-center text-xs text-muted">
              {breakdown.rejected} closed — that's pipeline space for new applications, not a
              reflection on you.
            </p>
          )}
        </>
      )}

      <AccessibleDataTable
        caption="Response breakdown: how many applications fall into each outcome category"
        headers={['Category', 'Count']}
        rows={data.map((d) => [d.name, d.value])}
      />
    </div>
  );
}

export default ResponseDonut;
