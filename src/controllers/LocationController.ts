import StreamManager = require("../repositories/memory/ActiveStreamRepository");
import Redis = require("../libs/database/drivers/Redis");
import InvalidStream = require("../exceptions/InvalidStream");
import LogService = require("../utils/facades/Logger");
import { Request, Response } from 'express';



/**
 * Return the most recent geolocation data from this channel.
 * 
 * @returns null
 */
function getLocation(req: Request, res: Response) {

  let stream;
  const streamID = Number(req.params.stream_id);
  const listKey = __makeListKey(streamID);

  LogService.info(`[Location] Stream = ${streamID}   List Key = ${listKey}`);

  try {
    stream = StreamManager.getStream(streamID);
  } catch (err) {
    LogService.error(err);
    if (err instanceof InvalidStream)
      res.writeHead(404, {});
    else
      res.writeHead(500, {});

    res.write(JSON.stringify({
      result: false,
      error: err.message
    }));
    res.end();
    return;
  }

  Redis.peek(listKey, (err, retval) => {
    if (err) {
      LogService.error(err);
      res.writeHead(404, {});
      res.write(JSON.stringify({
        error: err.message
      }));
      res.end();
    } else {
      if (retval.length) {
        console.log(retval);
        res.writeHead(200, {});
        res.write(retval[0]);
        res.end();
      } else {
        LogService.error(`Empty return data on stream${streamID}`);
        res.writeHead(404, {});
        res.end();
      }
    }
  });
}


/**
 * Store geolocation data sent by streamer in streaming database.
 * 
 * @returns null
 */
function postLocation(req: Request, res: Response) {

  const streamID = Number(req.params.stream_id);

  LogService.info(`[Stream] Location data posted on Stream${streamID}`);

  try {
    if (!StreamManager.doesStreamExist(streamID))
      throw new InvalidStream();

    const listKey = __makeListKey(streamID);
    const locationData = JSON.stringify({
      latitude: req.body.latitude,
      longitude: req.body.longitude,
      timestamp: req.body.timestamp
    });

    Redis.enqueue(listKey, locationData, (err, retval) => {
      if (err) {
        res.writeHead(500, {});
        res.write(JSON.stringify({
          error: err.message
        }));
      } else {
        res.writeHead(200, {});
        res.write({});
      }
      res.end();
    });
  } catch (err) {
    res.writeHead(404, {});
    res.write(JSON.stringify({
      error: err.message
    }));
    res.end();
    return;
  }
}


function __makeListKey(streamID: Number) {
  return `Stream_${streamID}_GeoLocation`;
}


export = {
  getLocation: getLocation,
  postLocation: postLocation
}