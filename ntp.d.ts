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
    describe(cardId?: string): CharacterDescriptor;
    /** stored is the raw payload the host saved; rules may fill defaults and derive. */
    read?(cardId: string, stored?: CharacterData): CharacterData;
    write?(cardId: string, data: CharacterData, patch?: boolean): CharacterData;
    validate?(cardId: string, data: CharacterData): CharacterValidationError[];
  }

  export interface CharacterAPI {
    define(definition: CharacterDefinition): void;
    describe(cardId?: string): CharacterDescriptor;
    read(cardId: string): CharacterData;
    write(cardId: string, data: CharacterData, patch?: boolean): CharacterData;
    validate(cardId: string, data: CharacterData): CharacterValidationError[];
  }

  export interface Narratable {
    CommandExecutor: typeof CommandExecutor;
    config: ConfigAPI;
    character: CharacterAPI;
    rule: {
      new: (name: string, alias: string[], description: string) => RuleNamespace;
      register(namespace: RuleNamespace): void;
    };
  }
}

declare const narratable: ntp.Narratable;
