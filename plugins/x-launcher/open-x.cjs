const { execFile } = require("node:child_process");
const { promisify } = require("node:util");

const run = promisify(execFile);

module.exports = function openX(launch = run) {
  const url = new URL("codex://browser");
  url.searchParams.set("url", "https://x.com/");
  return launch("/usr/bin/open", ["-b", "com.openai.codex", url.href], { timeout: 10000 });
};
