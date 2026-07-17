import { useMemo } from 'react';
import ActivityChart from '../components/stats/ActivityChart';
import FunnelChart from '../components/stats/FunnelChart';
import PipelineSnapshot from '../components/stats/PipelineSnapshot';
import ResponseDonut from '../components/stats/ResponseDonut';
import StaleTable from '../components/stats/StaleTable';
import StreakCard from '../components/stats/StreakCard';
import {
  computeActivityHeatmap,
  computeFunnel,
  computePipelineSnapshot,
  computeResponseBreakdown,
  computeStaleList,
  computeStreak,
  computeWeeklyActivity,
} from '../lib/stats';
import { useBoardStore } from '../store/useBoardStore';

function StatsPage() {
  const stages = useBoardStore((s) => s.stages);
  const applications = useBoardStore((s) => s.applications);
  const loadSampleData = useBoardStore((s) => s.loadSampleData);

  const activeCount = useMemo(
    () => applications.filter((a) => a.archivedAt === null).length,
    [applications],
  );

  const funnel = useMemo(() => computeFunnel(stages, applications), [stages, applications]);
  const weekly = useMemo(() => computeWeeklyActivity(applications), [applications]);
  const responseBreakdown = useMemo(
    () => computeResponseBreakdown(stages, applications),
    [stages, applications],
  );
  const pipeline = useMemo(
    () => computePipelineSnapshot(stages, applications),
    [stages, applications],
  );
  const streak = useMemo(() => computeStreak(applications), [applications]);
  const heatmap = useMemo(() => computeActivityHeatmap(applications), [applications]);
  const staleList = useMemo(() => computeStaleList(stages, applications), [stages, applications]);

  if (activeCount === 0) {
    return (
      <div>
        <h1 className="px-4 pt-4 text-xl font-semibold">Stats</h1>
        <div className="flex flex-col items-center gap-1 p-12 text-center">
          <p className="text-lg font-medium">No stats yet</p>
          <p className="text-sm text-muted">
            Add a few applications on the Board and your funnel, streak, and pipeline will show up
            here.
          </p>
          <button
            type="button"
            onClick={loadSampleData}
            className="mt-3 rounded-md px-3 py-1.5 text-sm font-medium text-on-action"
            style={{ backgroundColor: 'var(--action)' }}
          >
            Load example board
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="px-4 pt-4 text-xl font-semibold">Stats</h1>
      <div className="grid gap-4 p-4 md:grid-cols-2">
        <FunnelChart steps={funnel} />
        <ActivityChart buckets={weekly} />
        <ResponseDonut breakdown={responseBreakdown} />
        <PipelineSnapshot snapshot={pipeline} />
        <StreakCard streak={streak} heatmap={heatmap} />
        <StaleTable entries={staleList} />
      </div>
    </div>
  );
}

export default StatsPage;
