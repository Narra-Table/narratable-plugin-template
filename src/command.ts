export interface CommandSpec {
  name: string;
  alias?: string[];
  description: string;
  usage: string;
  examples?: string[];
  solve: ntp.Solve;
}

export function defineCommand(spec: CommandSpec): ntp.CommandExecutor {
  return new narratable.CommandExecutor(
    spec.name,
    spec.alias ?? [],
    spec.description,
    spec.examples ?? [],
    spec.usage,
    spec.solve,
  );
}

/** 点名列表的最后一项是发送者自己的面具。 */
export function sender(mentioned: readonly ntp.MentionedMask[]): ntp.MentionedMask | undefined {
  return mentioned[mentioned.length - 1];
}
