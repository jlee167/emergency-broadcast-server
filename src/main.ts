/*
|--------------------------------------------------------------------------
|   Streaming Server
|--------------------------------------------------------------------------
|
|
|   A Node.js implementation of emergency video broadcasting server.
|   User requests for emergency braodcast will be handled here.
|
|
|
|
|   *****  Stream Lifecycle  *****
|
|   1.  (/streams/{uid}) request from camera invokes stream object creation
|       and its registration in stream list
|   2.  JWT token is issued for streamer and guardians and stored in stream 
|       object.
|   3.  If emergency request is received before receiving close request, 
|       enter emergency protocol steps. (E(n) steps below)
|   4.  When stream shutdown request comes in, stream is closed. 
|       If emergency protocol is on, emergency end request must be received first.
|
|
|   E1. If emergency rescue request is received (/emergency), analyze JWT token. 
|       If token is valid, proceed.
|   E2. Send SMS notification to guardians in the stream object for requesting 
|       user. Initial geolocation info should be in SMS message.
|   E3. Allocate local storage for video.
|   E4. Open an RTMP/HLS stream with FFMPEG. 
|   E5. Respond to streamer with RTMP/HLS server address.
|   E6. Initiate additionl situation broadcast (B(n) steps below) to run
|       asynchronously and return to step 4 if the stream is set to public.  
|
|
|   B1. Use recommendation database (Graph Database) to extract recommended
|       guardians.
|   B2. Broadcast situation via sms to recommended guardians.
|
|
|   Current Settings
|     - Main Database: MariaDB
|     - Live Data Cache: Redis
|     - Graph Database: TigerGraph   
|
|
---------------------------------------------------------------------------*/



/* ---------------------- External Modules & Libraries ---------------------- */
/* Make your own env.js file!!! */
require('./env.js');


import App = require('./app.module')
const Logger = App.services.LogService;

import express = require('express');
import { Request, Response, NextFunction } from 'express';
import cors = require('cors');
import SocketIO = require('socket.io');
import MongoDbClient = require("./libs/database/drivers/MongoDB");

/* --------------------------------- Facades -------------------------------- */
// import Logger = require("./utils/facades/Logger");

/* ------------------------------- Controllers ------------------------------ */
import WebSocketHeaders = require("./configs/SocketHeaders");
import JwtController = require('./controllers/JwtController');
import StreamController = require('./controllers/StreamController');
import EmergencyController = require('./controllers/EmergencyController');
import MjpegController = require('./controllers/MjpegStreamController');
import LocationController = require('./controllers/LocationController');
import ChatController = require('./controllers/ChatController');
import HlsVideoController = require('./controllers/HlsVideoController');
import AudioStreamController = require('./controllers/AudioStreamController');

/* ----------------------- Personal/Server Credentials ---------------------- */
import Auth = require('./middlewares/SocketIO/Auth');
import JwtValidator = require('./middlewares/Http/JwtValidator');

import chalk = require('chalk');

/* ------------------------------- Exceptions ------------------------------- */
import InvalidStream = require('./exceptions/InvalidStream');
import GuardianException = require('./exceptions/GuardianException');
import InvalidCredential = require('./exceptions/InvalidCredential');

import DummyStreams = require('./utils/test_data/DummyStreams');
import SocketIoMiddlewares = require('./libs/socket/SocketIO/Middleware');




/* ---------------------------- Bootstrap Express --------------------------- */
const expressApp = express();
const httpServer = require('http').Server(expressApp);

const io = new SocketIO.Server(httpServer, {
  cors: {
    origin: process.env.HTTP_URL,
    methods: ["GET", "POST"]
  }
});

expressApp.use(express.json({
  limit: "50mb"
}));
expressApp.use(cors());
expressApp.use(express.raw({
  limit: "50mb"
}));


 /* ------------------------ Bootstrap MongoDB Client ------------------------ */
(async function () {
  await MongoDbClient.setNewClient(process.env.MONGODB_LOCAL_URI);
  await MongoDbClient.connect();
  await MongoDbClient.selectDB("stream_server");
})();




/* -------------------------------------------------------------------------- */
/*                               REST API Routing                             */
/* -------------------------------------------------------------------------- */

/* Server Ping (Server Alive Check) */
expressApp.get('/ping', (req: Request, res: Response) => {
  res.send('Lazyboy Streaming Server is up and running!');
  res.end();
  Logger.info("server pinged");
});


