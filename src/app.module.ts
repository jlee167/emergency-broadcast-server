import MongoDB = require("./libs/database/drivers/MongoDB");
import Mysql = require("./libs/database/drivers/Mysql");
import Redis = require("./libs/database/drivers/Redis");

import Services = require("./app.service");

class App {
  public services = Services;

  /* Databases */
  // public userDB = Mysql;
  // public logDB = MongoDB;
  // public chatDB = Redis;
}

export = new App();