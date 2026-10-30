export {};
const aliases:Record<string,string>={力量:"strength",敏捷:"dexterity",体质:"constitution",智力:"intelligence",感知:"wisdom",魅力:"charisma"};
const ns=narratable.rule.new("dnd5e",["dnd"],"DND5E 属性与豁免检定");
for(const command of ["dc","check","save"])ns.addCmd(new narratable.CommandExecutor(command,[],"DND 检定",[`.${command} 力量`],`.${command} [属性] [加值]`,(args,mentioned,cpi)=>{
 const who=mentioned[0];if(!who?.cardId){cpi.replyMessage("请先创建角色卡");return false;}
 const key=aliases[args[0]]??args[0]??"wisdom";const card=cpi.character.read(who.cardId);
 if(!["strength","dexterity","constitution","intelligence","wisdom","charisma"].includes(key))throw new Error("未知属性");
 const bonus=Number(args[1]??0);if(!Number.isFinite(bonus))throw new Error("加值必须为数字");
 const modifier=Math.floor((Number(card[key])-10)/2);const rolled=cpi.roll("1d20");
 cpi.replyMessage(`${who.name} ${args[0]??"感知"}${command==="save"?"豁免":"检定"}：D20=${rolled.total}，修正 ${modifier}，额外 ${bonus}，合计 ${rolled.total+modifier+bonus}`);return true;
}));
