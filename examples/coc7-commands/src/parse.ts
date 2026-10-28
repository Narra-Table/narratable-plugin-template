import { MAX_REPEAT } from "./dice";
import { normalizeName } from "./card";

export interface CheckArgs {
  repeat: number;
  bp: number;
  hidden: boolean;
  name: string;
  value: number | null;
  bonus: number;
  error: string;
}

export function parseCheck(args: readonly string[]): CheckArgs {
  const parsed: CheckArgs = {
    repeat: 1,
    bp: 0,
    hidden: false,
    name: "",
    value: null,
    bonus: 0,
    error: "",
  };
  const list = args.map((arg) => arg.trim());

  if (list.length > 0) {
    const repeatMatch = list[0].match(/^(\d+)[#＃](.*)$/);
    if (repeatMatch) {
      parsed.repeat = Number.parseInt(repeatMatch[1], 10);
      if (parsed.repeat < 1) parsed.repeat = 1;
      if (parsed.repeat > MAX_REPEAT) {
        parsed.error = `错误：一次最多支持 ${MAX_REPEAT} 次检定`;
        return parsed;
      }
      list[0] = repeatMatch[2];
      if (list[0] === "") list.shift();
    }
  }

  for (const token of list) {
    if (token === "") continue;
    const lower = token.toLowerCase();
    if (lower === "h") {
      parsed.hidden = true;
      continue;
    }
    const bpMatch = lower.match(/^([+-]?\d*)([bp])$/);
    if (bpMatch) {
      const amount = bpMatch[1] === "" || bpMatch[1] === "+"
        ? 1
        : bpMatch[1] === "-"
          ? -1
          : Number.parseInt(bpMatch[1], 10);
      parsed.bp += bpMatch[2] === "b" ? amount : -amount;
      continue;
    }
    const nameBonus = token.match(/^([^\d+-]+)([+-]\d+)$/);
    if (nameBonus) {
      parsed.name = normalizeName(nameBonus[1]);
      parsed.bonus += Number.parseInt(nameBonus[2], 10);
      continue;
    }
    const nameValue = token.match(/^([^\d+-]+)(\d+)$/);
    if (nameValue) {
      parsed.name = normalizeName(nameValue[1]);
      parsed.value = Number.parseInt(nameValue[2], 10);
      continue;
    }
    if (/^[+-]?\d+$/.test(token)) {
      if (/^[+-]/.test(token)) {
        parsed.bonus += Number.parseInt(token, 10);
      } else if (parsed.value === null) {
        parsed.value = Number.parseInt(token, 10);
      } else {
        parsed.bonus += Number.parseInt(token, 10);
      }
      continue;
    }
    if (!parsed.name) {
      parsed.name = normalizeName(token);
    }
  }

  if (!parsed.name) {
    parsed.error = "错误：缺少技能名称";
  }
  return parsed;
}

export interface LossSpec {
  min: number;
  max: number;
  roll(cpi: ntp.CPI): number;
}

export function parseLoss(expr: string): LossSpec | null {
  const text = expr.trim().toLowerCase();
  const fixed = text.match(/^(\d+)$/);
  if (fixed) {
    const value = Number.parseInt(fixed[1], 10);
    return { min: value, max: value, roll: () => value };
  }
  const dice = text.match(/^(\d+)d(\d+)([+-]\d+)?$/);
  if (dice) {
    const count = Number.parseInt(dice[1], 10);
    const sides = Number.parseInt(dice[2], 10);
    const modifier = dice[3] ? Number.parseInt(dice[3], 10) : 0;
    return {
      min: Math.max(0, count + modifier),
      max: Math.max(0, count * sides + modifier),
      roll: (cpi) => Math.max(0, cpi.roll(text).total),
    };
  }
  return null;
}
