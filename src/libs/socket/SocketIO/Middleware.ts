import GuardianException = require("../../../exceptions/GuardianException");
import InvalidStream = require("../../../exceptions/InvalidStream");
import WebSocketHeaders = require("../../../configs/SocketHeaders");
import InvalidCredential = require("../../../exceptions/InvalidCredential");
import LogService = require("../../../utils/facades/Logger");


function runMiddlewares(io, req, middlewares) {
  const socket = req.socket;
  const header = req.header;


  try {
    middlewares.forEach((middleware) => {
      middleware.handle(io, socket, req);
    })
  } catch (err) {
    if (err instanceof InvalidStream) {
      socket.emit(header, WebSocketHeaders.ERR_NOT_FOUND);
    }
    else if (err instanceof GuardianException) {
      socket.emit(header, WebSocketHeaders.ERR_NOT_GUARDIAN);
    }
    else if (err instanceof InvalidCredential) {
      socket.emit(header, WebSocketHeaders.ERR_AUTH);
    }

    LogService.error(`[WebSocket] Socket ${socket.id}:${err.message}`);
    throw err;
  }
}


export = {
  runMiddlewares: runMiddlewares
}