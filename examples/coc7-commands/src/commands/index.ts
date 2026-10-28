import { registerCheckCommands } from "./check";
import { registerGrowthCommand } from "./growth";
import { registerHiddenCommand } from "./hidden";
import { registerHouseCommand } from "./house";
import { registerInitiativeCommand } from "./initiative";
import { registerMadnessCommands } from "./madness";
import { registerSanityCommands } from "./sanity";
import { registerStatsCommand } from "./stats";

export function registerCommands(): void {
  const rule = narratable.rule.new("coc7", ["coc", "coc7th"], "COC7 版规则指令集");
  registerCheckCommands(rule);
  registerSanityCommands(rule);
  registerGrowthCommand(rule);
  registerStatsCommand(rule);
  registerMadnessCommands(rule);
  registerInitiativeCommand(rule);
  registerHouseCommand(rule);
  registerHiddenCommand(rule);
  narratable.rule.register(rule);
}
