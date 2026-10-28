import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { lstat, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { deflateRawSync } from "node:zlib";
import * as esbuild from "esbuild";

const buildDir = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const rootFlag = args.indexOf("--root");
if (rootFlag >= 0 && !args[rootFlag + 1]) {
  throw new Error("--root 需要一个目录");
}
const root = rootFlag >= 0 ? path.resolve(buildDir, args[rootFlag + 1]) : buildDir;
const pkg = JSON.parse(readFileSync(path.join(root, "package.json"), "utf8"));
const config = pkg.narratablePlugin ?? {};

const allowedAssetExt = new Set(["png", "jpg", "jpeg", "gif", "webp", "svg", "json", "ogg", "mp3", "wav"]);
const imageExt = new Set(["png", "jpg", "jpeg", "gif", "webp", "svg"]);
const audioExt = new Set(["ogg", "mp3", "wav"]);
const maxAssetBytes = 8 * 1024 * 1024;
const maxPackageBytes = 32 * 1024 * 1024;
const maxAssetCount = 200;

const allowedMetaKeys = new Set([
  "name",
  "displayName",
  "version",
  "description",
  "author",
  "rule",
  "pluginRule",
  "characterDataType",
  "depends",
  "windows",
]);

function flag(name) {
  return args.includes(`--${name}`);
}

function option(name) {
  const index = args.indexOf(`--${name}`);
  if (index === -1) return undefined;
  const value = args[index + 1];
  if (value === undefined || value.startsWith("--")) {
    throw new Error(`--${name} 需要一个值`);
  }
  return value;
}

function assertInsideProject(rel, label) {
  if (path.isAbsolute(rel)) {
    throw new Error(`${label} 必须是项目内的相对路径`);
  }
  const resolved = path.resolve(root, rel);
  if (resolved !== root && !resolved.startsWith(root + path.sep)) {
    throw new Error(`${label} 必须位于项目目录内`);
  }
  return resolved;
}

function chars(value) {
  return Array.from(value).length;
}

function readPluginMeta() {
  const file = path.join(root, "plugin.json");
  let raw;
  try {
    raw = readFileSync(file, "utf8");
  } catch (error) {
    if (error && error.code === "ENOENT") {
      throw new Error("缺少 plugin.json");
    }
    throw error;
  }
  if (raw.charCodeAt(0) === 0xfeff) raw = raw.slice(1);
  let meta;
  try {
    meta = JSON.parse(raw);
  } catch {
    throw new Error("plugin.json 不是合法的 JSON");
  }
  if (meta === null || typeof meta !== "object" || Array.isArray(meta)) {
    throw new Error("plugin.json 必须是对象");
  }
  for (const key of Object.keys(meta)) {
    if (!allowedMetaKeys.has(key)) {
      throw new Error(`plugin.json 含有未知字段 ${key}`);
    }
  }

  const name = requiredString(meta, "name");
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name) || chars(name) > 64) {
    throw new Error("name 必须是小写字母、数字和连字符，且不超过 64 个字符");
  }
  const displayName = requiredString(meta, "displayName");
  if (chars(displayName) > 128) {
    throw new Error("displayName 不能超过 128 个字符");
  }
  const version = requiredString(meta, "version");
  if (!/^[0-9]+\.[0-9]+\.[0-9]+(?:-[0-9A-Za-z.-]+)?$/.test(version) || version.length > 32) {
    throw new Error("version 必须是主版本.次版本.修订号，可选连字符后缀，且不超过 32 个字符");
  }

  const description = optionalString(meta, "description");
  if (chars(description) > 2000) {
    throw new Error("description 不能超过 2000 个字符");
  }
  const author = optionalString(meta, "author");
  if (chars(author) > 128) {
    throw new Error("author 不能超过 128 个字符");
  }

  let characterDataType;
  if (meta.characterDataType !== undefined) {
    if (typeof meta.characterDataType !== "string" || meta.characterDataType.trim() === "") {
      throw new Error("characterDataType 必须是非空字符串");
    }
    characterDataType = meta.characterDataType.trim();
    if (!/^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$/.test(characterDataType)) {
      throw new Error("characterDataType 只能包含字母、数字、下划线和连字符，且不超过 64 个字符");
    }
  }

  if (meta.configSchema !== undefined) {
    throw new Error("configSchema 已废弃；配置项改在脚本顶层用 narratable.config.* 登记");
  }

  const rule = readRule(meta.rule);
  const pluginRule = readPluginRule(meta.pluginRule);
  if (rule && pluginRule) {
    throw new Error("rule 与 pluginRule 不能同时声明");
  }
  const depends = readDepends(meta.depends);
  if (pluginRule) {
    const segment = pluginRule.rule.split("/").pop();
    const covered = depends.some((item) => item.id === pluginRule.rule || item.id === segment);
    if (!covered) {
      throw new Error(`pluginRule 要求在 depends 中声明 ${pluginRule.rule}`);
    }
  }
  const windows = readWindows(meta.windows);

  return { name, displayName, version, description, author, characterDataType, rule, pluginRule, depends, windows };
}

