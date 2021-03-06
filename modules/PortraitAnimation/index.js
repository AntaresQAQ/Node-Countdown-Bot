const configDefault = {
  baidu_client_id: "xxxxxxxx",
  baidu_client_secret: "xxxxxxxx"
};
const config = CountdownBot.loadConfig(__dirname, configDefault);

const axios = require("axios");
const BaiduAI = require("./baidu-ai.js");
const client = new BaiduAI(config.baidu_client_id, config.baidu_client_secret);

bot.command("anime <...image>", "人像动漫化")
  .alias("动画化")
  .option("-m,--mask", "口罩ID (1-8)")
  .action(async ({meta, options}, image) => {
    try {
      if (!await bot.sender.canSendImage()) throw new ErrorMsg("您的CoolQ不支持发送图片", meta);
      if (options.mask) {
        let maskId = parseInt(options.mask);
        if (isNaN(maskId) || maskId < 1 || maskId > 8) throw new ErrorMsg("非法的口罩ID", meta);
      }
      const imageRE = /^\[CQ:image,file=([^,]+),url=([^\]]+)]$/g;
      let search = imageRE.exec(image);
      if (!search) {
        await meta.$send(`[CQ:at,qq=${meta.userId}] 请发送一张图片`);
        bot.onceMiddleware(async (meta1) => {
          try {
            search = imageRE.exec(meta1.message);
            if (!search) throw new ErrorMsg(`[CQ:at,qq=${meta1.userId}] 您发送的不是图片!`, meta1);
            let imageUrl = search[2];
            let res = await axios.get(imageUrl, {responseType: "arraybuffer"});
            let imageBase64 = Buffer.from(res.data).toString("base64");
            let result = await client.portraitAnimation(imageBase64, options.mask);
            if (result.error_code) throw new ErrorMsg(result.error_msg, meta1);
            await meta1.$send(`[CQ:image,file=base64://${result.image}]`);
          } catch (e) {
            CountdownBot.log(e);
          }
        }, meta);
        return;
      }
      let imageUrl = search[2];
      let res = await axios.get(imageUrl, {responseType: "arraybuffer"});
      let imageBase64 = Buffer.from(res.data).toString("base64");
      let result = await client.portraitAnimation(imageBase64, options.mask);
      if (result.error_code) throw new ErrorMsg(result.error_msg, meta);
      await meta.$send(`[CQ:image,file=base64://${result.image}]`);
    } catch (e) {
      CountdownBot.log(e);
    }
  });

module.exports = {
  author: "Antares",
  version: "1.0",
  description: "人像动画化"
}

