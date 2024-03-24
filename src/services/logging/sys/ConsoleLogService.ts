class ConsoleLogService {

  constructor(){}

  info(msg: string): boolean {
    try {
      console.log(msg);
      return true;
    } catch(err) {
      return false;
    }
  };

  error(msg: string): boolean {
    try {
      console.error(msg);
      return true;
    } catch(err) {
      return false;
    }
  };

  warn(msg: string): boolean {
    try {
      console.warn(msg);
      return true;
    } catch(err) {
      return false;
    }
  };
}


export = ConsoleLogService;