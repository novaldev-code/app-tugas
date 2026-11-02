import {
  DndContext,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  formatDate,
  priorityClass,
  priorityLabel,
  statusClass,
  statusLabel,
  STATUSES,
} from '../labels.js';
import Filters from './Filters.jsx';

function DraggableTask({ task, onEdit, onDelete }) {
  const { attributes, isDragging, listeners, setNodeRef, transform } = useDraggable({
    id: `task-${task.id}`,
  });

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  return (
    <article
      ref={setNodeRef}
      style={style}
      className={`kanban-card${isDragging ? ' dragging' : ''}`}
    >
      <div className="kanban-card-header">
        <button
          type="button"
          className="drag-handle"
          {...listeners}
          {...attributes}
          aria-label={`Seret tugas ${task.title}`}
        >
          Seret
        </button>
        <h4>{task.title}</h4>
      </div>

      {task.description && <p className="task-description">{task.description}</p>}

      <div className="task-meta">
        <span className={`badge ${statusClass(task.status)}`}>
          {statusLabel(task.status)}
        </span>
        <span className={`badge ${priorityClass(task.priority)}`}>
          {priorityLabel(task.priority)}
        </span>
      </div>

      <div className="kanban-card-footer">
        {task.deadline ? (
          <span className={task.overdue ? 'deadline overdue' : 'deadline'}>
            {formatDate(task.deadline)}
            {task.overdue ? ' - Terlambat' : ''}
          </span>
        ) : (
          <span className="muted">Tanpa tenggat</span>
        )}

        <div className="task-actions">
          <button
            type="button"
            className="button small secondary"
            onClick={() => onEdit(task)}
          >
            Ubah
          </button>
          <button
            type="button"
            className="button small danger-ghost"
            onClick={() => onDelete(task)}
          >
            Hapus
          </button>
        </div>
      </div>
    </article>
  );
}

function KanbanColumn({ status, tasks, onEdit, onDelete }) {
  const { isOver, setNodeRef } = useDroppable({ id: `status-${status}` });

  return (
    <section
      ref={setNodeRef}
      className={`kanban-column${isOver ? ' over' : ''}`}
    >
      <header className="kanban-column-header">
        <h3>{statusLabel(status)}</h3>
        <span className="count">{tasks.length}</span>
      </header>

      <div className="kanban-column-body">
        {tasks.length === 0 ? (
          <p className="kanban-empty">Letakkan tugas di sini.</p>
        ) : (
          tasks.map((task) => (
            <DraggableTask
              key={task.id}
              task={task}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))
        )}
      </div>
    </section>
  );
}

export default function KanbanBoard({
  tasks,
  categories,
  filters,
  onFiltersChange,
  loading,
  error,
  onRetry,
  onAdd,
  onEdit,
  onDelete,
  onStatusChange,
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
  );

  const visibleStatuses =
    filters.status === 'all' ? STATUSES : [filters.status];

  function handleDragEnd(event) {
    const { active, over } = event;

    if (!over) {
      return;
    }

    const activeId = String(active.id);
    const overId = String(over.id);

    if (!activeId.startsWith('task-') || !overId.startsWith('status-')) {
      return;
    }

    const taskId = Number(activeId.slice('task-'.length));
    const nextStatus = overId.slice('status-'.length);
    const task = tasks.find((item) => item.id === taskId);

    if (task && task.status !== nextStatus) {
      onStatusChange(task, nextStatus);
    }
  }

  return (
    <section className="kanban-view">
      <header className="section-heading">
        <div>
          <h2>Kanban</h2>
          <p>Seret kartu tugas ke kolom status yang diinginkan.</p>
        </div>
        <button type="button" className="button primary" onClick={onAdd}>
          Tambah Tugas
        </button>
      </header>

      <Filters
        value={filters}
        onChange={onFiltersChange}
        categories={categories}
      />

      {loading && <p className="state inline-state">Memuat tugas...</p>}

      {error && (
        <div className="state error-state">
          <p>{error}</p>
          <button type="button" className="button secondary" onClick={onRetry}>
            Coba lagi
          </button>
        </div>
      )}

      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="kanban-board">
          {visibleStatuses.map((status) => (
            <KanbanColumn
              key={status}
              status={status}
              tasks={tasks.filter((task) => task.status === status)}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      </DndContext>
    </section>
  );
}
