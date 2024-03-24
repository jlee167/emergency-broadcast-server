import {Request, Response, NextFunction } from 'express';
import chalk = require("chalk");
import jwt = require('jsonwebtoken');
import LogService = require("../utils/facades/Logger");

import Mysql = require("../libs/database/drivers/Mysql");

import EmergencyStream = require("../models/EmergencyStream");

import CredentialException = require("../exceptions/InvalidCredential");
import UnknwonProtocol = require("../exceptions/UnknownProtocol");
import DuplicateStream = require("../exceptions/DuplicateStream");

import ActiveStreamRepository = require('../repositories/memory/ActiveStreamRepository');
import PortRepository = require("../repositories/memory/PortRepository");
import StreamRepository = require("../repositories/database/rdb/StreamRepository");

import MjpegStreamController = require("./MjpegStreamController");

const { spawn } = require('child_process');
const Net = require("net");




/**
 * Send error response to client. 
 *
 * @param {*} res 
 * @param {*} err 
 */
function __notifyError(res :Response, err :Error) {
  res.write(JSON.stringify({
    result: false,
    error: err.name,
    message: err.message
  }));
  res.end();
}


/**
 * Check if stream can be launched.
 * If not, throw error.
 *
 * @param {*} userID 
 * @returns Promise
 */
async function preLaunchCheck(userID) {
  const query = `SELECT id FROM streams WHERE uid= ${userID};`;

  /* If stream has already been started, return error */
  return Mysql.execute(query)
    .then(([rows]) => {
      if (rows.length)
        throw new DuplicateStream();
      else
        return Promise.resolve();
    })
}


/**
 * Open HLS or MJPEG stream (FFMPEG or TCP) to stream video/audio. 
 *
 * @param stream 
 */
function startMediaStream(stream :EmergencyStream) {

  stream.geoLocationUrl = `http://49.50.172.17:3001/geolocation/${stream.id}`;

  if (stream.protocol == "RTMP") {
    stream.videoUrl = `rtmp://10.41.169.126:${stream.videoInPort}`;
    LogService.info(`[Stream] Starting RTMP Server on ${stream.videoUrl}`);
  } else if (stream.protocol == "MJPEG") {
    const audioInUrl = `tcp://10.41.169.126:${stream.audioInPort}`;
    stream.audioUrl = `tcp://49.50.172.17:${stream.audioInPort}`;
    stream.videoUrl = `http://49.50.172.17:${stream.videoInPort}`;
    stream.videoOutUrl = `${process.env.HTTP_URL}:${process.env.PORT}/stream/${stream.id}/mjpeg.jpg`;
    stream.audioOutUrl = `${process.env.HTTP_URL}:${process.env.PORT}/audio/hls/${stream.id}/audio.m3u8`;
    /*stream.ffmpegAudio = spawn("ffmpeg", [
      "-f", "s32le",
      "-ar", "48000",
      "-ac", "1",
      "-re",
      "-i", `${stream.audioUrl}/?listen`,
      //"-c", "copy",
      "-acodec", "pcm_s32le",
      "tcp://10.41.169.126:3006/?listen"
      //"-f", "wav",
      //"pipe:1"
    ]);*/

    /* Create FFMPEG audio server */
    {
      stream.ffmpegAudio = spawn("ffmpeg", [
        "-f", "s16le",
        "-ar", "48000",
        "-ac", "1",
        "-re",
        "-i", `${audioInUrl}/?listen`,
        "-filter:a", "volume=4.0",
        //"-c:a", "aac",
        //"-hls_time", "6",
        //"-hls_list_size", "0",
        //"-hls_segment_size", "100000",
        `${process.env.STORAGE_PATH}/media/audio/audio.m3u8`
      ]);

      stream.ffmpegAudio.stderr.on('data', (data) => {
        LogService.info("audio data in");
        let dump = data;
      });

      stream.ffmpegAudio.stderr.pipe(process.stderr);
      stream.ffmpegAudio.stdout.pipe(process.stdout);
    }

    /* Create TCP server for MJPEG image stream */
    {
      stream.tcpVideoServer = Net.createServer((client) => {
        client.on('data', (data) => {
          const str = data.toString('utf-8');
          MjpegStreamController.postJpegFrame(stream.id, str);
        })

        client.on('end', () => {
          LogService.warn(`[Stream] TCP client on stream${stream.id} disconnected\n`);
        });

        client.on('timeout', function () {
          LogService.warn(`[Stream] TCP client on stream${stream.id} timed out\n`);
        });

        client.on('error', function (err) {
          LogService.error(`${err.name}: ${err.message}`);
        })
      });

      stream.tcpVideoServer.listen(stream.videoInPort, () => {
        stream.tcpVideoServer.on('close', () => {
          LogService.info(`[Stream] Video Server on port ${stream.videoInPort} closed\n\n`);
        });
        stream.tcpVideoServer.on('error', () => {
        });
      });
    }


  } else {
    throw new UnknwonProtocol(stream.protocol);
  }
}


/**
 * Retrieves stream information 
 *
 * @param req 
 * @param res 
 */
