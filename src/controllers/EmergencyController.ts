import Mysql = require("../libs/database/drivers/Mysql");
const ActiveStreamRepository = require("../repositories/memory/ActiveStreamRepository");
import LogService = require("../utils/facades/Logger");


/**
 * Start emergency protocol on this channel. 
 *
 * @param {*} req 
 * @param {*} res 
 * @param {*} params 
 */
async function startEmergency(req, res, params) {
  const stream = params.stream;
  const startEmergencyQuery = `CALL StartEmergencyProtocol(${stream.userID});`;

  Mysql.execute(startEmergencyQuery)
    .then(() => {
      stream.sendSmsWarning();
      res.write(JSON.stringify({
        result: true
      }));
      res.end();
    })
    .catch(err => {
      res.write(JSON.stringify({
        result: false,
        error: err.message
      }));
      res.end();
    });
}


/**
 * Alleviate emergency state to normal state. 
 *
 * @param {*} req 
 * @param {*} res 
 */
async function stopEmergency(req, res) {
  const stream = ActiveStreamRepository.getStream(req.params.stream_id);
  const query = `CALL StopEmergencyProtocol(${stream.userID});`;
  Mysql.execute(query)
    .then(() => {
      //@todo
    })
    .catch((err) => {
      res.write(JSON.stringify({
        result: false,
        error: err.message
      }));
      res.end();
    });
}


export = {
  startEmergency: startEmergency,
  stopEmergency: stopEmergency
}