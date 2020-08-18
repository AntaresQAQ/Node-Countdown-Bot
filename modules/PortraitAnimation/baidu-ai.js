const axios = require("axios");
const schedule = require("node-schedule");
const querystring = require("querystring");

class BaiduAI {
  constructor(ClientId, ClientSecret) {
    let getToken = async () => {
      try {
        let res = await axios.post("https://aip.baidubce.com/oauth/2.0/token", null, {
          params: {
            grant_type: "client_credentials",
            client_id: ClientId,
            client_secret: ClientSecret
          }
        })
        if (res.data.error === "invalid_client") throw new Error(res.data.error_description);
        this.AccessToken = res.data.access_token;
        console.log("PortraitAnimation: Get Baidu Token Succeed!");
        let nextDate = new Date(Date.now() + parseInt(res.data.expires_in) * 1000 - 60000);
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
    let data = {image: image};
    if (mask_id) {
      data.type = "anime_mask";
      data.mask_id = mask_id;
    }
    let res = await axios.post("https://aip.baidubce.com/rest/2.0/image-process/v1/selfie_anime",
      querystring.stringify(data), {
        headers: {"Content-Type": "application/x-www-form-urlencoded"},
        params: {access_token: this.AccessToken},
      });
    return res.data;
  }
}

module.exports = BaiduAI;