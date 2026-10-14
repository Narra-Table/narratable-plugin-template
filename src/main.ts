import { cmd } from "./commands/cmd";
import { icon } from "./commands/icon";

const commands = [cmd, icon];

const rule = narratable.rule.new("规则名", [], "说明");
for (const command of commands) {
  rule.addCmd(command);
}

narratable.rule.register(rule);
