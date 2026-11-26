const { execFile } = require("node:child_process");
const { randomUUID } = require("node:crypto");
const { promisify } = require("node:util");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const { McpServer } = require("@modelcontextprotocol/sdk/server/mcp.js");
const { StdioServerTransport } = require("@modelcontextprotocol/sdk/server/stdio.js");
const { registerAppResource, registerAppTool, RESOURCE_MIME_TYPE } = require("@modelcontextprotocol/ext-apps/server");

const iconData = readFileSync(join(__dirname, "x-icon.png")).toString("base64");
const server = new McpServer({
  name: "ai-consult",
  title: "X",
  version: require("./.codex-plugin/plugin.json").version,
  icons: [{ src: `data:image/png;base64,${iconData}`, mimeType: "image/png", sizes: ["128x128"] }]
});
const resourceUri = "ui://ai-consult/launcher-v2.html";
const browserUrl = new URL("codex://browser");
browserUrl.searchParams.set("url", "https://x.com/i/grok");
const run = promisify(execFile);

async function openGrok() {
  try {
    await run("/usr/bin/open", ["-b", "com.openai.codex", browserUrl.href], { timeout: 10000 });
    return { content: [] };
  } catch {
    return { isError: true, content: [{ type: "text", text: "未能打开 X 上的 Grok。请确认 Codex 可以打开网页，再试一次。" }] };
  }
}

registerAppTool(server, "open_grok", {
  title: "X",
  description: "从 Codex 左侧栏打开 X 上的 Grok。",
  inputSchema: {},
  _meta: {
    ui: { resourceUri, visibility: ["app"] },
    "openai/ui": { entrypoints: [{ type: "global" }] }
  }
}, async () => ({ content: [], structuredContent: { activation: randomUUID() } }));

server.registerTool("show_grok_browser", {
  title: "打开 X 上的 Grok",
  description: "在 Codex 内置浏览器打开 x.com/i/grok。",
  inputSchema: {},
  _meta: { ui: { visibility: ["app"] } }
}, openGrok);

registerAppResource(server, "X", resourceUri, {}, async () => ({
  contents: [{
    uri: resourceUri,
    mimeType: RESOURCE_MIME_TYPE,
    text: readFileSync(join(__dirname, "launcher.html"), "utf8")
  }]
}));

server.connect(new StdioServerTransport()).catch(() => { process.exitCode = 1; });
