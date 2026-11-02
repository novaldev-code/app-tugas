import { useEffect, useState } from 'react';
import { PRIORITY_OPTIONS, STATUS_OPTIONS } from '../labels.js';

function initialForm(task) {
  if (!task) {
    return {
      title: '',
      description: '',
      status: 'Todo',
      priority: 'Medium',
      deadline: '',
      category_id: '',
    };
  }

  return {
    title: task.title,
    description: task.description ?? '',
    status: task.status,
    priority: task.priority,
    deadline: task.deadline ?? '',
    category_id: task.category_id === null ? '' : String(task.category_id),
  };
}

function validate(form) {
  const errors = {};
  const title = form.title.trim();

  if (title.length < 1 || title.length > 120) {
    errors.title = 'Judul tugas harus 1-120 karakter.';
  }

  if (form.description.trim().length > 1000) {
    errors.description = 'Deskripsi tugas maksimal 1000 karakter.';
  }

  if (form.deadline && !/^\d{4}-\d{2}-\d{2}$/.test(form.deadline)) {
    errors.deadline = 'Tanggal tenggat tidak valid.';
  }

  return errors;
}

export default function TaskModal({ task, categories, onClose, onSave }) {
  const [form, setForm] = useState(() => initialForm(task));
  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape' && !busy) {
        onClose();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [busy, onClose]);

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setGeneralError('');

    const nextErrors = validate(form);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setBusy(true);

    try {
      await onSave(task?.id ?? null, {
        title: form.title.trim(),
        description: form.description.trim(),
        status: form.status,
        priority: form.priority,
        deadline: form.deadline || null,
        category_id: form.category_id === '' ? null : Number(form.category_id),
      });
    } catch (error) {
      setErrors(error.errors || {});
      setGeneralError(error.message || 'Gagal menyimpan tugas.');
      setBusy(false);
    }
  }

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !busy) {
          onClose();
        }
      }}
    >
      <div
        className="modal task-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="task-modal-title"
      >
        <div className="modal-header">
          <h2 id="task-modal-title">{task ? 'Ubah Tugas' : 'Tambah Tugas'}</h2>
          <button
            type="button"
            className="icon-button"
            onClick={onClose}
            disabled={busy}
            aria-label="Tutup"
          >
            Tutup
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          {generalError && <p className="alert error">{generalError}</p>}

          <div className="form-grid">
            <label className="field full-width">
              <span>Judul</span>
              <input
                type="text"
                value={form.title}
                onChange={(event) => update('title', event.target.value)}
                maxLength={120}
                aria-invalid={Boolean(errors.title)}
                autoFocus
              />
              {errors.title && <span className="field-error">{errors.title}</span>}
            </label>

            <label className="field full-width">
              <span>Deskripsi</span>
              <textarea
                value={form.description}
                onChange={(event) => update('description', event.target.value)}
                maxLength={1000}
                rows={4}
                aria-invalid={Boolean(errors.description)}
              />
              <span className="field-hint">
                {form.description.length}/1000 karakter
              </span>
              {errors.description && (
                <span className="field-error">{errors.description}</span>
              )}
            </label>

            <label className="field">
              <span>Status</span>
              <select
                value={form.status}
                onChange={(event) => update('status', event.target.value)}
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>Prioritas</span>
              <select
                value={form.priority}
                onChange={(event) => update('priority', event.target.value)}
                aria-invalid={Boolean(errors.priority)}
              >
                {PRIORITY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {errors.priority && (
                <span className="field-error">{errors.priority}</span>
              )}
            </label>

            <label className="field">
              <span>Tenggat</span>
              <input
                type="date"
                value={form.deadline}
                onChange={(event) => update('deadline', event.target.value)}
                aria-invalid={Boolean(errors.deadline)}
              />
              {errors.deadline && (
                <span className="field-error">{errors.deadline}</span>
              )}
            </label>

            <label className="field">
              <span>Kategori</span>
              <select
                value={form.category_id}
                onChange={(event) => update('category_id', event.target.value)}
                aria-invalid={Boolean(errors.category_id)}
              >
                <option value="">Tanpa Kategori</option>
                {categories.map((category) => (
                  <option key={category.id} value={String(category.id)}>
                    {category.name}
                  </option>
                ))}
              </select>
              {errors.category_id && (
                <span className="field-error">{errors.category_id}</span>
              )}
            </label>
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="button secondary"
              onClick={onClose}
              disabled={busy}
            >
              Batal
            </button>
            <button type="submit" className="button primary" disabled={busy}>
              {busy ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
