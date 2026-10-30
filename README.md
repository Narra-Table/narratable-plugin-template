# narratable-plugin-template

故桌插件的 TypeScript 工程。终端入口写指令，窗口入口写页面。构建产出脚本、窗口页面和资源清单，并可以打成 `.ntp` 包。

宿主提供全局对象 `narratable`。类型在 `ntp.d.ts`，命名空间是 `ntp`。副作用都通过 `cpi` 完成，例如 `replyMessage`、`sendToast`、`roll`；配置用 `narratable.config`，角色接口用 `narratable.character`。插件之间用 `narratable.export` 登记函数，用 `narratable.use("插件名")` 在同一次调用里执行，栈深最多 8 层。通用存储是 `cpi.data`。打开本插件窗口用 `cpi.openWindow`。

## 目录

| 路径 | 作用 |
| --- | --- |
| `plugin.json` | 插件身份、依赖和窗口声明 |
| `public/` | 随包分发的资源，按相对路径进入 `assets/` |
| `ntp.d.ts` | 宿主运行时类型 |
| `src/main.ts` | 终端入口：创建规则并登记指令。可以省略 |
| `src/windows/<id>/` | 一个窗口。入口是 `index.tsx` 或 `index.html` |
| `src/command.ts` | `defineCommand` 与 `sender` |
| `src/assets.ts` | 构建生成的资源引用，`image()` / `audio()` |
| `src/commands/` | 每条指令一个文件 |
| `build.mjs` | 构建脚本、清单，并在 `release` 时打包 |
| `examples/` | 示例插件项目，每个目录独立 `plugin.json` 和 TypeScript `src/` |
| `dist/` | 构建产物，不入库 |

`defineCommand` 把 `CommandExecutor` 的位置参数收成具名字段。`sender` 取点名列表的最后一项，也就是发送者自己的面具。

## 写一条指令

在 `src/commands/` 里定义指令，再把它放进 `src/main.ts` 的 `commands`。

```ts
import { defineCommand, sender } from "../command";

export const cmd = defineCommand({
  name: "cmd",
  description: "说明",
  usage: ".cmd",
  examples: [".cmd"],
  solve(args, mentioned, cpi) {
    const who = sender(mentioned);
    if (!who) return false;
    cpi.replyMessage(who.name);
    return true;
  },
});
```

`solve` 返回 `true` 表示这条指令执行成功，返回 `false` 表示失败。`args` 是去掉指令名之后的参数，缺参为 `undefined`。没有点名时，`mentioned` 里只有发送者；点了名时，被点的面具在前，发送者仍在最后。

```ts
import { cmd } from "./commands/cmd";

const commands = [cmd];

const rule = narratable.rule.new("规则名", [], "说明");
for (const command of commands) {
  rule.addCmd(command);
}
narratable.rule.register(rule);
```

`narratable.rule.new` 的三个参数是规则名、别名和说明。`register` 把这个命名空间登记到当前插件。

## 元信息与资源

`plugin.json` 写身份、规则、依赖和窗口。`name` 是小写字母、数字和连字符。`version` 是 `主版本.次版本.修订号`，可以带连字符后缀。`characterDataType`、`rule`、`pluginRule`、`depends` 都可以省略。`configSchema` 已废弃，写了会让构建失败；配置项改在脚本顶层用 `narratable.config.*` 登记。

```json
{
  "name": "example",
  "displayName": "示例插件",
  "version": "0.1.0",
  "description": "一条示例指令。",
  "author": "",
  "windows": [
    { "id": "panel", "title": "示例" }
  ]
}
```

`windows` 可以省略。写了的话，每一项必须有 `id` 和 `title`。`id` 对应目录 `src/windows/<id>/`。可选的窗口字段：

| 字段 | 说明 |
| --- | --- |
| `icon` | `assets/` 下的图片；缺省用应用图标 |
| `visibility` | `all` 或 `gm_only` |
| `defaultWidth` | 0 到 1 之间的初始宽度 |
| `defaultDisplay` | `normal` / `maximized` / `minimized` / `floating` |
| `chrome` | `full` / `titlebar-hidden` |
| `floating` `modal` `singleton` | 默认 `false` |
| `embeddable` `launcher` `resizable` `dismissible` | 默认 `true` |

## 规则与依赖

声明规则的插件用 `rule`，版本号就是规则版本。每个 rule 只有一个声明插件。

