const configDefault = {
  api_key: ""
};

const config = CountdownBot.loadConfig(__dirname, configDefault);
const axios = require("axios");

bot.command("where <keywords...>", "高德地图搜索")
  .option("-i,--id", "精确搜索")
  .action(async ({meta, options}, keywords) => {
    try {
      let res;
      if (options.id) {
        res = await axios.get("https://restapi.amap.com/v3/place/detail", {
          params: {
            key: config.api_key,
            id: keywords
          }
        });
      } else {
        res = await axios.get("https://restapi.amap.com/v3/place/text", {
          params: {
            key: config.api_key,
            keywords: keywords
          }
        });
      }
      let result = res.data;
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