function getStream(req :Request, res :Response) {
  const streamID = Number(req.params.stream_id);
  const stream = ActiveStreamRepository.getStream(streamID);

  if (stream) {
    res.writeHead(200, {
      'Content-Type': 'application/json',
    });
    res.write(JSON.stringify({
      protocol: stream.protocol,
      audioUrl: stream.audioOutUrl,
      videoUrl: stream.videoOutUrl, //videoUrl,
      geoLocationUrl: stream.geoLocationUrl
    }));
  } else {
    res.writeHead(404, {});
  }
  res.end();
}


/**
 * Start an emergency stream and register in related databases. 
 *
 * @param req 
 * @param res 
 *
 * @todo  implement notification to user's friends
 */
async function createStream(req :Request, res :Response) {

  let stream: EmergencyStream;
  let conn = await Mysql.getConnection();
  await conn.beginTransaction();

  const jwtToken = req.get('webToken');
  const protocol = req.body.protocol;
  const userID = Number(req.params.user_id);

  LogService.info(`New stream request from user #${req.params.user_id}`);
  LogService.info(req.body);
  LogService.info(`\n${chalk.yellow("Creating Stream...")}`);
  //Logger.info(`[Stream] Token=${jwtToken}`);
  LogService.info(`[Stream] Protocol=${protocol}`);
  LogService.info(`[Stream] User ID=${userID}\n`);


  /* If stream has already been started, return error */
  try {
    const [launchCheck, privateKey] = await Promise.all([
      preLaunchCheck(userID),
      StreamRepository.getStreamKey(conn, userID),
    ])

    const decodedUserID = jwt.verify(jwtToken, privateKey);
    LogService.info(`[Stream] JWT Decoded: ${decodedUserID}`);
    if (decodedUserID != String(userID)) {
      throw new CredentialException();
    };

    await StreamRepository.registerStream(conn, {
      id: userID,
      privateKey: privateKey,
    });

    const username = await StreamRepository.getUsername(conn, userID);
    const streamID = await StreamRepository.getStreamID(conn, userID);
    const guardians = await StreamRepository.getGuardianList(conn, username);

    stream = new EmergencyStream({
      userID: userID,
      privateKey: privateKey,
      username: username,
      id: streamID,
      guardians: guardians,
      protocol: protocol,
    });

    LogService.info(`[Stream] Stream registered for ${String(stream.username)}`);

    /* Open required socket ports */
    stream.videoInPort = PortRepository.acquirePort();
    if (stream.protocol == "MJPEG") {
      stream.audioInPort = PortRepository.acquirePort();
    }
    startMediaStream(stream);
    LogService.info(`[Stream] Video URL = ${stream.videoUrl}`);
    LogService.info(`[Stream] Audio URL = ${stream.audioUrl}`);


    res.writeHead(200, {
      'Content-Type': 'application/json',
      'X-Powered-By': 'bacon'
    });
    res.write(JSON.stringify({
      protocol: stream.protocol,
      id: stream.id,
      videoUrl: stream.videoUrl,
      audioUrl: stream.audioUrl,
      geoLocationUrl: stream.geoLocationUrl,
      result: true
    }));
    res.end();

    ActiveStreamRepository.putStream(stream);
    LogService.info(`[Stream] Stream ${stream.id} successfully registered`);

    await conn.commit();

  } catch (err) {
    LogService.error(err);
    __notifyError(res, err);
    res.end();
    if (stream) {
      try {
        __removeStream(stream.id);
      } catch (err) {
        LogService.error(err);
      }
    }
  };
}


/**
 * Stop an emergency stream. 
 * Call necessary functions to stop related processes and ports. 
 *
 * @param req 
 * @param res 
 */
async function stopStream(req :Request, res :Response) {

  const streamID = Number(req.params.stream_id);

  __removeStream(streamID)
  .then(() => {
    res.write(JSON.stringify({
      result: true,
    }));
    res.end();
    LogService.info("[Stream] stream stopped");
  })
  .catch ((err) => {
    LogService.error(err);
    __notifyError(res, err);
  });
}


/**
 * Close any media software and network connection related to
 *
 * @param streamID 
 * @returns 
 */
async function __removeStream(streamID: number) {
  let stream :EmergencyStream = ActiveStreamRepository.getStream(streamID);

  /* Close active ffmpeg streams */
  if (stream.ffmpegAudio) {
    stream.ffmpegAudio.kill('SIGTERM');
    PortRepository.releasePort(stream.audioInPort);
    PortRepository.releasePort(stream.audioOutPort);
    LogService.info(`[Stream] Audio for Stream${stream.id} terminated`);
  }

  if (stream.ffmpegVideo) {
    stream.ffmpegVideo.kill('SIGTERM');
    PortRepository.releasePort(stream.videoInPort);
    PortRepository.releasePort(stream.videoOutPort);
    LogService.info(`[Stream] Video for Stream${stream.id} terminated`);
  }

  /* Close sockets */
  if (stream.tcpVideoServer) {
    stream.tcpVideoServer.close();
    PortRepository.releasePort(stream.videoInPort);
    PortRepository.releasePort(stream.videoOutPort);
    LogService.info(`[Stream] Video for Stream${stream.id} terminated`);
  }

  /* Remove stream from local memory */
  ActiveStreamRepository.removeStream(stream.id);

  /* Delete stream from database */
  return await Mysql.execute(
    `DELETE FROM streams WHERE streams.id = ${stream.id};`
  );
}


export = {
  createStream: createStream,
  stopStream: stopStream,
  getStream: getStream,
};