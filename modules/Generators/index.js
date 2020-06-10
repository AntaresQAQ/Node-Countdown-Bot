const configDefault = {
    msg_length: 300,
    max_length: 6000
}
const config = CountdownBot.loadConfig(__dirname, configDefault);

const bullshit = require("./bullshit.js");
const marketer = require("./marketer.js");


bot.command("generators", "生成器")
    .action(async ({meta}) => {
        await bot.executeCommandLine("generators -h", meta);
    });

bot.command("generators/bullshit <subject>", "狗屁不通文章生成器")
    .alias("狗屁不通")
    .option("-l,--length", "长度限制", {default: config.msg_length})
    .action(async ({meta, options}, subject) => {
        try {
            let length = parseInt(options.length);
            if (isNaN(length)) throw new ErrorMsg("非法的长度", meta);
            if (length > config.max_length) throw new ErrorMsg("超过长度限制", meta);
            let article = bullshit(subject, length);
            if (length > config.msg_length) {
                let url = await CountdownBot.util.ubuntuPasteBin(meta.userId, article);
                await meta.$send(url);
            } else {
                await meta.$send(article);
            }
        } catch (e) {
            CountdownBot.log(e);
        }
    });

bot.command("generators/marketer", "营销号生成器")
    .alias("营销号")
    .option("-m,--main <main>", "主体")
    .option("-e,--event <event>", "事件")
    .option("-o,--other <other>", "另一种说法")
    .action(async ({meta, options}) => {
        try {
            if (!options.main || !options.event || !options.other) throw new ErrorMsg("缺少参数", meta);
            await meta.$send(marketer(options.main, options.event, options.other));
        } catch (e) {
            CountdownBot.log(e);
        }
    });

module.exports = {
    author: "Antares",
    version: "1.0",
    description: "各种生成器"
}
