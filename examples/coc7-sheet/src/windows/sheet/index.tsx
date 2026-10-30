import {bridge,node,page,button,showError,subscribe} from "../../../../shared/window";
interface Card{cardId:string;maskId:string;name:string;data:ntp.CharacterData;canWrite?:boolean}
const main=page("调查员卡");const selector=node("select");selector.setAttribute("aria-label","选择角色卡");const form=node("div");main.append(selector,form);
async function start(){
 const init=await bridge.ready;const descriptor=await bridge.request<ntp.CharacterDescriptor>("character.describe");
 const cards=await bridge.request<Card[]>("character.list");
 if(!cards.length){main.append(node("p","还没有规则卡，请在角色窗口中创建。"));return;}
 for(const card of cards){const opt=node("option",card.name);opt.value=card.cardId;selector.append(opt);}
 const params=init.params&&typeof init.params==="object"?init.params as Record<string,unknown>:{};
 if(typeof params.cardId==="string"&&cards.some(c=>c.cardId===params.cardId))selector.value=params.cardId;
 let dirty=false;
 async function refresh(){
  if(dirty){showError("角色已更新；你有未保存修改，请先保存或重新加载。");return;}
  const card=await bridge.request<Card>("character.read",{cardId:selector.value});form.replaceChildren();
  const controls=new Map<string,HTMLInputElement|HTMLSelectElement>();
  for(const group of descriptor.groups??[{key:"",label:"角色数据"}]){
   const section=node("section");section.append(node("h2",group.label));const fields=node("div");fields.className="fields";
   for(const field of descriptor.fields.filter(f=>(f.group??"")===group.key)){
    const label=node("label",field.label);let input:HTMLInputElement|HTMLSelectElement;
    if(field.type==="select"){input=node("select");for(const o of field.options??[]){const option=node("option",o.label);option.value=o.value;input.append(option)}}
    else {input=node("input");input.type=field.type==="number"?"number":field.type==="boolean"?"checkbox":"text";if(field.min!==undefined)input.min=String(field.min);if(field.max!==undefined)input.max=String(field.max)}
    input.value=String(card.data[field.key]??field.default??"");if(input instanceof HTMLInputElement&&input.type==="checkbox")input.checked=Boolean(card.data[field.key]);
    input.disabled=!card.canWrite;input.oninput=()=>{dirty=true};controls.set(field.key,input);label.append(input);fields.append(label);
   }section.append(fields);form.append(section);
  }
  if(card.canWrite)form.append(button("保存",async()=>{
   const data={...card.data};for(const field of descriptor.fields){const input=controls.get(field.key);if(!input)continue;data[field.key]=field.type==="number"?Number(input.value):field.type==="boolean"?(input as HTMLInputElement).checked:input.value;}
   await bridge.request("character.write",{cardId:card.cardId,data});dirty=false;showError("已保存");await refresh();
  }));
  form.append(button("重新加载",async()=>{dirty=false;await refresh()}));
 }
 selector.onchange=()=>{dirty=false;void refresh().catch(showError)};
 bridge.on("beforeClose",()=>{void bridge.request("window.closeDecision",{prevent:dirty})});
 await subscribe(["character.updated"],refresh);await refresh();
}
void start().catch(showError);
