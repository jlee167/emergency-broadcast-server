import { Request, Response, NextFunction } from 'express';
import jwt = require('jsonwebtoken');
import StreamManager = require('../../repositories/memory/ActiveStreamRepository');
import InvalidCredential = require('../../exceptions/InvalidCredential');
import EmergencyStream = require('../../models/EmergencyStream');

import chalk = require('chalk');


/**
 * Verify that current user is the owner of stream 
 *
 * @param req 
 * @param res 
 * @param next 
 */
function verifyStreamer(req: Request, res: Response, next: NextFunction) {
  try {
    const token: string = req.get('webToken');
    const streamID = Number(req.params.stream_id);
    const stream: EmergencyStream = StreamManager.getStream(streamID);
    let decoded: string;

    console.log(chalk.cyan("[Streamer Verification]"));
    console.log(`token : ${token}`);
    console.log(`private key : ${stream.privateKey}`);

    try {
      decoded = jwt.verify(token, stream.privateKey);
    } catch {
      throw new InvalidCredential();
    }

    if (decoded != stream.userID) {
      throw new InvalidCredential();
    }

    console.log(chalk.green('Verification Successful! \n\n'));
    next();
  } catch (err) {
    console.log(chalk.red(err.message));
    res.writeHead(401, {
      'Content-Type': 'application/json',
    });
    res.write(JSON.stringify({
      result: false,
      error: err.name,
      message: err.message
    }));
    res.end();
  }
};



/**
 * Verify that current user is the guardian of stream's owner 
 *
 * @param req 
 * @param res 
 * @param next 
 */
function verifyGuardian(req: Request, res: Response, next: NextFunction) {
  try {
    const token: string = req.get('webToken');
    const streamID = Number(req.params.stream_id);
    const stream: EmergencyStream = StreamManager.getStream(streamID);
    let decoded: string;

    console.log(chalk.yellow(`\n[Guardian Verification] Stream${streamID}`));

    // Decode JWT with stream's key
    try {
      decoded = jwt.verify(token, stream.privateKey);
    } catch {
      throw new InvalidCredential();
    }

    console.log(`[Auth] JWT decoded: ${decoded}`)

    let verified = false;
    stream.guardians.forEach((guardian) => {
      if (decoded == guardian) {
        verified = true;
        console.log(chalk.green("Verification Successful!\n\n"));
        next();
      }
    });
    if (!verified)
      throw new InvalidCredential();
  } catch (err) {
    console.log(`${chalk.red(err.message)}\n\n`);
    res.writeHead(401, {
      'Content-Type': 'application/json',
    });
    res.write(JSON.stringify({
      result: false,
      error: err.name,
      message: err.message
    }));
    res.end();
  }
};


export = {
  verifyStreamer: verifyStreamer,
  verifyGuardian: verifyGuardian,
};