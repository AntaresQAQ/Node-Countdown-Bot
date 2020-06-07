const configDefault = {
    api_url: "http://localhost:3000",
    search_limit: 10,
    phone: undefined,
    email: undefined,
    password: "123456789",
    inactive_groups: []
};

const config = CountdownBot.loadConfig(__dirname, configDefault);

const requestPromise = require("request-promise");
const {StatusCodeError} = require("request-promise/errors");
const cookieJar = requestPromise.jar();

async function login() {
    if (config.phone) {
        let res = await requestPromise.get({
            uri: config.api_url + "/login/cellphone",
            qs: {
                phone: config.phone,
                password: config.password
            },
            jar: cookieJar,
            json: true
        });
        return res.code === 200;
    } else if (config.email) {
        let res = await requestPromise.get({
            uri: config.api_url + "/login",
            qs: {
                email: config.email,
                password: config.password
            },
            jar: cookieJar,
            json: true
        });
        return res.code === 200;
    } else return undefined;
}

async function checkLoginStatus() {
    if (config.phone || config.email) {
        let res = await requestPromise.get({
            uri: config.api_url + "/login/refresh",
            jar: cookieJar,
            json: true
        });
        return res.code === 200;
    } else return undefined;
}

async function checkMusicAvailable(id) {
    let res = await requestPromise.get({
        uri: config.api_url + "/check/music",
        qs: {id: id},
        jar: cookieJar,
        json: true
    });
    return res.success;
}

async function getMusicUrl(id) {
    let res = await requestPromise.get({
        uri: config.api_url + "/song/url",
        qs: {
            id: id,
            br: 320000
        },
        jar: cookieJar,
        json: true
    });
    return res.data[0].url;
}

async function getMusicLyric(id) {
    let res = await requestPromise.get({
        uri: config.api_url + "/lyric",
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

async function searchMusic(keywords) {
    let res = await requestPromise.get({
        uri: config.api_url + "/search",
        qs: {
            keywords: keywords,
            limit: config.search_limit
        },
        jar: cookieJar,
        json: true
    });
    if (res.code !== 200 || res.result.songCount === 0) return null;
    return res.result.songs;
}

async function makeLyricUrl(id, lyric) {
    try {
        await requestPromise.post({
            uri: "https://paste.ubuntu.com/",
            form: {
                poster: id,
                syntax: "text",
                expiration: "",
                content: lyric
            },
            header: {
                "Accept": "application/json, text/plain, */*",
                "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) " +
                    "AppleWebKit/537.36 (KHTML, like Gecko) " +
                    "Chrome/81.0.4044.122 Safari/537.36",
                "Accept-Encoding": "gzip, deflate, br",
                "Accept-Language": "zh-CN,zh;q=0.9"
            }
        });
    } catch (e) {
        if (e instanceof StatusCodeError) {
            if (e.statusCode === 302) {
                return "https://paste.ubuntu.com" + e.response.headers.location;
            }
            throw e;
        }
        throw e;
    }
}

bot.groups.except(config.inactive_groups).plus(bot.discusses)
    .command("music <keywords...>", "网易云音乐点歌")
    .alias("音乐")
    .usage("music [关键词]")
    .option("-i,--id", "指定keywords为id")
    .option("-t,--type <type>", "返回类型[raw/link/record(default)]",
        {default: "record", isString: true})
    .option("-l,--lyric", "使用Ubuntu Paste Bin 发送歌词链接")
    .action(async ({meta, options}, keywords) => {
        try {
            if (await checkLoginStatus() === false) throw new ErrorMsg("网易云账号登陆失败！", meta);
            let type = (() => {
                if (options.type !== "record" &&
                    options.type !== "raw" &&
                    options.type !== "link") throw new ErrorMsg("非法的返回类型", meta);
                return options.type;
            })();
            if (type === "record" && !await bot.sender.canSendRecord())
                throw new ErrorMsg("您的CoolQ不支持发送语音", meta);
            if (options.id) {
                let id = parseInt(keywords);
                if (!await checkMusicAvailable(id)) throw new ErrorMsg("id对应的音乐不存在或无版权", meta);
                if (type === "raw") {
                    await meta.$send(`[CQ:music,type=163,id=${id}]`);
                } else {
                    let url = await getMusicUrl(id);
                    if (!url) throw new ErrorMsg("无法取得音乐链接，请检查是否为VIP歌曲", meta);
                    if (type === "link") {
                        await meta.$send(url);
                    } else if (type === "record") {
                        await meta.$send(`[CQ:record,file=${url}]`);
                    }
                }
                if (options.lyric) {
                    let lyric = await getMusicLyric(id);
                    if (!lyric) throw new ErrorMsg("该歌曲无歌词", meta);
                    let url = await makeLyricUrl(id, lyric);
                    await meta.$send(url);
                }
                return;
            }
            let musics = await searchMusic(keywords);
            if (!musics) throw new ErrorMsg("您搜索的歌曲不存在", meta);
            for (let music of musics) {
                let id = music.id;
                if (await checkMusicAvailable(id)) {
                    if (type === "raw") {
                        await meta.$send(`[CQ:music,type=163,id=${id}]`);
                    } else {
                        let url = await getMusicUrl(id);
                        if (!url) continue;
                        if (type === "link") {
                            await meta.$send(url);
                        } else if (type === "record") {
                            await meta.$send(`[CQ:record,file=${url}]`);
                        }
                    }
                    if (options.lyric) {
                        let lyric = await getMusicLyric(id);
                        if (!lyric) throw new ErrorMsg("该歌曲无歌词", meta);
                        let url = await makeLyricUrl(id, lyric);
                        await meta.$send(url);
                    }
                    return;
                }
            }
            throw new ErrorMsg("您搜索的歌曲可能不存在、无版权或为VIP歌曲", meta);
        } catch (e) {
            CountdownBot.log(e);
        }
    });

(async () => {
    if (config.phone || config.email) {
        if (await login()) {
            console.log("Cloudmusic Account Login Succeed!");
        } else {
            console.error("Cloudmusic Account Login Failed, Check Your Account Id and Password");
        }
    }
})().catch((err) => {
    console.error(err);
    process.exit(1);
});

module.exports = {
    author: "Antares",
    version: "1.0",
    description: "网易云音乐点歌"
};