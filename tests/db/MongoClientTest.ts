require("../../env");
import MongoClient = require("../../src/libs/database/drivers/MongoDB");
import ConsoleHelper = require("../console");
import test = require("../test");

const assert: (any) => any = test.assert;


const testdata1 = { name: "Ada Lovelace", job: "programmer" };
const testdata2 = { name: "Alan Turing", job: "mathmatician" };


/**
 *   Write and read back test data to MongoDB
 */
async function jsonReadbackTest() {
  await MongoClient.setNewClient(process.env.MONGODB_LOCAL_URI);
  await MongoClient.connect();
  await MongoClient.selectDB("test_db");

  await MongoClient.resetCollection("test_collection");

  await MongoClient.write("test_collection", testdata1);
  await MongoClient.write("test_collection", testdata2);

  const findAllResult = await MongoClient.read("test_collection", {});
  const returnedData1 = (await MongoClient.read("test_collection", { name: "Ada Lovelace" }))[0];
  const returnedData2 = (await MongoClient.read("test_collection", { name: "Alan Turing" }))[0];

  // console.log(`Reading back data1:`);
  // console.log(returnedData1);
  // console.log(`Reading back data2:`);
  // console.log(returnedData2);

  for (let key in Object.keys(returnedData1)) {
    assert(returnedData1[key] == testdata1[key]);
  }
}


async function exec() {
  try {
    await jsonReadbackTest();
    ConsoleHelper.printSuccessMsg();
    process.exit();
  } catch (err) {
    console.log(err);
    ConsoleHelper.printFailMsg();
  }
}


exec();
