import { HOUSE_RULES, houseRule, type HouseRule } from "../dice";
import { defineCommand } from "../command";

const RULE_IDS: HouseRule[] = [0, 1, 2, 3, 4, 5];

export function registerHouseCommand(rule: ntp.RuleNamespace): void {
  rule.addCmd(defineCommand({
    name: "setcoc",
    description: "设置 COC 房规",
    examples: [".setcoc", ".setcoc 2"],
    usage: ".setcoc [0-5]?",
    solve: (args, _mentioned, cpi) => {
      if (args.length === 0) {
        const current = houseRule(cpi);
        const lines = [`当前房规：${current} - ${HOUSE_RULES[current]}`, "", "可选房规："];
        for (const key of RULE_IDS) {
          lines.push(`${key}: ${HOUSE_RULES[key]}`);
        }
        cpi.replyMessage(lines.join("\n"));
        return true;
      }
      const value = Number.parseInt(args[0], 10);
      if (!Number.isFinite(value) || value < 0 || value > 5) {
        cpi.replyMessage("错误：房规编号必须为 0-5 之间的整数");
        return false;
      }
      cpi.setSpaceData("cocRule", String(value));
      cpi.replyMessage(`房规已设置为：${value} - ${HOUSE_RULES[value as HouseRule]}`);
      return true;
    },
  }));
}
