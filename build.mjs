import * as esbuild from "esbuild";
import { readFileSync, statSync } from "node:fs";
import path from "node:path";

const pkg = JSON.parse(readFileSync(new URL("./package.json", import.meta.url), "utf8"));
const config = pkg.narratablePlugin ?? {};
const args = process.argv.slice(2);

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
  const root = process.cwd();
  const resolved = path.resolve(root, rel);
  if (resolved !== root && !resolved.startsWith(root + path.sep)) {
    throw new Error(`${label} 必须位于项目目录内`);
  }
}

const entry = option("entry") ?? config.entry ?? "src/index.ts";
const outfile = option("outfile") ?? config.outfile ?? "dist/plugin.js";

if (flag("minify") && flag("no-minify")) {
  throw new Error("不能同时指定 --minify 和 --no-minify");
}

const minify = flag("minify") ? true : flag("no-minify") ? false : Boolean(config.minify);

assertInsideProject(entry, "入口");
assertInsideProject(outfile, "产物路径");

if (path.extname(outfile) !== ".js") {
  throw new Error("产物名称必须以 .js 结尾");
}

await esbuild.build({
  entryPoints: [entry],
  outfile,
  bundle: true,
  format: "iife",
  platform: "neutral",
  target: "es2020",
  minify,
  legalComments: minify ? "none" : "inline",
  charset: "utf8",
});

const bytes = statSync(outfile).size;
console.log(`${outfile} (${minify ? "minified" : "readable"}, ${bytes} bytes)`);
