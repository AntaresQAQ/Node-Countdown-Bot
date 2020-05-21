const requestPromise = require("request-promise");


bot.command("oier <name...>")
    .usage("oier [名字/缩写]")
    .action(async ({meta}, name) => {
        try {
            let result = await requestPromise({
                uri: "http://bytew.net/OIer/search.php",
                qs: {
                    method: "normal",
                    q: name
                },
                json: true,
                contentType: ""
            });
            let items = result.result.sort(() => (Math.random() - 0.5));
            if (!items.length) throw new ErrorMsg("找不到相关内容", meta);
            let buffers = [Buffer.from("查询到以下内容:\n")];
            for (let i = 0; i < items.length && i < 5; i++) {
                let item = items[i];
                buffers.push(Buffer.from(
                    `\n姓名: ${item.name}\n生理性别: ${{"-1": "女", "1": "男"}[item.sex] || "未知"}\n`));
                for(let award of eval(item.awards)) {
                    buffers.push(Buffer.from(
                        `在<${award.province}>${award.school}<${award.grade}>时参加`+
                        `<${award.identity}>以${award.score}分(全国排名${award.rank})的成绩获得<${award.award_type}>\n`));
                }
            }
            await meta.$send(Buffer.concat(buffers).toString());
        } catch (e) {
            CountdownBot.log(e);
        }
    });

module.exports = {
    author: "Antares",
    version: "1.0",
    description: "OIerDB(http://bytew.net/OIer)查询"
};