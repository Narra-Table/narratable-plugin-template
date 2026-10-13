import { cmd } from "./commands/cmd";

const commands = [cmd];

const rule = narratable.rule.new("规则名", [], "说明");
for (const command of commands) {
  rule.addCmd(command);
}

narratable.rule.register(rule);
