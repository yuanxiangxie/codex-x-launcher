const openX = require("./open-x.cjs");
const { randomUUID } = require("node:crypto");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const { McpServer } = require("@modelcontextprotocol/sdk/server/mcp.js");
const { StdioServerTransport } = require("@modelcontextprotocol/sdk/server/stdio.js");
const { registerAppResource, registerAppTool, RESOURCE_MIME_TYPE } = require("@modelcontextprotocol/ext-apps/server");

const iconData = readFileSync(join(__dirname, "x-icon.png")).toString("base64");
const server = new McpServer({
  name: "x-launcher",
  title: "X",
  version: require("./.codex-plugin/plugin.json").version,
  icons: [{ src: `data:image/png;base64,${iconData}`, mimeType: "image/png", sizes: ["128x128"] }]
});
const resourceUri = "ui://x-launcher/card-v1.html";

async function openInBrowser() {
  try {
    await openX();
    return { content: [] };
  } catch {
    return { isError: true, content: [{ type: "text", text: "Could not open X. Check that the Codex browser is available and try again." }] };
  }
}

registerAppTool(server, "activate_x_launcher", {
  title: "X",
  description: "Activate the X launcher from the Codex sidebar.",
  inputSchema: {},
  _meta: {
    ui: { resourceUri, visibility: ["app"] },
    "openai/ui": { entrypoints: [{ type: "global" }] }
  }
}, async () => ({ content: [], structuredContent: { activation: randomUUID() } }));

server.registerTool("open_x_in_browser", {
  title: "Open X",
  description: "Open https://x.com/ in the Codex in-app browser.",
  inputSchema: {},
  _meta: { ui: { visibility: ["app"] } }
}, openInBrowser);

registerAppResource(server, "X", resourceUri, {}, async () => ({
  contents: [{
    uri: resourceUri,
    mimeType: RESOURCE_MIME_TYPE,
    text: readFileSync(join(__dirname, "launcher.html"), "utf8")
  }]
}));

server.connect(new StdioServerTransport()).catch(() => { process.exitCode = 1; });
