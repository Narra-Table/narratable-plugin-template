import { fieldValue, loadCard, normalizeName, setFieldValue, showCard, toNumber } from "../card";
import { LABELS } from "../data";
import { defineCommand } from "../command";

export function registerStatsCommand(rule: ntp.RuleNamespace): void {
  rule.addCmd(defineCommand({
    name: "st",
    description: "属性设置",
    examples: [".st 侦查60", ".st 力量+10", ".st show", ".st show 侦查 力量"],
    usage: ".st [属性名][数值/±调整] / .st show [属性名]...",
    solve: (args, mentioned, cpi) => {
      if (args[0]?.toLowerCase() === "show") {
        return showCard(cpi, mentioned, args.slice(1));
      }
      const loaded = loadCard(cpi, mentioned);
      if (!loaded) {
        cpi.replyMessage("错误：未指定角色");
        return false;
      }
      const input = args.join("");
      const pattern = /([^\d+-]+)([+-]?)(\d+)/g;
      const changes: string[] = [];
      let match: RegExpExecArray | null;
      while ((match = pattern.exec(input)) !== null) {
        const key = normalizeName(match[1]);
        const operator = match[2];
        const amount = Number.parseInt(match[3], 10);
        const oldValue = toNumber(fieldValue(loaded.card, key), 0);
        let next = amount;
        if (operator === "+") next = oldValue + amount;
        if (operator === "-") next = oldValue - amount;
        setFieldValue(loaded.card, key, next);
        const label = LABELS[key] ?? key;
        const delta = operator ? `${operator}${amount}` : "";
        changes.push(`${label}: ${oldValue}${delta}->${next}`);
      }
      if (changes.length === 0) {
        cpi.replyMessage("没有识别到属性修改，用法如 .st 侦查60 或 .st 力量+10");
        return false;
      }
      cpi.setRoleAbilityList(loaded.who.maskId, loaded.card);
      cpi.replyMessage(`属性设置成功：<${loaded.who.name || "当前角色"}>\n${changes.join("\n")}`);
      return true;
    },
  }));
}
