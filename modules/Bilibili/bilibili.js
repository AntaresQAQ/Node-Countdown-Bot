// const request = require("request");
// const Promise = require("bluebird");
// const Url = require("url");
// const path = require("path");

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
  }/*,
  async url2bv(url) {
    let res = await axios.request({
      url: url
    });
    console.log(res);
    return new Promise((resolve, reject) => {
      request(url, {followAllRedirects: true}, (err, res) => {
        if (err) reject(err);
        resolve(path.parse(Url.parse(res.request.href).pathname).name);
      });
    });
  }*/
}