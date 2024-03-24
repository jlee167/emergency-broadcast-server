import EmergencyStream = require("../../models/EmergencyStream");
import StreamRepository = require("../../repositories/database/rdb/StreamRepository");
import Mysql = require("../../libs/database/drivers/Mysql");
import Redis = require("../../libs/database/drivers/Redis");
import ActiveStreamRepository = require("../../repositories/memory/ActiveStreamRepository");
import App = require("../../app.module");
const LogService = App.services.LogService;



async function createHlsStream() {
  let userID = 1;
  let conn = await Mysql.getConnection();
  const privateKey = StreamRepository.getStreamKey(conn, userID)
  await Mysql.execute(`INSERT INTO streams(uid, stream_key) VALUES (${userID}, '${privateKey}');`);
}



async function createMjpegStream() {
  let userID = 2;
  let conn = await Mysql.getConnection();
  const privateKey = StreamRepository.getStreamKey(conn, userID)
  await Mysql.execute(`INSERT INTO streams(uid, stream_key) VALUES (${userID}, '${privateKey}');`);
}



async function generate() {
  // @Todo: For test only!
  //await Mysql.execute("DELETE FROM streams WHERE (uid != 1) AND (uid != 2);");
  await Mysql.execute("DELETE FROM streams;");
  await createHlsStream();
  await createMjpegStream();

  /* -------------------------- Register test streams ------------------------- */
  {
    (async function () {

      const userID = 1;
      let privateKey, username, streamID, guardians;

      let conn = await Mysql.getConnection();
      await conn.beginTransaction();

      [privateKey, username, streamID] = await Promise.all([
        StreamRepository.getStreamKey(conn, userID),
        StreamRepository.getUsername(conn, userID),
        StreamRepository.getStreamID(conn, userID),
      ]);
      guardians = await StreamRepository.getGuardianList(conn, username);


      let stream = new EmergencyStream({
        userID: userID,
        privateKey: privateKey,
        username: username,
        id: streamID,
        guardians: guardians,
        protocol: "RTMP",
      });

      stream.protocol = "RTMP";
      stream.videoOutUrl = "//d2zihajmogu5jn.cloudfront.net/bipbop-advanced/bipbop_16x9_variant.m3u8";
      ActiveStreamRepository.putStream(stream);
      conn.commit();

      setupLocationGenerator(streamID);
    })();



    (async function () {

      const userID = 2;
      let privateKey, username, streamID, guardians;

      let conn = await Mysql.getConnection();
      await conn.beginTransaction();
      [privateKey, username, streamID] = await Promise.all([
        StreamRepository.getStreamKey(conn, userID),
        StreamRepository.getUsername(conn, userID),
        StreamRepository.getStreamID(conn, userID),
      ]);
      guardians = await StreamRepository.getGuardianList(conn, username);

      let stream = new EmergencyStream({
        userID: userID,
        privateKey: privateKey,
        username: username,
        id: streamID,
        guardians: guardians,
        protocol: "MJPEG",
      });
      stream.protocol = "MJPEG";
      stream.audioOutUrl = "//d2zihajmogu5jn.cloudfront.net/bipbop-advanced/bipbop_16x9_variant.m3u8";
      stream.videoOutUrl = "https://www.murideo.com/uploads/5/2/9/0/52903137/162556-1-orig_3.jpg";
      ActiveStreamRepository.putStream(stream);
      conn.commit();

      setupLocationGenerator(streamID);
    })();
  }



  /* ------------------ Update location data of test streams ------------------ */
  async function setupLocationGenerator(streamID: string) {

    enum Direction {
      Up = 1,
      Down,
      Left, 
      Right
    }

    /* location data */
    let lat = 33.450701;
    let long = 126.570667;

    /* location update vector */
    let latDir = Direction.Right;
    let longDir = Direction.Left;

    const latUpperLimit = 33.450701 + 0.001;
    const latLowerLimit = 33.450701 - 0.001;
    const longUpperLimit = 126.570667 + 0.001;
    const longLowerLimit = 126.570667 - 0.001;
    const geoListKey = `Stream_${streamID}_GeoLocation`;


    setInterval(() => {

      /* Update Direction */
      if (lat >= latUpperLimit) {
        latDir = Direction.Left;
      } else if (lat <= latLowerLimit) {
        latDir = Direction.Right;
      }

      if (long >= longUpperLimit) {
        longDir = Direction.Down;
      } else if (long <= longLowerLimit) {
        longDir = Direction.Up;
      }


      /* Update coordinate */
      if (latDir == Direction.Right) {
        lat += 0.000020;
      } else {
        lat -= 0.000020;
      } 

      if (longDir == Direction.Up) {
        long += 0.000020;
      } else  {
        long -= 0.000020;
      }


      const location = JSON.stringify({
        longitude: long,
        latitude: lat,
        timestamp: Date.now()
      });

      Redis.enqueue(geoListKey, location, (err, retval) => {
        if (err)
          console.error(err);
      });

      LogService.info(`Injecting test location data to test stream ${streamID}`);
    }, 5000);
  };

} 

export = {
  generate: generate
};