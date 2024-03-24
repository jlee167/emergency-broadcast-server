import InvalidCredential = require('../../exceptions/InvalidCredential');
import GuardianException = require('../../exceptions/GuardianException');
import chalk = require('chalk');
import jwt = require('jsonwebtoken');
import StreamManager = require('../../repositories/memory/ActiveStreamRepository');



const handle = (io, socket, req) => {
  
  const packet = JSON.parse(req.packet);
  const streamID = (packet.streamID);

  const stream = StreamManager.getStream(streamID);

  const sockets = io.sockets.adapter.rooms.get(streamID);
  if (sockets) {
    if (sockets.has(socket.id)){
      console.log(`[WebSocket]Authenticated Socket ${socket.id} entering room ${streamID}`);
      return;
    }
  }

  const clientToken = packet.webToken;
  const privateKey = stream.privateKey;

  try {
    const userID = Number(jwt.verify(clientToken, privateKey));
    console.log(stream.guardians);
    if (!stream.guardians[userID])
      throw new GuardianException();
  } catch (err) {
    throw new InvalidCredential();
  }
}


export = {
  handle: handle
};