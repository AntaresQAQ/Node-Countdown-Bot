const configDefault = {
    cron: "0 0 6 * * *",
    groups: [88888888]
};

const config = CountdownBot.loadConfig(__dirname, configDefault);
const schedule = require("node-schedule");
const requestPromise = require("request-promise");
const cheerio = require("cheerio");

function generateHitokotoMessage(text, source, id) {
    return text + "\n\n---" + source + "\n\n" + `(Hitokoto ID:${id} https://hitokoto.cn/?id=${id})`;
}

async function fetchHitokotoById(id) {
    let res = await requestPromise.get({
        uri: "https://hitokoto.cn",
        qs: {id: id}
    });
    const $ = cheerio.load(res);
    return generateHitokotoMessage(
        $("#hitokoto_text").text(),
        $("#hitokoto_author").text(),
        id
    );
}

async function fetchRandomHitokoto() {
    let res = await requestPromise.get({
        uri: "https://v1.hitokoto.cn",
        json: true
    });
    return generateHitokotoMessage(res["hitokoto"], res["from"], res["id"]);
}

schedule.scheduleJob(config.cron, async () => {
    try {
        for (let group of config.groups) {
            try {
                await bot.sender.sendGroupMsgAsync(group, await fetchRandomHitokoto());
            } catch (e) {
                CountdownBot.log(e);
            }
        }
    } catch (e) {
        CountdownBot.log(e);
    }
});

bot.command("hitokoto [id]", "查询一言")
    .alias("一言")
    .usage("hitokoto\n" + "hitokoto [ID]")
    .action(async ({meta}, id) => {
        try {
            if (id) {
                await meta.$send(await fetchHitokotoById(id));
            } else {
                await meta.$send(await fetchRandomHitokoto());
            }
        } catch (e) {
            CountdownBot.log(e);
        }
    });

module.exports = {
    author: "Antares",
    version: 1.0,
    description: "一言广播 & 查询"
};