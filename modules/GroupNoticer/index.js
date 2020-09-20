const configDefault = {
  welcomeMessages: {
    88888888: "自定义内容"
  },
  defaultWelcomeMessage: "[@]\n哇，你来啦，要玩的开心哦！"
};

const config = CountdownBot.loadConfig(__dirname, configDefault);

bot.groups.receiver.on("group-increase", async (meta) => {
  try {
    if (config.welcomeMessages[meta.groupId]) {
      await bot.sender.sendGroupMsgAsync(meta.groupId,
        config.welcomeMessages[meta.groupId].replace("[@]", `[CQ:at,qq=${meta.userId}]`));
    } else if (config.defaultWelcomeMessage) {
      await bot.sender.sendGroupMsgAsync(meta.groupId,
        config.defaultWelcomeMessage.replace("[@]", `[CQ:at,qq=${meta.userId}]`));
    }
  } catch (e) {
    CountdownBot.log(e);
  }
});

bot.groups.receiver.on("group-decrease", async (meta) => {
  try {
    // let leftUser = await bot.sender.getStrangerInfo(meta.userId);
    if (meta.subType === "leave") {
      // await bot.sender.sendGroupMsgAsync(meta.groupId,
      //   `用户 ${leftUser.nickname}(${leftUser.userId}) 已离开本群`);
      await bot.sender.sendGroupMsgAsync(meta.groupId, `用户 ${meta.userId} 已离开本群`);
    } else if (meta.subType === "kick") {
      // await bot.sender.sendGroupMsgAsync(meta.groupId,
      //   `用户 ${leftUser.nickname}(${leftUser.userId}) 被 [CQ:at,qq=${meta.operatorId}] 踢出本群`);
      await bot.sender.sendGroupMsgAsync(meta.groupId,
        `用户 ${meta.userId} 被 [CQ:at,qq=${meta.operatorId}] 踢出本群`);
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