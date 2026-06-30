import { describe, it, expect } from "vitest";
import { addTodo, toggleTodo, removeTodo, reorderTodos } from "../src/lib/todos";
import type { Todo } from "../src/types";

const mk = (over: Partial<Todo> = {}): Todo => ({ id: "x", text: "t", done: false, order: 0, ...over });

describe("todos", () => {
  it("adds a todo at the end with incremented order", () => {
    const list = [mk({ id: "a", order: 0 })];
    const next = addTodo(list, "buy milk", () => "b");
    expect(next).toHaveLength(2);
    expect(next[1]).toMatchObject({ id: "b", text: "buy milk", done: false, order: 1 });
  });
  it("ignores empty text", () => {
    expect(addTodo([], "   ", () => "b")).toHaveLength(0);
  });
  it("toggles done immutably", () => {
    const list = [mk({ id: "a" })];
    const next = toggleTodo(list, "a");
    expect(next[0].done).toBe(true);
    expect(list[0].done).toBe(false);
  });
  it("removes by id", () => {
    expect(removeTodo([mk({ id: "a" }), mk({ id: "b" })], "a")).toHaveLength(1);
  });
  it("reorders and renormalizes order indices", () => {
    const list = [mk({ id: "a", order: 0 }), mk({ id: "b", order: 1 }), mk({ id: "c", order: 2 })];
    const next = reorderTodos(list, ["c", "a", "b"]);
    expect(next.map((t) => t.id)).toEqual(["c", "a", "b"]);
    expect(next.map((t) => t.order)).toEqual([0, 1, 2]);
  });
});
