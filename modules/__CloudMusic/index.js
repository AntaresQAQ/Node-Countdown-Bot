const configDefault = {
  api_url: "http://localhost:3000",
  search_limit: 10,
  phone: undefined,
  email: undefined,
  password: "123456789",
  inactive_groups: []
};

const config = CountdownBot.loadConfig(__dirname, configDefault);

const CloudMusic = new (require("./cloudmusic.js"))({
  api_url: config.api_url,
  search_limit: config.search_limit,
  phone: config.phone,
  email: config.email,
  password: config.password
});

bot.groups.except(config.inactive_groups).plus(bot.discusses)
  .command("music <keywords...>", "网易云音乐点歌")
  .alias("音乐")
  .usage("music [关键词]")
  .option("-i,--id", "指定keywords为id")
  .option("-t,--type <type>", "返回类型[raw/link/record(default)]",
    {default: "record", isString: true})
  .option("-l,--lyric", "使用Ubuntu Paste Bin 发送歌词链接")
  .action(async ({meta, options}, keywords) => {
    try {
      if (await CloudMusic.checkLoginStatus() === false) throw new ErrorMsg("网易云账号登陆失败！", meta);
      let type = options.type;
      if (type !== "record" && type !== "raw" && type !== "link")
        throw new ErrorMsg("非法的返回类型", meta);
      if (type === "record" && !await bot.sender.canSendRecord())
        throw new ErrorMsg("您的CoolQ不支持发送语音", meta);
      if (options.id) {
        let id = parseInt(keywords);
        if (!await CloudMusic.checkMusicAvailable(id))
          throw new ErrorMsg("id对应的音乐不存在或无版权", meta);
        if (type === "raw") {
          await meta.$send(`[CQ:music,type=163,id=${id}]`);
        } else {
          let url = await CloudMusic.getMusicUrl(id);
          if (!url) throw new ErrorMsg("无法取得音乐链接，请检查是否为VIP歌曲", meta);
          if (type === "link") {
            await meta.$send(url);
          } else if (type === "record") {
            await meta.$send(`[CQ:record,file=${url}]`);
          }
        }
        if (options.lyric) {
          let lyric = await CloudMusic.getMusicLyric(id);
          if (!lyric) throw new ErrorMsg("该歌曲无歌词", meta);
          let url = await CountdownBot.util.ubuntuPasteBin(id, lyric);
          await meta.$send(url);
        }
        return;
      }
      let musics = await CloudMusic.searchMusic(keywords);
      if (!musics) throw new ErrorMsg("您搜索的歌曲不存在", meta);
      for (let music of musics) {
        let id = music.id;
        if (await CloudMusic.checkMusicAvailable(id)) {
          if (type === "raw") {
            await meta.$send(`[CQ:music,type=163,id=${id}]`);
          } else {
            let url = await CloudMusic.getMusicUrl(id);
            if (!url) continue;
            if (type === "link") {
              await meta.$send(url);
            } else if (type === "record") {
              await meta.$send(`[CQ:record,file=${url}]`);
            }
          }
          if (options.lyric) {
            let lyric = await CloudMusic.getMusicLyric(id);
            if (!lyric) throw new ErrorMsg("该歌曲无歌词", meta);
            let url = await CountdownBot.util.ubuntuPasteBin(id, lyric);
            await meta.$send(url);
          }
          return;
        }
      }
      throw new ErrorMsg("您搜索的歌曲可能不存在、无版权或为VIP歌曲", meta);
    } catch (e) {
      CountdownBot.log(e);
    }
  });

module.exports = {
  author: "Antares",
  version: "1.0",
  description: "网易云音乐点歌"
};