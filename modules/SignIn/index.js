const configDefault = {
    inactive_groups: []
};

const config = CountdownBot.loadConfig(__dirname, configDefault);

const path = require("path");
const Promise = require("bluebird");
const sqlite3 = require("sqlite3").verbose();
const moment = require("moment");
const db = new sqlite3.Database(path.join(CountdownBot.dataDir, "sign-in.db"))

class SignInData {
    constructor(groupId, userId, time, duration, score, scoreChanges) {
        this.groupId = groupId;
        this.userId = userId;
        this.time = time || 0;
        this.duration = duration || 0;
        this.score = score || 0;
        this.scoreChanges = scoreChanges || 0;
    }
}

class UserData {
    constructor(groupId, userId, score) {
        this.groupId = groupId;
        this.userId = userId;
        this.score = score || 0;
    }
}

db.serialize(() => {
    db.run("CREATE TABLE IF NOT EXISTS SIGN_IN(" +
        "GROUP_ID      INTEGER NOT NULL," +
        "USER_ID       INTEGER NOT NULL," +
        "TIME          INTEGER NOT NULL," +
        "DURATION      INTEGER NOT NULL," +
        "SCORE         INTEGER NOT NULL," +
        "SCORE_CHANGES INTEGER NOT NULL)", err => {
        if (err) {
            console.error(err);
            process.exit(1);
        }
        db.run("CREATE INDEX IF NOT EXISTS SIGN_IN_GROUP_ID_INDEX ON SIGN_IN(GROUP_ID)");
        db.run("CREATE INDEX IF NOT EXISTS SIGN_IN_USER_ID_INDEX  ON SIGN_IN(USER_ID)");
        db.run("CREATE INDEX IF NOT EXISTS SIGN_IN_TIME_INDEX     ON SIGN_IN(TIME)");
    });
    db.run("CREATE TABLE IF NOT EXISTS USERS(" +
        "GROUP_ID      INTEGER NOT NULL," +
        "USER_ID       INTEGER NOT NULL," +
        "SCORE         INTEGER NOT NULL)", err => {
        if (err) {
            console.error(err);
            process.exit(1);
        }
        db.run("CREATE INDEX IF NOT EXISTS USERS_GROUP_ID_INDEX   ON USERS(GROUP_ID)");
        db.run("CREATE INDEX IF NOT EXISTS USERS_USER_ID_INDEX    ON USERS(USER_ID)");
    });
});

function calcTotalSignInTimes(groupId, userId) {
    return new Promise((resolve, reject) => {
        db.get("SELECT COUNT(*) FROM SIGN_IN WHERE GROUP_ID = ? AND USER_ID = ?",
            [groupId, userId], (err, row) => {
                if (err) reject(err);
                else resolve(row["COUNT(*)"]);
            });
    });
}

function getLastSignInTime(groupId, userId) {
    return new Promise(((resolve, reject) => {
        db.get("SELECT MAX(TIME) FROM SIGN_IN WHERE GROUP_ID = ? AND USER_ID = ?",
            [groupId, userId], (err, row) => {
                if (err) reject(err);
                else resolve(row["MAX(TIME)"]);
            })
    }));
}

function getLastSignInData(groupId, userId) {
    return new Promise(async (resolve, reject) => {
        try {
            if (await calcTotalSignInTimes(groupId, userId)) {
                let lastTime = await getLastSignInTime(groupId, userId);
                db.get("SELECT * FROM SIGN_IN WHERE GROUP_ID = ? AND USER_ID = ? AND TIME = ?",
                    [groupId, userId, lastTime], (err, row) => {
                        if (err) reject(err);
                        else resolve(new SignInData(
                            groupId, userId, row["TIME"], row["DURATION"], row["SCORE"], row["SCORE_CHANGES"]));
                    });
            } else {
                resolve(new SignInData(groupId, userId));
            }
        } catch (e) {
            reject(e);
        }
    });
}

