export {};
const attrs=[['strength','力量'],['dexterity','敏捷'],['constitution','体质'],['intelligence','智力'],['wisdom','感知'],['charisma','魅力']];
const fields:ntp.CharacterField[]=attrs.map(([key,label])=>({key,label,type:"number",group:"abilities",default:10,min:1,max:30}));
fields.push({key:"hp",label:"生命",type:"number",group:"combat",default:10,min:0,max:999},{key:"ac",label:"护甲等级",type:"number",group:"combat",default:10,min:0,max:99},{key:"level",label:"等级",type:"number",group:"combat",default:1,min:1,max:20});
const defaults=Object.fromEntries(fields.map(f=>[f.key,f.default]));
function derive(data:ntp.CharacterData):ntp.CharacterData {
 const next={...defaults,...data};for(const [key] of attrs)next[key+"Modifier"]=Math.floor((Number(next[key])-10)/2);
 next.proficiencyBonus=2+Math.floor((Number(next.level)-1)/4);return next;
}
narratable.character.define({
 describe:()=>({ruleId:"narratable/dnd5e",ruleVersion:"0.1.1",name:"DND 5E",groups:[{key:"abilities",label:"属性"},{key:"combat",label:"战斗"}],fields,defaults}),
 read:derive,write:derive,
 validate:data=>fields.flatMap(f=>{
  const n=Number(data[f.key]); return !Number.isFinite(n)||!Number.isInteger(n)||n<(f.min??0)||n>(f.max??999)?[{field:f.key,message:`${f.label}超出范围或不是整数`}]:[];
 })
});
