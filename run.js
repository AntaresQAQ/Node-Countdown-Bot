const {App} = require("koishi");
const fs = require("fs-extra");
const fsPromise = fs.promises;
const path = require("path");

global.CountdownBot = {
    rootDir: __dirname,
    config: require("object-assign-deep")({}, require("./config-default.json"), require("./config.json")),
    plugins: {},
    async loadPlugins() {
        try {
            let files = await fs.readdirSync(path.join(__dirname, "plugins"));
            files.filter(async (file) => (
                await fsPromise.stat(path.join(__dirname, "plugins", file))).isDirectory()).forEach(
                (file) => this.plugins[file] = require(path.join(__dirname, "plugins", file, "plugin.js")));
        } catch (e) {
            console.error(e);
        }
    },
    loadBase() {
        bot.command("plugins")
            .usage("查看插件列表")
            .alias("插件")
            .action(async ({meta}) => {
                let buff_list = [];
                for (let pluginName in this.plugins) {
                    let plugin = this.plugins[pluginName];
                    buff_list.push(Buffer.from(
                        pluginName + " " + plugin.version.toFixed(1) + "\n" +
                        "作者: " + plugin.author + "\n" +
                        "描述: " + plugin.description
                    ));
                }
                await meta.$send(Buffer.concat(buff_list).toString());
            });
    },
    async run() {
        global.bot = new App(this.config.koishi);
        bot.options.commandPrefix = this.config.commandPrefix;
        this.loadBase();
        await this.loadPlugins();
        await bot.start();
    }
};

CountdownBot.untilStarted = CountdownBot.run();