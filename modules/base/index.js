const configDefault = {
    repeat_times: 3,
    break_repeat_message: "[@] 在？为什么打断复读？",
    handleFriend: false,
    handleGroupAdd: false,
    handleGroupInvite: false,
};

const config = CountdownBot.loadConfig(__dirname, configDefault);

bot.command("plugins", "查看插件列表")
    .alias("插件")
    .action(async ({meta}) => {
        try {
            let buff_list = [];
            let plugins = CountdownBot.modules;
            for (let pluginName in plugins) {
                let plugin = plugins[pluginName];
                buff_list.push(Buffer.from(
                    pluginName + " " + plugin.version.toFixed(1) + "\n" +
                    "作者: " + plugin.author + "\n" +
                    "描述: " + plugin.description + "\n\n"
                ));
            }
            await meta.$send(Buffer.concat(buff_list).toString());
        } catch (e) {
            this.log(e, meta.$send);
        }
    });

bot.plugin(require("koishi-plugin-common"), {
    admin: false,
    broadcast: false,
    contextify: false,
    info: false,
    echo: false,
    exec: false,
    exit: false,
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
    version: 1.0,
    description: "bot基础功能"
}
