/**
 * Stores active streams in local array.
 * Streams will be represented by EmergencyStream class.
 * Assign ports to channels upon request and retrieve them when stream ends.
 * 
 * @dependency EmergencyStream
 *
 */

import InvalidStream = require("../../exceptions/InvalidStream");
import EmergencyStream = require("../../models/EmergencyStream");

let Streams = Array();
let LastActive = Array<Date>();


function putStream(stream :EmergencyStream) {
  Streams[stream.id] = stream;
  updateTimestamp(stream.id);
  /*setInterval(() => {
    const msecElapsed = Date.now() - LastActive[stream.id].getMilliseconds();
    const minElapsed = msecElapsed / (1000 * 60);
    if (minElapsed > 10) {
      idleCallback();
    }
  });*/
};


function getAllStreams() :Array<EmergencyStream> {
  return Streams;
}

function getStream(streamID :number) :EmergencyStream {
  if (Streams[streamID] === undefined)
    throw new InvalidStream();
  return Streams[streamID];
};

function doesStreamExist(streamID :number) {
  return Streams[streamID] instanceof EmergencyStream;
}

function removeStream(index :number) {
  Streams[index] = null;
  LastActive[index] = null;
}

function updateTimestamp(streamID: number) {
  LastActive[streamID] = new Date();
}

function getLastTimestamp(streamID: number) :Date {
  return LastActive[streamID];
}


export = {
    Streams: Streams,
    putStream: putStream,
    getStream: getStream,
    getAllStreams: getAllStreams,
    removeStream: removeStream,
    doesStreamExist: doesStreamExist,
    getLastTimestamp: getLastTimestamp,
};