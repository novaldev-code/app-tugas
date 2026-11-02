import { useMemo } from 'react';
import { hasActiveFilters } from '../constants.js';
import { groupTasks } from '../grouping.js';
import Filters from './Filters.jsx';
import TaskActions from './task/TaskActions.jsx';
import TaskBadges from './task/TaskBadges.jsx';
import TaskMeta from './task/TaskMeta.jsx';
import EmptyState from './ui/EmptyState.jsx';
import { SkeletonCard } from './ui/Skeleton.jsx';

function TaskItem({ task, onEdit, onDelete }) {
  return (
    <article className="task-card">
      <div className="task-card-content">
        <div>
          <div className="task-card-title">{task.title}</div>
          {task.description && <p className="task-description">{task.description}</p>}
        </div>
        <TaskBadges status={task.status} priority={task.priority} />
        <div className="task-card-meta">
          <TaskMeta deadline={task.deadline} overdue={task.overdue} />
        </div>
      </div>
      <TaskActions onEdit={() => onEdit(task)} onDelete={() => onDelete(task)} />
    </article>
  );
}

export default function TaskList({
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
}) {
  const groups = useMemo(() => groupTasks(tasks, categories), [tasks, categories]);
  const filtersActive = hasActiveFilters(filters);

  return (
    <section className="page">
      <Filters value={filters} onChange={onFiltersChange} categories={categories} />

      {loading && (
        <div className="task-list-grid">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      )}

      {error && (
        <div className="empty-state">
          <div className="empty-state-title">Gagal memuat tugas</div>
          <p className="empty-state-text">{error}</p>
          <button type="button" className="button button-secondary" onClick={onRetry}>
            Coba lagi
          </button>
        </div>
      )}

      {!loading && !error && groups.length === 0 && (
        <EmptyState
          title={filtersActive ? 'Tidak ada tugas yang cocok' : 'Belum ada tugas'}
          description={
            filtersActive
              ? 'Coba ubah atau atur ulang filter untuk melihat tugas lain.'
              : 'Tambahkan tugas pertama untuk mulai mengelola pekerjaan.'
          }
          actionLabel={!filtersActive ? 'Tambah Tugas' : undefined}
          onAction={!filtersActive ? onAdd : undefined}
        />
      )}

      {!error && groups.length > 0 && (
        <div className="task-groups">
          {groups.map((group) => (
            <section className="task-group" key={group.key}>
              <header className="task-group-header">
                <h3 className="task-group-title">{group.name}</h3>
                <span className="task-group-count">{group.tasks.length}</span>
              </header>

              <div className="task-list-grid">
                {group.tasks.map((task) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    onEdit={onEdit}
                    onDelete={onDelete}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </section>
  );
}
