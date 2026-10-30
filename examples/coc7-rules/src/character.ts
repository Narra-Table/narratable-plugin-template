import { DEFAULTS, DESCRIPTOR } from "./descriptor";

type Sheet = Record<string, number | string>;

function asSheet(data: ntp.CharacterData | undefined): Sheet {
  const sheet: Sheet = {};
  if (!data) return sheet;
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === "number" || typeof value === "string") {
      sheet[key] = value;
    }
  }
  return sheet;
}

function numberOr(sheet: Sheet, key: string, fallback: number): number {
  let value = sheet[key];
  if (typeof value === "string" && value.trim() !== "") {
    value = Number(value);
  }
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return fallback;
  }
  return value;
}

function merge(base: Sheet, patch: Sheet): Sheet {
  return { ...base, ...patch };
}

function autoDerive(): boolean {
  const enabled = narratable.config.get<boolean | undefined>("autoDerive");
  return enabled === undefined ? true : Boolean(enabled);
}

/** Recalculate derived characteristics from the eight base attributes. */
export function derive(data: ntp.CharacterData | undefined): ntp.CharacterData {
  const supplied = asSheet(data);
  const sheet = merge(asSheet(DEFAULTS), supplied);
  const strength = numberOr(sheet, "strength", 0);
  const dexterity = numberOr(sheet, "dexterity", 0);
  const willpower = numberOr(sheet, "willpower", 0);
  const constitution = numberOr(sheet, "constitution", 0);
  const education = numberOr(sheet, "education", 0);
  const size = numberOr(sheet, "size", 0);

  // Current resources and trained skills survive reads and unrelated writes.
  // Only a new/missing field receives its initial value.
  sheet.healthPoints = numberOr(supplied, "healthPoints", Math.floor((constitution + size) / 10));
  sheet.magicPoints = numberOr(supplied, "magicPoints", Math.floor(willpower / 5));
  sheet.sanity = numberOr(supplied, "sanity", Math.min(99, willpower));
  sheet.luck = numberOr(sheet, "luck", 50);
  sheet.mov = dexterity < size && strength < size ? 7 : strength >= size && dexterity >= size ? 9 : 8;

  const total = strength + size;
  sheet.build = total < 65 ? -2 : total < 85 ? -1 : total < 125 ? 0 : total < 165 ? 1 : total < 205 ? 2 : 3;
  sheet.damageBonus = total < 65 ? "-2" : total < 85 ? "-1" : total < 125 ? "0" : total < 165 ? "+1d4" : total < 205 ? "+1d6" : "+2d6";
  sheet.dodge = numberOr(supplied, "dodge", Math.floor(dexterity / 2));
  sheet.motherTongue = numberOr(supplied, "motherTongue", education);
  return sheet;
}

function numeric(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

/** Register the character descriptor and its read/write/validate hooks. */
export function defineCharacter(): void {
  narratable.character.define({
    describe() {
      return DESCRIPTOR;
    },
    read(stored) {
      return autoDerive() ? derive(stored) : merge(asSheet(DEFAULTS), asSheet(stored));
    },
    write(data) {
      return autoDerive() ? derive(data) : merge(asSheet(DEFAULTS), asSheet(data));
    },
    validate(data) {
      const sheet = asSheet(data);
      const errors: ntp.CharacterValidationError[] = [];
      const labels = Object.fromEntries(DESCRIPTOR.fields.map((field) => [field.key, field.label]));

      const characteristics = [
        "strength", "dexterity", "willpower", "constitution", "appearance", "education", "size", "intelligence",
      ];
      for (const key of characteristics) {
        const value = numeric(sheet[key]);
        if (value === undefined) {
          errors.push({ field: key, code: "not_a_number", message: `${labels[key]}必须是数字` });
        } else if (value < 1 || value > 99) {
          errors.push({ field: key, code: "out_of_range", message: `${labels[key]}必须在 1 到 99 之间` });
        }
      }

      const derived = ["healthPoints", "magicPoints", "sanity", "luck", "mov"];
      for (const key of derived) {
        const value = numeric(sheet[key]);
        if (value !== undefined && value < 0) {
          errors.push({ field: key, code: "out_of_range", message: `${labels[key]}不能为负数` });
        }
      }

      const build = numeric(sheet.build);
      if (build === undefined || build < -2) {
        errors.push({ field: "build", code: "out_of_range", message: "体格不能小于 -2" });
      }

      for (const field of DESCRIPTOR.fields) {
        if (field.group === "background" || field.group === "derived" || field.group === "characteristics") {
          continue;
        }
        const value = numeric(sheet[field.key]);
        if (sheet[field.key] === undefined || sheet[field.key] === "") {
          continue;
        }
        if (value === undefined) {
          errors.push({ field: field.key, code: "not_a_number", message: `${field.label}必须是数字` });
        } else if (value < 0 || value > 999) {
          errors.push({ field: field.key, code: "out_of_range", message: `${field.label}必须在 0 到 999 之间` });
        }
      }
      return errors;
    },
  });
}
