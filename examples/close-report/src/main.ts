export {};
narratable.export("closeReport",(_args,cpi)=>{
 const data=cpi.reportData();
 return ["结团报告",`成员 ${data.members.length}`,`角色卡 ${data.cards.length}`,`骰点 ${data.rolls.length}`,`线索 ${data.clues.length}`,"",...data.members.map(m=>`${m.displayName||m.userId} · ${m.role}`),"",...data.cards.map(c=>`角色：${c.name}`),"",...data.clues.map(c=>`线索：${c.title}`)].join("\n");
});
