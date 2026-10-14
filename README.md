# narratable-plugin-template

故桌插件的 TypeScript 工程。终端入口写指令，窗口入口写页面。构建产出脚本、窗口页面和资源清单，并可以打成 `.ntp` 包。

宿主提供全局对象 `narratable`。类型在 `ntp.d.ts`，命名空间是 `ntp`。副作用都通过 `cpi` 完成，例如 `replyMessage`、`sendToast`、`roll`、`getRoleAbilityList`。

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

`plugin.json` 写身份和窗口。`name` 是小写字母、数字和连字符。`version` 是 `主版本.次版本.修订号`，可以带连字符后缀。`characterDataType` 和 `depends` 可以省略。配置槽和插件之间的调用还没有进模板，约定见仓库里的 `backend/docs/features/plugin-package.md`。

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

`windows` 可以省略。写了的话，每一项有 `id` 和 `title`。`id` 对应目录 `src/windows/<id>/`。可选的 `visibility` 是 `all` 或 `gm_only`。

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

`image("icon.svg")` 写入的 `resourceId` 是 `plugin:example/assets/icon.svg`，也就是插件名加包内路径。`audio()` 用于 ogg、mp3 和 wav。这条 id 会随消息保存。当前房间仍按空间资源去下载它，所以图片要等宿主认出 `plugin:` 前缀之后才会显示。

## 窗口

一个窗口一个目录。入口二选一：`index.html` 把脚本和样式写在文件里面，`index.tsx` 由构建打包。两份都在，或目录对不上 `plugin.json` 里的 `id`，构建失败。

```text
src/windows/panel/index.html
src/windows/sheet/index.tsx
```

只有窗口、没有指令和导出时，删掉 `src/main.ts`。包里就没有 `plugin.js`。只有终端时，不要写 `windows`。

构建后每个窗口是一份自包含的 `dist/windows/<id>.html`。当前宿主还不会把这个文件装进工作台。

## 检查与构建

```sh
pnpm install
pnpm check
pnpm build
pnpm release
```

`pnpm check` 会先刷新 `src/assets.ts`，确认窗口入口存在，再做类型检查。`pnpm build` 在有 `src/main.ts` 时用 esbuild 打出脚本，把每个窗口打成 `dist/windows/<id>.html`，把 `public/` 复制到 `dist/assets/`，并写 `dist/manifest.json`。清单里的 `format`、`entry`、`windows` 和 `files`（路径、字节数、sha256）由构建填写。没有终端入口时，清单不含 `entry`。`pnpm release` 会先做同样的构建，再把清单、脚本、窗口和资源打成 `dist/{name}-{version}.ntp`。`.ntp` 是这个固定布局的 zip。

当前管理页仍安装 `dist/plugin.js`。`.ntp` 是给后续宿主安装用的包。

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
