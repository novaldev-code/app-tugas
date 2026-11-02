export const STATUSES = ['Todo', 'In Progress', 'Done'];
export const PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'];

export const STATUS_LABELS = {
  Todo: 'Belum Dikerjakan',
  'In Progress': 'Sedang Dikerjakan',
  Done: 'Selesai',
};

export const PRIORITY_LABELS = {
  Low: 'Rendah',
  Medium: 'Sedang',
  High: 'Tinggi',
  Urgent: 'Mendesak',
};

export const STATUS_OPTIONS = STATUSES.map((value) => ({
  value,
  label: STATUS_LABELS[value],
}));

export const PRIORITY_OPTIONS = PRIORITIES.map((value) => ({
  value,
  label: PRIORITY_LABELS[value],
}));

export function statusLabel(value) {
  return STATUS_LABELS[value] ?? value;
}

export function priorityLabel(value) {
  return PRIORITY_LABELS[value] ?? value;
}

export function statusClass(value) {
  return `status-${value.toLowerCase().replace(/\s+/g, '-')}`;
}

export function priorityClass(value) {
  return `priority-${value.toLowerCase()}`;
}

export function formatDate(value) {
  if (!value) {
    return '';
  }

  const parts = value.split('-');

  if (parts.length !== 3) {
    return value;
  }

  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}
