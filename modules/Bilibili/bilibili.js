const Url = require("url");
const path = require("path");
const axios = require("axios");

const tab = [...'fZodR9XQDSUm21yCkr6zBqiveYah8bt4xsWpHnJE7jL5VG3guMTKNPAwcF'];
const sss = [11, 10, 3, 8, 4, 6];
const xor = 177451812;
const add = 8728348608;

module.exports = {
  av2bv(av) {
    let num = parseInt(av);
    if (isNaN(num) || num <= 0) return null;
    num = (num ^ xor) + add;
    let result = [...'BV1  4 1 7  '];
    for (let i = 0; i < 6; i++) {
      result[sss[i]] = tab[Math.floor(num / 58 ** i) % 58];
    }
    return result.join('');
  },
  bv2av(bv) {
    let result = 0;
    for (let i = 0; i < 6; i++) {
      result += tab.indexOf(bv[sss[i]]) * 58 ** i;
    }
    return `av${result - add ^ xor}`;
  },
  async url2bv(url) {
    let res = await axios.get(url, {
      headers: {
        "Accept": "application/json, text/plain, */*",
        "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) " +
          "AppleWebKit/537.36 (KHTML, like Gecko) " +
          "Chrome/81.0.4044.122 Safari/537.36",
        "Accept-Encoding": "gzip, deflate, br",
        "Accept-Language": "zh-CN,zh;q=0.9"
      }
    });
    return path.parse(Url.parse(res.config.url).pathname).base;
  }
}