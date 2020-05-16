const {App} = require("koishi");
const fs = require("fs-extra");
const fsPromise = fs.promises;
const path = require("path");
const objectAssignDeep = require("object-assign-deep");

// noinspection JSUndefinedPropertyAssignment
global.CountdownBot = {
    rootDir: __dirname,
    modules: {},
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
    async loadModules() {
        try {
            let files = await fs.readdirSync(path.join(__dirname, "modules"));
            files.filter(async (file) => (
                await fsPromise.stat(path.join(__dirname, "modules", file))).isDirectory()).forEach((file) => {
                this.modules[file] = require(path.join(__dirname, "modules", file));
                console.log("Load Module " + file + " " +
                    this.modules[file].version.toFixed(1) + " Succeed!");
            });
        } catch (e) {
            console.error(e);
        }
    },
    async run() {
        this.config = this.loadConfig(__dirname, require("./config-default.json"));
        // noinspection JSUndefinedPropertyAssignment
        global.bot = new App(this.config.koishi);
        bot.options.commandPrefix = this.config.commandPrefix;
        await this.loadModules();
        await bot.start();
        console.log("Countdown-Bot started succeed!");
    }
};

CountdownBot.untilStarted = CountdownBot.run();