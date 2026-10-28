import { fieldValue, loadCard, setFieldValue, toNumber } from "../card";
import { criticalFailure, houseRule, rollD100 } from "../dice";
import { LABELS } from "../data";
import { parseCheck } from "../parse";
import { reply } from "../reply";
import { defineCommand } from "../command";

export function registerGrowthCommand(rule: ntp.RuleNamespace): void {
  rule.addCmd(defineCommand({
    name: "en",
    description: "进行成长检定",
    examples: [".en 侦查", ".en 教育"],
    usage: ".en [技能名]",
    solve: (args, mentioned, cpi) => {
      const parsed = parseCheck(args);
      if (parsed.error) {
        cpi.replyMessage(parsed.error);
        return false;
      }
      const loaded = loadCard(cpi, mentioned);
      if (!loaded) {
        cpi.replyMessage("错误：未指定角色");
        return false;
      }
      let value = parsed.value;
      if (value === null) {
        value = toNumber(fieldValue(loaded.card, parsed.name), Number.NaN);
      }
      if (!Number.isFinite(value)) {
        cpi.replyMessage("错误：未找到技能或属性");
        return false;
      }
      value += parsed.bonus;
      if (value < 0) value = 0;

      const display = LABELS[parsed.name] ?? parsed.name;
      const roll = rollD100(cpi, 0).roll;
      const failed = roll > value || criticalFailure(roll, value, houseRule(cpi));
      let text = `${display}成长检定：D100=${roll}/${value}，${failed ? "检定失败" : "检定成功，无法成长"}`;
      if (failed) {
        const improve = cpi.roll("1d10").total;
        const next = value + improve;
        setFieldValue(loaded.card, parsed.name, next);
        cpi.setRoleAbilityList(loaded.who.maskId, loaded.card);
        text += `\n${display}成长：${value} -> ${next}`;
        cpi.setCopywritingKey("成长");
      }
      reply(cpi, mentioned, text, parsed.hidden);
      return true;
    },
  }));
}
