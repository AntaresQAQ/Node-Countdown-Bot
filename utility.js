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
    return res.config.url;
  },
  vmRun(code, timeLimit) {
    let vm = new VM({
      sandbox: {},
      timeout: timeLimit || 1000,
    });
    return vm.run(code);
  },
  makeRecord(buffer, format) {
    return new Promise((resolve, reject) => {
      let file = md5(buffer) + ".amr";
      let target = path.join(CountdownBot.config.cqhttp_path, "data", "voices", file);
      fs.access(target, fs.constants.F_OK, err => {
        if (err) {
          let stream = new Stream.Duplex();
          stream.push(buffer);
          stream.push(null);
          ffmpeg().input(stream)
            .inputFormat(format)
            .output(target)
            .audioFrequency(8000)
            .audioBitrate("12.20k")
            .audioChannels(1)
            .duration(600)
            .format("amr")
            .on("end", () => resolve(file))
            .on("error", (err) => reject(err)).run();
        } else {
          resolve(file);
        }
      });
    });
  }
};