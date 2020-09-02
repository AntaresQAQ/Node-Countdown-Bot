const axios = require("axios");
const urlencode = require("urlencode");
const https = require("https");

bot.command("couplet <text>", "对对联")
  .alias("对联")
  .usage("couplet [上联]")
  .action(async ({meta}, text) => {
    try {
      // Supported by https://ai.binwang.me/couplet/
      let result = await axios.get(`https://ai-backend.binwang.me/chat/couplet/${urlencode(text)}`, {
        timeout: 30000,
        httpsAgent: new https.Agent({rejectUnauthorized: false})
      });
      await meta.$send("上联：" + text + "\n下联：" + result.data.output);
    } catch (e) {
      CountdownBot.log(e);
    }
  });

module.exports = {
  author: "Antares",
  version: "1.0",
  description: "对联机"
};