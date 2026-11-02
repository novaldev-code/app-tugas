export function calculateCompletionRate(stats) {
  if (!stats) {
    return 0;
  }

  const total = Number(stats.total) || 0;
  if (total <= 0) {
    return 0;
  }

  const done = Number(stats.byStatus?.Done) || 0;
  return Math.round((done / total) * 100);
}

export function getStatusValue(stats, key) {
  if (!stats || !stats.byStatus) {
    return 0;
  }
  return Number(stats.byStatus[key]) || 0;
}

export function getPriorityValue(stats, key) {
  if (!stats || !stats.byPriority) {
    return 0;
  }
  return Number(stats.byPriority[key]) || 0;
}
