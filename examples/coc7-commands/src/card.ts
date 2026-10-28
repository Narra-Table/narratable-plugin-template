import { ALIASES, FALLBACK_KEYS, LABELS, SECTIONS, type Section } from "./data";

export interface LoadedCard {
  who: ntp.MentionedMask;
  card: ntp.RoleAbility;
}

const SECTIONS_ORDER: Section[] = ["basic", "ability", "skill", "extra", "act", "record"];

export function sender(mentioned: readonly ntp.MentionedMask[]): ntp.MentionedMask | undefined {
  return mentioned[mentioned.length - 1];
}

export function target(mentioned: readonly ntp.MentionedMask[]): ntp.MentionedMask | undefined {
  return mentioned[0] ?? sender(mentioned);
}

export function loadCard(cpi: ntp.CPI, mentioned: readonly ntp.MentionedMask[]): LoadedCard | null {
  const who = target(mentioned);
  if (!who) return null;
  return { who, card: cpi.getRoleAbilityList(who.maskId) };
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

interface LocatedField {
  section: Section;
  key: string;
  value: string;
}

function locateField(card: ntp.RoleAbility, key: string): LocatedField | null {
  for (const section of SECTIONS_ORDER) {
    const table = card[section] as Record<string, string> | undefined;
    if (!table) continue;
    for (const candidate of candidateKeys(key)) {
      const value = table[candidate];
      if (value !== undefined && value !== null) {
        return { section, key: candidate, value };
      }
    }
  }
  return null;
}

export function fieldValue(card: ntp.RoleAbility, key: string): string | undefined {
  return locateField(card, key)?.value;
}

export function setFieldValue(card: ntp.RoleAbility, key: string, value: string | number): void {
  const located = locateField(card, key);
  if (located) {
    card[located.section][located.key] = String(value);
    return;
  }
  const section = SECTIONS[key] ?? "skill";
  if (!card[section]) {
    (card as unknown as Record<string, Record<string, string>>)[section] = {};
  }
  card[section][key] = String(value);
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
