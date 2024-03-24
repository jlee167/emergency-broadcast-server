/**
 *  MariaDB/MySQL API for extracting stream-related data
 */
import mysql2 = require("mysql2/promise");
import Mysql = require("../../../libs/database/drivers/Mysql");


async function registerStream(conn :mysql2.Connection, user) {
  /* Register this stream */
  await conn.execute(`INSERT INTO streams(uid, stream_key) VALUES (${user.id},'${user.privateKey}');`);
}

async function getUsername(conn :mysql2.Connection, userID :Number) {
  return await conn.execute(`SELECT username FROM users WHERE id=${userID};`)
    .then(([rows]) => {return Promise.resolve(rows[0].username)});
}

async function getStreamID(conn :mysql2.Connection, userID :Number) {
  return conn.execute(`SELECT id FROM streams WHERE uid=${userID};`)
    .then(([rows]) => { console.log(rows); return Promise.resolve(rows[0].id); });
}

async function closeStream(streamID :Number) {
  return Mysql.execute(`DELETE FROM streams WHERE streams.id = ${streamID};`);
}


async function getGuardianList(conn :mysql2.Connection, username :string) {
  return conn.execute(`CALL GetGuardians('${username}');`)
    .then(([rows]) => {
      let guardians = [];
      for (const row of rows[0]) {
        guardians[row.id] = row.id;
      }
      return Promise.resolve(guardians);
    });
}


async function getStreamKey(conn :mysql2.Connection, userID :Number) {
  return conn.execute(`SELECT stream_key FROM users WHERE users.id=${userID};`)
    .then(([rows]) => {
      return Promise.resolve(rows[0].stream_key);
    });
}




export = {
  registerStream: registerStream,
  getUsername: getUsername,
  getStreamID: getStreamID,
  closeStream: closeStream,
  getGuardianList: getGuardianList,
  getStreamKey: getStreamKey,
};