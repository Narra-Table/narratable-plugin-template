export {};
interface Combatant { id: string; name: string; init: number; ownerId: string }
function read(cpi: ntp.CPI): Combatant[] { return (cpi.data.get("order", {room:true}) as Combatant[] | undefined) ?? []; }
function manager(cpi: ntp.CPI): void {
  const who = cpi.getSpaceInfo();
  if (!who.isOwner && who.role !== "gm" && who.role !== "agm") throw new Error("只有 GM/AGM 能整理先攻");
}
function save(cpi: ntp.CPI, rows: Combatant[]): Combatant[] {
  cpi.data.set("order", rows, {room:true, visibility:"all"}); return rows;
}
function add(args: unknown[], cpi: ntp.CPI): Combatant[] {
  const item = args[0] as {name?:unknown;init?:unknown;id?:unknown} | undefined;
  const name = String(item?.name ?? "").trim(); const init = Number(item?.init);
  if (!name || name.length > 80 || !Number.isFinite(init)) throw new Error("需要姓名和有效先攻值");
  const rows = read(cpi); if(rows.length >= 100) throw new Error("先攻表最多 100 个单位");
  const id = String(item?.id ?? `${cpi.getSpaceInfo().userId}-${rows.reduce((m,r)=>Math.max(m,Number(r.id.split(":").pop())||0),0)+1}:${rows.length}`);
  const existing = rows.find(row=>row.id===id);
  if (existing) {
    if (existing.ownerId !== cpi.getSpaceInfo().userId) manager(cpi);
    existing.name=name; existing.init=init;
  } else rows.push({id,name,init,ownerId:cpi.getSpaceInfo().userId});
  rows.sort((a,b)=>b.init-a.init);
  save(cpi,rows); cpi.replyMessage(`${name} 加入先攻 ${init}`); return rows;
}
narratable.export("addCombatant", add);
narratable.export("reorder", (args,cpi)=>{
  manager(cpi); const rows=read(cpi); const ids=args[0];
  if(!Array.isArray(ids)||ids.length!==rows.length||new Set(ids).size!==rows.length) throw new Error("先攻顺序已变化，请刷新");
  const ordered=ids.map(id=>{const row=rows.find(r=>r.id===id);if(!row)throw new Error("未知单位");return row});
  save(cpi,ordered); cpi.replyMessage("先攻顺序："+ordered.map(r=>r.name).join(" → ")); return ordered;
});
narratable.export("remove",(args,cpi)=>{ manager(cpi); return save(cpi,read(cpi).filter(r=>r.id!==args[0])); });
narratable.export("clear",(_args,cpi)=>{ manager(cpi); cpi.replyMessage("先攻表已清空"); return save(cpi,[]); });
const ns=narratable.rule.new("先攻",[],"房间先攻表");
ns.addCmd(new narratable.CommandExecutor("init",[],"加入先攻",[".init 林 14"],".init 名字 先攻",(args,mentioned,cpi)=>{
 add([{name:args[0]||mentioned[mentioned.length-1]?.name,init:args[1]||0}],cpi); cpi.openWindow("board",{}); return true;
}));
