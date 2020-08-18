const requestPromise = require("request-promise");

bot.command("oiwiki <keywords>", "OI-Wiki查询")
  .usage("oiwiki [查询关键词]")
  .example("oiwiki 线段树")
  .action(async ({meta}, keywords) => {
    try {
      let results = await requestPromise.get({
        uri: "https://search.oi-wiki.org:8443",
        qs: {s: keywords},
        json: true
      });
      let buffers = [Buffer.from(`查询到${results.length}条相关内容：\n`)];
      for (let result of results) {
        buffers.push(Buffer.from(`${result.title}: https://oi-wiki.org${result.url}\n\n`))
      }
      await meta.$send(Buffer.concat(buffers).toString());
    } catch (e) {
      CountdownBot.log(e);
    }
  });


module.exports = {
  author: "Antares",
  version: "1.0",
  description: "OI-Wiki查询"
}