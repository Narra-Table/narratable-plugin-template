export {};
interface Token { id: string; name: string; x: number; y: number; ownerId: string }
function manager(cpi:ntp.CPI):boolean {const i=cpi.getSpaceInfo();return i.isOwner||i.role==="gm"||i.role==="agm";}
narratable.export("setToken",(args,cpi)=>{
 const incoming=args[0] as Partial<Token>|undefined; if(!incoming)throw new Error("缺少标记");
 const id=String(incoming.id??""); const name=String(incoming.name??"标记").trim();
 const x=Number(incoming.x),y=Number(incoming.y);
 if(!/^[a-zA-Z0-9_-]{1,48}$/.test(id)||!name||name.length>80||!Number.isInteger(x)||!Number.isInteger(y)||x<0||x>19||y<0||y>19)throw new Error("无效标记或坐标");
 const key="token:"+id; const previous=cpi.data.get(key,{room:true}) as Token|undefined;
 if(previous && previous.ownerId!==cpi.getSpaceInfo().userId && !manager(cpi)) throw new Error("只能移动自己的标记");
 const token={id,name,x,y,ownerId:previous?.ownerId??cpi.getSpaceInfo().userId};
 cpi.data.set(key,token,{room:true,visibility:"all"});return token;
});
narratable.export("removeToken",(args,cpi)=>{
 const key="token:"+String(args[0]); const token=cpi.data.get(key,{room:true}) as Token|undefined;
 if(token && token.ownerId!==cpi.getSpaceInfo().userId && !manager(cpi))throw new Error("只能删除自己的标记");
 cpi.data.delete(key,{room:true});return true;
});
