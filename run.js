const {App} = require("koishi");
const fs = require("fs-extra");
const fsPromise = fs.promises;
const path = require("path");
const objectAssignDeep = require("object-assign-deep");
const utility = require("./utility.js");

// noinspection JSUndefinedPropertyAssignment
global.CountdownBot = {
  rootDir: __dirname,
  modules: {},
  log(obj) {
    if (obj instanceof ErrorMsg) {
      obj.meta.$send(obj.msg).catch(console.log);
      return;
    }
    console.log(obj);
  },
  loadConfig(dirname, defaultConfig) {
    try {
      return objectAssignDeep(defaultConfig, require(path.join(dirname, "config.json")));
    } catch (e) {
      console.log(dirname + "/config.json not found, using default config");
      return defaultConfig;
    }
  },
  async loadModules() {
    try {
      let files = await fsPromise.readdir(path.join(__dirname, "modules"));
      for (let file of files) {
        if (!file.startsWith("__") &&
          (await fsPromise.stat(path.join(__dirname, "modules", file))).isDirectory()) {
          this.modules[file] = require(path.join(__dirname, "modules", file));
          console.log("Load Module " + file + " " + this.modules[file].version + " Succeed!");
        }
      }
    } catch (e) {
      console.error(e);
    }
  },
  async run() {
    this.config = this.loadConfig(__dirname, require("./config-default.json"));
    this.dataDir = path.join(this.rootDir, "data");
    this.util = utility;
    await fsPromise.mkdir(this.dataDir, {recursive: true});
    // noinspection JSUndefinedPropertyAssignment

    global.bot = new App(this.config.koishi);
    bot.options.commandPrefix = this.config.commandPrefix;

    await this.loadModules();

    if (this.config.debug) {
      bot.receiver.on("message/friend", meta => {
        console.log(`收到 ${meta.sender.nickname}(${meta.sender.userId}) 的消息: ${meta.message}`);
      });
      bot.receiver.on("message/group", meta => {
        console.log(`收到 来自群${meta.groupId}中${meta.sender.nickname}(${meta.sender.userId}) ` +
          `的私聊消息: ${meta.message}`);
      });
      bot.receiver.on("message/normal", meta => {
        console.log(`来自群 ${meta.groupId} 由 ${meta.sender.nickname}(${meta.sender.userId})` +
          `发出的消息: ${meta.message}`);
      });
      bot.receiver.on("message/notice", meta => {
        console.log(`来自群 ${meta.groupId} 发出的提醒信息: ${meta.message}`);
      });
    }
    bot.start().then(() => console.log("Countdown-Bot started succeed!"));
  }
};

CountdownBot.untilStarted = CountdownBot.run();