import { fieldValue, loadCard, toNumber } from "../card";
import { checkLine, rollD100 } from "../dice";
import { LABELS } from "../data";
import { parseCheck } from "../parse";
import { reply } from "../reply";
import { defineCommand } from "../command";

export function runCheck(
  cpi: ntp.CPI,
  mentioned: readonly ntp.MentionedMask[],
  args: readonly string[],
  defaultBp = 0,
  hiddenDefault = false,
): boolean {
  const parsed = parseCheck(args);
  if (parsed.error) {
    cpi.replyMessage(parsed.error);
    return false;
  }
  if (parsed.bp === 0) parsed.bp = defaultBp;

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
    cpi.replyMessage("错误：未找到技能或属性，且没有指定技能值");
    return false;
  }
  value += parsed.bonus;
  if (value < 0) value = 0;

  const rollsPerCheck = parsed.bp === 0 ? 1 : 2 + Math.abs(parsed.bp);
  const maxRepeat = Math.max(1, Math.floor(18 / rollsPerCheck));
  const repeat = Math.min(parsed.repeat, maxRepeat);
  const display = LABELS[parsed.name] ?? parsed.name;
  const lines: string[] = [];

  for (let index = 0; index < repeat; index += 1) {
    const rolled = rollD100(cpi, parsed.bp);
    let line = checkLine(display, rolled.roll, value, cpi);
    if (repeat > 1) line = `第 ${index + 1} 次 ${line}`;
    if (parsed.bp > 0) line += ` 奖励骰 [${rolled.dice.join(",")}]`;
    if (parsed.bp < 0) line += ` 惩罚骰 [${rolled.dice.join(",")}]`;
    lines.push(line);
  }

  let text = lines.join("\n");
  if (repeat > 1) {
    text = `对<${loaded.who.name || "当前角色"}>的"${display}"进行了 ${repeat} 次检定：\n${text}`;
  }
  reply(cpi, mentioned, text, parsed.hidden || hiddenDefault);
  return true;
}

export function registerCheckCommands(rule: ntp.RuleNamespace): void {
  rule.addCmd(defineCommand({
    name: "rc",
    alias: ["ra"],
    description: "进行技能检定",
    examples: [".rc 侦查", ".rc 侦查+10", ".rc 侦查 50", ".rc 3#手枪", ".rc b 力量"],
    usage: "rc [次数#]? [奖励/惩罚骰]? [技能名] [技能值]?",
    solve: (args, mentioned, cpi) => runCheck(cpi, mentioned, args),
  }));

  rule.addCmd(defineCommand({
    name: "rcb",
    alias: ["rab"],
    description: "进行带奖励骰的技能检定",
    examples: [".rcb 侦查", ".rcb 2b 手枪", ".rcb 力量+10"],
    usage: "rcb [技能名] [奖励骰数量]?",
    solve: (args, mentioned, cpi) => runCheck(cpi, mentioned, args, 1),
  }));

  rule.addCmd(defineCommand({
    name: "rcp",
    alias: ["rap"],
    description: "进行带惩罚骰的技能检定",
    examples: [".rcp 侦查", ".rcp 2p 手枪", ".rcp 力量-10"],
    usage: "rcp [技能名] [惩罚骰数量]?",
    solve: (args, mentioned, cpi) => runCheck(cpi, mentioned, args, -1),
  }));

  rule.addCmd(defineCommand({
    name: "rch",
    alias: ["rah"],
    description: "进行暗技能检定，结果仅自己可见",
    examples: [".rch 侦查", ".rch 力量+10"],
    usage: "rch [技能名] [技能值]?",
    solve: (args, mentioned, cpi) => runCheck(cpi, mentioned, args, 0, true),
  }));
}
