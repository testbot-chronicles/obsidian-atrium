import type { SvelteComponent } from "svelte";

/** Handle returned by {@link mountWidget} to update props / tear the component down. */
export interface MountedWidget {
  /** Reactively push new props into the mounted component. */
  update(props: Record<string, unknown>): void;
  /** Unmount the component and free its resources. */
  destroy(): void;
}

/**
 * Mount a Svelte 4 component into a DOM node; returns a handle to update props / destroy it.
 *
 * @param Component - The Svelte component class to instantiate.
 * @param target - The host element the component is rendered into.
 * @param props - Props passed to the component on creation.
 * @returns A {@link MountedWidget} handle whose `update()` sets props and `destroy()` unmounts.
 */
export function mountWidget(
  Component: typeof SvelteComponent,
  target: HTMLElement,
  props: Record<string, unknown>,
): MountedWidget {
  const instance = new (Component as any)({ target, props });
  return {
    update: (p) => instance.$set(p),
    destroy: () => instance.$destroy(),
  };
}
