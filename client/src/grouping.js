export function groupTasks(tasks, categories) {
  const groups = categories.map((category) => ({
    key: `category-${category.id}`,
    name: category.name,
    tasks: tasks.filter((task) => task.category_id === category.id),
  }));

  const uncategorized = tasks.filter((task) => task.category_id === null);

  if (uncategorized.length > 0) {
    groups.push({
      key: 'uncategorized',
      name: 'Tanpa Kategori',
      tasks: uncategorized,
    });
  }

  return groups.filter((group) => group.tasks.length > 0);
}
