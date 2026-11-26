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
  buttonLabel.textContent = "Opening…";
  status.textContent = "";
  try {
    const result = await app.callServerTool({ name: "open_x_in_browser", arguments: {} });
    if (result.isError) throw new Error("Could not open X");
    buttonLabel.textContent = "Reopen X";
    retryTimer = setTimeout(() => { button.disabled = false; }, 6000);
  } catch {
    status.textContent = "Could not open X in Codex. Try again.";
    buttonLabel.textContent = "Retry";
    button.disabled = false;
  } finally {
    opening = false;
    if (activation !== dispatched) void reveal();
  }
}

app.ontoolresult = result => {
  if (result.isError) {
    button.hidden = true;
    status.textContent = "Select X in the Codex sidebar to try again.";
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
  status.textContent = "Could not connect to Codex. Select X in the sidebar to reconnect.";
});
