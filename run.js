const {App} = require("koishi");
const fs = require("fs-extra");
const fsPromise = fs.promises;
const path = require("path");
const objectAssignDeep = require("object-assign-deep");

// noinspection JSUndefinedPropertyAssignment
global.CountdownBot = {
    rootDir: __dirname,
    config: objectAssignDeep({}, require("./config-default.json"), require("./config.json")),
    plugins: {},
    log(msg, sender) {
        if (sender) sender(msg.toString());
        console.log(msg);
    },
    loadConfig(dirname, defaultConfig) {
        try {
            return objectAssignDeep(defaultConfig, require(path.join(dirname, "config.json")));
        } catch (e) {
            this.log(dirname + "/config.json not found, using default config");
            return defaultConfig;
        }
    },
    async loadPlugins() {
        try {
            let files = await fs.readdirSync(path.join(__dirname, "plugins"));
            files.filter(async (file) => (
                await fsPromise.stat(path.join(__dirname, "plugins", file))).isDirectory()).forEach((file) => {
                this.plugins[file] = require(path.join(__dirname, "plugins", file, "plugin.js"));
                console.log("Load plugin " + file + " " +
                    this.plugins[file].version.toFixed(1) + " succeed");
            });
        } catch (e) {
            console.error(e);
        }
    },
    loadBase() {
        bot.command("plugins")
            .usage("查看插件列表")
            .alias("插件")
            .action(async ({meta}) => {
                try {
                    let buff_list = [];
                    for (let pluginName in this.plugins) {
                        let plugin = this.plugins[pluginName];
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
        bot.command("help")
            .usage("查看帮助")
            .alias("帮助")
            .action(async ({meta}) => {
                try {
                    let buff_list = [];
                    for (let command of bot._commands) {
                        buff_list.push(command._aliases + " --- " + command._usage + "\n");
                    }
                    await meta.$send(Buffer.concat(buff_list).toString());
                } catch (e) {
                    this.log(e, meta.$send);
                }
            });
    },
    async run() {
        // noinspection JSUndefinedPropertyAssignment
        global.bot = new App(this.config.koishi);
        bot.options.commandPrefix = this.config.commandPrefix;
        this.loadBase();
        await this.loadPlugins();
        await bot.start();
        console.log("Countdown-Bot started succeed!");
    }
};

CountdownBot.untilStarted = CountdownBot.run();