const configDefault = {
    cron: "0 0 6 * * *",
    countdowns: {
        "group-id": [
            {
                name: "event name",
                time: "2020-1-1"
            }
        ]
    }
};
const config = CountdownBot.loadConfig(__dirname, configDefault);
delete config.countdowns["group-id"];
const schedule = require("node-schedule");
const moment = require("moment");

schedule.scheduleJob(config.cron, async () => {
    try {
        let now = new Date(moment().format("YYYY-MM-DD"));
        for (let group in config.countdowns) {
            try {
                // noinspection JSUnfilteredForInLoop
                for (let event of config.countdowns[group]) {
                    let time = new Date(event.time);
                    let delta = Math.ceil(moment(time).diff(now, "days", true));
                    if (delta < 0) continue;
                    let msg = () => {
                        if (delta) return `距离 ${event.name}(${moment(time).format('YYYY-MM-DD')}) 还有 ${delta} 天`;
                        else return `今天(${moment(time).format('YYYY-MM-DD')})是${event.name}`;
                    };
                    // noinspection JSUnfilteredForInLoop
                    await bot.sender.sendGroupMsg(parseInt(group), msg());
                }
            } catch (e) {
                CountdownBot.log(e);
            }
        }
    } catch (e) {
        CountdownBot.log(e);
    }
});

bot.groups.command("broadcast", "在当前群进行广播")
    .alias("广播")
    .action(async ({meta}) => {
        try {
            let events = config.countdowns[meta.groupId];
            let now = new Date(moment().format("YYYY-MM-DD"));
            if (!events) return;
            for (let event of events) {
                let time = new Date(event.time);
                let delta = Math.ceil(moment(time).diff(now, "days", true));
                if (delta < 0) continue;
                let msg = delta ?
                    `距离 ${event.name}(${moment(time).format('YYYY-MM-DD')}) 还有 ${delta} 天` :
                    `今天(${moment(time).format('YYYY-MM-DD')})是${event.name}`;
                await meta.$send(msg);
            }
        } catch (e) {
            CountdownBot.log(e);
        }
    });

module.exports = {
    author: "Antares",
    version: "1.0",
    description: "倒计时广播"
};