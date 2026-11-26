import manifest from "./.codex-plugin/plugin.json";
import { App, applyDocumentTheme } from "@modelcontextprotocol/ext-apps";

const app = new App({ name: "X", version: manifest.version });
const button = document.querySelector("button");
const buttonLabel = button.querySelector("span");
const status = document.querySelector("[role=status]");
let connected = false;
let visible = false;
let activation = null;
let dispatched = null;
let opening = false;
let retryTimer;

function applyTheme(context) {
  if (context?.theme) applyDocumentTheme(context.theme);
}

app.onhostcontextchanged = applyTheme;

async function reveal() {
  if (!connected || !visible || document.hidden || opening || !activation || activation === dispatched) return;
  dispatched = activation;
  opening = true;
  clearTimeout(retryTimer);
  button.hidden = false;
  button.disabled = true;
  buttonLabel.textContent = "正在打开…";
  status.textContent = "";
  try {
    const result = await app.callServerTool({ name: "show_grok_browser", arguments: {} });
    if (result.isError) throw new Error("open failed");
    buttonLabel.textContent = "重新打开";
    retryTimer = setTimeout(() => { button.disabled = false; }, 6000);
  } catch {
    status.textContent = "未能在 Codex 浏览器中打开 Grok，请重试。";
    buttonLabel.textContent = "重试";
    button.disabled = false;
  } finally {
    opening = false;
    if (activation !== dispatched) void reveal();
  }
}

app.ontoolresult = result => {
  if (result.isError) {
    button.hidden = true;
    status.textContent = "请点击 Codex 左侧栏的「X」，重新打开 Grok。";
    return;
  }
  activation = result.structuredContent?.activation ?? "current-mount";
  void reveal();
};

new IntersectionObserver(([entry]) => {
  visible = entry.isIntersecting;
  void reveal();
}).observe(document.documentElement);
document.addEventListener("visibilitychange", reveal);
button.addEventListener("click", () => {
  dispatched = null;
  void reveal();
});

app.connect().then(() => {
  applyTheme(app.getHostContext());
  connected = true;
  void reveal();
}).catch(() => {
  button.hidden = true;
  status.textContent = "未能连接到 Codex。请重新点击左侧栏的「X」。";
});