```json
{
  "name": "coc7",
  "version": "1.4.2",
  "rule": { "id": "narratable/coc7", "name": "COC 7th" }
}
```

依赖某条规则的插件用 `pluginRule`，并在 `depends` 里显式依赖声明插件；宿主不会自动补依赖。

```json
{
  "pluginRule": {
    "rule": "narratable/coc7",
    "constraint": ">= 1.0.0 < 2.0.0",
    "namespace": "coc7"
  },
  "depends": [
    { "id": "narratable/coc7", "constraint": ">= 1.0.0 < 2.0.0" }
  ]
}
```

`depends` 也接受旧字符串数组，构建时会统一输出 `{ id }` 对象。没有 `pluginRule` 的插件是公共插件，可在任何空间启用。

## 配置

配置项在脚本顶层登记，宿主试加载时收集，不进 `plugin.json`。普通值和 `Selector<T>` 用同一套 API。

```ts
narratable.config.int("diceFaces", 100, "个人骰面", "规则", { scope: "user" });
narratable.config.selector("dice", {
  valueType: "int",
  scope: "user",
  default: "workspace",
  options: [
    { id: "workspace", name: "跟随工作区", source: { scope: "workspace", key: "defaultDice" } },
    { id: "user", name: "个人骰面", source: { scope: "user", key: "diceFaces" } },
  ],
});

const faces = narratable.config.get<number>("dice");
const option = narratable.config.select("dice");
const raw = narratable.config.in("workspace").raw("defaultDice");
```

作用域是 `global`、`user`、`workspace`。Selector 只能读同层或更宽的槽：个人选择器可以跟随工作区值，工作区共享值不能读个人槽。

## 角色接口

规则声明插件可以实现 character 接口。宿主保存卡片元数据和不透明 payload，表单由 `describe` 驱动。

```ts
narratable.character.define({
  describe() {
    return {
      ruleId: "narratable/coc7",
      name: "COC 7th",
      fields: [
        { key: "hp", label: "生命", type: "number", default: 10 },
        { key: "san", label: "理智", type: "number", default: 50 },
      ],
    };
  },
  read(stored) {
    return stored;
  },
  write(data) {
    return data;
  },
  validate(data) {
    return [];
  },
});
```

这些 hook 是只接收数据的纯变换。指令通过 `mentioned[i].cardId` 确定卡片，调用 `cpi.character.read(cardId)` / `write(cardId, data)`；新规则卡不再使用六张字符串表。当前生命、理智和成长技能不能在每次 read/write 时恢复初值。

资源放在 `public/`。`public/icon.svg` 打进包后是 `assets/icon.svg`。允许的类型是 png、jpg、jpeg、gif、webp、svg、json、ogg、mp3、wav。单个文件不超过 8MB，合计不超过 32MB，最多 200 个。以点开头的文件会被跳过，符号链接会让构建失败。

指令的名字和说明仍写在 `defineCommand` 里，不抄进 `plugin.json`。

文本回复继续用 `cpi.replyMessage`。图片和音频放进 `cpi.sendMessage` 的块里。`pnpm check` 和 `pnpm build` 会根据 `public/` 生成 `src/assets.ts`，路径写错时类型检查会失败。

```ts
import { image } from "../assets";

cpi.sendMessage({
  content: [
    { type: "paragraph", children: [{ type: "text", text: who.name }] },
    image("icon.svg", { alt: "图标" }),
  ],
});
```

`image("icon.svg")` 写入的 `resourceId` 是 `plugin:example/assets/icon.svg`，也就是插件名加包内路径。`audio()` 用于 ogg、mp3 和 wav。这条 id 会随消息保存。宿主按当前空间锁定的版本解析 `plugin:`，鉴权后生成 blob URL。

## 窗口

一个窗口一个目录。入口二选一：`index.html` 把脚本和样式写在文件里面，`index.tsx` 由构建打包。两份都在，或目录对不上 `plugin.json` 里的 `id`，构建失败。

```text
src/windows/panel/index.html
src/windows/sheet/index.tsx
```

只有窗口、没有指令和导出时，删掉 `src/main.ts`。包里就没有 `plugin.js`。只有终端时，不要写 `windows`。

