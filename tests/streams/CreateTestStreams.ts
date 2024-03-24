
import StreamRepository = require("../../src/repositories/database/rdb/StreamRepository");
import Mysql = require('../../src/libs/database/drivers/Mysql');

Mysql.execute("DELETE FROM streams;");

async function createHlsStream() {
  let userID = 1;
  let conn = await Mysql.getConnection();
  const privateKey = StreamRepository.getStreamKey(conn, userID)
  Mysql.execute(`INSERT INTO streams(uid, stream_key) VALUES (${userID}, '${privateKey}');`);
}

async function createMjpegStream() {
  let userID = 2;
  let conn = await Mysql.getConnection();
  const privateKey = StreamRepository.getStreamKey(conn, userID)
  Mysql.execute(`INSERT INTO streams(uid, stream_key) VALUES (${userID}, '${privateKey}');`);
}

createHlsStream();
createMjpegStream();

console.log("======= Done =======");