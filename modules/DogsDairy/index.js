const requestPromise = require("request-promise");
const {VM} = require("vm2");


bot.command("dog", "舔狗日记(https://we.dog)")
    .alias("舔狗")
    .action(async ({meta}) => {
        try {
            let res = await requestPromise.get({
                uri: "https://we.dog/assets/js/index.js",
                json: false,
                timeout: 100000,
                header: {
                    "Accept": "application/json, text/plain, */*",
                    "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) " +
                        "AppleWebKit/537.36 (KHTML, like Gecko) " +
                        "Chrome/81.0.4044.122 Safari/537.36",
                    "Accept-Encoding": "gzip, deflate, br",
                    "Accept-Language": "zh-CN,zh;q=0.9"
                }
            });
            let vm = new VM({
                sandbox: {},
                timeout: 1000,
            });
            let result = vm.run(res + "soul");
            let msg = result[Math.floor(Math.random() * result.length)].replace(/\*\*/g, "");
            await meta.$send(msg);
        } catch (e) {
            CountdownBot.log(e);
        }
    });

module.exports = {
    author: "Antares",
    version: "1.0",
    description: "舔狗日记(https://we.dog)"
};