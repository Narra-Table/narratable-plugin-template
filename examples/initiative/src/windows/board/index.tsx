import {bridge,node,page,button,showError,subscribe,manager} from "../../../../shared/window";
interface Row {id:string;name:string;init:number}
const main=page("先攻");const toolbar=node("div");toolbar.className="toolbar";
const name=node("input");name.placeholder="角色名称";name.setAttribute("aria-label","角色名称");name.maxLength=80;
const score=node("input");score.type="number";score.value="0";score.setAttribute("aria-label","先攻值");
const rows=node("div");rows.className="rows";main.append(toolbar,rows);
async function start(){
 const init=await bridge.ready;if(!init.roomId)throw new Error("请从一个房间打开先攻窗口");let current:Row[]=[];
 async function invoke(name:string,args:unknown[]){await bridge.request("invoke",{export:name,args});await refresh()}
 async function refresh(){
  current=(await bridge.request<Row[]|null>("data.get",{key:"order",room:true}))??[];rows.replaceChildren();
  if(!current.length)rows.append(node("p","尚无先攻单位。使用 .init 名字 先攻，或在这里添加。"));
  current.forEach((r,index)=>{
   const row=node("div");row.className="row";const label=node("span",`${index+1}. ${r.name} · ${r.init}`);label.className="name";row.append(label);
   if(manager(init)){
    const up=button("上移",async()=>{const ids=current.map(r=>r.id);[ids[index-1],ids[index]]=[ids[index],ids[index-1]];await invoke("reorder",[ids])});up.disabled=index===0;
    row.append(up,button("移除",()=>invoke("remove",[r.id])));
   }rows.append(row);
  });
 }
 if(init.user.role!=="ob")toolbar.append(name,score,button("加入",()=>invoke("addCombatant",[{name:name.value,init:Number(score.value)}])));
 toolbar.append(button("刷新",refresh));if(manager(init))toolbar.append(button("清空",()=>invoke("clear",[])));
 await subscribe(["appdata.updated"],refresh);await refresh();
}
void start().catch(showError);
