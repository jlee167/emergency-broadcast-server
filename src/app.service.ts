import CacheToDiskService = require("./services/logging/stream/CacheToDiskService");
import ConsoleLogService = require("./services/logging/sys/ConsoleLogService");
import NexmoSmsService = require("./services/sms/NexmoSmsService");


interface LogServiceInterface {
  info(msg: any): boolean;
  error(msg: any): boolean;
  warn(msg: any): boolean;
}


interface SmsServiceInterface {
  sendSmsWarning: (streamer: string, origin: string, dest: string) => any;
}


interface CacheFlushInterface {
  start: () => any
}


/* Dependency Injections */
const LogService: LogServiceInterface = new ConsoleLogService();
const SmsService: SmsServiceInterface = new NexmoSmsService({
  apiKey: process.env.NEXMO_API_KEY,
  apiSecret: process.env.NEXMO_API_SECRET,
});
const CacheFlushService: CacheFlushInterface = new CacheToDiskService(LogService);


export = {
  LogService: LogService, 
  SmsService: SmsService,
  CacheFlushService: CacheFlushService,
};