// 由 build.mjs 根据 plugin.json 与 public/ 生成。

export type AssetPath = "grid.svg";
export type ImageAsset = "grid.svg";
export type AudioAsset = never;

const pluginName = "map-grid";

/** 插件包内资源。宿主把它当作消息里的 resourceId。 */
export function asset(file: AssetPath): string {
  return `plugin:${pluginName}/assets/${file}`;
}

export function image(
  file: ImageAsset,
  options?: { alt?: string; width?: number; height?: number },
): ntp.ImageBlock {
  const block: ntp.ImageBlock = { type: "image", resourceId: asset(file) };
  if (options?.alt !== undefined) block.alt = options.alt;
  if (options?.width !== undefined) block.width = options.width;
  if (options?.height !== undefined) block.height = options.height;
  return block;
}

export function audio(
  file: AudioAsset,
  options?: { title?: string; duration?: number },
): ntp.AudioBlock {
  const block: ntp.AudioBlock = { type: "audio", resourceId: asset(file) };
  if (options?.title !== undefined) block.title = options.title;
  if (options?.duration !== undefined) block.duration = options.duration;
  return block;
}
