const requestPromise = require("request-promise");
const urlencode = require("urlencode");

bot.command("couplet <text>", "对对联")
    .alias("对联")
    .usage("couplet [上联]")
    .action(async ({meta}, text) => {
        try {
            // Supported by https://ai.binwang.me/couplet/
            let result = await requestPromise.get({
                uri: `https://ai-backend.binwang.me/chat/couplet/${urlencode(text)}`,
                json: true,
                timeout: 30000
            });
            await meta.$send("上联：" + text + "\n下联：" + result.output);
        } catch (e) {
            CountdownBot.log(e);
        }
    });

module.exports = {
    author: "Antares",
    version: 1.0,
    description: "对联机"
};