const configDefault = {
    docker_image: "2f23e2a45ebf",
    time_limit: 10000,
    memory_limit: 64000000,
    output_limit: 1024,
    cpu_limit: 0.5,
    min_interval: 5,
    inactive_groups: []
};

const config = CountdownBot.loadConfig(__dirname, configDefault);
const langs = require("./langs.json");
const tmpPromise = require("tmp-promise");
const fs = require("fs-extra");
const fsPromise = fs.promises;
const path = require("path");
const Docker = require("dockerode");
const docker = new Docker();
const koishiUtils = require("koishi-utils");
const Promise = require("bluebird");

function fsExists(filePath) {
    return new Promise((resolve) => {
        fs.access(filePath, (err) => {
            if (err) resolve(true);
            else resolve(false);
        })
    })
}

async function clearDir(filePath) {
    for (let file of await fsPromise.readdir(filePath)) {
        if ((await fsPromise.stat(path.join(filePath, file))).isFile())
            await fsPromise.unlink(path.join(filePath, file));
        else await clearDir(path.join(filePath, file));
    }
}

function generateHelp() {
    let buffers = [Buffer.from("语言ID: 描述\n")];
    for (let lang in langs) {
        // noinspection JSUnfilteredForInLoop
        buffers.push(Buffer.from(`${lang}: ${langs[lang].description}\n`));
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
            let running_id = parseInt(Math.random() * 1000000);
            code = koishiUtils.CQCode.unescape(code);
            let tmpDir = await tmpPromise.dir();
            if (!langs[options.lang]) throw new ErrorMsg("不支持的语言", meta);
            let lang = langs[options.lang];
            await fsPromise.writeFile(path.join(tmpDir.path, lang.source), code);
            let command = (lang.compile ? lang.compile + " > stderr 2>&1 && " : "") +
                lang.run + " 1> stdout 2>> stderr && touch " + running_id + "_ok";
            CountdownBot.log("User: " + meta.userId + " run code " + code);
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
                    NanoCPUs: parseInt(config.cpu_limit / 1e-9),
                }
            });
            await container.start();

            let TLE = () => new Promise(async (resolve) => {
                setTimeout(() => resolve(true), config.time_limit);
                await container.wait();
                resolve(false);
            });

            if (await TLE()) {
                await container.kill();
                await container.remove();
                await clearDir(tmpDir.path);
                await tmpDir.cleanup();
                throw new ErrorMsg("Time Limit Exceeded", meta);
            }

            await container.remove();

            if (await fsExists(path.join(tmpDir.path, running_id + "_ok"))) {
                let error_info = await fsExists(path.join(tmpDir.path, "stderr")) ? "Unknown Error" :
                    await fsPromise.readFile(path.join(tmpDir.path, "stderr"), {flag: "r"})
                await clearDir(tmpDir.path);
                await tmpDir.cleanup();
                throw new ErrorMsg(error_info.toString(), meta);
            }

            let result = (await fsPromise.readFile(path.join(tmpDir.path, "stdout"), {flag: "r"})).toString();
            await clearDir(tmpDir.path);
            await tmpDir.cleanup();
            await meta.$send(result.substr(0, config.output_limit) +
            result.length >= config.output_limit ? "\n[超出长度部分已截断]" : "");
        } catch (e) {
            CountdownBot.log(e);
        }
    });

module.exports = {
    author: "Antares",
    version: "1.0",
    description: "Docker Code Runner"
};