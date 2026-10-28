import { sender } from "./card";

/** Reply publicly, or send a veil message only the sender (and GMs) can see. */
export function reply(
  cpi: ntp.CPI,
  mentioned: readonly ntp.MentionedMask[],
  text: string,
  hidden: boolean,
): void {
  if (!hidden) {
    cpi.replyMessage(text);
    return;
  }
  const who = sender(mentioned);
  cpi.sendMessage({
    text,
    veil: {
      visibility: "gm_and_custom",
      visibleTo: who?.userId ? [who.userId] : [],
    },
  });
}
