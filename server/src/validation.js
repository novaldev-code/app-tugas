import { ValidationError } from './errors.js';

export const STATUSES = ['Todo', 'In Progress', 'Done'];
export const PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'];

function fieldError(field, message) {
  return new ValidationError(message, { [field]: message });
}

export function normalizeTitle(value) {
  if (typeof value !== 'string') {
    throw fieldError('title', 'Judul tugas wajib diisi.');
  }

  const title = value.trim();

  if (title.length < 1 || title.length > 120) {
    throw fieldError('title', 'Judul tugas harus 1-120 karakter.');
  }

  return title;
}

export function normalizeDescription(value) {
  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value !== 'string') {
    throw fieldError('description', 'Deskripsi tugas tidak valid.');
  }

  const description = value.trim();

  if (description.length === 0) {
    return null;
  }

  if (description.length > 1000) {
    throw fieldError('description', 'Deskripsi tugas maksimal 1000 karakter.');
  }

  return description;
}

export function normalizeStatus(value, { defaultValue } = {}) {
  if (value === undefined || value === null || value === '') {
    if (defaultValue !== undefined) {
      return defaultValue;
    }

    throw fieldError('status', 'Status tugas tidak valid.');
  }

  if (!STATUSES.includes(value)) {
    throw fieldError('status', 'Status tugas tidak valid.');
  }

  return value;
}

export function normalizePriority(value) {
  if (!PRIORITIES.includes(value)) {
    throw fieldError('priority', 'Prioritas tugas tidak valid.');
  }

  return value;
}

export function normalizeDeadline(value) {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  if (typeof value !== 'string') {
    throw fieldError('deadline', 'Tanggal tenggat tidak valid.');
  }

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (!match) {
    throw fieldError('deadline', 'Tanggal tenggat harus berformat YYYY-MM-DD.');
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() + 1 !== month ||
    date.getUTCDate() !== day
  ) {
    throw fieldError('deadline', 'Tanggal tenggat tidak valid.');
  }

  return value;
}

export function normalizeCategoryName(value) {
  if (typeof value !== 'string') {
    throw fieldError('name', 'Nama kategori wajib diisi.');
  }

  const name = value.trim();

  if (name.length < 1 || name.length > 50) {
    throw fieldError('name', 'Nama kategori harus 1-50 karakter.');
  }

  return name;
}

export function normalizeCategoryId(value) {
  if (value === undefined || value === null || value === '' || value === 'null') {
    return null;
  }

  const id = Number(value);

  if (!Number.isInteger(id) || id <= 0) {
    throw fieldError('category_id', 'Kategori tidak valid.');
  }

  return id;
}

export function localDateISO(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export function isOverdue(deadline, status, now = new Date()) {
  if (!deadline || status === 'Done') {
    return false;
  }

  return deadline < localDateISO(now);
}
