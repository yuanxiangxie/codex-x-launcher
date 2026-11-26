import { mkdir, copyFile, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const root = fileURLToPath(new URL("../", import.meta.url));
const plugin = "plugins/x-launcher";
const dist = path.join(root, plugin, "dist");
await mkdir(dist, { recursive: true });

const browser = await build({
  absWorkingDir: root,
  entryPoints: [plugin + "/launcher.js"],
  bundle: true,
  platform: "browser",
  format: "iife",
  target: "es2022",
  minify: true,
  write: false
});
const template = await readFile(path.join(root, plugin, "launcher.html"), "utf8");
const script = browser.outputFiles[0].text;
if (template.split("<!-- app-script -->").length !== 2 || /<\/script/i.test(script)) {
  throw new Error("Could not embed the browser script in the launcher template.");
}
const html = template.replace("<!-- app-script -->", () => `<script>${script}</script>`);
await writeFile(path.join(dist, "launcher.html"), html);
await copyFile(path.join(root, plugin, "x-icon.png"), path.join(dist, "x-icon.png"));
await build({
  absWorkingDir: root,
  entryPoints: [plugin + "/server.cjs"],
  outfile: path.join(dist, "server.cjs"),
  bundle: true,
  platform: "node",
  format: "cjs",
  target: "node22"
});
