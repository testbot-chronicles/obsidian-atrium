import type { SvelteComponent } from "svelte";

/** Handle returned by {@link mountWidget} used to tear the component down. */
export interface MountedWidget {
  destroy(): void;
}

/**
 * Mount a Svelte 4 component into a DOM node; returns a handle to destroy it.
 *
 * @param Component - The Svelte component class to instantiate.
 * @param target - The host element the component is rendered into.
 * @param props - Props passed to the component on creation.
 * @returns A {@link MountedWidget} handle whose `destroy()` unmounts the component.
 */
export function mountWidget(
  Component: typeof SvelteComponent,
  target: HTMLElement,
  props: Record<string, unknown>,
): MountedWidget {
  const instance = new (Component as any)({ target, props });
  return { destroy: () => instance.$destroy() };
}
