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
    /** First rule card on this mask, if one exists. */
    cardId?: string;
  }

  export interface CommandInfo {
    name: string;
    alias?: string[];
    description?: string;
    usage?: string;
    examples?: string[];
  }

  export interface SpaceInfo {
    userId: string;
    role: "gm" | "agm" | "pl" | "ob";
    isOwner: boolean;
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
    character: {
      read(cardId: string): CharacterData;
      write(cardId: string, data: CharacterData): CharacterData;
    };
    data: {
      get(key: string, options?: { room?: boolean }): unknown;
      set(key: string, value: unknown, options?: { room?: boolean; visibility?: "all" | "gm_only" }): void;
      list(prefix: string, options?: { room?: boolean }): string[];
      delete(key: string, options?: { room?: boolean }): void;
    };
    openWindow(windowId: string, params?: unknown): void;
    /** 结团报告可读数据：成员、角色卡、骰点账本、线索。非 GM 只看到自己能看见的部分。 */
    reportData(): {
      members: { userId: string; role: string; displayName: string }[];
      cards: { id: string; maskId: string; name: string; data: unknown }[];
      rolls: { messageId: string; roomId: string; raw: string; visibility: string; result: string }[];
      clues: { messageId: string; roomId: string; title: string; tags: string[]; visibility: string }[];
    };
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

  // ------------------------------------------------------------
  //  配置：插件在脚本顶层登记，宿主收集后供设置页和脚本读取
  // ------------------------------------------------------------

  export type ConfigScope = "global" | "user" | "workspace";

  export interface ConfigSource {
    scope: ConfigScope;
    key: string;
  }

  export interface ConfigOption {
    id: string;
    name?: string;
    /** Selector 选项读取的目标槽；普通 option 类型可省略。 */
    source?: ConfigSource;
  }

  export interface ConfigSelectorOption extends ConfigOption {
    source: ConfigSource;
  }

  export interface ConfigDeclOptions {
    scope?: ConfigScope;
    name?: string;
    group?: string;
    options?: ConfigOption[];
  }

  export type ConfigValueType = "string" | "int" | "float" | "bool" | "template" | "option";

  export interface ConfigSelectorSpec {
    /** Selector 解析出的值类型，也可以是另一个 selector。 */
    valueType: ConfigValueType | "selector";
    scope?: ConfigScope;
    name?: string;
    group?: string;
    /** 默认选项 id；缺省时用第一个选项。 */
    default?: string;
    options: ConfigSelectorOption[];
  }

  export interface ConfigDeclaration {
    key: string;
    name: string;
    group?: string;
    type: ConfigValueType | "selector";
    scope: ConfigScope;
    default?: unknown;
    valueType?: ConfigValueType | "selector";
    options?: ConfigOption[];
    pluginId?: string;
    namespace?: string;
  }

  export interface ConfigDescription {
    declaration: ConfigDeclaration;
    option?: string;
    value?: unknown;
    source?: ConfigSource;
    /** 目标缺失或越界时的回退说明。 */
    anomaly?: string;
  }

  export interface ConfigAPI {
    string(key: string, defaultValue?: string, name?: string, group?: string, options?: ConfigDeclOptions): void;
    int(key: string, defaultValue?: number, name?: string, group?: string, options?: ConfigDeclOptions): void;
    float(key: string, defaultValue?: number, name?: string, group?: string, options?: ConfigDeclOptions): void;
    bool(key: string, defaultValue?: boolean, name?: string, group?: string, options?: ConfigDeclOptions): void;
    template(key: string, defaultValue?: string, name?: string, group?: string, options?: ConfigDeclOptions): void;
    option(key: string, defaultValue?: string, name?: string, group?: string, options?: ConfigDeclOptions): void;
    selector(key: string, spec: ConfigSelectorSpec): void;
    /** 解析后的值。 */
    get<T = unknown>(key: string): T;
    /** Selector 当前选项 id。 */
    select(key: string): string;
    describe(key: string): ConfigDescription;
    /** 读取指定作用域的原始槽，不做 Selector 解析。 */
    in(scope: ConfigScope): { raw(key: string): unknown };
  }

  // ------------------------------------------------------------
  //  角色：规则声明插件实现 describe/read/write/validate
  // ------------------------------------------------------------

  export type CharacterFieldType = "text" | "number" | "boolean" | "select" | "list" | "object";

  export interface CharacterOption {
    value: string;
    label: string;
  }

  export interface CharacterField {
    key: string;
    label: string;
    type: CharacterFieldType;
    group?: string;
    description?: string;
    default?: unknown;
    required?: boolean;
    options?: CharacterOption[];
    min?: number;
    max?: number;
  }

  export interface CharacterGroup {
    key: string;
    label: string;
  }

  export interface CharacterDescriptor {
    ruleId: string;
    ruleVersion?: string;
    name: string;
    description?: string;
    groups?: CharacterGroup[];
    fields: CharacterField[];
    /** Payload a new card starts with. */
    defaults?: CharacterData;
  }

  export type CharacterData = Record<string, unknown>;

  export interface CharacterValidationError {
    field?: string;
    code?: string;
    message: string;
  }

  export interface CharacterDefinition {
    describe(): CharacterDescriptor;
    /** stored is the raw payload the host saved; rules may fill defaults and derive. */
    read?(stored: CharacterData): CharacterData;
    write?(data: CharacterData): CharacterData;
    validate?(data: CharacterData): CharacterValidationError[];
  }

  export interface CharacterAPI {
    define(definition: CharacterDefinition): void;
  }

  export interface Narratable {
    CommandExecutor: typeof CommandExecutor;
    config: ConfigAPI;
    character: CharacterAPI;
    /** Register a function other plugins call through use(). */
    export(name: string, fn: (args: unknown[], cpi: CPI) => unknown): void;
    /**
     * Call another active plugin's exports in this same invocation.
     * The stack is at most 8 frames and shares the command timeout.
     */
    use(pluginName: string): Record<string, (...args: unknown[]) => unknown>;
    rule: {
      new: (name: string, alias: string[], description: string) => RuleNamespace;
      register(namespace: RuleNamespace): void;
    };
  }
  /** The host injects ntpWindow into each sandboxed iframe before plugin code. */
  export type WindowMethod =
    | "hello" | "subscribe" | "resource.url" | "invoke"
    | "config.get" | "config.select" | "config.describe" | "config.raw" | "config.set"
    | "character.describe" | "character.list" | "character.read" | "character.write"
    | "data.get" | "data.list"
    | "window.open" | "window.close" | "window.closeDecision"
    | "window.getState" | "window.setState" | "window.setTitle" | "window.setIcon"
    | "window.setAttention" | "window.postMessage" | "window.broadcast" | "keyboard";

  export type WindowEvent =
    | "visibility" | "beforeClose" | "theme" | "window.message"
    | "config.updated" | "appdata.updated" | "character.updated" | "message.created";

  export interface WindowInit {
    spaceId: string;
    roomId?: string;
    instanceId: string;
    user: { userId: string; displayName: string; role: "gm" | "agm" | "pl" | "ob"; isOwner: boolean };
    rule?: { ruleId?: string; ruleName?: string; version?: string; pluginId?: string };
    archived: boolean;
    params?: unknown;
    /** Per-instance view state. Null on first open; separate from launch params. */
    state: unknown | null;
    theme: Record<string, string>;
  }

  export type WindowBridgeMessage =
    | { ntp: 1; kind: "request"; id: string; method: WindowMethod; params?: unknown }
    | { ntp: 1; kind: "response"; id: string; ok: true; result: unknown }
    | { ntp: 1; kind: "response"; id: string; ok: false; error: { code: string; message: string } }
    | { ntp: 1; kind: "event"; event: WindowEvent; payload: unknown };

  export interface WindowBridge {
    ready: Promise<WindowInit>;
    /** JSON envelopes <=32KB, at most 32 outstanding requests. */
    request<T = unknown>(method: WindowMethod, params?: unknown): Promise<T>;
    on(event: WindowEvent, callback: (payload: unknown) => void): () => void;
  }

}

declare const ntpWindow: ntp.WindowBridge;
declare const narratable: ntp.Narratable;
