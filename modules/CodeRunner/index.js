const configDefault = {
  docker_image: "2f23e2a45ebf",
  time_limit: 10000,
  memory_limit: 64000000,
  output_limit: 1024,
  rows_limit: 20,
  cpu_limit: 0.5,
  min_interval: 5,
  inactive_groups: []
};

const config = CountdownBot.loadConfig(__dirname, configDefault);
const Langs = require("./langs.json");
const tmpPromise = require("tmp-promise");
const fs = require("fs-extra");
const fsPromise = fs.promises;
const path = require("path");
const Promise = require("bluebird");
const Docker = require("dockerode");
const docker = new Docker({Promise: Promise});
const {CQCode} = require("koishi");

function fsExists(filePath) {
  return new Promise((resolve) => {
    fs.access(filePath, (err) => {
      if (err) resolve(true);
      else resolve(false);
    })
  })
}

function generateHelp() {
  let buffers = [Buffer.from("语言ID: 描述\n")];
  for (let lang in Langs) {
    // noinspection JSUnfilteredForInLoop
    buffers.push(Buffer.from(`${lang}: ${Langs[lang].description}\n`));
  }
  return Buffer.concat(buffers).toString();
}

bot.groups.except(config.inactive_groups)
  .command("run <code...>", "运行代码,默认JavaScript",
    {minInterval: config.min_interval, showWarning: true})
  .option("-l,--list", "查看支持语言列表")
  .option("-x,--lang <lang>", "指定语言ID", {default: "js"})
  .action(async ({meta, options}, code) => {
    try {
      if (options.list) {
        await meta.$send(generateHelp());
        return;
      }
      let running_id = Math.ceil(Math.random() * 1000000);
      code = CQCode.unescape(code);
      let tmpDir = await tmpPromise.dir();
      if (!Langs[options.lang]) throw new ErrorMsg("不支持的语言", meta);
      let lang = Langs[options.lang];
      await fsPromise.writeFile(path.join(tmpDir.path, lang.source), code);
      let command = (lang.compile ? lang.compile + " > stderr 2>&1 && " : "") +
        lang.run + " 1> stdout 2>> stderr && touch " + running_id + "_ok";
      CountdownBot.log("User: " + meta.userId + " run " + options.lang + "\n" + code);
      let container = await docker.createContainer({
        Image: config.docker_image,
        AttachStdin: false,
        AttachStdout: true,
        AttachStderr: false,
        Tty: true,
        WorkingDir: "/working",
        Cmd: ["sh", "-c", command],
        NetworkDisabled: true,
        OomKillDisable: true,
        HostConfig: {
          Binds: [
            `${tmpDir.path}:/working`
          ],
          Memory: config.memory_limit,
          MemorySwap: config.memory_limit,
          NanoCPUs: Math.ceil(config.cpu_limit / 1e-9)
        }
      });
      await container.start();

      let TLE = () => new Promise((resolve, reject) => {
        let timeout = setTimeout(() => resolve(true), config.time_limit);
        container.wait().then(() => {
          clearTimeout(timeout);
          resolve(false)
        }).catch(reason => {
          clearTimeout(timeout);
          reject(reason);
        });
      });

      if (await TLE()) {
        await container.kill();
        await container.remove();
        await CountdownBot.util.clearDir(tmpDir.path);
        await tmpDir.cleanup();
        throw new ErrorMsg("Time Limit Exceeded", meta);
      }

      await container.remove();

      if (await fsExists(path.join(tmpDir.path, running_id + "_ok"))) {
        let error_info = await fsExists(path.join(tmpDir.path, "stderr")) ? "Unknown Error" :
          await fsPromise.readFile(path.join(tmpDir.path, "stderr"), {flag: "r"})
        await CountdownBot.util.clearDir(tmpDir.path);
        await tmpDir.cleanup();
        throw new ErrorMsg(error_info.toString().substr(0, config.output_limit), meta);
      }

      let result = (await fsPromise.readFile(path.join(tmpDir.path, "stdout"), {flag: "r"})).toString();
      await CountdownBot.util.clearDir(tmpDir.path);
      await tmpDir.cleanup();
      if (result.length === 0) {
        await meta.$send("无输出");
      } else {
        let lines = result.split("\n");
        if (lines.length > config.rows_limit) {
          result = lines.slice(0, config.rows_limit).join("\n") + "\n[超出行数限制部分已截断]";
        }
        if (result.length > config.output_limit) {
          await meta.$send(result.substr(0, config.output_limit) + "\n[超出长度部分已截断]")
        } else {
          await meta.$send(result);
        }
      }
    } catch (e) {
      CountdownBot.log(e);
    }
  });

module.exports = {
  author: "Antares",
  version: "1.0",
  description: "Docker Code Runner"
};