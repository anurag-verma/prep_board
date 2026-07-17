import KanbanBoard from '../components/board/KanbanBoard';
import OnboardingBanner from '../components/board/OnboardingBanner';
import DetailSheet from '../components/detail/DetailSheet';
import { useBoardStore } from '../store/useBoardStore';
import { useUiStore } from '../store/useUiStore';

function BoardPage() {
  const selectedApplicationId = useUiStore((s) => s.selectedApplicationId);
  const stages = useBoardStore((s) => s.stages);
  const applications = useBoardStore((s) => s.applications);
  const onboardingDismissed = useBoardStore((s) => s.onboardingDismissed);
  const selectedApplication = applications.find((app) => app.id === selectedApplicationId);

  const showOnboarding = applications.length === 0 && !onboardingDismissed;

  return (
    <>
      {showOnboarding && <OnboardingBanner />}
      <KanbanBoard />
      {selectedApplication && <DetailSheet application={selectedApplication} stages={stages} />}
    </>
  );
}

export default BoardPage;
