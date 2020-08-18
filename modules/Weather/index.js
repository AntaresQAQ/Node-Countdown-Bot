const configDefault = {
  api_key: "" //和风天气 https://www.heweather.com
};

const config = CountdownBot.loadConfig(__dirname, configDefault);
const axios = require("axios");

async function getWeatherData(location, type1, type2) {
  let result = await axios.get(`https://free-api.heweather.net/s6/${type1}/${type2}`, {
    params: {
      location: location,
      key: config.api_key,
      lang: "zh"
    }
  });
  return result.data['HeWeather6'][0];
}

function generateLocation(data) {
  return `查询位置: ${data["location"]},${data["parent_city"]},${data["admin_area"]},${data["cnty"]}\n` +
    `时区: ${data["tz"]}\n经度: ${data["lon"]}\n纬度: ${data["lat"]}\n`;
}

function generateWeather(data) {
  return `当前天气: ${data["cond_txt"]}\n当前温度: ${data["tmp"]}摄氏度\n` +
    `风向风力: ${data["wind_dir"]} ${data["wind_sc"]}级\n`;
}

function generateForecast(day, data) {
  return `${"今明后"[day]}天(${data['date']}):\n白天天气: ${data['cond_txt_d']}\n` +
    `夜间天气: ${data['cond_txt_n']}\n最高温度: ${data['tmp_max']}摄氏度\n最低温度: ${data['tmp_min']}摄氏度\n`
}

bot.command("weather <location>", "天气查询")
  .alias("天气")
  .usage("weather [地名]\n" +
    "weather [半角逗号分割小到大的行政区]\n" +
    "weather [城市代码]\n" +
    "weather [IP地址]\n" +
    "weather [经度,纬度]")
  .action(async ({meta}, location) => {
    try {
      let weatherNow = await getWeatherData(location, "weather", "now");
      let weatherForecast = await getWeatherData(location, "weather", "forecast");
      if (weatherNow.status !== "ok") throw new ErrorMsg(weatherNow.status, meta);
      if (weatherForecast.status !== "ok") throw new ErrorMsg(weatherForecast.status, meta);
      let airNow = await getWeatherData(weatherNow['basic']['parent_city'], "air", "now");
      let buffer_list = [
        Buffer.from(generateLocation(weatherNow['basic'])),
        Buffer.from(`更新时间:${weatherNow['update']['loc']}\n\n`),
        Buffer.from(generateWeather(weatherNow['now'])),
      ];
      if (airNow['status'] === "ok") {
        buffer_list.push(Buffer.from(
          `空气质量: ${airNow['air_now_city']["qlty"]}\n` +
          `空气质量指数(AQI): ${airNow['air_now_city']["aqi"]}\n`));
      }
      buffer_list.push(Buffer.from("\n最近三天:\n"));
      let dailyForecast = weatherForecast['daily_forecast'];
      for (let index in dailyForecast) {
        // noinspection JSUnfilteredForInLoop
        buffer_list.push(Buffer.from(generateForecast(index, dailyForecast[index])));
        if (index >= 2) break;
        buffer_list.push(Buffer.from("\n"));
      }
      await meta.$send(Buffer.concat(buffer_list).toString());
    } catch (e) {
      CountdownBot.log(e);
    }
  });

module.exports = {
  author: "Antares",
  version: "1.0",
  description: "天气查询"
};