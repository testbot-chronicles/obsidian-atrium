import type { Todo } from "../types";

export function addTodo(list: Todo[], text: string, genId: () => string): Todo[] {
  const trimmed = text.trim();
  if (!trimmed) return list;
  const order = list.length ? Math.max(...list.map((t) => t.order)) + 1 : 0;
  return [...list, { id: genId(), text: trimmed, done: false, order }];
}
export function toggleTodo(list: Todo[], id: string): Todo[] {
  return list.map((t) => (t.id === id ? { ...t, done: !t.done } : t));
}
export function removeTodo(list: Todo[], id: string): Todo[] {
  return list.filter((t) => t.id !== id);
}
export function reorderTodos(list: Todo[], orderedIds: string[]): Todo[] {
  const byId = new Map(list.map((t) => [t.id, t]));
  return orderedIds
    .map((id) => byId.get(id))
    .filter((t): t is Todo => !!t)
    .map((t, i) => ({ ...t, order: i }));
}
