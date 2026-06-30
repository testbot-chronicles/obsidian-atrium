/**
 * Ambient module declaration so `tsc` understands `import X from "./Foo.svelte"`.
 * esbuild-svelte handles the actual compilation at build time; this only gives
 * the type-checker a default export typed as a Svelte component class.
 */
declare module "*.svelte" {
  export { SvelteComponent as default } from "svelte";
}
