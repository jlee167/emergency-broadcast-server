import fs = require("fs");
import LogService = require("../utils/facades/Logger");


// /**
//  * Get HLS channel file (.m3u8) and segment (.ts) 
//  * from local storage  
//  * 
//  * @param {Request} req 
//  * @param {Response} res 
//  */
// function getHlsSegments(req, res) {
  
//   const filename = req.params.filename;

//   fs.readFile(`./storage/media/hls/${filename}`, (err, data) => {
//     if (err) {
//       Logger.error(`${err.name}(${err.code}): ${err.message}`);
//       res.writeHead(404, {});
//       res.end();
//     }
//     else {
//       res.writeHead(200, {
//       });
//       res.write(data);
//       res.end();
//     }
//   });
// }



async function getHlsSegments (req, res) {
  res.writeHead(200, {
    'Content-Type': 'text/html; charset=utf-8',
    'Access-Control-Allow-Origin': '*'
  });

  /* Return M3U8 and TS files */
  const filePath = `./resources/videos/${req.params.stream_id}/${req.params.filename}`;
  fs.createReadStream(filePath).pipe(res);
  LogService.info(`Resource requested: ${req.url}`);
  LogService.info(`Resource fetched from filesystem: ${filePath}`);
}


export = {
  getHlsSegments: getHlsSegments,
}