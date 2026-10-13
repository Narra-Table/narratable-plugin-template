declare namespace ntp {
  export type Visibility = "all" | "gm_only" | "custom" | "gm_and_custom";

  export interface Veil {
    visibility: Visibility;
    visibleTo?: string[];
    revealOnSpaceClose?: boolean;
  }

  export interface MentionedMask {
    userId: string;
    maskId: string;
    name: string;
  }

  export interface CommandInfo {
    name: string;
    alias?: string[];
    description?: string;
    usage?: string;
    examples?: string[];
  }

  export interface SpaceInfo {
    spaceId: string;
    roomId: string;
    name: string;
    ruleId?: string;
    ruleName?: string;
  }

  export interface RoleAbility {
    maskId: string;
    cardId?: string;
    ruleId?: string;
    act: Record<string, string>;
    basic: Record<string, string>;
    ability: Record<string, string>;
    skill: Record<string, string>;
    record: Record<string, string>;
    extra: Record<string, string>;
  }

  export interface RollGroup {
    count: number;
    sides: number;
    sign: number;
    rolls: number[];
    subtotal: number;
  }

  export interface RollResult {
    expression: string;
    groups?: RollGroup[];
    modifier?: number;
    total: number;
  }

  export interface ClueContent {
    title: string;
    description: string;
    imageUrl?: string;
    tags: string[];
    isDiscovered: boolean;
  }

  export type PluginMessageType = "chat" | "system" | "clue";

  export interface TextInline {
    type: "text";
    text?: string;
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
    strikethrough?: boolean;
  }

  export interface MentionInline {
    type: "mention";
    target?: {
      kind: "user" | "mask" | "characterCard";
      userId?: string;
      maskId?: string;
      characterCardId?: string;
    };
    displayText?: string;
  }

  export interface FaceInline {
    type: "face";
    faceId?: string;
  }

  export type Inline = TextInline | MentionInline | FaceInline;

  export interface ParagraphBlock {
    type: "paragraph";
    children?: Inline[];
  }

  export interface ImageBlock {
    type: "image";
    resourceId?: string;
    width?: number;
    height?: number;
    alt?: string;
  }

  export interface AudioBlock {
    type: "audio";
    resourceId?: string;
    title?: string;
    duration?: number;
  }

  export interface TableBlock {
    type: "table";
    headers?: string[];
    rows?: string[][];
    caption?: string;
  }

  export interface ReplyBlock {
    type: "reply";
    messageId?: string;
    preview?: {
      senderName: string;
      textSnippet: string;
    };
  }

  export interface DividerBlock {
    type: "divider";
    label?: string;
  }

  export type Block = ParagraphBlock | ImageBlock | AudioBlock | TableBlock | ReplyBlock | DividerBlock;

  export interface MessageDraft {
    type?: PluginMessageType;
    text?: string;
    content?: Block[];
    clue?: ClueContent;
    veil?: Veil;
  }

  export interface CPI {
    replyMessage(text: string): void;
    sendToast(text: string): void;
    sendMessage(draft: MessageDraft): void;
    roll(expression: string): RollResult;
    getRoleAbilityList(maskId: string): RoleAbility;
    setRoleAbilityList(maskId: string, ability: RoleAbility): void;
    getSpaceInfo(): SpaceInfo;
    getSpaceData(key: string): string | undefined;
    setSpaceData(key: string, value: string | null): void;
    setCopywritingKey(key: string | null): void;
    registerCommand(
      name: string,
      info?: Pick<CommandInfo, "description" | "usage" | "alias" | "examples">,
    ): void;
  }

  export type Solve = (args: string[], mentioned: MentionedMask[], cpi: CPI) => boolean;

  export class CommandExecutor {
    constructor(
      name: string,
      alias: string[],
      description: string,
      examples: string[],
      usage: string,
      solve: Solve,
    );
    readonly cmdInfo: CommandInfo;
    readonly name: string;
    readonly alias: string[];
    readonly description: string;
    readonly examples: string[];
    readonly usage: string;
    readonly solve: Solve;
  }

  export interface RuleNamespace {
    name: string;
    alias: string[];
    description: string;
    addCmd(command: CommandExecutor): void;
  }

  export interface Narratable {
    CommandExecutor: typeof CommandExecutor;
    rule: {
      new: (name: string, alias: string[], description: string) => RuleNamespace;
      register(namespace: RuleNamespace): void;
    };
  }
}

declare const narratable: ntp.Narratable;
