import { priorityClass, priorityLabel, statusClass, statusLabel } from '../../labels.js';

export default function TaskBadges({ status, priority }) {
  return (
    <div className="task-card-top">
      <span className={`badge badge-status-${statusClass(status).replace('status-', '')}`}>
        {statusLabel(status)}
      </span>
      <span className={`badge badge-priority-${priorityClass(priority).replace('priority-', '')}`}>
        {priorityLabel(priority)}
      </span>
    </div>
  );
}
