import { Plus } from 'lucide-react';
import { useState } from 'react';
import { useBoardStore } from '../../store/useBoardStore';
import type { Application, Round } from '../../types/models';
import RoundForm from './RoundForm';
import { OUTCOME_COLORS, OUTCOME_ICONS, OUTCOME_LABELS, ROUND_TYPE_ICONS, ROUND_TYPE_LABELS } from './roundMeta';

interface RoundsTabProps {
  application: Application;
}

function RoundsTab({ application }: RoundsTabProps) {
  const addRound = useBoardStore((s) => s.addRound);
  const updateRound = useBoardStore((s) => s.updateRound);
  const deleteRound = useBoardStore((s) => s.deleteRound);
  const [editingRoundId, setEditingRoundId] = useState<string | 'new' | null>(null);

  if (editingRoundId === 'new') {
    return (
      <RoundForm
        applicationId={application.id}
        onSave={(round) => {
          addRound(application.id, round);
          setEditingRoundId(null);
        }}
        onCancel={() => setEditingRoundId(null)}
      />
    );
  }

  const editingRound = application.rounds.find((r) => r.id === editingRoundId);
  if (editingRound) {
    return (
      <RoundForm
        applicationId={application.id}
        round={editingRound}
        onSave={(patch) => {
          updateRound(application.id, editingRound.id, patch);
          setEditingRoundId(null);
        }}
        onCancel={() => setEditingRoundId(null)}
        onDelete={() => {
          deleteRound(application.id, editingRound.id);
          setEditingRoundId(null);
        }}
      />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={() => setEditingRoundId('new')}
        className="flex items-center justify-center gap-1 rounded-card border border-dashed border-line py-2 text-sm text-muted hover:border-action hover:text-action"
      >
        <Plus size={14} /> Add round
      </button>

      {application.rounds.length === 0 && (
        <p className="text-sm text-muted">No rounds logged yet.</p>
      )}

      {application.rounds.map((round) => (
        <RoundCard key={round.id} round={round} onClick={() => setEditingRoundId(round.id)} />
      ))}
    </div>
  );
}

function RoundCard({ round, onClick }: { round: Round; onClick: () => void }) {
  const TypeIcon = ROUND_TYPE_ICONS[round.type];
  const OutcomeIcon = OUTCOME_ICONS[round.outcome];

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center justify-between rounded-card border border-line bg-surface p-3 text-left text-sm [box-shadow:var(--shadow-resting)] transition-shadow hover:[box-shadow:var(--shadow-elevated)]"
    >
      <span className="flex items-center gap-2">
        <TypeIcon aria-hidden size={16} className="text-muted" />
        <span className="font-medium">{ROUND_TYPE_LABELS[round.type]}</span>
        <span className="font-mono text-xs text-muted">{round.date}</span>
      </span>
      <span
        className="flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium"
        style={{ borderColor: OUTCOME_COLORS[round.outcome], color: OUTCOME_COLORS[round.outcome] }}
      >
        <OutcomeIcon aria-hidden size={12} />
        {OUTCOME_LABELS[round.outcome]}
      </span>
    </button>
  );
}

export default RoundsTab;
