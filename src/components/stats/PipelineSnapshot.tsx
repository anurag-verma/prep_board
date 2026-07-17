import { Bar, BarChart, CartesianGrid, Cell, LabelList, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import type { PipelineStageCount } from '../../lib/stats';
import { usePrefersReducedMotion } from '../ui/usePrefersReducedMotion';
import AccessibleDataTable from './AccessibleDataTable';

interface PipelineSnapshotProps {
  snapshot: PipelineStageCount[];
}

function PipelineSnapshot({ snapshot }: PipelineSnapshotProps) {
  const prefersReducedMotion = usePrefersReducedMotion();

  return (
    <div className="rounded-column border border-line bg-surface p-4">
      <h3 className="mb-3 text-sm font-semibold">Pipeline now</h3>

      <ResponsiveContainer width="100%" height={Math.max(snapshot.length * 32, 120)}>
        <BarChart
          data={snapshot}
          layout="vertical"
          margin={{ top: 4, right: 24, bottom: 4, left: 4 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" horizontal={false} />
          <XAxis type="number" allowDecimals={false} stroke="var(--muted)" fontSize={12} />
          <YAxis type="category" dataKey="name" width={100} stroke="var(--muted)" fontSize={12} />
          <Bar dataKey="count" radius={4} isAnimationActive={!prefersReducedMotion}>
            {snapshot.map((stage) => (
              <Cell key={stage.stageId} fill={stage.color} />
            ))}
            <LabelList dataKey="count" position="right" fill="var(--muted)" fontSize={12} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <AccessibleDataTable
        caption="Current number of applications in each stage"
        headers={['Stage', 'Count']}
        rows={snapshot.map((s) => [s.name, s.count])}
      />
    </div>
  );
}

export default PipelineSnapshot;
