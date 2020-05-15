const configDefault = {
    max_length: 500
}

const config = CountdownBot.loadConfig(__dirname, configDefault) || configDefault;
const qrCode = require("bluebird").promisifyAll(require("qrcode"));

bot.command("qrcode <text...>")
    .alias("二维码")
    .usage("生成二维码 | qrcode [内容]")
    .action(async ({meta}, text) => {
        try {
            if (!await bot.sender.canSendImage()) {
                await meta.$send("您的CoolQ不支持发送图片");
                return;
            }
            if (text.length > config.max_length) {
                await meta.$send("字符串长度超过限制");
                return;
            }
            let result = (await qrCode.toDataURLAsync(text)).split(",")[1];
            await meta.$send(`[CQ:image,file=base64://${result}]`);
        } catch (e) {
            CountdownBot.log(e, meta.$send)
        }
    });


module.exports = {
    author: "Antares",
    version: 1.0,
    description: "二维码生成器"
};