const requestPromise = require("request-promise");
const cookieJar = requestPromise.jar();

class CloudMusic {
    constructor(config) {
        this.config = config;
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
            let res = await requestPromise.get({
                uri: this.config.api_url + "/login/cellphone",
                qs: {
                    phone: this.config.phone,
                    password: this.config.password
                },
                jar: cookieJar,
                json: true
            });
            return res.code === 200;
        } else if (this.config.email) {
            let res = await requestPromise.get({
                uri: this.config.api_url + "/login",
                qs: {
                    email: this.config.email,
                    password: this.config.password
                },
                jar: cookieJar,
                json: true
            });
            return res.code === 200;
        } else return null;
    }

    async checkLoginStatus() {
        if (this.config.phone || this.config.email) {
            let res = await requestPromise.get({
                uri: this.config.api_url + "/login/refresh",
                jar: cookieJar,
                json: true
            });
            return res.code === 200;
        } else return null;
    }

    async checkMusicAvailable(id) {
        let res = await requestPromise.get({
            uri: this.config.api_url + "/check/music",
            qs: {id: id},
            jar: cookieJar,
            json: true
        });
        return res.success;
    }

    async getMusicUrl(id) {
        let res = await requestPromise.get({
            uri: this.config.api_url + "/song/url",
            qs: {
                id: id,
                br: 320000
            },
            jar: cookieJar,
            json: true
        });
        return res.data[0].url;
    }

    async getMusicLyric(id) {
        let res = await requestPromise.get({
            uri: this.config.api_url + "/lyric",
            qs: {
                id: id
            },
            jar: cookieJar,
            json: true
        });
        if (res.nolyric || res.uncollected) {
            return null;
        } else {
            return res.lrc.lyric;
        }
    }

    async searchMusic(keywords) {
        let res = await requestPromise.get({
            uri: this.config.api_url + "/search",
            qs: {
                keywords: keywords,
                limit: this.config.search_limit
            },
            jar: cookieJar,
            json: true
        });
        if (res.code !== 200 || res.result.songCount === 0) return null;
        return res.result.songs;
    }
}

module.exports = CloudMusic;