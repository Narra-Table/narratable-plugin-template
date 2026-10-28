import { reply } from "../reply";
import { defineCommand } from "../command";

type Symptom = readonly [name: string, description: string];

const TEMPORARY: Symptom[] = [
  ["失忆", "调查员对上一次抵达安全场所后发生的事一无所知。"],
  ["假性残疾", "调查员陷入因心理作用引起的失明、耳聋或肢体失能。"],
  ["暴力倾向", "调查员沉浸于狂怒，开始对四周施加失控的暴力与破坏。"],
  ["偏执妄想", "调查员陷入严重的偏执妄想，认为所有人都与他为敌。"],
  ["人际依赖", "调查员将当前场景中的另一人误认为他的重要之人。"],
  ["昏厥", "调查员立即昏倒。"],
  ["惊慌逃窜", "调查员无法自制地远远逃开。"],
  ["歇斯底里", "调查员开始狂笑、哭泣或尖叫。"],
  ["恐惧症", "调查员患上一项新的恐惧症。"],
  ["躁狂症", "调查员患上一项新的躁狂症。"],
];

const SUMMARY: Symptom[] = [
  ["失忆", "调查员恢复神志时身处陌生地点，连自己是谁都不记得。"],
  ["被劫", "调查员恢复神志时财物已遭人打劫。"],
  ["遍体鳞伤", "调查员恢复神志时遍体鳞伤，生命值降至疯狂前的一半。"],
  ["暴力", "调查员的情绪在暴力和破坏的冲动中爆发。"],
  ["思想与信念", "调查员将一项思想与信念以极端方式展现出来。"],
  ["重要之人", "调查员会尽一切努力接近他的重要之人。"],
  ["被收容", "调查员恢复神志时身处精神病房或警局拘留室。"],
  ["惊慌逃窜", "调查员恢复神志时已经身处很远的地方。"],
  ["恐惧症", "调查员患上一项新的恐惧症。"],
  ["躁狂症", "调查员患上一项新的躁狂症。"],
];

function draw(cpi: ntp.CPI, mentioned: readonly ntp.MentionedMask[], table: Symptom[], kind: string, unit: string): boolean {
  const index = Math.max(0, Math.min(table.length - 1, cpi.roll("1d10").total - 1));
  const symptom = table[index];
  const duration = cpi.roll("1d10").total;
  reply(cpi, mentioned, `疯狂发作-${kind}：\n${symptom[0]}\n持续${unit}：${duration}\n${symptom[1]}`, false);
  return true;
}

export function registerMadnessCommands(rule: ntp.RuleNamespace): void {
  rule.addCmd(defineCommand({
    name: "ti",
    description: "抽取临时症状",
    examples: [".ti"],
    usage: ".ti",
    solve: (_args, mentioned, cpi) => draw(cpi, mentioned, TEMPORARY, "即时症状", "轮"),
  }));
  rule.addCmd(defineCommand({
    name: "li",
    description: "抽取总结症状",
    examples: [".li"],
    usage: ".li",
    solve: (_args, mentioned, cpi) => draw(cpi, mentioned, SUMMARY, "总结症状", "小时"),
  }));
}
