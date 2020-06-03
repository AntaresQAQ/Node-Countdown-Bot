const configDefault = {
    repeat_times: 3,
    break_repeat_message: "[@] 在？为什么打断复读？",
    handleFriend: false,
    handleGroupAdd: false,
    handleGroupInvite: false
};

const config = CountdownBot.loadConfig(__dirname, configDefault);

bot.command("modules", "查看模块列表")
    .alias("模块")
    .action(async ({meta}) => {
        try {
            let buff_list = [];
            let plugins = CountdownBot.modules;
            for (let pluginName in plugins) {
                let plugin = plugins[pluginName];
                buff_list.push(Buffer.from(
                    pluginName + " " + plugin.version + "\n" +
                    "作者: " + plugin.author + "\n" +
                    "描述: " + plugin.description + "\n\n"
                ));
            }
            await meta.$send(Buffer.concat(buff_list).toString());
        } catch (e) {
            CountdownBot.log(e);
        }
    });

bot.command("about", "关于", {authority: 0})
    .alias("关于")
    .action(async ({meta}) => {
        try {
            await meta.$send("[CQ:share," +
                "url=https://github.com/AntaresQAQ/Node-Countdown-Bot," +
                "title=Node-Countdown-Bot," +
                "content=AntaresQAQ/Node-Countdown-Bot: Node.js的Countdown-Bot," +
                "image=https://github.com/fluidicon.png]"
            );
        } catch (e) {
            CountdownBot.log(e);
        }
    });

bot.plugin(require("koishi-plugin-common"), {
    admin: false,
    broadcast: false,
    contextify: false,
    info: false,
    exec: false,
    exit: false,
    welcomeMessage: false,
    repeater: {
        repeat: (repeated, times) => times === config.repeat_times,
        interruptCheck: (repeated, times) => repeated && times >= 5 && config.break_repeat_message,
        interruptCheckText: (userId) => config.break_repeat_message.replace("[@]", `[CQ:at,qq=${userId}]`),
    },
    handleFriend: config.handleFriend,
    handleGroupAdd: config.handleGroupAdd,
    handleGroupInvite: config.handleGroupInvite
});

module.exports = {
    author: "Antares",
    version: "1.0",
    description: "bot基础功能"
}