function calcMonthSignInTimes(groupId, userId) {
    let this_month = new Date();
    this_month.setDate(1);
    this_month.setHours(0, 0, 0, 0);
    return new Promise((resolve, reject) => {
        db.get("SELECT COUNT(*) FROM SIGN_IN WHERE GROUP_ID = ? AND USER_ID = ? AND TIME >= ?",
            [groupId, userId, parseInt(this_month.getTime() / 1000)],
            (err, row) => {
                if (err) reject(err);
                else resolve(row["COUNT(*)"]);
            });
    });
}

function saveSignInData(signInData) {
    return new Promise((resolve, reject) => {
        db.run("INSERT INTO SIGN_IN (GROUP_ID,USER_ID,TIME,DURATION,SCORE,SCORE_CHANGES) VALUES (?,?,?,?,?,?)", [
            signInData.groupId,
            signInData.userId,
            signInData.time,
            signInData.duration,
            signInData.score,
            signInData.scoreChanges
        ], err => {
            if (err) reject(err);
            db.get("SELECT COUNT(*) FROM USERS WHERE GROUP_ID = ? AND USER_ID = ?", [
                signInData.groupId,
                signInData.userId
            ], (err, row) => {
                if (err) reject(err);
                else if (row["COUNT(*)"]) {
                    db.run("UPDATE USERS SET SCORE = ? WHERE GROUP_ID = ? AND USER_ID = ?", [
                        signInData.score,
                        signInData.groupId,
                        signInData.userId
                    ], (err) => {
                        if (err) reject(err);
                        else resolve();
                    });
                } else {
                    db.run("INSERT INTO USERS (GROUP_ID,USER_ID,SCORE) VALUES (?,?,?)", [
                        signInData.groupId,
                        signInData.userId,
                        signInData.score
                    ], (err) => {
                        if (err) reject(err);
                        else resolve();
                    })
                }
            });
        });
    });
}

function getSignInData(timeBegin, timeEnd, groupId, userId) {
    return new Promise((resolve, reject) => {
        if (userId) {
            db.all("SELECT * FROM SIGN_IN WHERE GROUP_ID = ? AND USER_ID = ? AND TIME >= ? AND TIME <= ?",
                [groupId, userId, timeBegin, timeEnd], (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows.map((row) => new SignInData(
                        groupId,
                        userId,
                        row["TIME"],
                        row["DURATION"],
                        row["SCORE"],
                        row["SCORE_CHANGES"]
                    )));
                });
        } else {
            db.all("SELECT * FROM SIGN_IN WHERE GROUP_ID = ? AND TIME >= ? AND TIME < ?",
                [groupId, timeBegin, timeEnd], (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows.map((row) => new SignInData(
                        groupId,
                        row["USER_ID"],
                        row["TIME"],
                        row["DURATION"],
                        row["SCORE"],
                        row["SCORE_CHANGES"]
                    )));
                });
        }
    });
}

function getUserData(userId) {
    return new Promise((resolve, reject) => {
        db.all("SELECT * FROM USERS WHERE USER_ID = ?", [userId],
            (err, rows) => {
                if (err) reject(err);
                else resolve(rows.map(row => new UserData(row["GROUP_ID"], userId, row["SCORE"])));
            });
    });
}

