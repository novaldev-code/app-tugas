import { useCallback, useEffect, useState } from 'react';
import { api } from './api.js';
import { DEFAULT_FILTERS } from './constants.js';
import { statusLabel } from './labels.js';
import AppShell from './components/AppShell.jsx';
import CategoriesView from './components/CategoriesView.jsx';
import ConfirmDialog from './components/ConfirmDialog.jsx';
import Dashboard from './components/Dashboard.jsx';
import Icon from './components/Icon.jsx';
import KanbanBoard from './components/KanbanBoard.jsx';
import TaskList from './components/TaskList.jsx';
import TaskModal from './components/TaskModal.jsx';

const VIEW_TITLES = {
  dashboard: {
    title: 'Dashboard',
    subtitle: 'Ringkasan seluruh tugas tanpa pengaruh filter tampilan.',
  },
  list: {
    title: 'Daftar Tugas',
    subtitle: 'Tugas dikelompokkan berdasarkan kategori dengan filter dan pencarian.',
  },
  kanban: {
    title: 'Kanban',
    subtitle: 'Atur status tugas dengan seret dan letakkan antar kolom.',
  },
  categories: {
    title: 'Kategori',
    subtitle: 'Kelola kategori tugas dan perlakuan setelah penghapusan.',
  },
};

export default function AppWorkspace({ user, onLogout }) {
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
  const [logoutBusy, setLogoutBusy] = useState(false);
  const [logoutError, setLogoutError] = useState('');

  const refresh = useCallback(() => {
    setRefreshKey((current) => current + 1);
  }, []);

  const isTaskView = view === 'list' || view === 'kanban';
  const activeFilters = view === 'list' ? listFilters : kanbanFilters;
  const viewMeta = VIEW_TITLES[view] ?? VIEW_TITLES.dashboard;

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


  async function handleLogout() {
    setLogoutBusy(true);
    setLogoutError('');

    try {
      await onLogout();
    } catch (error) {
      setLogoutError(error.message || 'Gagal logout. Coba lagi.');
    } finally {
      setLogoutBusy(false);
    }
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
    <AppShell
      view={view}
      onViewChange={changeView}
      user={user}
      onLogout={handleLogout}
      logoutBusy={logoutBusy}
      logoutError={logoutError}
      header={
        <div className="page-header-content">
          <span className="page-eyebrow">Personal Task Manager</span>
          <h1 className="page-title">{viewMeta.title}</h1>
          <p className="page-subtitle">{viewMeta.subtitle}</p>
        </div>
      }
      actions={
        <button
          type="button"
          className="button button-primary"
          onClick={openCreateTask}
        >
          <Icon name="plus" size={18} />
          Tambah Tugas
        </button>
      }
    >
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
            <button type="button" className="button button-secondary" onClick={refresh}>
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
        <div className="toast-stack" role="status" aria-live="polite">
          <div className="toast toast-success">{toast}</div>
        </div>
      )}
    </AppShell>
  );
}
