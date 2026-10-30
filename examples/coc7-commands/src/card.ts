import { ALIASES, FALLBACK_KEYS, LABELS } from "./data";

export interface LoadedCard {
  who: ntp.MentionedMask;
  card: ntp.CharacterData;
}


export function sender(mentioned: readonly ntp.MentionedMask[]): ntp.MentionedMask | undefined {
  return mentioned[mentioned.length - 1];
}

export function target(mentioned: readonly ntp.MentionedMask[]): ntp.MentionedMask | undefined {
  return mentioned[0] ?? sender(mentioned);
}

export function loadCard(cpi: ntp.CPI, mentioned: readonly ntp.MentionedMask[]): LoadedCard | null {
  const who = target(mentioned);
  if (!who?.cardId) return null;
  return { who, card: cpi.character.read(who.cardId) };
}

export function normalizeName(raw: string): string {
  const name = raw.trim();
  if (!name) return "";
  return ALIASES[name] ?? ALIASES[name.toLowerCase()] ?? name;
}

export function toNumber(value: unknown, fallback: number): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function candidateKeys(key: string): string[] {
  return [key, ...(FALLBACK_KEYS[key] ?? [])];
}

export function fieldValue(card: ntp.CharacterData, key: string): unknown {
  for (const candidate of candidateKeys(key)) {
    if (card[candidate] !== undefined) return card[candidate];
  }
  return undefined;
}

export function setFieldValue(card: ntp.CharacterData, key: string, value: string | number): void {
  card[key] = value;
}

export function saveCard(cpi: ntp.CPI, loaded: LoadedCard): void {
  if (!loaded.who.cardId) throw new Error("角色没有绑定规则卡");
  cpi.character.write(loaded.who.cardId, loaded.card);
}

export function showCard(cpi: ntp.CPI, mentioned: readonly ntp.MentionedMask[], names: string[]): boolean {
  const loaded = loadCard(cpi, mentioned);
  if (!loaded) {
    cpi.replyMessage("未指定角色");
    return false;
  }
  const keys = names.length > 0 ? names.map(normalizeName) : Object.keys(LABELS);
  const lines = [`<${loaded.who.name || "当前角色"}> 的角色卡：`];
  for (const key of keys) {
    const value = fieldValue(loaded.card, key);
    if (value !== undefined) {
      lines.push(`${LABELS[key] ?? key}: ${value}`);
    }
  }
  cpi.replyMessage(lines.join("\n"));
  return true;
}