/* Renew JWT token of a user */
/* @Todo: Remove Private key from parameter */
expressApp.get('/jwtgen/:guardian_id/:private_key', async (req: Request, res: Response) => {
  const params = {
    guardianID: req.params.guardian_id,
    privateKey: req.params.private_key
  }
  JwtController.issueJwtToken(req, res, params);
});


/* Get stream data */
expressApp.get('/stream/:stream_id',
  JwtValidator.verifyGuardian,
  StreamController.getStream,
);


/* Start user stream */
expressApp.post('/stream/:user_id',
  StreamController.createStream
);


/* End Stream */
expressApp.delete('/stream/:stream_id',
  JwtValidator.verifyStreamer,
  StreamController.stopStream,
);


/* Start emergency protocol */
expressApp.post('/emergency/:stream_id', 
  JwtValidator.verifyStreamer,
  EmergencyController.startEmergency,
);


/* End emergency protocol */
expressApp.delete('/emergency/:stream_id',
  JwtValidator.verifyStreamer,
  EmergencyController.stopEmergency,
);



/* ----------------------------- Media Streaming ---------------------------- */

expressApp.post('/stream/:stream_id/geo',
  JwtValidator.verifyStreamer,
  LocationController.postLocation,
);


expressApp.get('/stream/:stream_id/mjpeg.jpg',
  //JwtValidator.verifyGuardian,
  MjpegController.getJpegFrame,
);


expressApp.get('/stream/:stream_id/geo',
  JwtValidator.verifyGuardian,
  LocationController.getLocation,
);


expressApp.get('/video/hls/:stream_id/:filename', 
  HlsVideoController.getHlsSegments
);


expressApp.get('/audio/hls/:stream_id/:filename', 
  AudioStreamController.getAudioFile
);



/* -------------------------------------------------------------------------- */
/*                                  WebSocket                                 */
/* -------------------------------------------------------------------------- */




// function __runMiddlewares(io, req, middlewares) {

//   const socket = req.socket;
//   const header = req.header;


//   try {
//     middlewares.forEach((middleware) => {
//       middleware.handle(io, socket, req);
//     })
//   } catch (err) {
//     if (err instanceof InvalidStream) {
//       socket.emit(header, WebSocketHeaders.ERR_NOT_FOUND);
//     }
//     else if (err instanceof GuardianException) {
//       socket.emit(header, WebSocketHeaders.ERR_NOT_GUARDIAN);
//     }
//     else if (err instanceof InvalidCredential) {
//       socket.emit(header, WebSocketHeaders.ERR_AUTH);
//     }

//     Logger.error(`[WebSocket] Socket ${socket.id}:${err.message}`);
//     throw err;
//   }
// }



io.on(WebSocketHeaders.HEADER_CONNECTION, (socket) => {

  Logger.info(`[WebSocket] ${socket.id} Connected `);

  socket.on(WebSocketHeaders.HEADER_USER_JOIN, (packet) => {
    try {
      SocketIoMiddlewares.runMiddlewares(io, {
        socket: socket, 
        packet: packet, 
        header: WebSocketHeaders.HEADER_USER_JOIN
      }, [Auth]);
    } catch (err) { return; }
    ChatController.onUserJoin(io, socket, packet);
  });


  socket.on(WebSocketHeaders.HEADER_CHAT_MESSAGE, (packet) => {
    try {
      SocketIoMiddlewares.runMiddlewares(io, {
        socket: socket, 
        packet: packet, 
        header: WebSocketHeaders.HEADER_CHAT_MESSAGE
      }, [Auth]);
    } catch (err) { return; }

    ChatController.handleChatMessage(io, socket, packet);
  });


  socket.on(WebSocketHeaders.HEADER_DISCONNECTION, (packet) => {
    try {
      SocketIoMiddlewares.runMiddlewares(io, {
        socket: socket, 
        packet: packet, 
        header: WebSocketHeaders.HEADER_DISCONNECTION
      }, []);
    } catch (err) {
      Logger.error(err.message);
      return;
    }
    ChatController.onUserDisconnect(io, socket, packet);
  });


  socket.on(WebSocketHeaders.HEADER_USER_LIST, (packet) => {
    try {
      SocketIoMiddlewares.runMiddlewares(io, {
        socket: socket, 
        packet: packet, 
        header: WebSocketHeaders.HEADER_USER_LIST
      }, [Auth]);
    } catch (err) { return; }
    ChatController.sendUserList(io, socket, packet);
  });
});






/* ------------------------------- Launch server ------------------------------- */
httpServer.listen(process.env.PORT, () => {
  Logger.info(`listening on *:${process.env.PORT}`);
});


DummyStreams.generate();
App.services.CacheFlushService.start();

