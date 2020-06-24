const tab = [...'fZodR9XQDSUm21yCkr6zBqiveYah8bt4xsWpHnJE7jL5VG3guMTKNPAwcF'];
const sss = [11, 10, 3, 8, 4, 6];
const xor = 177451812;
const add = 8728348608;

function av2bv(av) {
    let num = parseInt(av);
    if (isNaN(num) || num <= 0) return null;
    num = (num ^ xor) + add;
    let result = [...'BV1  4 1 7  '];
    for (let i = 0; i < 6; i++) {
        result[sss[i]] = tab[Math.floor(num / 58 ** i) % 58];
    }
    return result.join('');
}

function bv2av(bv) {
    let result = 0;
    for (let i = 0; i < 6; i++) {
        result += tab.indexOf(bv[sss[i]]) * 58 ** i;
    }
    return `av${result - add ^ xor}`;
}

bot.command("avbv <id>", "AV号BV号互转")
    .action(async ({meta}, id) => {
        try {
            const avRE = /[Aa][Vv]([0-9]+)/g;
            const bvRE = /[Bb][Vv][fZodR9XQDSUm21yCkr6zBqiveYah8bt4xsWpHnJE7jL5VG3guMTKNPAwcF]{10}/g;
            let search = avRE.exec(id);
            if (search) {
                let bv = av2bv(search[1]);
                if (!bv) throw new ErrorMsg("非法的AV号", meta);
                await meta.$send(bv);
                return;
            }
            search = bvRE.exec(id);
            if (!search) throw new ErrorMsg("非法的AV号或BV号", meta);
            await meta.$send(bv2av(search[0]));
        } catch (e) {
            CountdownBot.log(e);
        }
    });

module.exports = {
    author: "Antares",
    version: "1.0",
    description: "AV号BV号互转"
}