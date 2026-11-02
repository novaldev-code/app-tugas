import { useCallback, useEffect, useState } from 'react';
import { api } from './api.js';
import { DEFAULT_FILTERS } from './constants.js';
import { statusLabel } from './labels.js';
import CategoriesView from './components/CategoriesView.jsx';
import ConfirmDialog from './components/ConfirmDialog.jsx';
import Dashboard from './components/Dashboard.jsx';
import KanbanBoard from './components/KanbanBoard.jsx';
import TaskList from './components/TaskList.jsx';
import TaskModal from './components/TaskModal.jsx';

const VIEWS = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'list', label: 'Daftar Tugas' },
  { id: 'kanban', label: 'Kanban' },
  { id: 'categories', label: 'Kategori' },
];

export default function App() {
  const [view, setView] = useState('dashboard');
  const [listFilters, setListFilters] = useState(DEFAULT_FILTERS);
  const [kanbanFilters, setKanbanFilters] = useState(DEFAULT_FILTERS);

  const [tasks, setTasks] = useState([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [tasksError, setTasksError] = useState('');

  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState('');

  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState('');

  const [refreshKey, setRefreshKey] = useState(0);
  const [taskModal, setTaskModal] = useState({ open: false, task: null });
  const [confirm, setConfirm] = useState(null);
  const [confirmBusy, setConfirmBusy] = useState(false);
  const [toast, setToast] = useState('');

  const refresh = useCallback(() => {
    setRefreshKey((current) => current + 1);
  }, []);

  const isTaskView = view === 'list' || view === 'kanban';
  const activeFilters = view === 'list' ? listFilters : kanbanFilters;

  useEffect(() => {
    if (!toast) {
      return undefined;
    }

    const timer = setTimeout(() => setToast(''), 3500);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    let cancelled = false;
    setCategoriesLoading(true);
    setCategoriesError('');

    api
      .listCategories()
      .then((data) => {
        if (!cancelled) {
          setCategories(data);
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setCategoriesError(error.message);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setCategoriesLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  useEffect(() => {
    let cancelled = false;
    setStatsLoading(true);
    setStatsError('');

    api
      .getStats()
      .then((data) => {
        if (!cancelled) {
          setStats(data);
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setStatsError(error.message);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setStatsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  useEffect(() => {
    if (!isTaskView) {
      setTasksLoading(false);
      return undefined;
    }

    const controller = new AbortController();
    let timer;

    setTasksLoading(true);
    setTasksError('');

    timer = setTimeout(() => {
      api
        .listTasks(activeFilters, controller.signal)
        .then((data) => {
          if (!controller.signal.aborted) {
            setTasks(data);
          }
        })
        .catch((error) => {
          if (error.name !== 'AbortError') {
            setTasksError(error.message);
          }
        })
        .finally(() => {
          if (!controller.signal.aborted) {
            setTasksLoading(false);
          }
        });
    }, 200);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [isTaskView, activeFilters, refreshKey]);

  function changeView(nextView) {
    if (nextView !== view) {
      if (nextView === 'list') {
        setListFilters(DEFAULT_FILTERS);
      }

      if (nextView === 'kanban') {
        setKanbanFilters(DEFAULT_FILTERS);
      }
    }

    setView(nextView);
  }

  function openCreateTask() {
    setTaskModal({ open: true, task: null });
  }

  function openEditTask(task) {
    setTaskModal({ open: true, task });
  }

  function closeTaskModal() {
    setTaskModal({ open: false, task: null });
  }

  async function saveTask(taskId, payload) {
    if (taskId) {
      await api.updateTask(taskId, payload);
      setToast('Tugas berhasil diperbarui.');
    } else {
      await api.createTask(payload);
      setToast('Tugas berhasil ditambahkan.');
    }

    closeTaskModal();
    refresh();
  }

  function requestDeleteTask(task) {
    setConfirm({ type: 'task', item: task });
  }

  function requestDeleteCategory(category) {
    setConfirm({ type: 'category', item: category });
  }

  async function confirmDelete() {
    if (!confirm) {
      return;
    }

    setConfirmBusy(true);

    try {
      if (confirm.type === 'task') {
        await api.deleteTask(confirm.item.id);
        setToast('Tugas berhasil dihapus.');
      } else {
        await api.deleteCategory(confirm.item.id);
        setToast('Kategori berhasil dihapus.');
      }

      setConfirm(null);
      refresh();
    } catch (error) {
      setToast(error.message || 'Gagal menghapus data.');
      setConfirm(null);
    } finally {
      setConfirmBusy(false);
    }
  }

  async function changeTaskStatus(task, nextStatus) {
    try {
      const updated = await api.updateTask(task.id, { status: nextStatus });
      setTasks((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
      setToast(
        `Status "${task.title}" diubah menjadi ${statusLabel(nextStatus)}.`,
      );
      refresh();
    } catch (error) {
      setTasksError(error.message);
    }
  }

  const confirmTitle =
    confirm?.type === 'category' ? 'Hapus kategori?' : 'Hapus tugas?';
  const confirmMessage =
    confirm?.type === 'category'
      ? `Kategori "${confirm.item.name}" akan dihapus. Tugas di dalamnya akan menjadi Tanpa Kategori.`
      : confirm
        ? `Tugas "${confirm.item.title}" akan dihapus permanen.`
        : '';

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            MT
          </span>
          <div>
            <h1>Manajer Tugas Pribadi</h1>
            <p>Kelola tugas, kategori, dan progres dalam satu tempat.</p>
          </div>
        </div>

        <button type="button" className="button primary" onClick={openCreateTask}>
          Tambah Tugas
        </button>
      </header>

      <nav className="tabs" aria-label="Navigasi utama">
        {VIEWS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`tab${view === item.id ? ' active' : ''}`}
            onClick={() => changeView(item.id)}
            aria-current={view === item.id ? 'page' : undefined}
          >
            {item.label}
          </button>
        ))}
      </nav>

      <main className="app-main">
        {view === 'dashboard' && (
          <Dashboard
            stats={stats}
            loading={statsLoading}
            error={statsError}
            onRetry={refresh}
          />
        )}

        {view === 'list' && (
          <TaskList
            tasks={tasks}
            categories={categories}
            filters={listFilters}
            onFiltersChange={setListFilters}
            loading={tasksLoading}
            error={tasksError}
            onRetry={refresh}
            onAdd={openCreateTask}
            onEdit={openEditTask}
            onDelete={requestDeleteTask}
          />
        )}

        {view === 'kanban' && (
          <KanbanBoard
            tasks={tasks}
            categories={categories}
            filters={kanbanFilters}
            onFiltersChange={setKanbanFilters}
            loading={tasksLoading}
            error={tasksError}
            onRetry={refresh}
            onAdd={openCreateTask}
            onEdit={openEditTask}
            onDelete={requestDeleteTask}
            onStatusChange={changeTaskStatus}
          />
        )}

        {view === 'categories' &&
          (categoriesLoading && categories.length === 0 ? (
            <p className="state">Memuat kategori...</p>
          ) : categoriesError ? (
            <div className="state error-state">
              <p>{categoriesError}</p>
              <button
                type="button"
                className="button secondary"
                onClick={refresh}
              >
                Coba lagi
              </button>
            </div>
          ) : (
            <CategoriesView
              categories={categories}
              onChanged={refresh}
              onRequestDelete={requestDeleteCategory}
            />
          ))}
      </main>

      {taskModal.open && (
        <TaskModal
          task={taskModal.task}
          categories={categories}
          onClose={closeTaskModal}
          onSave={saveTask}
        />
      )}

      <ConfirmDialog
        open={Boolean(confirm)}
        title={confirmTitle}
        message={confirmMessage}
        busy={confirmBusy}
        onCancel={() => setConfirm(null)}
        onConfirm={confirmDelete}
      />

      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}
    </div>
  );
}
