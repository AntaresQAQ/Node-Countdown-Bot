const configDefault = {
    max_length: 500
}

const config = CountdownBot.loadConfig(__dirname, configDefault) || configDefault;
const qrCode = require("bluebird").promisifyAll(require("qrcode"));

bot.command("qrcode <text...>", "生成二维码")
    .alias("二维码")
    .usage("qrcode [内容]")
    .action(async ({meta}, text) => {
        try {
            if (!await bot.sender.canSendImage()) throw new ErrorMsg("您的CoolQ不支持发送图片", meta);
            if (text.length > config.max_length) throw new ErrorMsg("字符串长度超过限制", meta);
            let result = (await qrCode.toDataURLAsync(text)).split(",")[1];
            await meta.$send(`[CQ:image,file=base64://${result}]`);
        } catch (e) {
            CountdownBot.log(e)
        }
    });


module.exports = {
    author: "Antares",
    version: "1.0",
    description: "二维码生成器"
};