function readRule(value) {
  if (value === undefined) return undefined;
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("rule 必须是对象");
  }
  for (const key of Object.keys(value)) {
    if (key !== "id" && key !== "name") {
      throw new Error(`rule 含有未知字段 ${key}`);
    }
  }
  if (typeof value.id !== "string" || !isRuleID(value.id)) {
    throw new Error("rule.id 必须是 命名空间/规则名");
  }
  const name = requiredString(value, "name");
  if (chars(name) > 128) {
    throw new Error("rule.name 不能超过 128 个字符");
  }
  return { id: value.id, name };
}

function readPluginRule(value) {
  if (value === undefined) return undefined;
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("pluginRule 必须是对象");
  }
  for (const key of Object.keys(value)) {
    if (key !== "rule" && key !== "constraint" && key !== "namespace") {
      throw new Error(`pluginRule 含有未知字段 ${key}`);
    }
  }
  if (typeof value.rule !== "string" || !isRuleID(value.rule)) {
    throw new Error("pluginRule.rule 必须是 命名空间/规则名");
  }
  if (typeof value.constraint !== "string" || value.constraint.trim() === "") {
    throw new Error("pluginRule.constraint 必须是非空字符串");
  }
  if (value.constraint.includes("||")) {
    throw new Error("pluginRule.constraint 不支持 ||");
  }
  let namespace = value.rule.split("/").pop();
  if (value.namespace !== undefined) {
    if (typeof value.namespace !== "string" || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value.namespace)) {
      throw new Error("pluginRule.namespace 必须是小写字母、数字和连字符");
    }
    namespace = value.namespace;
  }
  return { rule: value.rule, constraint: value.constraint.trim(), namespace };
}

function isRuleID(value) {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*\/[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
}

function readDepends(value) {
  if (value === undefined) return [];
  if (!Array.isArray(value)) {
    throw new Error("depends 必须是对象数组");
  }
  return value.map((item, index) => {
    if (typeof item === "string") {
      // Legacy string form. The emitted manifest always uses objects.
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(item)) {
        throw new Error(`depends[${index}] 必须是插件名`);
      }
      return { id: item };
    }
    if (item === null || typeof item !== "object" || Array.isArray(item)) {
      throw new Error(`depends[${index}] 必须是对象`);
    }
    for (const key of Object.keys(item)) {
      if (key !== "id" && key !== "constraint") {
        throw new Error(`depends[${index}] 含有未知字段 ${key}`);
      }
    }
    if (typeof item.id !== "string" || (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(item.id) && !isRuleID(item.id))) {
      throw new Error(`depends[${index}].id 必须是插件名或规则 ID`);
    }
    const dep = { id: item.id };
    if (item.constraint !== undefined) {
      if (typeof item.constraint !== "string" || item.constraint.trim() === "" || item.constraint.includes("||")) {
        throw new Error(`depends[${index}].constraint 无效`);
      }
      dep.constraint = item.constraint.trim();
    }
    return dep;
  });
}

const windowKeys = new Set([
  "id", "title", "icon", "visibility", "defaultWidth", "defaultDisplay", "chrome",
  "floating", "modal", "singleton", "embeddable", "launcher", "resizable", "dismissible",
]);

