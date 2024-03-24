import Redis = require("../libs/database/drivers/Redis");
import LogService = require("../utils/facades/Logger");


let fps = 0;
let currImage;


/**
 * Store received JPEG image to Redis 
 * @todo  Create Database interface for abstraction instead of using Redis directly.
 *
 * @param {*} streamID 
 * @param {*} data 
 */
function postJpegFrame(streamID, data){
  const key = __getJpegKey(streamID);
  let images = data.split('/9j/4AAQ');

  for (let i = 0; i < images.length; i++) {
    if (i < (images.length-1)) {
      currImage += images[i];
      if (currImage) {}
      else continue;
    
      fps++;
      LogService.info(`Frame: ${fps}`);
      //Logger.info(currImage.length);
      Redis.enqueue(key, currImage, (err) => { 
        if (err) {
          LogService.error(err.message);
        }
      });
      currImage = "/9j/4AAQ";
    } else {
      currImage += images[i];
    }
  }
}


/**
 * Get most recent jpeg image from stream.
 * @todo  Create Database interface for abstraction instead of using Redis directly.
 *
 * @param {*} req 
 * @param {*} res 
 */
function getJpegFrame(req, res) {
  const streamID = req.params.stream_id;
  
  Redis.peek(__getJpegKey(streamID), (err, retval) => {
    if (err) {
      res.writeHead(500, {});
      res.end();
    } else {
      res.writeHead(200, {
        'Content-Type': 'image/jpeg',
      });
      let data = Buffer.from(retval[0], "base64");
      res.write(data);
      res.end();
    }
  });
}


function __getJpegKey(streamID) {
  return `Stream_${streamID}_Mjpeg`;
}




export = {
  postJpegFrame: postJpegFrame,
  getJpegFrame: getJpegFrame,
}