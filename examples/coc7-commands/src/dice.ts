export const MAX_REPEAT = 10;

export type HouseRule = 0 | 1 | 2 | 3 | 4 | 5;

export const HOUSE_RULES: Record<HouseRule, string> = {
  0: " [COC7官方规则书] 出1大成功，不满50出96-100大失败，满50出100大失败",
  1: " 不满50出1大成功，不满50出96-100大失败，满50出100大失败",
  2: " [常用房规] 出1-5且判定成功为大成功，出96-100且判定失败为大失败",
  3: " 出1-5大成功，出96-100大失败，无视判定结果",
  4: " 出1-5且≤成功率/10为大成功，不满50出>=96+成功率/10大失败，满50出100大失败",
  5: " 出1-2且≤成功率/5为大成功，不满50出96-100大失败，满50出99-100大失败",
};

export function houseRule(cpi: ntp.CPI): HouseRule {
  const raw = cpi.getSpaceData("cocRule");
  const rule = Number.parseInt(raw ?? "0", 10);
  if (!Number.isFinite(rule) || rule < 0 || rule > 5) return 0;
  return rule as HouseRule;
}

export function criticalSuccess(roll: number, value: number, rule: HouseRule): boolean {
  switch (rule) {
    case 0: return roll === 1;
    case 1: return value < 50 && roll === 1;
    case 2: return roll >= 1 && roll <= 5 && roll <= value;
    case 3: return roll >= 1 && roll <= 5;
    case 4: return roll >= 1 && roll <= 5 && roll <= Math.ceil(value / 10);
    case 5: return roll >= 1 && roll <= 2 && roll <= Math.ceil(value / 5);
  }
}

export function criticalFailure(roll: number, value: number, rule: HouseRule): boolean {
  switch (rule) {
    case 0:
    case 1:
      return value < 50 ? roll >= 96 : roll === 100;
    case 2:
      return roll >= 96 && roll > value;
    case 3:
      return roll >= 96;
    case 4:
      return value < 50 ? roll >= Math.min(96 + Math.floor(value / 10), 100) : roll === 100;
    case 5:
      return value < 50 ? roll >= 96 : roll >= 99;
  }
}

export type CheckLevel = "大成功" | "大失败" | "失败" | "成功" | "困难成功" | "极难成功";

export function levelOf(roll: number, value: number, cpi: ntp.CPI): CheckLevel {
  const rule = houseRule(cpi);
  if (criticalSuccess(roll, value, rule)) return "大成功";
  if (criticalFailure(roll, value, rule)) return "大失败";
  if (roll > value) return "失败";
  if (roll <= Math.floor(value / 5)) return "极难成功";
  if (roll <= Math.floor(value / 2)) return "困难成功";
  return "成功";
}

export interface D100Result {
  roll: number;
  dice: number[];
}

function d10(cpi: ntp.CPI): number {
  return cpi.roll("1d10").total - 1;
}

function connect(tens: number, ones: number): number {
  const value = tens * 10 + ones;
  return value === 0 ? 100 : value;
}

/** Roll d100 with bonus (bp > 0) or penalty (bp < 0) dice. */
export function rollD100(cpi: ntp.CPI, bp: number): D100Result {
  if (!bp) {
    return { roll: cpi.roll("1d100").total, dice: [] };
  }
  const tens = d10(cpi);
  const ones = d10(cpi);
  let best = tens;
  const shown = [tens];
  for (let index = 0; index < Math.abs(bp); index += 1) {
    const candidate = d10(cpi);
    shown.push(candidate);
    const current = connect(best, ones);
    const next = connect(candidate, ones);
    if (bp > 0 ? next > current : next < current) {
      best = candidate;
    }
  }
  return { roll: connect(best, ones), dice: shown };
}

export function checkLine(name: string, roll: number, value: number, cpi: ntp.CPI): string {
  const level = levelOf(roll, value, cpi);
  cpi.setCopywritingKey(level);
  return `${name}检定：D100=${roll}/${value} ${level}`;
}
