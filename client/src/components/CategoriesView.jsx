import { useState } from 'react';
import { api } from '../api.js';
import Button from './ui/Button.jsx';
import Badge from './ui/Badge.jsx';

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
    <section className="page">
      <div className="panel">
        <div className="panel-header">
          <div>
            <h2>Manajemen Kategori</h2>
            <p className="page-subtitle">
              Kategori bawaan dapat diubah atau dihapus. Tugas pada kategori yang dihapus akan menjadi Tanpa Kategori.
            </p>
          </div>
        </div>
        <div className="panel-body">
          {error && <div className="alert error">{error}</div>}
          {fieldError && !editingId && <div className="alert error">{fieldError}</div>}

          <form className="category-form" onSubmit={handleAdd}>
            <input
              type="text"
              value={newName}
              onChange={(event) => setNewName(event.target.value)}
              placeholder="Nama kategori baru"
              maxLength={50}
              aria-label="Nama kategori baru"
              style={{ maxWidth: '320px' }}
            />
            <Button type="submit" variant="primary" disabled={busy}>
              {busy && !editingId ? 'Menambahkan...' : 'Tambah Kategori'}
            </Button>
          </form>

          <div className="category-list">
            {categories.map((category) => (
              <div className="category-row" key={category.id}>
                {editingId === category.id ? (
                  <form className="category-form" onSubmit={handleSave} style={{ flex: 1 }}>
                    <input
                      type="text"
                      value={editingName}
                      onChange={(event) => setEditingName(event.target.value)}
                      maxLength={50}
                      aria-label={`Ubah nama kategori ${category.name}`}
                      autoFocus
                      style={{ maxWidth: '280px' }}
                    />
                    <Button type="submit" variant="primary" size="small" disabled={busy}>
                      Simpan
                    </Button>
                    <Button type="button" variant="secondary" size="small" onClick={cancelEditing} disabled={busy}>
                      Batal
                    </Button>
                    {fieldError && <span className="field-error">{fieldError}</span>}
                  </form>
                ) : (
                  <>
                    <div className="category-name-group">
                      <span className="task-card-title">{category.name}</span>
                      {category.is_default && <Badge tone="default">Bawaan</Badge>}
                    </div>

                    <div className="category-actions">
                      <Button type="button" variant="secondary" size="small" onClick={() => startEditing(category)}>
                        Ubah
                      </Button>
                      <Button type="button" variant="danger-ghost" size="small" onClick={() => onRequestDelete(category)}>
                        Hapus
                      </Button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
