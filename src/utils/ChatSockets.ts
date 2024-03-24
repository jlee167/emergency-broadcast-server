interface ChatSocket {
  id: number;
  user: any;
}


class ChatSocketStore {

  private sockets: Array<ChatSocket>;

  constructor () {
    this.sockets = [];
  }

  add(socketID, user) {
    this.sockets[socketID] = {
      id: socketID,
      user: user
    };
  }

  remove(socketID) {
    this.sockets[socketID] = null;
  }

  findByID(socketID) {
    return this.sockets[socketID];
  }
}

export = ChatSocketStore;