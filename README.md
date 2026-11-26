# Codex X Launcher

在 macOS 版 Codex 左侧栏点击 **X**，即可在应用内置浏览器打开 [X 上的 Grok](https://x.com/i/grok)。插件页提供「重新打开」和失败重试。需要登录时，直接在 X 页面完成登录。

![X 插件卡片，显示 Grok 地址和重新打开按钮](docs/launcher.png)

## 安装

准备好 macOS、支持插件全局入口和内置浏览器的 Codex 桌面版，以及 Node.js 22 或更高版本和 npm。终端中的 `codex plugin --help` 应列出 `add` 和 `marketplace`。本项目在桌面版 26.1120.50957 上验证。Google Chrome 仅用于可选的浏览器测试。

从 GitHub 克隆仓库，进入含有本 README 的目录，执行以下命令。仓库按源码分发，先构建，再把这个目录注册为本地插件市场。保留此目录，以便之后升级。

```sh
npm ci
npm run build
npm test
codex plugin marketplace add "$PWD"
codex plugin add ai-consult@local-ai-consult
```

如果桌面版随附的 CLI 比终端里的更新，可在安装于 `/Applications/ChatGPT.app` 的这版应用上用以下函数运行相同的命令。

```sh
codex() { "/Applications/ChatGPT.app/Contents/Resources/codex-cli/bin/codex" "$@"; }
```

打开 Codex，在左栏选择带黑底白色 X 图标的入口。若安装后仍显示旧列表，可完整退出并重新打开桌面应用。点击 **X** 后，插件页显示卡片，内置浏览器导航至 Grok。右侧浏览器标签的关闭键只关闭网页；左边的 **X** 是插件入口的标题。

## 日常操作

| 操作 | 位置与效果 |
| --- | --- |
| 进入 Grok | 点击左栏 **X**。插件页可见后会自动请求打开网页。 |
| 再次打开 | 点击卡片右侧「重新打开」。成功发出打开请求后，按钮等待约 6 秒再启用；失败时显示「重试」。 |
| 登录 X | 在内置浏览器的 X 登录页完成。插件只发送固定的网址，账号、密码及登录状态由浏览器和 X 处理。 |
| 扩大浏览器 | 在 Codex 浏览器区域点击 **Enter full view**；用 **Exit full view** 返回分屏。 |
| 收起悬浮聊天框 | 如果浏览器工具栏的 **⋯** 提供 **Hide composer**，可在此收起。全视图和聊天框可见性由宿主管理。 |

## 一次点击如何打开网页

1. Codex 从 `.agents/plugins/marketplace.json` 找到插件，经 `.codex-plugin/plugin.json` 读取名称、简介和图标，经 `.mcp.json` 用标准输入输出启动 MCP 服务。对用户显示的名称是 **X**。安装标识沿用 `ai-consult@local-ai-consult`，方便已有安装升级。
2. `server.cjs` 把 `open_grok` 注册为 `openai/ui.entrypoints` 下的 `global` 入口，并用 `_meta.ui.resourceUri` 关联卡片。服务初始化时还通过 `serverInfo.icons` 提供 PNG，供宿主渲染左栏图标。
3. 点击入口后，服务返回本次激活的随机 ID。卡片等待宿主连接成功、文档可见且进入视口，再调用仅供卡片使用的 `show_grok_browser`。同一激活 ID 会去重，隐藏预加载的卡片不会提前打开网页。
4. 服务调用 macOS Launch Services，将带有固定目标网址的深链接交给已安装的 Codex。可以在终端单独验证这一步，命令会实际打开网页。

```sh
/usr/bin/open -b com.openai.codex 'codex://browser?url=https%3A%2F%2Fx.com%2Fi%2Fgrok'
```

卡片只负责入口和状态，网页由 Codex 内置浏览器渲染。卡片会跟随宿主主题，使用面板的可用宽度；顶部额外留出 16 CSS 像素，窄窗口下按钮换行。有关全局入口与界面资源的定义，参见 [OpenAI 插件扩展文档](https://developers.openai.com/plugins/build/extensions) 和 [插件 UI 文档](https://developers.openai.com/plugins/build/chatgpt-ui)。

## 代码与构建

| 文件 | 用途 |
| --- | --- |
| `.agents/plugins/marketplace.json` | 声明本地市场和插件路径。 |
| `plugins/ai-consult/.codex-plugin/plugin.json` | 管理显示名称、版本、说明和图标。 |
| `plugins/ai-consult/.mcp.json`、`start.sh` | 从插件目录启动服务；优先使用标准安装位置的应用内置 Node，随后尝试 PATH 中的 Node。 |
| `plugins/ai-consult/server.cjs` | 注册入口和卡片资源，声明工具，打开固定的 Grok 地址。 |
| `plugins/ai-consult/launcher.html`、`launcher.js` | 卡片样式、可见性判断、主题同步、自动打开和重试。 |
| `plugins/ai-consult/x-icon.png` | 插件与侧栏使用的 X 图标。 |
| `scripts/build.mjs`、`package-lock.json` | 按锁定版本打包 MCP 服务，将浏览器脚本内联到 HTML，并复制图标。 |
| `scripts/verify.mjs`、`scripts/verify-ui.mjs` | 分别验证真实服务协议和浏览器中的卡片交互。 |

构建产物在 `plugins/ai-consult/dist/`，由构建脚本生成。Git 只跟踪源文件、依赖锁和预览；本机 Codex 安装时会复制已经构建的插件目录。

## 验证与升级

```sh
npm test
npm run test:ui
```

第一条按插件配置启动真实服务，检查侧栏声明、图标、卡片和激活 ID。第二条用本机 Chrome 和模拟宿主检查自动打开、240 至 1440 像素布局、顶部间距、深色主题和键盘重试。这两项测试都可在未登录 X 时运行。要验证桌面集成，在 Codex 中点击 **X**，确认内置浏览器显示 Grok 或 X 登录页。也可以针对一个已安装的插件目录运行 `node scripts/verify.mjs "/path/to/installed/plugin"`。

收到新版源码后，在仓库根目录执行以下命令。

```sh
git pull --ff-only
npm ci
npm run build
npm test
codex plugin add ai-consult@local-ai-consult
```

维护者发布新版时，更新插件清单里的版本，并同步根目录的 npm 版本及锁文件。变更卡片 HTML、JS 或 CSS 后重新构建。若宿主复用旧卡片，按官方建议给新版界面分配新的资源 URI 并同步入口声明；本项目在 `server.cjs` 的 `resourceUri` 常量中统一引用。重新载入当前 Codex 窗口，再点击左栏的 X。如果仍显示旧内容，完整退出并重新打开 Codex。排查时先比对构建目录和已安装版本，通常无需清除整个 Codex 缓存。

## 托管到 GitHub

维护者首次上传时，在自己的 GitHub 账号下创建一个空仓库，自行选定公开或私有。复制该仓库的 HTTPS 或 SSH 地址，在本地仓库根目录执行以下命令，将占位地址替换为复制的地址。

```sh
git remote add origin <你的-GitHub-仓库地址>
git push -u origin main
```

后续版本提交源码、锁文件和必要的说明即可。其他人从 GitHub 克隆后按本页的安装步骤构建，再注册本地市场。`docs/launcher.png` 是卡片预览，可以直接用于仓库首页。

## 卸载

```sh
codex plugin remove ai-consult@local-ai-consult
codex plugin marketplace remove local-ai-consult
```

第二条移除本项目的本地市场登记。保留源码目录即可重新构建并安装。
