const configDefault = {
  "using_av": false
};

const config = CountdownBot.loadConfig(__dirname, configDefault);

const Bilibili = require("./bilibili.js");
const {CQCode} = require("koishi");

bot.command("avbv <id>", "AV号BV号互转")
  .action(async ({meta}, id) => {
    try {
      const avRE = /[Aa][Vv]([0-9]+)/g;
      const bvRE = /[Bb][Vv][fZodR9XQDSUm21yCkr6zBqiveYah8bt4xsWpHnJE7jL5VG3guMTKNPAwcF]{10}/g;
      let search = avRE.exec(id);
      if (search) {
        let bv = Bilibili.av2bv(search[1]);
        if (!bv) throw new ErrorMsg("非法的AV号", meta);
        await meta.$send(bv);
        return;
      }
      search = bvRE.exec(id);
      if (!search) throw new ErrorMsg("非法的AV号或BV号", meta);
      await meta.$send(Bilibili.bv2av(search[0]));
    } catch (e) {
      CountdownBot.log(e);
    }
  });

bot.groups.receiver.on("message", async (meta) => {
  try {
    let search = /^[\s\S]*QQ小程序[\s\S]*哔哩哔哩[\s\S]*请使用最新版本手机QQ查看([\s\S]+)$/g.exec(meta.message);
    if (!search) return;
    let content = JSON.parse(CQCode.unescape(search[1]))["meta"];
    if (content["detail_1"]["appid"] !== "1109937557") return;
    let bv = await Bilibili.url2bv(content["detail_1"]["qqdocurl"]);
    if (config.using_av) {
      await meta.$send(Bilibili.bv2av(bv));
    } else {
      await meta.$send(bv);
    }
  } catch (e) {
    CountdownBot.log(e);
  }
});

module.exports = {
  author: "Antares",
  version: "1.0",
  description: "Bilibili插件"
}