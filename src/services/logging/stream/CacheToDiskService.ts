import Redis = require("../../../libs/database/drivers/Redis");
import CacheConfig = require("../../../configs/Caching");
import MongoDB = require("../../../libs/database/drivers/MongoDB");
import ActiveStreamRepository = require("../../../repositories/memory/ActiveStreamRepository");



/**
 *  Moves cached logs in memory (program memory/Redis)
 *  to permanent storage.
 *  
 *  @Todo Currently permanent storage is hardcoded to Mognodb.
 *        Provide common DB interface in future
 */
class CacheToDiskService {

  private _handles: Array<ReturnType<typeof setInterval>>;
  private _isActive: boolean;

  public LogService;

  //constructor(DatabaseAccessInterface dbInterface){}
  constructor(LogService) {
    this.LogService = LogService;
    this._isActive = false;
    this._handles = [];
  }


  __handleRedisError(err, ret) {
    if (err) {
      this.LogService.error(`${err.name}, ${err.message}`);
      return;
    }
  }


  /**
   * Flush Chat messages if enough number of messages are accumulted in cache. 
   *
   * @param streamID 
   * @returns 
   */
  async __flushChatMessage(streamID: number) {
    const flushThreshold = CacheConfig.CHAT_MIN_FLUSH_SIZE + CacheConfig.MIN_LOG_KEEP;
    await Redis.size(`CHAT_STREAM${streamID}`, (err, size) => {
      if (size < flushThreshold)
        return;

      let flushSize = size - CacheConfig.MIN_LOG_KEEP;
      if (flushSize > CacheConfig.CHAT_MAX_FLUSH_SIZE)
        flushSize = CacheConfig.CHAT_MAX_FLUSH_SIZE;

      Redis.dequeueMany(`CHAT_STREAM${streamID}`, flushSize,
        (err, data: Array<string>) => {
          this.LogService.info(`[Flushing Chat Message] Flushing ${data.length} \
                  message from Stream ${streamID}`);
          if (err) {
            this.LogService.error(err);
            return;
          }
          for (const entry of data) {
            MongoDB.write("chats", JSON.parse(entry));
          }
        });
    });
  }



  start() {
    const chatMessageFlusher = setInterval(() => {
      for (const stream of ActiveStreamRepository.getAllStreams()) {
        if (stream) {
          this.__flushChatMessage(stream.id);
        }
      }
    }, CacheConfig.FLUSH_INTERVAL_MS);


    const mediaDataFlusher = setInterval(() => {
    }, CacheConfig.FLUSH_INTERVAL_MS);


    this._handles.push(chatMessageFlusher);
    this._handles.push(mediaDataFlusher);

    this._isActive = true;
  }


  stopAll() {
    for (const handle of this._handles) {
      clearInterval(handle);
    }
  }


  get isActive() {
    return this._isActive;
  }
}




export = CacheToDiskService;