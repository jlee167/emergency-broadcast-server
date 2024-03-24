import ActiveStreamRepository = require("../repositories/memory/ActiveStreamRepository");
import Chat = require("../configs/SocketHeaders");
import Mysql = require("../libs/database/drivers/Mysql");
import Redis = require("../libs/database/drivers/Redis");
import chalk = require("chalk");
import LogService = require("../utils/facades/Logger");



/**
 * Update local list of users 
 *
 * @param socketIO 
 * @param streamID 
 * @returns 
 */
async function __updateUserLIst(socketIO, streamID :number) {
  const sockets = socketIO.sockets.adapter.rooms.get(streamID);
  if (!sockets)
    return;

  let users = [];
  let len = 0;
  let tries = 0;
  for (const socketID of sockets) {
    await Redis.read(`socket${socketID}`, (err, data) => {
      users.push(JSON.parse(data));
      len++;
    });
  }

  let fetchWorker = setInterval(() => {
    tries++;
    if (tries > 50)
      clearInterval(fetchWorker);
    if (len == sockets.size) {
      socketIO.to(streamID).emit(Chat.HEADER_USER_LIST, JSON.stringify(users));
      clearInterval(fetchWorker);
    }
  }, 50);
}


async function onUserJoin(socketIO, socket, recv) {
  const packet = JSON.parse(recv);
  const streamID :number = packet.streamID;
  const stream = ActiveStreamRepository.getStream(streamID);

  let user = null;

  await Mysql.execute(
    `SELECT username FROM users WHERE id=${packet.userID};`
  ).then(([rows]) => {
    user = {
      id: packet.userID,
      username: rows[0].username,
      streamID: streamID,
      imageUrl: packet.imageUrl,
      status: 'ONLINE',
    }

    Redis.write(`socket${socket.id}`, JSON.stringify(user));
  });

  
  socket.join(streamID);
  __updateUserLIst(socketIO, streamID);

  const message = `[CHAT] Admin: ${packet.username} joined chat on Stream '${stream.id}'`;
  socketIO.to(streamID).emit(Chat.HEADER_USER_JOIN, JSON.stringify(user));
  LogService.info(message);
}


/**
 * Removes a disconneted user and notify it to other users 
 *
 * @param socketIO 
 * @param socket 
 * @param recv 
 */
function onUserDisconnect(socketIO, socket, recv) {

  const key = `socket${socket.id}`;

  Redis.read(key, async (err, data) => {
    if (err) {
      LogService.info(err);
      return;
    }

    if (!data) {
      return;
    }

    const user = JSON.parse(data);
    LogService.info(`[CHAT] ${chalk.yellow(user.name)} requested to disconnect`);

    Redis.remove(key, (err, result) => {
      if (err) {
        LogService.error(err);
        return;
      } else {
        LogService.info(`[CHAT] ${chalk.yellow(user.name)} disconnected\n\n`);
        __updateUserLIst(socketIO, user.streamID);
      }
    });
  });
}


/**
 * Send list of all users currently in the room 
 *
 * @param socketIO 
 * @param socket 
 * @param recv 
 */
async function sendUserList(socketIO, socket, recv) {
  const packet = JSON.parse(recv);
  const streamID :number = packet.streamID;
  const sockets = await socketIO.fetchSockets(streamID);

  let userFetched = 0;
  let users = new Array();

  setTimeout(() => {
    if (userFetched == sockets.length) {
      socketIO.sockets.socket(socket.id).emit(
        Chat.HEADER_USER_LIST, 
        JSON.stringify(users),
      );
    } else {
      socketIO.sockets.socket(socket.id).emit(
        Chat.HEADER_USER_LIST, 
        Chat.ERR_TIMEOUT,
      );
    }
  }, 5000); 

  for (socket in sockets) {
    Redis.read(`socket${socket.id}`,(err, data) => {
      if (err) {
        LogService.error(`${err.name}, ${err.message}`);
        return;
      }

      userFetched++;
      const user = JSON.parse(data);
      users.push(user);
    });
  }
}


/**
 * Receive a message from user and broadcast it to other users.
 * Store the message in cache DB. (Currently Redis) 
 *
 * @param socketIO 
 * @param socket 
 * @param recv 
 */
function onChatMessage(socketIO, socket, recv) {
  const packet = JSON.parse(recv);
  const streamID: number = packet.streamID;
  packet.timestamp = Date.now();

  Redis.read(`socket${socket.id}`, (err, data) => {
    if (err) {
      LogService.error(`socket${socket.id} not found`);
      return;
    }
    
    Redis.enqueue(`CHAT_STREAM${streamID}`, JSON.stringify(packet), (err, retval) => {
      if(err)
        LogService.error(err);
    });
    try{
      socketIO.to(streamID).emit(Chat.HEADER_CHAT_MESSAGE, JSON.stringify(packet));
    } catch (err) {
      LogService.error(err);
    }
  });
}


export = {
  onUserJoin: onUserJoin,
  onUserDisconnect: onUserDisconnect,
  handleChatMessage: onChatMessage,
  sendUserList: sendUserList,
}