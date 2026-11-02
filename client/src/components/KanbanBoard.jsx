import {
  DndContext,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { statusLabel, STATUSES } from '../labels.js';
import Filters from './Filters.jsx';
import TaskActions from './task/TaskActions.jsx';
import TaskBadges from './task/TaskBadges.jsx';
import TaskMeta from './task/TaskMeta.jsx';
import Button from './ui/Button.jsx';
import { SkeletonCard } from './ui/Skeleton.jsx';

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
          ⋮⋮
        </button>
        <div className="kanban-card-title">{task.title}</div>
      </div>

      {task.description && <p className="task-description">{task.description}</p>}

      <TaskBadges status={task.status} priority={task.priority} />

      <div className="kanban-card-footer">
        <TaskMeta deadline={task.deadline} overdue={task.overdue} />
        <TaskActions onEdit={() => onEdit(task)} onDelete={() => onDelete(task)} />
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
        <div>
          <div className="kanban-column-title">{statusLabel(status)}</div>
          <div className="kpi-meta">{tasks.length} tugas</div>
        </div>
        <span className="task-group-count">{tasks.length}</span>
      </header>

      <div className="kanban-column-body">
        {tasks.length === 0 ? (
          <div className="kanban-empty">Letakkan tugas di sini</div>
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
    <section className="page">
      <Filters value={filters} onChange={onFiltersChange} categories={categories} />

      {loading && (
        <div className="kanban-wrapper">
          <div className="kanban-board">
            {STATUSES.map((status) => (
              <div key={status} className="kanban-column">
                <div className="kanban-column-header">
                  <SkeletonCard />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="empty-state">
          <div className="empty-state-title">Gagal memuat tugas</div>
          <p className="empty-state-text">{error}</p>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button variant="secondary" onClick={onRetry}>
              Coba lagi
            </Button>
            <Button variant="primary" onClick={onAdd}>
              Tambah Tugas
            </Button>
          </div>
        </div>
      )}

      {!loading && !error && (
        <div className="kanban-wrapper">
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
        </div>
      )}
    </section>
  );
}
