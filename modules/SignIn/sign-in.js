const path = require("path");
const Promise = require("bluebird");
const sqlite3 = require("sqlite3").verbose();


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

class SignInDB {
  constructor() {
    this.db = new sqlite3.Database(path.join(CountdownBot.dataDir, "sign-in.db"));
    this.db.serialize(() => {
      this.db.run("CREATE TABLE IF NOT EXISTS SIGN_IN(" +
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
        this.db.run("CREATE INDEX IF NOT EXISTS SIGN_IN_GROUP_ID_INDEX ON SIGN_IN(GROUP_ID)");
        this.db.run("CREATE INDEX IF NOT EXISTS SIGN_IN_USER_ID_INDEX  ON SIGN_IN(USER_ID)");
        this.db.run("CREATE INDEX IF NOT EXISTS SIGN_IN_TIME_INDEX     ON SIGN_IN(TIME)");
      });
      this.db.run("CREATE TABLE IF NOT EXISTS USERS(" +
        "GROUP_ID      INTEGER NOT NULL," +
        "USER_ID       INTEGER NOT NULL," +
        "SCORE         INTEGER NOT NULL)", err => {
        if (err) {
          console.error(err);
          process.exit(1);
        }
        this.db.run("CREATE INDEX IF NOT EXISTS USERS_GROUP_ID_INDEX   ON USERS(GROUP_ID)");
        this.db.run("CREATE INDEX IF NOT EXISTS USERS_USER_ID_INDEX    ON USERS(USER_ID)");
      });
    });
  }

  calcTotalSignInTimes(groupId, userId) {
    return new Promise((resolve, reject) => {
      this.db.get("SELECT COUNT(*) FROM SIGN_IN WHERE GROUP_ID = ? AND USER_ID = ?",
        [groupId, userId], (err, row) => {
          if (err) reject(err);
          else resolve(row["COUNT(*)"]);
        });
    });
  }

  getLastSignInTime(groupId, userId) {
    return new Promise(((resolve, reject) => {
      this.db.get("SELECT MAX(TIME) FROM SIGN_IN WHERE GROUP_ID = ? AND USER_ID = ?",
        [groupId, userId], (err, row) => {
          if (err) reject(err);
          else resolve(row["MAX(TIME)"]);
        })
    }));
  }

  getLastSignInData(groupId, userId) {
    return new Promise(async (resolve, reject) => {
      try {
        if (await this.calcTotalSignInTimes(groupId, userId)) {
          let lastTime = await this.getLastSignInTime(groupId, userId);
          this.db.get("SELECT * FROM SIGN_IN WHERE GROUP_ID = ? AND USER_ID = ? AND TIME = ?",
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

  calcMonthSignInTimes(groupId, userId) {
    let this_month = new Date();
    this_month.setDate(1);
    this_month.setHours(0, 0, 0, 0);
    return new Promise((resolve, reject) => {
      this.db.get("SELECT COUNT(*) FROM SIGN_IN WHERE GROUP_ID = ? AND USER_ID = ? AND TIME >= ?",
        [groupId, userId, parseInt(this_month.getTime() / 1000)],
        (err, row) => {
          if (err) reject(err);
          else resolve(row["COUNT(*)"]);
        });
    });
  }

  saveSignInData(signInData) {
    return new Promise((resolve, reject) => {
      this.db.run("INSERT INTO SIGN_IN (GROUP_ID,USER_ID,TIME,DURATION,SCORE,SCORE_CHANGES) VALUES (?,?,?,?,?,?)", [
        signInData.groupId,
        signInData.userId,
        signInData.time,
        signInData.duration,
        signInData.score,
        signInData.scoreChanges
      ], err => {
        if (err) reject(err);
        this.db.get("SELECT COUNT(*) FROM USERS WHERE GROUP_ID = ? AND USER_ID = ?", [
          signInData.groupId,
          signInData.userId
        ], (err, row) => {
          if (err) reject(err);
          else if (row["COUNT(*)"]) {
            this.db.run("UPDATE USERS SET SCORE = ? WHERE GROUP_ID = ? AND USER_ID = ?", [
              signInData.score,
              signInData.groupId,
              signInData.userId
            ], (err) => {
              if (err) reject(err);
              else resolve();
            });
          } else {
            this.db.run("INSERT INTO USERS (GROUP_ID,USER_ID,SCORE) VALUES (?,?,?)", [
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

  getSignInData(timeBegin, timeEnd, groupId, userId) {
    return new Promise((resolve, reject) => {
      if (userId) {
        this.db.all("SELECT * FROM SIGN_IN WHERE GROUP_ID = ? AND USER_ID = ? AND TIME >= ? AND TIME <= ?",
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
        this.db.all("SELECT * FROM SIGN_IN WHERE GROUP_ID = ? AND TIME >= ? AND TIME < ?",
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

  getUserData(userId) {
    return new Promise((resolve, reject) => {
      this.db.all("SELECT * FROM USERS WHERE USER_ID = ?", [userId],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows.map(row => new UserData(row["GROUP_ID"], userId, row["SCORE"])));
        });
    });
  }
}

module.exports = {
  SignInData: SignInData,
  UserData: UserData,
  SignInDB: SignInDB
}