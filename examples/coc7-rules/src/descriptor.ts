// Character descriptor for COC7, mirroring TuanChatWeb's RoleAbilityTable.
// Field keys are stable; labels are the Chinese names used by the sheet UI.

export const RULE_ID = "narratable/coc7";
// Keep in sync with plugin.json and examples/coc7-commands/plugin.json constraints.
export const RULE_VERSION = "0.4.0";
export const RULE_NAME = "COC 7th";

export const GROUPS: ntp.CharacterGroup[] = [
  { key: "characteristics", label: "基础属性" },
  { key: "derived", label: "衍生属性" },
  { key: "knowledge", label: "知识技能" },
  { key: "action", label: "行动技能" },
  { key: "social", label: "社交技能" },
  { key: "technical", label: "技术技能" },
  { key: "combat", label: "战斗技能" },
  { key: "language", label: "语言技能" },
  { key: "mythos", label: "神话" },
  { key: "background", label: "人物背景" },
];

interface NumberSpec {
  key: string;
  label: string;
  group: string;
  defaultValue: number;
  min: number;
  max: number;
}

interface TextSpec {
  key: string;
  label: string;
  group: string;
  defaultValue: string;
}

const CHARACTERISTICS: NumberSpec[] = [
  { key: "strength", label: "力量", group: "characteristics", defaultValue: 50, min: 1, max: 99 },
  { key: "dexterity", label: "敏捷", group: "characteristics", defaultValue: 50, min: 1, max: 99 },
  { key: "willpower", label: "意志", group: "characteristics", defaultValue: 50, min: 1, max: 99 },
  { key: "constitution", label: "体质", group: "characteristics", defaultValue: 50, min: 1, max: 99 },
  { key: "appearance", label: "外貌", group: "characteristics", defaultValue: 50, min: 1, max: 99 },
  { key: "education", label: "教育", group: "characteristics", defaultValue: 50, min: 1, max: 99 },
  { key: "size", label: "体型", group: "characteristics", defaultValue: 50, min: 1, max: 99 },
  { key: "intelligence", label: "智力", group: "characteristics", defaultValue: 50, min: 1, max: 99 },
];

const DERIVED: NumberSpec[] = [
  { key: "healthPoints", label: "生命值", group: "derived", defaultValue: 10, min: 0, max: 99 },
  { key: "magicPoints", label: "魔法点数", group: "derived", defaultValue: 10, min: 0, max: 99 },
  { key: "sanity", label: "理智", group: "derived", defaultValue: 50, min: 0, max: 99 },
  { key: "luck", label: "运气", group: "derived", defaultValue: 50, min: 0, max: 99 },
  { key: "mov", label: "移动力", group: "derived", defaultValue: 8, min: 0, max: 20 },
  { key: "build", label: "体格", group: "derived", defaultValue: 0, min: -2, max: 10 },
];

const KNOWLEDGE: NumberSpec[] = [
  { key: "accounting", label: "会计学", group: "knowledge", defaultValue: 5, min: 0, max: 999 },
  { key: "anthropology", label: "人类学", group: "knowledge", defaultValue: 1, min: 0, max: 999 },
  { key: "appraisal", label: "估价", group: "knowledge", defaultValue: 5, min: 0, max: 999 },
  { key: "archaeology", label: "考古学", group: "knowledge", defaultValue: 1, min: 0, max: 999 },
  { key: "history", label: "历史", group: "knowledge", defaultValue: 5, min: 0, max: 999 },
  { key: "law", label: "法律", group: "knowledge", defaultValue: 5, min: 0, max: 999 },
  { key: "libraryUse", label: "图书馆使用", group: "knowledge", defaultValue: 20, min: 0, max: 999 },
  { key: "medicine", label: "医学", group: "knowledge", defaultValue: 1, min: 0, max: 999 },
  { key: "naturalWorld", label: "博物学", group: "knowledge", defaultValue: 10, min: 0, max: 999 },
  { key: "navigation", label: "导航", group: "knowledge", defaultValue: 10, min: 0, max: 999 },
  { key: "occult", label: "神秘学", group: "knowledge", defaultValue: 5, min: 0, max: 999 },
  { key: "pharmacy", label: "药学", group: "knowledge", defaultValue: 1, min: 0, max: 999 },
  { key: "psychology", label: "心理学", group: "knowledge", defaultValue: 10, min: 0, max: 999 },
  { key: "psychoanalysis", label: "精神分析", group: "knowledge", defaultValue: 1, min: 0, max: 999 },
  { key: "firstAid", label: "急救", group: "knowledge", defaultValue: 30, min: 0, max: 999 },
  { key: "listen", label: "聆听", group: "knowledge", defaultValue: 20, min: 0, max: 999 },
  { key: "investigation", label: "侦查", group: "knowledge", defaultValue: 25, min: 0, max: 999 },
];

const ACTION: NumberSpec[] = [
  { key: "climb", label: "攀爬", group: "action", defaultValue: 20, min: 0, max: 999 },
  { key: "dodge", label: "闪避", group: "action", defaultValue: 25, min: 0, max: 999 },
  { key: "drive", label: "驾驶", group: "action", defaultValue: 20, min: 0, max: 999 },
  { key: "jump", label: "跳跃", group: "action", defaultValue: 20, min: 0, max: 999 },
  { key: "ride", label: "骑术", group: "action", defaultValue: 5, min: 0, max: 999 },
  { key: "stealth", label: "潜行", group: "action", defaultValue: 20, min: 0, max: 999 },
  { key: "swim", label: "游泳", group: "action", defaultValue: 20, min: 0, max: 999 },
  { key: "throwAbility", label: "投掷", group: "action", defaultValue: 20, min: 0, max: 999 },
  { key: "track", label: "追踪", group: "action", defaultValue: 10, min: 0, max: 999 },
  { key: "disguise", label: "乔装", group: "action", defaultValue: 5, min: 0, max: 999 },
];

