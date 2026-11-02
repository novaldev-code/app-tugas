export const DEFAULT_FILTERS = Object.freeze({
  search: '',
  category_id: 'all',
  status: 'all',
  priority: 'all',
  sort: 'created_desc',
});

export function hasActiveFilters(filters) {
  return Boolean(
    filters.search.trim() ||
      filters.category_id !== 'all' ||
      filters.status !== 'all' ||
      filters.priority !== 'all' ||
      filters.sort !== DEFAULT_FILTERS.sort,
  );
}
