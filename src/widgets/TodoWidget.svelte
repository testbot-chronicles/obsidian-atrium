<script lang="ts">
  import { setIcon } from "obsidian";
  import { addTodo, toggleTodo, removeTodo, reorderTodos, type Todo } from "../lib/todos";

  export let instance;
  export const app = undefined;
  export let plugin;

  $: cfg = instance?.config ?? {};
  $: newPlaceholder = cfg.newPlaceholder ?? "Add a task…";
  $: showCompleted = cfg.showCompleted ?? true;

  // Local source of truth, seeded once from the instance at mount.
  let items: Todo[] = Array.isArray(instance?.config?.items) ? [...instance.config.items] : [];
  let draft = "";
  let dragId: string | null = null;

  /** Write to the canonical instance (by id) in plugin data, update local state, persist. */
  function persist(next: Todo[]): void {
    const canonical = plugin?.data?.layout?.find((w: { id: string }) => w.id === instance.id);
    if (canonical) (canonical as { config: Record<string, unknown> }).config.items = next;
    items = next;
    plugin?.saveAtrium?.();
  }
  function add(): void {
    const next = addTodo(items, draft, () => crypto.randomUUID());
    if (next !== items) { persist(next); draft = ""; }
  }
  function onDrop(targetId: string): void {
    if (!dragId || dragId === targetId) { dragId = null; return; }
    const ids = items.map((t) => t.id);
    ids.splice(ids.indexOf(dragId), 1);
    ids.splice(ids.indexOf(targetId), 0, dragId);
    persist(reorderTodos(items, ids));
    dragId = null;
  }
  function delIcon(node: HTMLElement) { setIcon(node, "x"); return {}; }

  $: visible = showCompleted ? items : items.filter((t) => !t.done);
  $: remaining = items.filter((t) => !t.done).length;
</script>

<div class="atrium-todos">
  <input
    class="atrium-todo-input"
    type="text"
    placeholder={newPlaceholder}
    bind:value={draft}
    on:keydown={(e) => e.key === "Enter" && add()}
  />
  <ul class="atrium-todo-list">
    {#each visible as t (t.id)}
      <!-- svelte-ignore a11y-no-static-element-interactions -->
      <li
        class="atrium-todo"
        class:done={t.done}
        draggable="true"
        on:dragstart={() => (dragId = t.id)}
        on:dragover|preventDefault
        on:drop|preventDefault={() => onDrop(t.id)}
      >
        <input type="checkbox" checked={t.done} on:change={() => persist(toggleTodo(items, t.id))} />
        <span class="atrium-todo-text">{t.text}</span>
        <button class="atrium-todo-del" aria-label="Delete task" on:click={() => persist(removeTodo(items, t.id))} use:delIcon></button>
      </li>
    {/each}
  </ul>
  {#if items.length}
    <div class="atrium-todo-foot">
      <span>{remaining} left</span>
      {#if items.some((t) => t.done)}
        <button class="atrium-todo-clear" on:click={() => persist(items.filter((t) => !t.done))}>Clear done</button>
      {/if}
    </div>
  {/if}
</div>

<style>
  .atrium-todos { display: flex; flex-direction: column; height: 100%; gap: 6px; }
  .atrium-todo-input {
    width: 100%; background: var(--background-modifier-form-field);
    border: 1px solid var(--background-modifier-border); border-radius: var(--radius-s);
    color: var(--text-normal); padding: 4px 8px;
  }
  .atrium-todo-list { list-style: none; margin: 0; padding: 0; overflow: auto; flex: 1 1 auto; min-height: 0; }
  .atrium-todo { display: flex; align-items: center; gap: 8px; padding: 3px 0; }
  .atrium-todo[draggable="true"] { cursor: grab; }
  .atrium-todo.done .atrium-todo-text { text-decoration: line-through; color: var(--text-muted); }
  .atrium-todo-text { flex: 1 1 auto; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .atrium-todo-del {
    opacity: 0; background: none; border: none; cursor: pointer; color: var(--text-faint);
    display: inline-flex; align-items: center; padding: 0;
  }
  .atrium-todo:hover .atrium-todo-del { opacity: 0.7; }
  .atrium-todo-del:hover { color: var(--text-error); opacity: 1; }
  .atrium-todo-del :global(svg) { width: 14px; height: 14px; }
  .atrium-todo-foot { display: flex; justify-content: space-between; align-items: center; font-size: 0.8em; color: var(--text-muted); flex: 0 0 auto; }
  .atrium-todo-clear { background: none; border: none; cursor: pointer; color: var(--text-muted); }
  .atrium-todo-clear:hover { color: var(--text-normal); }
</style>
