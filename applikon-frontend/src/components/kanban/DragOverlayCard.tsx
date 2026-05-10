import type { Application } from '../../types/domain'

interface DragOverlayCardProps {
  application: Application
}

export function DragOverlayCard({ application }: DragOverlayCardProps) {
  return (
    <div className="kanban-card dragging">
      <h4>{application.company}</h4>
      <p className="card-position">{application.position}</p>
    </div>
  )
}