const SOCIAL: NumberSpec[] = [
  { key: "acting", label: "表演", group: "social", defaultValue: 5, min: 0, max: 999 },
  { key: "charm", label: "魅惑", group: "social", defaultValue: 15, min: 0, max: 999 },
  { key: "creditRating", label: "信用评级", group: "social", defaultValue: 0, min: 0, max: 999 },
  { key: "fastTalk", label: "话术", group: "social", defaultValue: 5, min: 0, max: 999 },
  { key: "intimidate", label: "恐吓", group: "social", defaultValue: 15, min: 0, max: 999 },
  { key: "persuade", label: "说服", group: "social", defaultValue: 10, min: 0, max: 999 },
];

const TECHNICAL: NumberSpec[] = [
  { key: "computerUse", label: "计算机使用", group: "technical", defaultValue: 5, min: 0, max: 999 },
  { key: "electricRepair", label: "电器维修", group: "technical", defaultValue: 10, min: 0, max: 999 },
  { key: "electronics", label: "电子学", group: "technical", defaultValue: 1, min: 0, max: 999 },
  { key: "locksmith", label: "开锁", group: "technical", defaultValue: 1, min: 0, max: 999 },
  { key: "machineRepair", label: "机械维修", group: "technical", defaultValue: 10, min: 0, max: 999 },
  { key: "sleightOfHand", label: "妙手", group: "technical", defaultValue: 10, min: 0, max: 999 },
  { key: "demolition", label: "爆破", group: "technical", defaultValue: 1, min: 0, max: 999 },
  { key: "artillery", label: "炮术", group: "technical", defaultValue: 1, min: 0, max: 999 },
  { key: "animalTraining", label: "驯兽", group: "technical", defaultValue: 5, min: 0, max: 999 },
  { key: "lipReading", label: "读唇", group: "technical", defaultValue: 5, min: 0, max: 999 },
  { key: "hypnosis", label: "催眠", group: "technical", defaultValue: 1, min: 0, max: 999 },
];

const COMBAT: NumberSpec[] = [
  { key: "fistfight", label: "斗殴", group: "combat", defaultValue: 25, min: 0, max: 999 },
  { key: "firearms", label: "火器使用", group: "combat", defaultValue: 20, min: 0, max: 999 },
];

const LANGUAGE: NumberSpec[] = [
  { key: "english", label: "英语", group: "language", defaultValue: 1, min: 0, max: 999 },
  { key: "russian", label: "俄语", group: "language", defaultValue: 1, min: 0, max: 999 },
  { key: "motherTongue", label: "母语", group: "language", defaultValue: 50, min: 0, max: 999 },
];

const MYTHOS: NumberSpec[] = [
  { key: "cthulhuMythos", label: "克苏鲁神话", group: "mythos", defaultValue: 0, min: 0, max: 999 },
];

const BACKGROUND: Array<NumberSpec | TextSpec> = [
  { key: "occupation", label: "职业", group: "background", defaultValue: "" },
  { key: "age", label: "年龄", group: "background", defaultValue: 30, min: 0, max: 120 },
  { key: "residence", label: "居住地", group: "background", defaultValue: "" },
  { key: "gender", label: "性别", group: "background", defaultValue: "" },
];

function isNumberSpec(spec: NumberSpec | TextSpec): spec is NumberSpec {
  return "min" in spec;
}

function numberField(spec: NumberSpec): ntp.CharacterField {
  return {
    key: spec.key,
    label: spec.label,
    type: "number",
    group: spec.group,
    default: spec.defaultValue,
    min: spec.min,
    max: spec.max,
  };
}

function textField(spec: TextSpec): ntp.CharacterField {
  return {
    key: spec.key,
    label: spec.label,
    type: "text",
    group: spec.group,
    default: spec.defaultValue,
  };
}

const NUMERIC_SPECS = [
  ...CHARACTERISTICS,
  ...DERIVED,
  ...KNOWLEDGE,
  ...ACTION,
  ...SOCIAL,
  ...TECHNICAL,
  ...COMBAT,
  ...LANGUAGE,
  ...MYTHOS,
];

export const FIELDS: ntp.CharacterField[] = [
  ...NUMERIC_SPECS.map(numberField),
  ...BACKGROUND.map((spec) => (isNumberSpec(spec) ? numberField(spec) : textField(spec))),
];

export function buildDefaults(fields: ntp.CharacterField[] = FIELDS): ntp.CharacterData {
  const data: ntp.CharacterData = {};
  for (const field of fields) {
    data[field.key] = field.default;
  }
  return data;
}

export const DEFAULTS = buildDefaults();

export const DESCRIPTOR: ntp.CharacterDescriptor = {
  ruleId: RULE_ID,
  ruleVersion: RULE_VERSION,
  name: RULE_NAME,
  description: "克苏鲁的呼唤第七版。八项基础属性、衍生属性与完整技能表；保留当前资源和成长技能，只初始化缺失值。",
  groups: GROUPS,
  fields: FIELDS,
  defaults: DEFAULTS,
};
