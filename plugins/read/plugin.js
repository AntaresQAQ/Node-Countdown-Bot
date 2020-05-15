const configDefault = {
    max_length: 300, // String length limit
    app_id: "", // Baidu AI Apps
    api_key: "",
    secret_key: "",
    volume: 8, // Volume 1(low)-10(high)
    speed: 4 //Speech rate 1(slow)-10(quick)
};

const config = CountdownBot.loadConfig(__dirname, configDefault);
const AipSpeechClient = require("baidu-aip-sdk").speech;
const util = require("util");
const client = new AipSpeechClient(config.app_id, config.api_key, config.secret_key);


bot.command('read <text...>')
    .usage("文字转语音 | read [文字]")
    .action(async ({meta}, text) => {
        try {
            if (!await bot.sender.canSendRecord()) {
                await meta.$send("您的CoolQ不支持发送语音");
                return;
            }
            if (text.length > config.max_length) {
                await meta.$send("字符串长度超过限制");
                return;
            }
            let result = await client.text2audio(text, {
                spd: config.speed,
                per: 4,
                vol: config.volume,
            });
            if (!(result.data instanceof Buffer)) throw Error(util.inspect(result.data));
            await meta.$send(`[CQ:record,file=base64://${result.data.toString("base64")}]`);
        } catch (e) {
            CountdownBot.log(e, meta.$send)
        }
    });

module.exports = {
    author: "Antares",
    version: 1.0,
    description: "文字转语音"
};