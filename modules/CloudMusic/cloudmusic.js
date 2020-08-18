const axios = require("axios");
const tough = require('tough-cookie');
require('axios-cookiejar-support').default(axios);
const cookieJar = new tough.CookieJar();


class CloudMusic {
  constructor(config) {
    this.config = require("object-assign-deep")({}, {
      api_url: "http://localhost:3000", search_limit: 10
    }, config);
    if (this.config.phone || this.config.email) {
      this.login().then((result) => {
        if (result) {
          console.log("Cloudmusic Account Login Succeed!");
        } else {
          console.error("Cloudmusic Account Login Failed, Check Your Account Id and Password");
        }
      }).catch((err) => {
        console.error(err);
        process.exit(1);
      })
    }
  }

  async login() {
    if (this.config.phone) {
      let res = await axios.get(this.config.api_url + "/login/cellphone", {
        params: {
          phone: this.config.phone,
          password: this.config.password
        },
        jar: cookieJar,
        withCredentials: true
      });
      return res.data.code === 200;
    } else if (this.config.email) {
      let res = await axios.get(this.config.api_url + "/login", {
        params: {
          email: this.config.email,
          password: this.config.password
        },
        jar: cookieJar,
        withCredentials: true
      });
      return res.data.code === 200;
    } else return null;
  }

  async checkLoginStatus() {
    if (this.config.phone || this.config.email) {
      let res = await axios.get(this.config.api_url + "/login/refresh", {
        jar: cookieJar,
        withCredentials: true
      });
      return res.data.code === 200;
    } else return null;
  }

  async checkMusicAvailable(id) {
    let res = await axios.get(this.config.api_url + "/check/music", {
      params: {id: id},
      jar: cookieJar,
      withCredentials: true
    });
    return res.data.success;
  }

  async getMusicUrl(id) {
    let res = await axios.get(this.config.api_url + "/song/url", {
      params: {
        id: id,
        br: 320000
      },
      jar: cookieJar,
      withCredentials: true
    });
    return res.data.data[0].url;
  }

  async getMusicLyric(id) {
    let res = await axios.get(this.config.api_url + "/lyric", {
      params: {id: id},
      jar: cookieJar,
      withCredentials: true
    });
    if (res.data["nolyric"] || res.data["uncollected"]) {
      return null;
    } else {
      return res.data["lrc"]["lyric"];
    }
  }

  async searchMusic(keywords) {
    let res = await axios.get(this.config.api_url + "/search", {
      params: {
        keywords: keywords,
        limit: this.config.search_limit
      },
      jar: cookieJar,
      withCredentials: true
    });
    if (res.data.code !== 200 || res.data.result["songCount"] === 0) return null;
    return res.data.result["songs"];
  }
}

module.exports = CloudMusic;