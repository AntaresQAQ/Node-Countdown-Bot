const dnsPromise = require("dns").promises;

async function queryA(hostname) {
    try {
        let addresses = await dnsPromise.resolve4(hostname, {ttl: true});
        let buffers = [Buffer.from("Results:\n")];
        if (addresses instanceof Array) {
            addresses.forEach((address) => buffers.push(
                Buffer.from(`${address.address} TTL:${address.ttl}\n`)));
        } else {
            buffers.push(Buffer.from(addresses + "\n"));
        }
        return Buffer.concat(buffers);
    } catch (e) {
        return Buffer.from(e.toString() + "\n");
    }
}

async function queryCNAME(hostname) {
    try {
        let addresses = await dnsPromise.resolveCname(hostname);
        let buffers = [Buffer.from("Results:\n")];
        addresses.forEach((address) => buffers.push(Buffer.from(address + "\n")));
        return Buffer.concat(buffers);
    } catch (e) {
        return Buffer.from(e.toString() + "\n");
    }

}

async function queryMX(hostname) {
    try {
        let addresses = await dnsPromise.resolveMx(hostname);
        let buffers = [Buffer.from("Results:\n")];
        addresses.forEach((address) => buffers.push(
            Buffer.from(`EXC:${address.exchange} PRI:${address.priority}\n`)));
        return Buffer.concat(buffers);
    } catch (e) {
        return Buffer.from(e.toString() + "\n");
    }
}

async function queryNS(hostname) {
    try {
        let addresses = await dnsPromise.resolveNs(hostname);
        let buffers = [Buffer.from("Results:\n")];
        addresses.forEach((address) => buffers.push(Buffer.from(address + "\n")));
        return Buffer.concat(buffers);
    } catch (e) {
        return Buffer.from(e.toString() + "\n");
    }

}

async function queryTXT(hostname) {
    try {
        let addresses = await dnsPromise.resolveTxt(hostname);
        let buffers = [Buffer.from("Results:\n")];
        addresses.forEach((address) => Buffer.from(address.toString()));
        return Buffer.concat(buffers);
    } catch (e) {
        return Buffer.from(e.toString() + "\n");
    }

}

const TypesDNS = {
    A: {name: "IPv4地址", query: queryA},
    CNAME: {name: "规范名称记录", query: queryCNAME},
    MX: {name: "邮件交换记录", query: queryMX},
    NS: {name: "域名服务器记录", query: queryNS},
    TXT: {name: "文字记录", query: queryTXT},
}

const helpString = () => {
    let help = "dns [hostname] [类型](可选)\n 支持的类型列表:";
    for (let type in TypesDNS) {
        help += `\n${type}:${TypesDNS[type].name}`;
    }
    return help;
}

bot.command("dns <hostname> <type>", "DNS查询")
    .usage(helpString())
    .action(async ({meta}, hostname, type) => {
        try {
            if (type === undefined) {
                let buffers = [];
                for (let type in TypesDNS) {
                    buffers.push(Buffer.from(`Type: ${type}\n`));
                    buffers.push(await TypesDNS[type].query(hostname));
                    buffers.push(Buffer.from("\n"));
                }
                await meta.$send(Buffer.concat(buffers).toString());
                return;
            }
            if (TypesDNS[type] === undefined) throw new ErrorMsg("非法的查询类型", meta);
            await meta.$send((await TypesDNS[type].query(hostname)).toString());
        } catch (e) {
            CountdownBot.log(e);
        }
    });

module.exports = {
    author: "Antares",
    version: "1.0",
    description: "DNS查询"
};