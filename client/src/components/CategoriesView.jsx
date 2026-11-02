import { useState } from 'react';
import { api } from '../api.js';

function validateName(value) {
  const name = value.trim();

  if (name.length < 1 || name.length > 50) {
    return 'Nama kategori harus 1-50 karakter.';
  }

  return '';
}

export default function CategoriesView({ categories, onChanged, onRequestDelete }) {
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [error, setError] = useState('');
  const [fieldError, setFieldError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleAdd(event) {
    event.preventDefault();
    setError('');
    setFieldError('');

    const validationError = validateName(newName);

    if (validationError) {
      setFieldError(validationError);
      return;
    }

    setBusy(true);

    try {
      await api.createCategory({ name: newName.trim() });
      setNewName('');
      onChanged();
    } catch (requestError) {
      setFieldError(requestError.errors?.name ?? '');
      setError(requestError.message || 'Gagal menambahkan kategori.');
    } finally {
      setBusy(false);
    }
  }

  function startEditing(category) {
    setEditingId(category.id);
    setEditingName(category.name);
    setError('');
    setFieldError('');
  }

  function cancelEditing() {
    setEditingId(null);
    setEditingName('');
    setFieldError('');
  }

  async function handleSave(event) {
    event.preventDefault();
    setError('');
    setFieldError('');

    const validationError = validateName(editingName);

    if (validationError) {
      setFieldError(validationError);
      return;
    }

    setBusy(true);

    try {
      await api.updateCategory(editingId, { name: editingName.trim() });
      cancelEditing();
      onChanged();
    } catch (requestError) {
      setFieldError(requestError.errors?.name ?? '');
      setError(requestError.message || 'Gagal mengubah kategori.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="categories-view">
      <header className="section-heading">
        <div>
          <h2>Kategori</h2>
          <p>
            Kategori bawaan dapat diubah atau dihapus. Tugas pada kategori yang
            dihapus akan menjadi Tanpa Kategori.
          </p>
        </div>
      </header>

      {error && <p className="alert error">{error}</p>}
      {fieldError && !editingId && (
        <p className="alert error">{fieldError}</p>
      )}

      <form className="inline-form" onSubmit={handleAdd}>
        <input
          type="text"
          value={newName}
          onChange={(event) => setNewName(event.target.value)}
          placeholder="Nama kategori baru"
          maxLength={50}
          aria-label="Nama kategori baru"
        />
        <button type="submit" className="button primary" disabled={busy}>
          {busy && !editingId ? 'Menambahkan...' : 'Tambah Kategori'}
        </button>
      </form>

      <ul className="category-list">
        {categories.map((category) => (
          <li className="category-row" key={category.id}>
            {editingId === category.id ? (
              <form className="category-edit-form" onSubmit={handleSave}>
                <input
                  type="text"
                  value={editingName}
                  onChange={(event) => setEditingName(event.target.value)}
                  maxLength={50}
                  aria-label={`Ubah nama kategori ${category.name}`}
                  autoFocus
                />
                <button type="submit" className="button small primary" disabled={busy}>
                  Simpan
                </button>
                <button
                  type="button"
                  className="button small secondary"
                  onClick={cancelEditing}
                  disabled={busy}
                >
                  Batal
                </button>
                {fieldError && <span className="field-error">{fieldError}</span>}
              </form>
            ) : (
              <>
                <div className="category-name">
                  <span>{category.name}</span>
                  {category.is_default && (
                    <span className="badge default-badge">Bawaan</span>
                  )}
                </div>

                <div className="task-actions">
                  <button
                    type="button"
                    className="button small secondary"
                    onClick={() => startEditing(category)}
                  >
                    Ubah
                  </button>
                  <button
                    type="button"
                    className="button small danger-ghost"
                    onClick={() => onRequestDelete(category)}
                  >
                    Hapus
                  </button>
                </div>
              </>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
