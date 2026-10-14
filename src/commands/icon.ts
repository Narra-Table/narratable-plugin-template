import { image } from "../assets";
import { defineCommand, sender } from "../command";

export const icon = defineCommand({
  name: "icon",
  description: "发送插件自带的图标",
  usage: ".icon",
  examples: [".icon"],
  solve(_args, mentioned, cpi) {
    const who = sender(mentioned);
    if (!who) return false;
    cpi.sendMessage({
      content: [
        { type: "paragraph", children: [{ type: "text", text: who.name }] },
        image("icon.svg", { alt: "图标" }),
      ],
    });
    return true;
  },
});
