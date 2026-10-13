# narratable-plugin-template

故桌指令插件的 TypeScript 工程。在这里编写规则和指令，打包成单个 JavaScript 脚本后交给宿主执行。

宿主提供全局对象 `narratable`。类型在 `ntp.d.ts`，命名空间是 `ntp`。副作用都通过 `cpi` 完成，例如 `replyMessage`、`sendToast`、`roll`、`getRoleAbilityList`。

## 目录

| 路径 | 作用 |
| --- | --- |
| `ntp.d.ts` | 宿主运行时类型 |
| `src/index.ts` | 入口：创建规则并登记指令 |
| `src/command.ts` | `defineCommand` 与 `sender` |
| `src/commands/` | 每条指令一个文件 |
| `build.mjs` | 用 esbuild 打成单个 IIFE |
| `dist/` | 构建产物，不入库 |

`defineCommand` 把 `CommandExecutor` 的位置参数收成具名字段。`sender` 取点名列表的最后一项，也就是发送者自己的面具。

## 写一条指令

在 `src/commands/` 里定义指令，再把它放进 `src/index.ts` 的 `commands`。

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

## 检查与构建

```sh
pnpm install
pnpm check
pnpm build
```

`pnpm check` 只做类型检查，不产出文件。`pnpm build` 把入口打成单个脚本。默认入口、产物路径和是否压缩写在 `package.json` 的 `narratablePlugin` 里：

```json
{
  "entry": "src/index.ts",
  "outfile": "dist/plugin.js",
  "minify": false
}
```

命令行可以覆盖这三项。`--minify` 与 `--no-minify` 不能同时使用。入口和产物都必须是项目内的相对路径，产物文件名必须以 `.js` 结尾。

```sh
pnpm build -- --outfile dist/dice.js --minify
pnpm build -- --entry src/index.ts --no-minify
```

## 许可

本项目以 [MIT](LICENSE) 协议发布。
