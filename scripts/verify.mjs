import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import openX from "../plugins/x-launcher/open-x.cjs";

const launches = [];
await openX((command, args) => launches.push([command, ...args]));
assert.deepEqual(launches, [[
  "/usr/bin/open", "-b", "com.openai.codex", "codex://browser?url=https%3A%2F%2Fx.com%2F"
]]);

const plugin = process.argv[2] ? path.resolve(process.argv[2]) :
  fileURLToPath(new URL("../plugins/x-launcher/", import.meta.url));
const read = name => readFile(path.join(plugin, name), "utf8");
const manifest = JSON.parse(await read(".codex-plugin/plugin.json"));
const config = JSON.parse(await read(".mcp.json")).mcpServers[manifest.name];
const client = new Client({ name: "launcher-check", version: "1" });
try {
  await client.connect(new StdioClientTransport({
    command: config.command, args: config.args, cwd: path.resolve(plugin, config.cwd)
  }));
  const info = client.getServerVersion();
  assert.equal(info.title, "X");
  assert.equal(info.version, manifest.version);
  const png = await readFile(path.resolve(plugin, manifest.interface.logo));
  assert.equal(info.icons[0].src, "data:image/png;base64," + png.toString("base64"));

  const { tools } = await client.listTools();
  const launch = tools.find(tool => tool.name === "activate_x_launcher");
  assert.equal(launch.title, "X");
  assert.deepEqual(launch._meta["openai/ui"].entrypoints, [{ type: "global" }]);
  const open = tools.find(tool => tool.name === "open_x_in_browser");
  assert.deepEqual(open._meta.ui.visibility, ["app"]);
  const uri = launch._meta.ui.resourceUri;
  const { resources } = await client.listResources();
  assert.ok(resources.some(resource => resource.uri === uri));
  const { contents } = await client.readResource({ uri });
  assert.equal(contents[0].text, await read("dist/launcher.html"));
  assert.match(contents[0].text, /<html lang="en">/);
  assert.match(contents[0].text, /<p class="address">x\.com<\/p>/);
  const activate = async () => (await client.callTool({ name: launch.name, arguments: {} })).structuredContent.activation;
  const first = await activate();
  assert.match(first, /^[0-9a-f-]{36}$/);
  assert.notEqual(first, await activate());
  console.log("Passed: sidebar entry, X icon, card resource and distinct activations.");
} finally {
  await client.close();
}
