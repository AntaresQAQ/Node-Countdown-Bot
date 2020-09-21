const configDefault = {
  NoPrefix: true,
  inactive_groups: []
};

const config = CountdownBot.loadConfig(__dirname, configDefault);

const {SignInData, SignInDB} = require("./sign-in.js");
const moment = require("moment");
const db = new SignInDB();

bot.groups.except(config.inactive_groups)
  .command("sign-in", "签到")
  .alias("签到")
  .shortcut("签到", {prefix: !config.NoPrefix})
  .shortcut("签到儿", {prefix: !config.NoPrefix})
  .action(async ({meta}) => {
      try {
        let groupId = parseInt(meta.groupId);
        let userId = parseInt(meta.userId);
        let lastSignInData = await db.getLastSignInData(groupId, userId);
        let lastTime = new Date(lastSignInData.time * 1000);
        let currentTime = new Date();
        let totalTimes = await db.calcTotalSignInTimes(groupId, userId);
        let monthTimes = await db.calcMonthSignInTimes(groupId, userId);

        if (lastTime.getFullYear() === currentTime.getFullYear() &&
          lastTime.getMonth() === currentTime.getMonth() &&
          lastTime.getDate() === currentTime.getDate()) {
          // noinspection JSUnresolvedVariable
          let msg = `[CQ:at,qq=${userId}]今天已经签过到啦！
连续签到：${lastSignInData.duration}天
当前积分：${lastSignInData.score}
本月签到次数：${monthTimes}
累计群签到次数：${totalTimes}`;
          await meta.$send(msg);
          return;
        }
        let signInData = new SignInData(groupId, userId, parseInt(currentTime.getTime() / 1000));

        let tomorrowTime = new Date(lastTime.getFullYear(),
          lastTime.getMonth(), lastTime.getDate() + 1);
        // noinspection JSUnresolvedFunction
        if (tomorrowTime.getFullYear() === currentTime.getFullYear() &&
          tomorrowTime.getMonth() === currentTime.getMonth() &&
          tomorrowTime.getDate() === currentTime.getDate())
          signInData.duration = lastSignInData.duration + 1;
        else
          signInData.duration = 1;

        let durationAdd = signInData.duration <= 5 ? 0 : Math.round(2.75 * Math.log(signInData.duration - 4) - 1);
        signInData.scoreChanges = 10 + durationAdd;
        signInData.score = lastSignInData.score + signInData.scoreChanges;
        await db.saveSignInData(signInData);
        let msg = `给[CQ:at,qq=${userId}]签到成功了！
连续签到：${signInData.duration}天
积分增加：${signInData.scoreChanges}
连续签到加成：${durationAdd}
当前积分：${signInData.score}
本月签到次数：${monthTimes + 1}
累计群签到次数：${totalTimes + 1}`;
        await meta.$send(msg);
      } catch
        (e) {
        CountdownBot.log(e);
      }
    }
  )
  .subcommand("sign-in-record", "签到记录查询")
  .alias("签到记录")
  .option("-m,--month <month>", "指定月份查询，默认当前月")
  .option("-y,--year <year>", "指定年份查询，必须指定月份")
  .action(async ({meta, options}) => {
    try {
      let timeBegin = new Date();
      timeBegin.setHours(0, 0, 0, 0);
      timeBegin.setDate(1);
      if (options.month) {
        let month = parseInt(options.month);
        if (isNaN(month) || month < 1 || month > 12) throw new ErrorMsg("非法的月份", meta);
        timeBegin.setMonth(month - 1);
      }
      if (options.year) {
        if (!options.month) throw new ErrorMsg("指定年份必须指定月份", meta);
        let year = parseInt(options.year);
        if (isNaN(year)) throw new ErrorMsg("非法的年份", meta);
        timeBegin.setFullYear(year);
      }
      let timeEnd = new Date(timeBegin.getFullYear(), timeBegin.getMonth() + 1);
      let signInData = await db.getSignInData(
        parseInt(timeBegin.getTime() / 1000),
        parseInt(timeEnd.getTime() / 1000),
        parseInt(meta.groupId),
        parseInt(meta.userId)
      );
      let buffers = [];
      buffers.push(Buffer.from(`[CQ:at,qq=${meta.userId}]\n`));
      buffers.push(Buffer.from(`查询到${signInData.length}条签到记录：\n`));
      buffers.push(Buffer.from("日期 时间 积分 积分变化\n"));
      // noinspection JSUnresolvedFunction
      signInData.forEach(data => {
        let timeString = moment(new Date(data.time * 1000)).format("YYYY/MM/DD HH:mm");
        buffers.push(Buffer.from(`${timeString} ${data.score} +${data.scoreChanges}\n`));
      });
      await meta.$send(Buffer.concat(buffers).toString());
    } catch (e) {
      CountdownBot.log(e);
    }
  });

bot.users.command("rating", "签到积分查询")
  .alias("签到积分")
  .action(async ({meta}) => {
    try {
      let userData = await db.getUserData(meta.userId);
      // noinspection JSUnresolvedVariable
      let buffers = [Buffer.from(`查询到您在${userData.length}个群有签到记录:\n`)];
      for (let data of userData) {
        let groupInfo = await bot.sender.getGroupInfo(data.groupId);
        buffers.push(Buffer.from(`在 [${groupInfo.groupName}](${groupInfo.groupId}) 积分为: ${data.score}\n`))
      }
      await meta.$send(Buffer.concat(buffers).toString());
    } catch (e) {
      CountdownBot.log(e);
    }
  });


module.exports = {
  author: "Antares",
  version: "1.0",
  description: "签到"
}