import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { memo } from 'react';
import type { Application, Stage } from '../../types/models';
import JobCard from './JobCard';

interface SortableJobCardProps {
  application: Application;
  stage: Stage;
}

function SortableJobCard({ application, stage }: SortableJobCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: application.id,
    data: { type: 'card', stageId: application.stageId },
  });

  return (
    <JobCard
      application={application}
      stage={stage}
      dragHandle={{
        setNodeRef,
        attributes,
        listeners,
        style: { transform: CSS.Transform.toString(transform), transition },
        isDragging,
      }}
    />
  );
}

export default memo(SortableJobCard);
