const configDefault = {
  api_key: ""
};

const config = CountdownBot.loadConfig(__dirname, configDefault);
const requestPromise = require("request-promise");

bot.command("where <keywords...>", "高德地图搜索")
  .option("-i,--id", "精确搜索")
  .action(async ({meta, options}, keywords) => {
    try {
      let result;
      if (options.id) {
        result = await requestPromise.get({
          uri: "https://restapi.amap.com/v3/place/detail",
          qs: {
            key: config.api_key,
            id: keywords
          },
          json: true,
          encode: "utf-8"
        });
      } else {
        result = await requestPromise.get({
          uri: "https://restapi.amap.com/v3/place/text",
          qs: {
            key: config.api_key,
            keywords: keywords
          },
          json: true,
          encode: "utf-8"
        });
      }
      if (result.status !== "1") throw new ErrorMsg(result.info, meta);
      if (!result.pois.length) throw new ErrorMsg("搜索无结果", meta);
      let target = result.pois[0];
      let location = target.location.split(",");
      let lon = location[0], lat = location[1];
      await meta.$send("[CQ:location," +
        `lat=${lat},lon=${lon},` +
        `content=${target.address},` +
        `title=${target.name}]`
      );
      if (!options.id) {
        let buffers = [];
        for (let i = 0; i < result.pois.length && i < 5; i++) {
          let item = result.pois[i];
          buffers.push(Buffer.from(
            `ID: ${item.id} | 名称: ${item.name} | 地址: ${item.address} | 类型: ${item.type}\n`));
        }
        await meta.$send(Buffer.concat(buffers).toString());
      }
    } catch (e) {
      CountdownBot.log(e);
    }
  });

module.exports = {
  author: "Antares",
  version: "1.0",
  description: "高德地图API查询"
}