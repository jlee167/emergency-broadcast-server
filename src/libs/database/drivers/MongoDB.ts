const { MongoClient } = require('mongodb');
let uri = process.env.MONGODB_CLUSTER_URI;
let client;


let db = null;

async function setNewClient(newURI: string) {
  uri = newURI;
  client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
}

async function selectDB(newDB: string) {
  db = await client.db(newDB);
}


async function connect() {
  try{
    await client.connect();
  } catch (err) {
    throw err;
  }
}


function isReady() {
  return !(db == null);
}


async function write(collection: string, data: object) {
  const __collection = db.collection(collection);
  await __collection.insertMany([data]);
}


async function insertMany(collection: string, data: Array<object>) {
  const __collection = db.collection(collection);
  await __collection.insertMany(data);
}


async function read(collection: string, filter: object) {
  const __collection = db.collection(collection);
  const result = await __collection.find(filter).toArray();
  return result;
}


async function resetCollection(collection: string) {
  db.collection(collection).remove({});
}


const MongoDB = {
  write: write,
  insertMany: insertMany,
  read: read,
  isReady: isReady,
  setNewClient: setNewClient,
  connect: connect,
  resetCollection: resetCollection,
  selectDB: selectDB,
};

export = MongoDB;