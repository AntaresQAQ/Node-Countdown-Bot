global.ErrorMsg = class ErrorMsg {
  constructor(msg, meta) {
    this.msg = msg;
    this.meta = meta;
  }
}

const fs = require("fs-extra");
const fsPromise = fs.promises;
const path = require("path");
const qs = require("querystring");
const axios = require("axios");
const {VM} = require("vm2");
const ffmpeg = require("fluent-ffmpeg");
const Stream = require('stream');
const Promise = require("bluebird");
const tmpPromise = require("tmp-promise");
const md5 = require("md5");

module.exports = {
  async clearDir(filePath) {
    for (let file of await fsPromise.readdir(filePath)) {
      if ((await fsPromise.stat(path.join(filePath, file))).isDirectory()) {
        await this.clearDir(path.join(filePath, file));
        await fsPromise.rmdir(path.join(filePath, file));
      } else {
        await fsPromise.unlink(path.join(filePath, file));
      }
    }
  },
  async ubuntuPasteBin(poster, content, syntax, expiration) {
    let res = await axios.post("https://paste.ubuntu.com/", qs.stringify({
      poster: poster,
      syntax: syntax || "text",
      expiration: expiration || "",
      content: content
    }), {
      headers: {
        "Accept": "application/json, text/plain, */*",
        "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) " +
          "AppleWebKit/537.36 (KHTML, like Gecko) " +
          "Chrome/81.0.4044.122 Safari/537.36",
        "Accept-Encoding": "gzip, deflate, br",
        "Accept-Language": "zh-CN,zh;q=0.9"
      }
    });
    return "https://paste.ubuntu.com" + res.request.path;
  },
  vmRun(code, timeLimit) {
    let vm = new VM({
      sandbox: {},
      timeout: timeLimit || 1000,
    });
    return vm.run(code);
  },
  async makeRecord(buffer, format) {
    let bufferMD5 = md5(buffer);
    let target = await tmpPromise.file();
    await new Promise((resolve, reject) => {
      let stream = new Stream.Duplex();
      stream.push(buffer);
      stream.push(null);
      ffmpeg().input(stream)
        .inputFormat(format)
        .output(target.path)
        .audioFrequency(8000)
        .audioBitrate("12.20k")
        .audioChannels(1)
        .format("amr")
        .on("end", resolve)
        .on("error", (err) => reject(err)).run();
    });
    let result = bufferMD5 + ".amr";
    await fsPromise.copyFile(target.path,
      path.join(CountdownBot.config.cqhttp_path, "data", "voices", result));
    await target.cleanup();
    return result;
  }
};