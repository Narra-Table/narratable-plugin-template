/** Rule-level options registered when the plugin is loaded. */
export function registerConfig(): void {
  narratable.config.int("defaultDice", 100, "默认骰面", "规则", { scope: "workspace" });
  narratable.config.bool("autoDerive", true, "自动计算衍生属性", "规则", { scope: "workspace" });
}
