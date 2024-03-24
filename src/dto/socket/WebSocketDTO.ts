class WebSocketDTO {
  public socket;
  public packet;
  public header;

  constructor(socket, packet, header) {
    this.socket = socket;
    this.packet = packet;
    this.header = header;
  }
}

export = WebSocketDTO;