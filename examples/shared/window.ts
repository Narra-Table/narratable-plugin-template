export type Init = ntp.WindowInit;
export type WindowBridge = ntp.WindowBridge;
export const bridge=ntpWindow;
export function node<K extends keyof HTMLElementTagNameMap>(tag:K,text?:string):HTMLElementTagNameMap[K] {
 const el=document.createElement(tag);if(text!==undefined)el.textContent=text;return el;
}
export function button(label:string,action:()=>void|Promise<unknown>):HTMLButtonElement {
 const el=node("button",label);el.type="button";el.onclick=()=>{el.disabled=true;Promise.resolve().then(action).catch(showError).finally(()=>{el.disabled=false})};return el;
}
const status=node("p"); status.role="status";
export function showError(error:unknown):void {status.textContent=error instanceof Error?error.message:String(error);}
export function page(title:string):HTMLElement {
 document.documentElement.lang="zh-CN";document.title=title;
 const style=node("style");style.textContent=`
 :root{color-scheme:light dark}*{box-sizing:border-box}body{margin:0;padding:16px;font:14px/1.5 system-ui;color:var(--foreground,#e6e6e6);background:var(--background,#202126)}
 h1{font-size:18px;margin:0 0 12px}h2{font-size:15px}button,input,select{font:inherit;color:inherit;background:var(--input,#303137);border:1px solid var(--border,#666);border-radius:6px;padding:7px;max-width:100%}button{cursor:pointer}button:disabled{opacity:.5;cursor:default}button:focus-visible,input:focus-visible{outline:2px solid var(--primary,#9cc6ff)}
 .toolbar{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:12px}.rows{display:grid;gap:8px}.row{display:flex;align-items:center;gap:8px;padding:6px;border-bottom:1px solid var(--border,#666)}.name{flex:1;overflow-wrap:anywhere}label{display:grid;gap:4px;margin-bottom:8px}.fields{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px}p[role=status]{min-height:1.5em;color:var(--destructive,#ffb3a7)}
 .grid{position:relative;aspect-ratio:1;touch-action:none;border:1px solid var(--border,#666);background-size:5% 5%;overflow:hidden}.token{position:absolute;width:5%;height:5%;padding:0;overflow:hidden;font-size:10px;touch-action:none;background:var(--primary,#749acd);color:var(--primary-foreground,#111)}
 `;document.head.append(style);const main=node("main");main.append(node("h1",title));document.body.append(main,status);return main;
}
export async function subscribe(events:ntp.WindowEvent[],refresh:()=>Promise<void>):Promise<void> {
 for(const event of events)bridge.on(event,()=>{void refresh().catch(showError)});
 await bridge.request("subscribe",{events});
}
export function manager(init:Init):boolean{return !!init.user.isOwner||["gm","agm"].includes(init.user.role)}
