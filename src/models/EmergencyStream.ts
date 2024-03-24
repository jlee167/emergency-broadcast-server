import ChatSocketStore = require('../utils/ChatSockets');


interface StreamInfo {
  userID: number;
  privateKey: string;
  username: string;
  id: number;
  guardians: Array<number>;
  protocol: string;
}



class EmergencyStream {

  public id;
  public userID;
  public username;
  public guardians;
  public chatSockets;

  public protocol;
  public videoUrl: string;
  public audioUrl: string;
  public videoOutUrl: string;
  public audioOutUrl: string;
  public geoLocationUrl: string;

  public audioInPort: number;
  public audioOutPort: number;
  public videoInPort: number;
  public videoOutPort: number;

  public tcpVideoServer;

  public ffmpegAudio;
  public ffmpegVideo;
  public audioResHandles;
  public sockets;


  #privateKey: string;

  public fps: number;

  public geoLocation;

  

  /* ------------------------------ Intialization ----------------------------- */

  /**
   * Default Constructor.
   * Complete essential streaming information
   * 
   */
  constructor(streamInfo: StreamInfo) {
    this.id = streamInfo.id;
    this.userID = streamInfo.userID;
    this.#privateKey = streamInfo.privateKey;
    this.username = streamInfo.username;
    this.guardians = streamInfo.guardians;
    this.protocol = streamInfo.protocol;
    this.chatSockets = new ChatSocketStore();
    this.sockets = [];
    this.audioResHandles = [];

    /* Streamer's GeoLocation info */
    this.geoLocation = {
      latitude: Number(37),
      longitude: Number(127)
    };
  }

  get getUsername() {
    return this.username;
  }

  get getID() {
    return this.id;
  }

  get privateKey() {
    return this.#privateKey;
  }

  /**
   * @param {String} url
   */
  set setGeoLocationUrl(url) {
    this.geoLocationUrl = url;
  }
}


export = EmergencyStream;