构建后每个窗口是一份自包含的 `dist/windows/<id>.html`。宿主会把这个文件装进 sandbox iframe，资源走 `plugin:<name>/assets/...`。窗口桥和键盘转发由宿主注入，类型与方法名见 `ntp.WindowBridge`。

`await ntpWindow.ready` 取得用户、规则、房间、启动参数 `params` 和该实例的视图状态 `state`。`window.getState` 读取视图状态，`window.setState` 接受 `{ state }`；状态须可 JSON 序列化，连同宿主保留的房间和启动参数总计不超过 16KB。状态跟随工作区同步，只属于当前实例。模态窗口不写入持久化快照。

```ts
const init = await ntpWindow.ready;
const view = (init.state ?? { tab: "summary" }) as { tab: string };
await ntpWindow.request("window.setState", { state: view });
ntpWindow.on("beforeClose", () => {
  void ntpWindow.request("window.closeDecision", { prevent: false });
});
```

`beforeClose` 可在 2 秒内用 `window.closeDecision` 的 `prevent: true` 阻止关闭。业务更新通过 `subscribe` 订阅，`on` 返回取消监听函数；跨实例消息只发给同空间同插件窗口。请求信封上限 32KB，同时最多 32 个请求。配置与角色卡经各自写接口，其他共享数据写入使用 `invoke`，页面不直接写 `data`。

## 示例插件

`examples/` 包含九个官方插件，覆盖规则、指令、窗口和互操作：

| 目录 | 内容 |
| --- | --- |
| `examples/coc7-rules` | 声明 `narratable/coc7`、角色卡字段和配置，没有指令 |
| `examples/coc7-commands` | `pluginRule` + `depends`，提供 `.rc`/`.sc`/`.st`，`.ri` 调用先攻导出 |
| `examples/dice-core` | 公共骰点与帮助指令、配置 |
| `examples/coc7-sheet` | 角色卡窗口与订阅 |
| `examples/dnd5e-rules` / `examples/dnd5e-commands` | 第二条规则及其指令 |
| `examples/initiative` | 房间先攻表、指令、导出和窗口 |
| `examples/map-grid` | 地图、通用存储、资源和窗口广播 |
| `examples/close-report` | 结团报告导出与窗口 |

构建全部官方包用 `npm run official`；只构建两个 COC 核心示例：

```sh
npm run examples
```

产物在 `examples/<name>/dist/`。单独构建用 `--root`：

```sh
node ./build.mjs --root examples/coc7-commands --release
```

示例用 TypeScript 写在 `src/`，由 esbuild 打包；规则插件按 descriptor/character/config 拆文件，指令插件按 `src/commands/*.ts` 一条指令一个文件。指令插件构建时会从 `examples/coc7-rules/src/descriptor.ts` 导入字段标签和分组，避免两份技能表。

## 检查与构建

```sh
pnpm install
pnpm check
pnpm build
pnpm release
```

`pnpm check` 会先刷新根项目的 `src/assets.ts`，确认窗口入口存在，再对根项目和 `examples/` 里的 TypeScript 做类型检查。`pnpm build` 在有 `src/main.ts` 时用 esbuild 打出脚本，把每个窗口打成 `dist/windows/<id>.html`，把 `public/` 复制到 `dist/assets/`，并写 `dist/manifest.json`。清单里的 `format`、`entry`、`windows` 和 `files`（路径、字节数、sha256）由构建填写。没有终端入口时，清单不含 `entry`。`pnpm release` 会先做同样的构建，再把清单、脚本、窗口和资源打成 `dist/{name}-{version}.ntp`。`.ntp` 是这个固定布局的 zip。

管理页安装 `.ntp`，空间锁定精确版本。后端 `scripts/update-official.mjs` 从本仓库重建并同步官方种子包。

默认入口、产物路径和是否压缩写在 `package.json` 的 `narratablePlugin` 里：

```json
{
  "entry": "src/main.ts",
  "outfile": "dist/plugin.js",
  "minify": true
}
```

命令行可以覆盖这三项。`--minify` 与 `--no-minify` 不能同时使用。入口和产物都必须是项目内的相对路径，产物文件名必须以 `.js` 结尾。有终端入口时，`release` 的脚本产物必须是 `dist/plugin.js`。

```sh
pnpm build -- --outfile dist/dice.js --minify
pnpm build -- --entry src/main.ts --no-minify
pnpm release
```

## 许可

本项目以 [MIT](LICENSE) 协议发布。
