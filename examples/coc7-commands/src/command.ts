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
