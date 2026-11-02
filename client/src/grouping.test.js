import { describe, expect, it } from 'vitest';
import { groupTasks } from './grouping.js';

const categories = [
  { id: 1, name: 'Pribadi' },
  { id: 2, name: 'Pekerjaan' },
  { id: 3, name: 'Belajar' },
  { id: 4, name: 'Arsip' },
];

describe('groupTasks', () => {
  it('hides empty groups and keeps category order', () => {
    const tasks = [
      { id: 10, title: 'Satu', category_id: 4 },
      { id: 11, title: 'Dua', category_id: 1 },
    ];

    const groups = groupTasks(tasks, categories);

    expect(groups.map((group) => group.name)).toEqual(['Pribadi', 'Arsip']);
    expect(groups[0].tasks.map((task) => task.id)).toEqual([11]);
    expect(groups[1].tasks.map((task) => task.id)).toEqual([10]);
  });

  it('puts Tanpa Kategori last only when it has tasks', () => {
    const tasks = [
      { id: 1, title: 'Tanpa', category_id: null },
      { id: 2, title: 'Pribadi', category_id: 1 },
    ];

    const groups = groupTasks(tasks, categories);

    expect(groups.map((group) => group.name)).toEqual(['Pribadi', 'Tanpa Kategori']);
    expect(groups.at(-1).tasks.map((task) => task.id)).toEqual([1]);
  });

  it('omits Tanpa Kategori when there are no uncategorized tasks', () => {
    const groups = groupTasks([{ id: 1, title: 'Satu', category_id: 1 }], categories);

    expect(groups.map((group) => group.name)).toEqual(['Pribadi']);
  });

  it('assigns each task to exactly one group', () => {
    const tasks = [
      { id: 1, title: 'Satu', category_id: 1 },
      { id: 2, title: 'Dua', category_id: 2 },
      { id: 3, title: 'Tiga', category_id: null },
    ];

    const groups = groupTasks(tasks, categories);
    const assigned = groups.flatMap((group) => group.tasks.map((task) => task.id));

    expect(assigned.sort()).toEqual([1, 2, 3]);
    expect(new Set(assigned).size).toBe(assigned.length);
  });

  it('returns no groups for an empty task list', () => {
    expect(groupTasks([], categories)).toEqual([]);
  });
});
