import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { chromium } from "playwright-core";

const html = await readFile(new URL("../plugins/ai-consult/dist/launcher.html", import.meta.url), "utf8");
const browser = await chromium.launch({ channel: "chrome", headless: true, chromiumSandbox: true });
try {
  const page = await browser.newPage({ viewport: { width: 795, height: 320 } });
  await page.route(/^https?:/, route => route.abort());
  await page.setContent('<style>body{margin:0}iframe{width:100vw;height:100vh;border:0;display:block}</style><iframe></iframe>');
  await page.evaluate(html => {
    const frame = document.querySelector("iframe");
    window.openCount = 0;
    window.notify = (method, params) => frame.contentWindow.postMessage({ jsonrpc: "2.0", method, params }, "*");
    window.addEventListener("message", ({ source, data }) => {
      if (source !== frame.contentWindow || !data?.method) return;
      const reply = result => source.postMessage({ jsonrpc: "2.0", id: data.id, result }, "*");
      if (data.method === "ui/initialize") {
        reply({
          protocolVersion: data.params.protocolVersion, hostInfo: { name: "preview", version: "1" },
          hostCapabilities: { serverTools: {} }, hostContext: { theme: "light" }
        });
      }
      if (data.method === "ui/notifications/initialized") {
        window.notify("ui/notifications/tool-result", { content: [], structuredContent: { activation: "preview" } });
      }
      if (data.method === "tools/call" && data.params.name === "show_grok_browser") {
        window.openCount++;
        reply({ content: [], isError: window.openCount === 2 });
      }
    });
    frame.srcdoc = html;
  }, html);
  const ui = page.frameLocator("iframe");
  const button = ui.getByRole("button");
  await ui.getByRole("button", { name: "重新打开" }).waitFor();
  assert.equal(await page.evaluate(() => window.openCount), 1);
  for (const width of [240, 400, 795, 1440]) {
    await page.setViewportSize({ width, height: 320 });
    const metrics = await ui.locator("main").evaluate(card => {
      const rect = card.getBoundingClientRect();
      return {
        left: rect.left, right: innerWidth - rect.right, top: rect.top,
        paddingTop: parseFloat(getComputedStyle(document.body).paddingTop),
        overflow: document.documentElement.scrollWidth > innerWidth
      };
    });
    assert.ok(Math.abs(metrics.left - metrics.right) < 0.1);
    assert.ok(Math.abs(metrics.top - metrics.paddingTop - 16) < 0.1);
    assert.equal(metrics.overflow, false);
  }
  await page.evaluate(() => window.notify("ui/notifications/host-context-changed", { theme: "dark" }));
  await ui.locator('html[data-theme="dark"]').waitFor({ state: "attached" });
  await page.setViewportSize({ width: 240, height: 320 });
  assert.ok((await button.boundingBox()).y > (await ui.locator("h1").boundingBox()).y);
  await page.waitForFunction(() => !document.querySelector("iframe").contentDocument.querySelector("button").disabled);
  await button.focus();
  await page.keyboard.press("Enter");
  await ui.getByRole("button", { name: "重试" }).waitFor();
  assert.match(await ui.getByRole("status").textContent(), /请重试/);
  await button.click();
  await ui.getByRole("button", { name: "重新打开" }).waitFor();
  assert.equal(await page.evaluate(() => window.openCount), 3);
  console.log("通过：自动触发、宽窄布局、顶部间距、深色主题和键盘重试。");
} finally {
  await browser.close();
}
