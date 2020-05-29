const requestPromise = require("request-promise");
const RPCClient = require("@alicloud/pop-core").RPCClient;

async function getToken(AccessKeyId, AccessKeySecret) {
    let client = new RPCClient({
        accessKeyId: AccessKeyId,
        accessKeySecret: AccessKeySecret,
        endpoint: 'http://nls-meta.cn-shanghai.aliyuncs.com',
        apiVersion: '2019-02-28'
    });
    let result = await client.request('CreateToken');
    return result.Token;
}

async function getVoice(text, appKey, token, options) {
    let postBody = Object.assign({}, options, {
        appkey: appKey,
        text: text,
        token: token,
        format: "wav"
    });
    try {
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
    } catch (e) {
        throw e;
    }
}

module.exports = {
    getVoice: getVoice,
    getToken: getToken
}