function readWindows(value) {
  if (value === undefined) return [];
  if (!Array.isArray(value)) {
    throw new Error("windows 必须是数组");
  }
  if (value.length > 20) {
    throw new Error("windows 最多 20 个");
  }
  const seen = new Set();
  return value.map((item, index) => {
    if (item === null || typeof item !== "object" || Array.isArray(item)) {
      throw new Error(`windows[${index}] 必须是对象`);
    }
    for (const key of Object.keys(item)) {
      if (!windowKeys.has(key)) {
        throw new Error(`windows[${index}] 含有未知字段 ${key}`);
      }
    }
    const id = item.id;
    const title = item.title;
    if (typeof id !== "string" || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id) || chars(id) > 64) {
      throw new Error(`windows[${index}].id 必须是小写字母、数字和连字符`);
    }
    if (seen.has(id)) {
      throw new Error(`窗口 id ${id} 重复`);
    }
    seen.add(id);
    if (typeof title !== "string" || title.trim() === "" || chars(title.trim()) > 128) {
      throw new Error(`windows[${index}].title 必须是不超过 128 个字符的非空字符串`);
    }
    const window = { id, title: title.trim() };
    if (item.icon !== undefined) {
      if (typeof item.icon !== "string" || !item.icon.startsWith("assets/") || !imageExt.has(path.posix.extname(item.icon).slice(1).toLowerCase())) {
        throw new Error(`windows[${index}].icon 必须是 assets/ 下允许的图片`);
      }
      window.icon = item.icon;
    }
    if (item.visibility !== undefined) {
      if (item.visibility !== "all" && item.visibility !== "gm_only") {
        throw new Error(`windows[${index}].visibility 只能是 all 或 gm_only`);
      }
      window.visibility = item.visibility;
    }
    if (item.defaultWidth !== undefined) {
      if (typeof item.defaultWidth !== "number" || item.defaultWidth <= 0 || item.defaultWidth > 1) {
        throw new Error(`windows[${index}].defaultWidth 必须在 0 到 1 之间`);
      }
      window.defaultWidth = item.defaultWidth;
    }
    if (item.defaultDisplay !== undefined) {
      if (!["normal", "maximized", "minimized", "floating"].includes(item.defaultDisplay)) {
        throw new Error(`windows[${index}].defaultDisplay 无效`);
      }
      window.defaultDisplay = item.defaultDisplay;
    }
    if (item.chrome !== undefined) {
      if (item.chrome !== "full" && item.chrome !== "titlebar-hidden") {
        throw new Error(`windows[${index}].chrome 只能是 full 或 titlebar-hidden`);
      }
      window.chrome = item.chrome;
    }
    for (const key of ["floating", "modal", "singleton", "embeddable", "launcher", "resizable", "dismissible"]) {
      if (item[key] !== undefined) {
        if (typeof item[key] !== "boolean") {
          throw new Error(`windows[${index}].${key} 必须是布尔值`);
        }
        window[key] = item[key];
      }
    }
    return window;
  });
}

