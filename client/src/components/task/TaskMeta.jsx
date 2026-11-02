import { formatDate } from '../../labels.js';

export default function TaskMeta({ deadline, overdue }) {
  if (!deadline) {
    return <span className="muted">Tanpa tenggat</span>;
  }

  return (
    <span className={`task-meta-item ${overdue ? 'task-meta-item-overdue' : ''}`}>
      Tenggat: {formatDate(deadline)}
      {overdue ? ' - Terlambat' : ''}
    </span>
  );
}
