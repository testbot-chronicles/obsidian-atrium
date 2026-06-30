import esbuild from "esbuild";
import process from "process";
import builtins from "builtin-modules";
import esbuildSvelte from "esbuild-svelte";
import sveltePreprocess from "svelte-preprocess";
import { readFileSync, writeFileSync } from "fs";

const prod = process.argv[2] === "production";

/**
 * Concatenate gridstack's dist CSS with Atrium's own CSS into the repo-root
 * `styles.css` on every build. Obsidian auto-loads `styles.css`, whereas a CSS
 * import from JS would make esbuild emit a `main.css` that Obsidian never loads.
 */
const atriumCssPlugin = {
  name: "atrium-css",
  setup(build) {
    build.onEnd(() => {
      const grid = readFileSync("node_modules/gridstack/dist/gridstack.min.css", "utf8");
      const ours = readFileSync("src/atrium.css", "utf8");
      writeFileSync("styles.css", `/* gridstack (bundled) */\n${grid}\n/* atrium */\n${ours}\n`);
    });
  },
};

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
    atriumCssPlugin,
  ],
});

if (prod) {
  await ctx.rebuild();
  process.exit(0);
} else {
  await ctx.watch();
}
