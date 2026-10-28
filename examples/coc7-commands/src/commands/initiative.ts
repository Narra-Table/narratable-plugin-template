import { fieldValue, loadCard, setFieldValue, toNumber } from "../card";
import { defineCommand } from "../command";

export function registerInitiativeCommand(rule: ntp.RuleNamespace): void {
  rule.addCmd(defineCommand({
    name: "ri",
    description: "读取敏捷先攻",
    examples: [".ri"],
    usage: ".ri",
    solve: (_args, mentioned, cpi) => {
      const seen = new Set<string>();
      const lines: string[] = [];
      for (const who of mentioned) {
        if (!who.maskId || seen.has(who.maskId)) continue;
        seen.add(who.maskId);
        const card = cpi.getRoleAbilityList(who.maskId);
        const initiative = toNumber(fieldValue(card, "dexterity"), 0);
        setFieldValue(card, "initiative", initiative);
        cpi.setRoleAbilityList(who.maskId, card);
        lines.push(`${who.name || "角色"} 先攻：${initiative}`);
      }
      cpi.replyMessage(lines.length > 0 ? lines.join("\n") : "未指定角色");
      return true;
    },
  }));
}
