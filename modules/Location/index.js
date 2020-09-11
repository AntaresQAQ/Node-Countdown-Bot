const configDefault = {
  api_key: ""
};

const config = CountdownBot.loadConfig(__dirname, configDefault);
const axios = require("axios");
const {CQCode} = require("koishi");

function makeLocationXML(lat, lon, address, name) {
  return "<?xml version='1.0' encoding='UTF-8' standalone='yes'?>" +
    "<msg serviceID=\"32\" templateID=\"1\" action=\"plugin\" " +
    "actionData=\"mqqapi://app/action?pkg=com.tencent.mobileqq&amp;" +
    "cmp=com.tencent.biz.PoiMapActivity&amp;type=sharedmap&amp;" +
    `lat=${lat}&amp;lon=${lon}&amp;title=${name}&amp;loc=${address}&amp;dpid=\" brief=\"[位置]${name}\" ` +
    "sourceMsgId=\"0\" url=\"\" flag=\"0\" adverSign=\"0\" multiMsgFlag=\"0\">" +
    "<item layout=\"2\">" +
    "<picture cover=\"https://pub.idqqimg.com/pc/misc/lbsshare_icon.jpg\" w=\"0\" h=\"0\" needRoundView=\"0\" />" +
    `<title>${name}</title>` +
    `<summary>${address}</summary>` +
    "</item>" +
    "<source name=\"\" icon=\"\" action=\"\" appid=\"-1\" />" +
    "</msg>"
}

function makeLoactionJSON(lat, lng, address, name) {
  return JSON.stringify({
    app: "com.tencent.map",
    desc: "地图",
    view: "LocationShare",
    ver: "0.0.0.1",
    prompt: "[应用]地图",
    from: 1,
    meta: {
      "Location.Search": {
        name, address, lat, lng,
        from: "plusPanel"
      }
    },
    config: {
      forward: 1,
      autosize: 1,
      type: "card"
    }
  });
}

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
      await meta.$send("[CQ:xml," +
        `data=${CQCode.escape(makeLocationXML(lat, lon, target.address, target.name), true)}][CQ:json,` +
        `data=${CQCode.escape(makeLoactionJSON(lat, lon, target.address, target.name), true)}]`);
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