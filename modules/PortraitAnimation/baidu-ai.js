const requestPromise = require("request-promise");
const schedule = require("node-schedule");
const querystring = require("querystring");

class BaiduAI {
  constructor(ClientId, ClientSecret) {
    let getToken = async () => {
      try {
        let res = await requestPromise.post({
          uri: "https://aip.baidubce.com/oauth/2.0/token",
          qs: {
            grant_type: "client_credentials",
            client_id: ClientId,
            client_secret: ClientSecret
          },
          json: true
        });
        if (res.error === "invalid_client") throw new Error(res.error_description);
        this.AccessToken = res.access_token;
        console.log("PortraitAnimation: Get Baidu Token Succeed!");
        let nextDate = new Date(Date.now() + parseInt(res.expires_in) * 1000 - 60000);
        schedule.scheduleJob(nextDate, getToken);
      } catch (e) {
        console.error("PortraitAnimation: Get Baidu Token Failed, Check Your ClientId and ClientSecret!");
        console.error(e);
        process.exit(1);
      }
    }
    getToken().catch((err) => {
      console.error(err);
      process.exit(1);
    });
  }

  async portraitAnimation(image, mask_id) {
    let postBody = {image: image};
    if (mask_id) {
      postBody.type = "anime_mask";
      postBody.mask_id = mask_id;
    }
    let res = await requestPromise.post({
      uri: "https://aip.baidubce.com/rest/2.0/image-process/v1/selfie_anime",
      header: {"Content-Type": "application/x-www-form-urlencoded"},
      qs: {access_token: this.AccessToken},
      body: querystring.stringify(postBody)
    });
    return JSON.parse(res);
  }
}

module.exports = BaiduAI;