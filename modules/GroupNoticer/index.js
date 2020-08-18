const configDefault = {
  welcomeMessage: " [@]\n哇，你来啦，要玩的开心哦！",
  inactive_group_increase: [],
  inactive_group_decrease: []
};

const config = CountdownBot.loadConfig(__dirname, configDefault);

bot.groups.except(config.inactive_group_increase).receiver
  .on("group-increase", async (meta) => {
    try {
      await bot.sender.sendGroupMsgAsync(meta.groupId,
        config.welcomeMessage.replace("[@]", `[CQ:at,qq=${meta.userId}]`));
    } catch (e) {
      CountdownBot.log(e);
    }
  });

bot.groups.except(config.inactive_group_decrease).receiver
  .on("group-decrease", async (meta) => {
    try {
      let leftUser = await bot.sender.getStrangerInfo(meta.userId);
      if (meta.subType === "leave") {
        await bot.sender.sendGroupMsgAsync(meta.groupId,
          `用户 ${leftUser.nickname}(${leftUser.userId}) 离开本群`);
      } else if (meta.subType === "kick") {
        await bot.sender.sendGroupMsgAsync(meta.groupId,
          `用户 ${leftUser.nickname}(${leftUser.userId}) 被 [CQ:at,qq=${meta.operatorId}] 踢出本群`);
      } else {
        CountdownBot.log("Leave Group " + meta.groupId);
      }
    } catch (e) {
      CountdownBot.log(e);
    }
  });

module.exports = {
  author: "Antares",
  version: "1.0",
  description: "通知器"
}