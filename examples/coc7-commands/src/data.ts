// Field metadata shared by the command handlers.
// Labels and groups come from the COC7 rule plugin's descriptor so the command
// plugin cannot drift from the character sheet.

import { FIELDS as DESCRIPTOR_FIELDS } from "../../coc7-rules/src/descriptor";

export type Section = "basic" | "ability" | "skill" | "extra" | "act" | "record";

export interface FieldInfo {
  label: string;
  section: Section;
}

function sectionFor(group: string | undefined): Section {
  if (group === "characteristics" || group === "derived") return "ability";
  if (group === "background") return "extra";
  return "skill";
}

export const FIELDS: Record<string, FieldInfo> = Object.fromEntries(
  DESCRIPTOR_FIELDS.map((field) => [field.key, { label: field.label, section: sectionFor(field.group) }]),
);

export const EXTRA_ALIASES: Record<string, string> = {
  "str": "strength",
  "dex": "dexterity",
  "pow": "willpower",
  "con": "constitution",
  "app": "appearance",
  "edu": "education",
  "siz": "size",
  "int": "intelligence",
  "灵感": "intelligence",
  "san": "sanity",
  "san值": "sanity",
  "理智值": "sanity",
  "理智": "sanity",
  "luck": "luck",
  "运气": "luck",
  "幸运": "luck",
  "mp": "magicPoints",
  "魔法": "magicPoints",
  "魔法值": "magicPoints",
  "hp": "healthPoints",
  "体力": "healthPoints",
  "体力值": "healthPoints",
  "生命值": "healthPoints",
  "cm": "cthulhuMythos",
  "克苏鲁": "cthulhuMythos",
  "信誉": "creditRating",
  "信用": "creditRating",
  "计算机": "computerUse",
  "电脑": "computerUse",
  "驾驶": "drive",
  "汽车": "drive",
  "图书馆": "libraryUse",
  "开锁": "locksmith",
  "撬锁": "locksmith",
  "领航": "navigation",
  "侦察": "investigation",
  "侦查": "investigation",
  "闪避": "dodge",
  "格斗": "fistfight",
  "斗殴": "fistfight",
  "射击": "firearms",
};

function buildAliases(): Record<string, string> {
  const aliases: Record<string, string> = {};
  for (const [key, info] of Object.entries(FIELDS)) {
    aliases[key] = key;
    aliases[key.toLowerCase()] = key;
    aliases[info.label] = key;
  }
  for (const [alias, key] of Object.entries(EXTRA_ALIASES)) {
    aliases[alias] = key;
    aliases[alias.toLowerCase()] = key;
  }
  return aliases;
}

export const ALIASES = buildAliases();

export const LABELS: Record<string, string> = Object.fromEntries(
  Object.entries(FIELDS).map(([key, info]) => [key, info.label]),
);

export const SECTIONS: Record<string, Section> = Object.fromEntries(
  Object.entries(FIELDS).map(([key, info]) => [key, info.section]),
);

// Legacy TuanChat keys that should update in place instead of creating a new field.
export const FALLBACK_KEYS: Record<string, string[]> = {
  "sanity": ["san", "理智", "理智值"],
  "healthPoints": ["hp", "生命值", "体力"],
  "magicPoints": ["mp", "魔法值"],
  "luck": ["幸运", "运气"],
  "cthulhuMythos": ["cm", "克苏鲁"],
  "creditRating": ["信誉", "信用"],
  "computerUse": ["计算机", "电脑"],
  "libraryUse": ["图书馆"],
  "locksmith": ["开锁", "撬锁"],
  "navigation": ["领航"],
  "investigation": ["侦查", "侦察"],
  "dodge": ["闪避"],
  "fistfight": ["斗殴", "格斗"],
  "firearms": ["射击"],
};