function requiredString(meta, key) {
  const value = meta[key];
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${key} 必须是非空字符串`);
  }
  return value.trim();
}

function optionalString(meta, key) {
  if (meta[key] === undefined) return "";
  if (typeof meta[key] !== "string") {
    throw new Error(`${key} 必须是字符串`);
  }
  return meta[key].trim();
}

async function collectAssets() {
  const dir = path.join(root, "public");
  let stats;
  try {
    stats = await lstat(dir);
  } catch (error) {
    if (error && error.code === "ENOENT") return [];
    throw error;
  }
  if (stats.isSymbolicLink() || !stats.isDirectory()) {
    throw new Error("public 必须是目录");
  }

  const files = [];
  let total = 0;

  async function walk(absDir, relDir) {
    const names = (await readdir(absDir)).sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
    for (const name of names) {
      if (name.startsWith(".")) continue;
      const abs = path.join(absDir, name);
      const rel = relDir ? `${relDir}/${name}` : name;
      const item = await lstat(abs);
      if (item.isSymbolicLink()) {
        throw new Error(`public/${rel} 不能是符号链接`);
      }
      if (item.isDirectory()) {
        await walk(abs, rel);
        continue;
      }
      if (!item.isFile()) {
        throw new Error(`public/${rel} 不是普通文件`);
      }
      const ext = path.extname(name).slice(1).toLowerCase();
      if (!allowedAssetExt.has(ext)) {
        throw new Error(`public/${rel} 的类型不在允许范围内`);
      }
      if (rel.length > 200) {
        throw new Error(`public/${rel} 路径过长`);
      }
      if (item.size > maxAssetBytes) {
        throw new Error(`public/${rel} 超过 8MB`);
      }
      total += item.size;
      if (total > maxPackageBytes) {
        throw new Error("public 中的资源合计超过 32MB");
      }
      files.push({ path: `assets/${rel}`, abs, bytes: item.size });
      if (files.length > maxAssetCount) {
        throw new Error("public 中的文件超过 200 个");
      }
    }
  }

  await walk(dir, "");
  return files;
}

function typeUnion(paths) {
  if (paths.length === 0) return "never";
  return paths.map((item) => JSON.stringify(item)).join(" | ");
}

function writeAssetModule(meta, assets) {
  const all = [];
  const images = [];
  const audios = [];
  for (const asset of assets) {
    const rel = asset.path.startsWith("assets/") ? asset.path.slice("assets/".length) : asset.path;
    all.push(rel);
    const ext = path.posix.extname(rel).slice(1).toLowerCase();
    if (imageExt.has(ext)) images.push(rel);
    else if (audioExt.has(ext)) audios.push(rel);
  }
  const text = `// 由 build.mjs 根据 plugin.json 与 public/ 生成。

export type AssetPath = ${typeUnion(all)};
export type ImageAsset = ${typeUnion(images)};
export type AudioAsset = ${typeUnion(audios)};

const pluginName = ${JSON.stringify(meta.name)};

/** 插件包内资源。宿主把它当作消息里的 resourceId。 */
export function asset(file: AssetPath): string {
  return \`plugin:\${pluginName}/assets/\${file}\`;
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
`;
  const dest = path.join(root, "src", "assets.ts");
  writeFileSync(dest, text);
  return dest;
}

function sha256(data) {
  return createHash("sha256").update(data).digest("hex");
}

function fileRecord(filePath, data) {
  return { path: filePath, bytes: data.length, sha256: sha256(data) };
}

function buildManifest(meta, entry, files) {
  const manifest = {
    format: 1,
    name: meta.name,
    displayName: meta.displayName,
    version: meta.version,
    description: meta.description,
    author: meta.author,
  };
  if (meta.characterDataType) manifest.characterDataType = meta.characterDataType;
  if (meta.rule) manifest.rule = meta.rule;
  if (meta.pluginRule) manifest.pluginRule = meta.pluginRule;
  if (meta.depends.length > 0) manifest.depends = meta.depends;
  if (meta.windows.length > 0) {
    manifest.windows = meta.windows.map((item) => {
      const window = { id: item.id, title: item.title, entry: `windows/${item.id}.html` };
      for (const key of ["icon", "visibility", "defaultWidth", "defaultDisplay", "chrome", "floating", "modal", "singleton", "embeddable", "launcher", "resizable", "dismissible"]) {
        if (item[key] !== undefined) window[key] = item[key];
      }
      return window;
    });
  }
  if (entry) manifest.entry = entry;
  manifest.files = files;
  return `${JSON.stringify(manifest, null, 2)}\n`;
}

function escapeHtml(value) {
  return value.replace(/[&<>"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[ch]);
}

async function fileKind(abs) {
  if (!existsSync(abs)) return "missing";
  const info = await lstat(abs);
  if (info.isSymbolicLink()) return "link";
  if (info.isFile()) return "file";
  return "other";
}

async function renderWindow(spec, minify) {
  const dir = path.join(root, "src", "windows", spec.id);
  const dirKind = await fileKind(dir);
  if (dirKind === "missing") {
    throw new Error(`缺少 src/windows/${spec.id}/index.tsx 或 index.html`);
  }
  if (dirKind !== "file" && dirKind !== "other") {
    throw new Error(`src/windows/${spec.id} 不能是符号链接`);
  }
  const dirInfo = await lstat(dir);
  if (!dirInfo.isDirectory()) {
    throw new Error(`src/windows/${spec.id} 必须是目录`);
  }
  const tsx = path.join(dir, "index.tsx");
  const html = path.join(dir, "index.html");
  const tsxKind = await fileKind(tsx);
  const htmlKind = await fileKind(html);
  if (tsxKind === "link" || htmlKind === "link") {
    throw new Error(`src/windows/${spec.id} 的入口不能是符号链接`);
  }
  const hasTsx = tsxKind === "file";
  const hasHtml = htmlKind === "file";
  if (hasTsx && hasHtml) {
    throw new Error(`src/windows/${spec.id} 不能同时有 index.tsx 和 index.html`);
  }
  if (!hasTsx && !hasHtml) {
    throw new Error(`缺少 src/windows/${spec.id}/index.tsx 或 index.html`);
  }
  if (hasHtml) {
    const text = readFileSync(html, "utf8");
    if (/<script\b[^>]*\bsrc\s*=/i.test(text) || /<link\b[^>]*\bhref\s*=/i.test(text)) {
      throw new Error(`src/windows/${spec.id}/index.html 必须把脚本和样式写在文件内`);
    }
    return text.endsWith("\n") ? text : `${text}\n`;
  }
  const result = await esbuild.build({
    absWorkingDir: root,
    entryPoints: [tsx],
    outfile: path.join(root, "dist", "windows", `${spec.id}.js`),
    bundle: true,
    format: "iife",
    platform: "browser",
    target: "es2020",
    minify,
    write: false,
    jsx: "automatic",
    legalComments: minify ? "none" : "inline",
    charset: "utf8",
  });
  const js = result.outputFiles.find((file) => file.path.endsWith(".js"));
  const css = result.outputFiles.filter((file) => file.path.endsWith(".css")).map((file) => file.text).join("\n");
  if (!js) {
    throw new Error(`src/windows/${spec.id}/index.tsx 没有产出脚本`);
  }
  const script = js.text.replace(/<\/script/gi, "<\\/script");
  const style = css ? `<style>${css}</style>\n` : "";
  return `<!DOCTYPE html>
<html lang="zh">
<head>
<meta charset="utf-8">
<title>${escapeHtml(spec.title)}</title>
${style}</head>
<body>
<div id="root"></div>
<script>${script}</script>
</body>
</html>
`;
}

const crcTable = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(data) {
  let c = 0xffffffff;
  for (let i = 0; i < data.length; i += 1) {
    c = crcTable[(c ^ data[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function zipPackage(entries) {
  if (entries.length > 0xffff) {
    throw new Error("包内文件过多");
  }
  const locals = [];
  const centrals = [];
  let offset = 0;
  for (const entry of entries) {
    const name = Buffer.from(entry.name, "utf8");
    const crc = crc32(entry.data);
    const deflated = deflateRawSync(entry.data, { level: 9 });
    const method = deflated.length < entry.data.length ? 8 : 0;
    const payload = method === 8 ? deflated : entry.data;
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0x0800, 6);
    local.writeUInt16LE(method, 8);
    local.writeUInt16LE(0, 10);
    local.writeUInt16LE(0x21, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(payload.length, 18);
    local.writeUInt32LE(entry.data.length, 22);
    local.writeUInt16LE(name.length, 26);
    local.writeUInt16LE(0, 28);
    locals.push(local, name, payload);

    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(0x0314, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0x0800, 8);
    central.writeUInt16LE(method, 10);
    central.writeUInt16LE(0, 12);
    central.writeUInt16LE(0x21, 14);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(payload.length, 20);
    central.writeUInt32LE(entry.data.length, 24);
    central.writeUInt16LE(name.length, 28);
    central.writeUInt16LE(0, 30);
    central.writeUInt16LE(0, 32);
    central.writeUInt16LE(0, 34);
    central.writeUInt16LE(0, 36);
    central.writeUInt32LE(0x81a40000, 38);
    central.writeUInt32LE(offset, 42);
    centrals.push(central, name);
    offset += local.length + name.length + payload.length;
  }

  const centralDir = Buffer.concat(centrals);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(entries.length, 8);
  eocd.writeUInt16LE(entries.length, 10);
  eocd.writeUInt32LE(centralDir.length, 12);
  eocd.writeUInt32LE(offset, 16);
  return Buffer.concat([...locals, centralDir, eocd]);
}

const entryFlag = option("entry");
const entry = entryFlag ?? config.entry ?? "src/main.ts";
const outfile = option("outfile") ?? config.outfile ?? "dist/plugin.js";
const releasing = flag("release");

if (flag("minify") && flag("no-minify")) {
  throw new Error("不能同时指定 --minify 和 --no-minify");
}

const minify = flag("minify") ? true : flag("no-minify") ? false : Boolean(config.minify);
const entryPath = assertInsideProject(entry, "入口");
const outfilePath = assertInsideProject(outfile, "产物路径");
const outfileRel = path.relative(root, outfilePath);
const hasCli = existsSync(entryPath);

if (entryFlag && !hasCli) {
  throw new Error(`找不到终端入口 ${entry}`);
}
if (hasCli && path.extname(outfilePath) !== ".js") {
  throw new Error("产物名称必须以 .js 结尾");
}
if (hasCli && releasing && outfileRel.split(/[\\/]/).join("/") !== "dist/plugin.js") {
  throw new Error("release 的产物必须是 dist/plugin.js");
}

if (flag("assets") && releasing) {
  throw new Error("不能同时指定 --assets 和 --release");
}

const meta = readPluginMeta();
if (!hasCli && meta.windows.length === 0) {
  throw new Error("插件至少要有 src/main.ts 或一个窗口");
}
const assets = (await collectAssets()).sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));
const assetModule = assets.length === 0 && config.assets === false ? null : writeAssetModule(meta, assets);
const windowPages = [];
for (const spec of meta.windows) {
  windowPages.push({ spec, html: await renderWindow(spec, minify) });
}
if (flag("assets")) {
  if (assetModule) console.log(path.relative(root, assetModule));
  process.exit(0);
}

if (hasCli) {
  await esbuild.build({
    absWorkingDir: root,
    entryPoints: [entryPath],
    outfile: outfilePath,
    bundle: true,
    format: "iife",
    platform: "neutral",
    target: "es2020",
    minify,
    legalComments: minify ? "none" : "inline",
    charset: "utf8",
  });
}

const stageDir = path.dirname(outfilePath);
const assetsDir = path.join(stageDir, "assets");
const windowsDir = path.join(stageDir, "windows");
const manifestPath = path.join(stageDir, "manifest.json");
rmSync(manifestPath, { force: true });
rmSync(assetsDir, { recursive: true, force: true });
rmSync(windowsDir, { recursive: true, force: true });
if (!hasCli) rmSync(path.join(stageDir, "plugin.js"), { force: true });

const files = [];
let packageBytes = 0;
if (hasCli) {
  const bundle = readFileSync(outfilePath);
  packageBytes += bundle.length;
  files.push(fileRecord("plugin.js", bundle));
}
for (const asset of assets) {
  const data = readFileSync(asset.abs);
  packageBytes += data.length;
  if (packageBytes > maxPackageBytes) {
    throw new Error("插件包超过 32MB");
  }
  const dest = path.join(stageDir, ...asset.path.split("/"));
  mkdirSync(path.dirname(dest), { recursive: true });
  writeFileSync(dest, data);
  files.push(fileRecord(asset.path, data));
}
for (const page of windowPages) {
  const data = Buffer.from(page.html, "utf8");
  packageBytes += data.length;
  if (packageBytes > maxPackageBytes) {
    throw new Error("插件包超过 32MB");
  }
  const dest = path.join(windowsDir, `${page.spec.id}.html`);
  mkdirSync(windowsDir, { recursive: true });
  writeFileSync(dest, data);
  files.push(fileRecord(`windows/${page.spec.id}.html`, data));
}

const packaged = new Set(files.map((item) => item.path));
for (const window of meta.windows) {
  if (window.icon && !packaged.has(window.icon)) {
    throw new Error(`窗口 ${window.id} 的 icon ${window.icon} 不在 public/ 中`);
  }
}
const manifestText = buildManifest(meta, hasCli ? "plugin.js" : "", files);
writeFileSync(manifestPath, manifestText);

if (hasCli) {
  console.log(`${outfileRel} (${minify ? "minified" : "readable"}, ${statSync(outfilePath).size} bytes)`);
}
for (const page of windowPages) {
  console.log(`dist/windows/${page.spec.id}.html`);
}
console.log(`${path.relative(root, manifestPath)} (${files.length} files)`);

if (!releasing) {
  process.exit(0);
}

const packed = zipPackage([
  { name: "manifest.json", data: Buffer.from(manifestText, "utf8") },
  ...files.map((file) => ({
    name: file.path,
    data: readFileSync(path.join(stageDir, ...file.path.split("/"))),
  })),
]);
const ntpName = `${meta.name}-${meta.version}.ntp`;
const ntpPath = path.join(stageDir, ntpName);
writeFileSync(ntpPath, packed);
console.log(`${path.relative(root, ntpPath)} (${packed.length} bytes)`);
