const requestPromise = require("request-promise");
const RPCClient = require("@alicloud/pop-core").RPCClient;
const schedule = require("node-schedule");

class AliyunTTS {
  constructor(AccessKeyId, AccessKeySecret, AppKey) {
    this.AppKey = AppKey;
    let client = new RPCClient({
      accessKeyId: AccessKeyId,
      accessKeySecret: AccessKeySecret,
      endpoint: 'http://nls-meta.cn-shanghai.aliyuncs.com',
      apiVersion: '2019-02-28'
    });
    let getToken = async () => {
      try {
        this.Token = (await client.request('CreateToken')).Token;
        console.log("Read: Get Aliyun Token Succeed!");
        let nextDate = new Date(parseInt(this.Token.ExpireTime) * 1000 - 60000);
        schedule.scheduleJob(nextDate, getToken);
      } catch (e) {
        console.error("Read: Get Aliyun Token Failed, Check Your AccessKey!");
        process.exit(1);
      }
    }
    getToken().catch((err) => {
      console.error(err);
      process.exit(1);
    });
  }

  async getVoice(text, options) {
    let postBody = Object.assign({}, options, {
      appkey: this.AppKey,
      text: text,
      token: this.Token.Id,
      format: "wav"
    });
    let result = await requestPromise.post({
      uri: "https://nls-gateway.cn-shanghai.aliyuncs.com/stream/v1/tts",
      headers: {
        "Content-Type": "application/json",
      },
      body: postBody,
      json: true,
      encoding: null
    });
    return Buffer.from(result, "binary");
  }
}

module.exports = AliyunTTS;