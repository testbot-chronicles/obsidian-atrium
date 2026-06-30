import esbuild from "esbuild";
import process from "process";
import builtins from "builtin-modules";
import esbuildSvelte from "esbuild-svelte";
import sveltePreprocess from "svelte-preprocess";

const prod = process.argv[2] === "production";

const ctx = await esbuild.context({
  entryPoints: ["src/main.ts"],
  bundle: true,
  external: ["obsidian", "electron", "@codemirror/*", "@lezer/*", ...builtins],
  format: "cjs",
  target: "es2022",
  logLevel: "info",
  sourcemap: prod ? false : "inline",
  treeShaking: true,
  outfile: "main.js",
  minify: prod,
  plugins: [
    esbuildSvelte({
      compilerOptions: { css: "injected" },
      preprocess: sveltePreprocess(),
    }),
  ],
});

if (prod) {
  await ctx.rebuild();
  process.exit(0);
} else {
  await ctx.watch();
}
