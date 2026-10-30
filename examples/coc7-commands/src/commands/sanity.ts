import { saveCard, fieldValue, loadCard, setFieldValue, toNumber } from "../card";
import { criticalFailure, criticalSuccess, houseRule, rollD100 } from "../dice";
import { parseLoss } from "../parse";
import { reply } from "../reply";
import { defineCommand } from "../command";
import { runCheck } from "./check";

export function registerSanityCommands(rule: ntp.RuleNamespace): void {
  rule.addCmd(defineCommand({
    name: "cc",
    description: "理智检定",
    examples: [".cc"],
    usage: ".cc",
    solve: (_args, mentioned, cpi) => runCheck(cpi, mentioned, ["理智"]),
  }));

  rule.addCmd(defineCommand({
    name: "sc",
    description: "进行理智检定",
    examples: [".sc 1/1d6", ".sc 0/1d10 50"],
    usage: ".sc [成功扣除]/[失败扣除] [当前理智]?",
    solve: (args, mentioned, cpi) => {
      const lossArg = args[0];
      if (!lossArg || !lossArg.includes("/")) {
        cpi.replyMessage("损失表达式格式错误，应为[成功损失]/[失败损失]");
        return false;
      }
      const [successPart, failurePart] = lossArg.split("/");
      const successLoss = parseLoss(successPart);
      const failureLoss = parseLoss(failurePart);
      if (!successLoss || !failureLoss) {
        cpi.replyMessage("损失表达式格式错误，支持固定值或 NdM 表达式");
        return false;
      }

      const loaded = loadCard(cpi, mentioned);
      if (!loaded) {
        cpi.replyMessage("错误：未指定角色");
        return false;
      }
      const explicitSan = args[1] ? Number.parseInt(args[1], 10) : Number.NaN;
      const currentSan = Number.isFinite(explicitSan)
        ? explicitSan
        : toNumber(fieldValue(loaded.card, "sanity"), Number.NaN);
      if (!Number.isFinite(currentSan)) {
        cpi.replyMessage("未找到角色的理智值");
        return false;
      }

      const rule = houseRule(cpi);
      const roll = rollD100(cpi, 0).roll;
      const isCriticalSuccess = criticalSuccess(roll, currentSan, rule);
      const isCriticalFailure = criticalFailure(roll, currentSan, rule);

      let level: string;
      let loss: number;
      if (isCriticalSuccess) {
        level = "大成功";
        loss = successLoss.min;
      } else if (isCriticalFailure) {
        level = "大失败";
        loss = failureLoss.max;
      } else if (roll <= currentSan) {
        level = "成功";
        loss = successLoss.roll(cpi);
      } else {
        level = "失败";
        loss = failureLoss.roll(cpi);
      }

      const nextSan = Math.max(0, currentSan - loss);
      setFieldValue(loaded.card, "sanity", nextSan);
      saveCard(cpi, loaded);
      cpi.setCopywritingKey(`理智检定_${level}`);

      let text = `理智检定：D100=${roll}/${currentSan} ${level}`
        + `\n损失理智值：${loss}`
        + `\n当前理智值：${nextSan}`;
      if (nextSan === 0) {
        text += "\n注意：角色理智值归零，陷入永久性疯狂。";
        cpi.setCopywritingKey("陷入疯狂_永久性疯狂");
      } else if (loss >= 5) {
        text += "\n注意：单次失去理智值达到 5 点，请进行智力检定；疯狂后可用 .ti 或 .li 抽取症状。";
        cpi.setCopywritingKey("陷入疯狂_临时性疯狂");
      }
      reply(cpi, mentioned, text, args.includes("h"));
      return true;
    },
  }));
}
