import { defineCommand, sender } from "../command";

export const cmd = defineCommand({
  name: "cmd",
  description: "说明",
  usage: ".cmd",
  examples: [".cmd"],
  solve(_args, mentioned, cpi) {
    const who = sender(mentioned);
    if (!who) return false;
    cpi.replyMessage(who.name);
    return true;
  },
});
