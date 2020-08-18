global.ErrorMsg = class ErrorMsg {
  constructor(msg, meta) {
    this.msg = msg;
    this.meta = meta;
  }
}

const fsPromise = require("fs/promises");
const path = require("path");
const requestPromise = require("request-promise");
const {StatusCodeError} = require("request-promise/errors");
const {VM} = require("vm2");

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
    try {
      await requestPromise.post({
        uri: "https://paste.ubuntu.com/",
        form: {
          poster: poster,
          syntax: syntax || "text",
          expiration: expiration || "",
          content: content
        },
        header: {
          "Accept": "application/json, text/plain, */*",
          "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) " +
            "AppleWebKit/537.36 (KHTML, like Gecko) " +
            "Chrome/81.0.4044.122 Safari/537.36",
          "Accept-Encoding": "gzip, deflate, br",
          "Accept-Language": "zh-CN,zh;q=0.9"
        }
      });
    } catch (e) {
      if (e instanceof StatusCodeError) {
        if (e.statusCode === 302) {
          return "https://paste.ubuntu.com" + e.response.headers.location;
        }
        throw e;
      }
      throw e;
    }
  },
  vmRun(code, timeLimit) {
    let vm = new VM({
      sandbox: {},
      timeout: timeLimit || 1000,
    });
    return vm.run(code);
  }
};