bot.groups.except(config.inactive_groups)
    .command("sign-in", "签到")
    .alias("签到")
    .action(async ({meta}) => {
            try {
                let groupId = parseInt(meta.groupId);
                let userId = parseInt(meta.userId);
                let lastSignInData = await getLastSignInData(groupId, userId);
                let lastTime = new Date(lastSignInData.time * 1000);
                let currentTime = new Date();
                let totalTimes = await calcTotalSignInTimes(groupId, userId);
                let monthTimes = await calcMonthSignInTimes(groupId, userId);

                if (lastTime.getFullYear() === currentTime.getFullYear() &&
                    lastTime.getMonth() === currentTime.getMonth() &&
                    lastTime.getDate() === currentTime.getDate()) {
                    let msg = `[CQ:at,qq=${userId}]今天已经签过到啦！
连续签到：${lastSignInData.duration}天
当前积分：${lastSignInData.score}
本月签到次数：${monthTimes}
累计群签到次数：${totalTimes}`;
                    await meta.$send(msg);
                    return;
                }
                let signInData = new SignInData(groupId, userId, parseInt(currentTime.getTime() / 1000));

                let tomorrowTime = new Date(lastTime.getFullYear(),
                    lastTime.getMonth(), lastTime.getDate() + 1);
                if (tomorrowTime.getFullYear() === currentTime.getFullYear() &&
                    tomorrowTime.getMonth() === currentTime.getMonth() &&
                    tomorrowTime.getDate() === currentTime.getDate())
                    signInData.duration = lastSignInData.duration + 1;
                else
                    signInData.duration = 1;

                let durationAdd = signInData.duration <= 5 ? 0 : Math.round(2.75 * Math.log(signInData.duration - 4) - 1);
                signInData.scoreChanges = 10 + durationAdd;
                signInData.score = lastSignInData.score + signInData.scoreChanges;
                saveSignInData(signInData);
                let msg = `给[CQ:at,qq=${userId}]签到成功了！
连续签到：${signInData.duration}天
积分增加：${signInData.scoreChanges}
连续签到加成：${durationAdd}
当前积分：${signInData.score}
本月签到次数：${monthTimes + 1}
累计群签到次数：${totalTimes + 1}`;
                await meta.$send(msg);
            } catch
                (e) {
                CountdownBot.log(e);
            }
        }
    )
    .subcommand("sign-in-record", "签到记录查询")
    .alias("签到记录")
    .option("-m,--month <month>", "指定月份查询，默认当前月")
    .option("-y,--year <year>", "指定年份查询，必须指定月份")
    .action(async ({meta, options}) => {
        try {
            let timeBegin = new Date();
            timeBegin.setHours(0, 0, 0, 0);
            timeBegin.setDate(1);
            if (options.month) {
                let month = parseInt(options.month);
                if (isNaN(month) || month < 1 || month > 12) throw new ErrorMsg("非法的月份", meta);
                timeBegin.setMonth(month);
            }
            if (options.year) {
                if (!options.month) throw new ErrorMsg("指定年份必须指定月份", meta);
                let year = parseInt(options.year);
                if (isNaN(year)) throw new ErrorMsg("非法的年份", meta);
                timeBegin.setFullYear(year);
            }
            let timeEnd = new Date(timeBegin.getFullYear(), timeBegin.getMonth() + 1);
            let signInData = await getSignInData(
                parseInt(timeBegin.getTime() / 1000),
                parseInt(timeEnd.getTime() / 1000),
                parseInt(meta.groupId),
                parseInt(meta.userId)
            );
            let buffers = [];
            buffers.push(Buffer.from(`[CQ:at,qq=${meta.userId}]\n`));
            buffers.push(Buffer.from(`查询到${signInData.length}条签到记录：\n`));
            buffers.push(Buffer.from("日期 时间 积分 积分变化\n"));
            signInData.forEach(data => {
                let timeString = moment(new Date(data.time * 1000)).format("YYYY/MM/DD HH:mm:ss");
                buffers.push(Buffer.from(`${timeString} ${data.score} +${data.scoreChanges}\n`));
            });
            await meta.$send(Buffer.concat(buffers).toString());
        } catch (e) {
            CountdownBot.log(e);
        }
    });

bot.groups.except(config.inactive_groups).receiver.on("message", meta => {
    if (meta.message === "签到") bot.runCommand("sign-in", meta);
});

bot.users.command("rating", "签到积分查询")
    .alias("签到积分")
    .action(async ({meta}) => {
        try {

        } catch (e) {
            CountdownBot.log(e);
        }
    });


module.exports = {
    author: "Antares",
    version: "1.0",
    description: "签到"
}