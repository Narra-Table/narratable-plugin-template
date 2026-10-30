import {execFileSync} from "node:child_process";
import {fileURLToPath} from "node:url";
const root=fileURLToPath(new URL("../",import.meta.url));
for(const name of ["dice-core","coc7-rules","coc7-commands","coc7-sheet","dnd5e-rules","dnd5e-commands","initiative","map-grid","close-report"]){
 execFileSync(process.execPath,["build.mjs","--root",`examples/${name}`,"--release"],{cwd:root,stdio:"inherit"});
}
