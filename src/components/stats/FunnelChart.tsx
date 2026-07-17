import { Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import type { FunnelStep } from '../../lib/stats';
import { usePrefersReducedMotion } from '../ui/usePrefersReducedMotion';
import AccessibleDataTable from './AccessibleDataTable';

interface FunnelChartProps {
  steps: FunnelStep[];
}

function FunnelChart({ steps }: FunnelChartProps) {
  const prefersReducedMotion = usePrefersReducedMotion();

  return (
    <div className="rounded-column border border-line bg-surface p-4">
      <h3 className="mb-1 text-sm font-semibold">Funnel</h3>
      <div className="mb-3 flex flex-wrap items-center gap-x-1.5 gap-y-1 font-mono text-xs text-muted">
        {steps.map((step, i) => (
          <span key={step.stageId} className="flex items-center gap-1">
            {i > 0 && <span aria-hidden>→</span>}
            <span>
              {step.name} {step.count}
              {step.conversionFromPrevious !== null &&
                ` (${Math.round(step.conversionFromPrevious * 100)}%)`}
            </span>
          </span>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={Math.max(steps.length * 36, 120)}>
        <BarChart data={steps} layout="vertical" margin={{ top: 4, right: 24, bottom: 4, left: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" horizontal={false} />
          <XAxis type="number" allowDecimals={false} stroke="var(--muted)" fontSize={12} />
          <YAxis type="category" dataKey="name" width={100} stroke="var(--muted)" fontSize={12} />
          <Bar dataKey="count" fill="var(--action)" radius={4} isAnimationActive={!prefersReducedMotion}>
            <LabelList dataKey="count" position="right" fill="var(--muted)" fontSize={12} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <AccessibleDataTable
        caption="Funnel: applications that reached each stage or later, with conversion rate from the previous stage"
        headers={['Stage', 'Count', 'Conversion from previous']}
        rows={steps.map((s) => [
          s.name,
          s.count,
          s.conversionFromPrevious === null
            ? '—'
            : `${Math.round(s.conversionFromPrevious * 100)}%`,
        ])}
      />
    </div>
  );
}

export default FunnelChart;
