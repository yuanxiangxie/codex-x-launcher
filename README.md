# Codex X Launcher

Open [X](https://x.com/) from the sidebar of the Codex desktop app on macOS. The launcher opens the X homepage in the built-in browser, so you can use X alongside your conversation.

![X launcher card showing x.com and the Reopen X button](docs/launcher.png)

## Installation

You need macOS, Node.js 22 or later with npm, and a version of Codex that supports sidebar plugins and the in-app browser. Run `codex plugin --help` to check that your CLI includes the `add` and `marketplace` commands.

```sh
git clone https://github.com/yuanxiangxie/codex-x-launcher.git
cd codex-x-launcher
npm ci
npm run build
codex plugin marketplace add "$PWD"
codex plugin add x-launcher@codex-x-launcher
```

Keep the cloned directory in place. Codex uses it as the local plugin marketplace.

<details>
<summary>Moving from the 1.x plugin</summary>

Version 2 opens the X homepage and uses a new plugin ID. In the existing checkout, remove the old registration, update the source, and install the new entry.

```sh
codex plugin remove ai-consult@local-ai-consult
codex plugin marketplace remove local-ai-consult
git pull --ff-only
npm ci
npm run build
codex plugin marketplace add "$PWD"
codex plugin add x-launcher@codex-x-launcher
```

</details>

<details>
<summary>My terminal does not recognize <code>codex plugin</code></summary>

If your desktop app is installed at `/Applications/ChatGPT.app` and includes the bundled CLI at the path below, run this in the current shell, then repeat the plugin commands.

```sh
codex() { "/Applications/ChatGPT.app/Contents/Resources/codex-cli/bin/codex" "$@"; }
```

</details>

## Usage

Select **X** in the Codex sidebar. When the launcher becomes visible, it opens `https://x.com/`. If X asks you to sign in, complete that step on the website.

- Select **Reopen X** on the card to open the homepage again. If the launch fails, select **Retry**.
- Use **Enter full view** in the browser toolbar to expand the page, and **Exit full view** to return to split view. Where available, **Hide composer** in the **⋯** menu hides the floating chat input.

## Updating

From the checkout used for installation, run the following commands.

```sh
git pull --ff-only
npm ci
npm run build
codex plugin add x-launcher@codex-x-launcher
```

Reload the Codex window if it still shows an earlier version of the card.

## Uninstalling

```sh
codex plugin remove x-launcher@codex-x-launcher
codex plugin marketplace remove codex-x-launcher
```

## Development

The local MCP server registers the sidebar entry. The card waits until it is visible before asking the server to open X. On macOS the server passes a fixed browser link to Codex through Launch Services. Sign-in and browsing take place in the Codex browser.

- Sidebar tools and macOS navigation are implemented in [server.cjs](plugins/x-launcher/server.cjs) and [open-x.cjs](plugins/x-launcher/open-x.cjs).
- For card layout and interaction, see [launcher.html](plugins/x-launcher/launcher.html) and [launcher.js](plugins/x-launcher/launcher.js).

After changing the source, rebuild and run the tests.

```sh
npm run build
npm test          # Check the destination, sidebar registration, icon and activation
npm run test:ui   # Test layout, theme changes and keyboard retry in local Google Chrome
```

## License

[MIT](LICENSE)
