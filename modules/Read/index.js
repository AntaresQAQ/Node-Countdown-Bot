const configDefault = {
  maxLength: 300, // String length limit (1 - 300)
  appKey: "", // Aliyun Apps
  accessKeyId: "",
  accessKeySecret: "",
  voice: "Sitong", // https://help.aliyun.com/document_detail/84435.html
  volume: 50, // Volume 0(low) - 100(high)
  speech_rate: 0, //Speech rate -500(slow) - 500(quick)
  pitch_rate: 0, //Pitch rate -500(low) - 500(high)
  inactive_groups: []
};

const config = CountdownBot.loadConfig(__dirname, configDefault);
const tts = new (require("./aliyun-tts.js"))(config.accessKeyId, config.accessKeySecret, config.appKey);
const voices = require("./voices.json") || [];
const voiceSet = new Set(voices.map(voice => voice.voice));

function generateHelp() {
  let buffers = [Buffer.from("名字 voice参数 类型 语言\n")];
  for (let voice of voices) {
    buffers.push(Buffer.from(`${voice.name} ${voice.voice} ${voice.type} ${voice.lang}\n`));
  }
  return Buffer.concat(buffers).toString();
}

bot.groups.except(config.inactive_groups).plus(bot.discusses)
  .command('read <text...>', "文字转语音")
  .usage("read [文字]")
  .option("-l,--list", "查看支持的声色列表", {})
  .option("-v, --voice <voice>", "声色，使用-l,--list参数查看声色列表", {
    isString: true,
    default: config.voice
  })
  .option("-r,--rate <rate>", "语速 0(slow)~1000(quick)", {default: config.speech_rate + 500})
  .action(async ({meta, options}, text) => {
    try {
      if (options.list) {
        await meta.$send(generateHelp());
        return;
      }
      if (!await bot.sender.canSendRecord()) throw new ErrorMsg("您的CoolQ不支持发送语音", meta);
      if (text.length > config.maxLength) throw new ErrorMsg("字符串长度超过限制", meta);
      let speechRate = parseInt(options.rate);
      if (isNaN(speechRate)) throw new ErrorMsg("请检查参数rate值是否为数字范围内", meta)
      if (speechRate < 0 || speechRate > 1000) throw new ErrorMsg("请检查参数rate值是否在0~1000范围内", meta);
      if (!voiceSet.has(options.voice)) throw new ErrorMsg("未知的Voice", meta);
      let result = await tts.getVoice(text, {
        voice: options.voice,
        volume: config.volume,
        speech_rate: speechRate - 500,
        pitch_rate: config.pitch_rate
      });
      if (!(result instanceof Buffer)) throw new ErrorMsg(result, meta);
      let file = await CountdownBot.util.makeRecord(result, "wav");
      await meta.$send(`[CQ:record,file=${file}]`);
    } catch (e) {
      CountdownBot.log(e)
    }
  });

module.exports = {
  author: "Antares",
  version: "1.0",
  description: "文字转语音"
};