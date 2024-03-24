const redis = require('redis');
const redisClient = redis.createClient();

let inst;

export = {
  constructor: () => {
    inst = redisClient;
  },


  getConnection: () => {
    return inst;
  },


  write: async (k: any, v: any) => {
    redisClient.set(k, v);
  },

  read: async (k: any, callback: Function) => {
    return redisClient.get(k, (err, retval) => {
      callback(err, retval);
    });
  },

  readSync: async (k: any, callback: Function) => {
    return await redisClient.get(k, (err, retval) => {
      callback(err, retval);
    });
  },

  remove: async (k: any, callback: Function) => {
    redisClient.del(k, (err, retval) => {
      callback(err, retval);
    });
  },

  peek: async (list, callback) => {
    return await redisClient.lrange(list, -1, -1, (err, retval) => {
      callback(err, retval);
    });
  },

  enqueue: async (list, value, callback) => {
    redisClient.rpush([list, value], (err, retval) => {
      callback(err, retval);
    });
  },

  dequeue: async (list, callback) => {
    return redisClient.lpop(list, (err, retval) => {
      callback(err, retval);
    });
  },

  dequeueMany: async (list, size, callback) => {
    const data = await redisClient.lrange(list, 0, (size-1), (err, retval) => {
      callback(err, retval);
    });

    redisClient.ltrim(list, size, -1);

    return data;
  },

  size: async (list, callback) => {
    return await redisClient.llen(list, (err, retval) => {
      callback(err, retval);
    });
  },
};