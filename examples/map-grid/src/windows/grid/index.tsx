import {bridge,node,page,button,showError,subscribe,manager} from "../../../../shared/window";
interface Token{id:string;name:string;x:number;y:number;ownerId:string}
const main=page("共享地图");const toolbar=node("div");toolbar.className="toolbar";const name=node("input");name.placeholder="标记名称";name.setAttribute("aria-label","标记名称");
const grid=node("div");grid.className="grid";grid.setAttribute("aria-label","20×20 格地图");main.append(toolbar,grid,node("p","拖动自己的标记可同步位置。键盘聚焦标记后用方向键移动，Delete 删除。"));
async function start(){
 const init=await bridge.ready;if(!init.roomId)throw new Error("请从一个房间打开地图");let tokens:Token[]=[];
 const url=await bridge.request<string>("resource.url",{id:"plugin:map-grid/assets/grid.svg"});grid.style.backgroundImage=`url("${url}")`;
 async function invoke(exp:string,args:unknown[]){await bridge.request("invoke",{export:exp,args});await refresh()}
 async function move(t:Token,x:number,y:number){await invoke("setToken",[{...t,x:Math.max(0,Math.min(19,x)),y:Math.max(0,Math.min(19,y))}])}
 async function refresh(){
  const keys=await bridge.request<string[]>("data.list",{prefix:"token:",room:true});
  tokens=(await Promise.all(keys.map(key=>bridge.request<Token|null>("data.get",{key,room:true})))).filter((t):t is Token=>!!t);grid.replaceChildren();
  for(const t of tokens){
   const el=node("button",t.name);el.className="token";el.style.left=`${t.x*5}%`;el.style.top=`${t.y*5}%`;el.title=`${t.name} (${t.x},${t.y})`;el.setAttribute("aria-label",el.title);
   const editable=init.user.role!=="ob"&&(manager(init)||t.ownerId===init.user.userId);el.disabled=!editable;
   el.onpointerdown=e=>{el.setPointerCapture(e.pointerId);e.preventDefault()};
   el.onpointermove=e=>{if(!el.hasPointerCapture(e.pointerId))return;const r=grid.getBoundingClientRect();el.style.left=`${Math.max(0,Math.min(19,Math.floor((e.clientX-r.left)/r.width*20)))*5}%`;el.style.top=`${Math.max(0,Math.min(19,Math.floor((e.clientY-r.top)/r.height*20)))*5}%`};
   el.onpointerup=e=>{if(!el.hasPointerCapture(e.pointerId))return;el.releasePointerCapture(e.pointerId);const r=grid.getBoundingClientRect();void move(t,Math.floor((e.clientX-r.left)/r.width*20),Math.floor((e.clientY-r.top)/r.height*20)).catch(showError)};
   el.onkeydown=e=>{const delta:Record<string,number[]>={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]};if(delta[e.key]){e.preventDefault();void move(t,t.x+delta[e.key][0],t.y+delta[e.key][1]).catch(showError)}else if(e.key==="Delete"){e.preventDefault();void invoke("removeToken",[t.id]).catch(showError)}};
   grid.append(el);
  }
 }
 if(init.user.role!=="ob")toolbar.append(name,button("添加标记",()=>invoke("setToken",[{id:crypto.randomUUID(),name:name.value||init.user.displayName,x:0,y:0}])));
 toolbar.append(button("刷新",refresh),button("呼叫同桌",()=>bridge.request("window.broadcast",{message:{type:"focus-map"}})));
 bridge.on("window.message",()=>{void bridge.request("window.setAttention",{attention:true})});
 await subscribe(["appdata.updated"],refresh);await refresh();
}
void start().catch(showError);
