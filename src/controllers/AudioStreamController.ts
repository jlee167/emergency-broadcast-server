import { Request, Response } from "express";
import fs = require("fs");
import LogService = require("../utils/facades/Logger");


/**
 * Return audio data for this stream.
 * Mostly used for HLS audio.  
 *
 * @param {Request} req 
 * @param {Response} res 
 */
function getAudioFile(req: Request, res: Response) {
  const filename = req.params.filename;
  fs.readFile(`${process.env.STORAGE_PATH}/media/audio/${filename}`, (err, data) => {
    if (err) {
      LogService.error(`${err.name}(${err.code}): ${err.message}`);
      res.writeHead(404, {});
      res.end();
    }
    else {
      res.writeHead(200, {});
      res.write(data);
      res.end();
    }
  });
}


export = {
  getAudioFile: getAudioFile,
}