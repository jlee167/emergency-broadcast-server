const utf8 = require('utf8');
const Nexmo = require('nexmo');


class NexmoSmsService {

  private nexmo;

  constructor(credentials) {
    this.nexmo = new Nexmo({
      apiKey: credentials.key,
      apiSecret: credentials.secret,
    });
  }

  sendSmsWarning(streamer: string, origin: string, dest: string) {
    const text = utf8.encode(`Emergency! Rescue call from ${streamer}`);
    this.nexmo.message.sendSms(origin, dest, text);
  }
}

export = NexmoSmsService;

