export {};
(() => {
  narratable.config.int("defaultDice", 100, "默认骰面", "骰子", { scope: "workspace" })
  const ns = narratable.rule.new("通用", [], "通用指令集")
  ns.addCmd(new narratable.CommandExecutor(
    "r",
    [],
    "掷骰",
    [".r 1d100", ".r 3d6+2"],
    ".r [掷骰表达式]",
    function(args, mentioned, cpi) {
      var hidden = false
      var parts: string[] = []
      for (var i = 0; i < args.length; i++) {
        if (args[i] === "h") { hidden = true } else { parts.push(args[i]) }
      }
      var expr = parts.join("")
      if (!expr) {
        var faces: number = 100
        try {
          var configured = narratable.config.get<number>("defaultDice")
          if (configured !== undefined && configured !== null) faces = configured
        } catch (e) {}
        expr = "1d" + faces
      }
      var rolled = cpi.roll(expr)
      var name = mentioned[mentioned.length - 1].name
      if (hidden) {
        cpi.sendToast(name + " " + expr + " = " + rolled.total)
        cpi.replyMessage(name + "进行了一次暗骰")
        return true
      }
      cpi.replyMessage(name + " 掷骰 " + expr + " = " + rolled.total)
      return true
    }
  ))
  ns.addCmd(new narratable.CommandExecutor(
    "help",
    [],
    "显示指令帮助",
    [".help"],
    ".help",
    function(args, mentioned, cpi) {
      cpi.sendToast("r: 掷骰；help: 显示帮助")
      return true
    }
  ))
  narratable.rule.register(ns)
})();
