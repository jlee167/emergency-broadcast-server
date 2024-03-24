const env = require('../../../env');
import mysql = require('mysql2/promise');
import Setting = require('../../../configs/Connections');


let pool :mysql.Pool = mysql.createPool({
  host: env.MARIADB_HOST,
  user: env.MARIADB_USER,
  password: env.MARIADB_PASSWORD,
  database: env.MARIADB_DATABASE,
  waitForConnections: true,
  connectionLimit: Setting.MYSQL_POOL_SIZE,
  queueLimit: 0
});


async function getConnection() :Promise<mysql.Connection> {
  return pool.getConnection();
}

async function execute(query :string) :Promise<[any, mysql.FieldPacket[]]> {
  return pool.execute(query);
}


export = {
  getConnection: getConnection,
  execute: execute,
};


