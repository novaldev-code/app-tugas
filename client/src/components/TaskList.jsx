import { useMemo } from 'react';
import {
  formatDate,
  priorityClass,
  priorityLabel,
  statusClass,
  statusLabel,
} from '../labels.js';
import { hasActiveFilters } from '../constants.js';
import { groupTasks } from '../grouping.js';
import Filters from './Filters.jsx';

function TaskItem({ task, onEdit, onDelete }) {
  return (
    <article className="task-card">
      <div className="task-card-main">
        <div className="task-card-title-row">
          <h4>{task.title}</h4>
          <span className={`badge ${statusClass(task.status)}`}>
            {statusLabel(task.status)}
          </span>
        </div>

        {task.description && <p className="task-description">{task.description}</p>}

        <div className="task-meta">
          <span className={`badge ${priorityClass(task.priority)}`}>
            {priorityLabel(task.priority)}
          </span>

          {task.deadline ? (
            <span className={task.overdue ? 'deadline overdue' : 'deadline'}>
              Tenggat: {formatDate(task.deadline)}
              {task.overdue ? ' - Terlambat' : ''}
            </span>
          ) : (
            <span className="muted">Tanpa tenggat</span>
          )}
        </div>
      </div>

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
    <section className="task-list-view">
      <header className="section-heading">
        <div>
          <h2>Daftar Tugas</h2>
          <p>Tugas dikelompokkan berdasarkan kategori.</p>
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

      {!loading && !error && groups.length === 0 && (
        <div className="empty-state">
          <h3>{filtersActive ? 'Tidak ada tugas yang cocok' : 'Belum ada tugas'}</h3>
          <p>
            {filtersActive
              ? 'Coba ubah atau atur ulang filter untuk melihat tugas lain.'
              : 'Tambahkan tugas pertama untuk mulai mengelola pekerjaan.'}
          </p>
          {!filtersActive && (
            <button type="button" className="button primary" onClick={onAdd}>
              Tambah Tugas
            </button>
          )}
        </div>
      )}

      {!error && groups.length > 0 && (
        <div className="task-groups">
          {groups.map((group) => (
            <section className="task-group" key={group.key}>
              <header className="task-group-header">
                <h3>{group.name}</h3>
                <span className="count">{group.tasks.length}</span>
              </header>

              <div className="task-list">
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
