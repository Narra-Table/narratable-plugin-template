import { reply } from "../reply";
import { defineCommand } from "../command";

export function registerHiddenCommand(rule: ntp.RuleNamespace): void {
  rule.addCmd(defineCommand({
    name: "rh",
    alias: ["暗骰"],
    description: "进行暗骰，结果仅自己可见",
    examples: [".rh", ".rh 1d100", ".rh 3d6"],
    usage: "rh [骰子表达式]?",
    solve: (args, mentioned, cpi) => {
      const expression = args.length > 0 ? args.join("") : "1d100";
      const result = cpi.roll(expression);
      reply(cpi, mentioned, `暗骰：${expression} = ${result.total}`, true);
      return true;
    },
  }));
}
