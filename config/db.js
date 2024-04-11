const mongoose = require("mongoose");
const dotenv = require("dotenv").config();

const dbUrl = process.env.mongoProd;
const dbName = process.env.DBNAME;

const connectToMongo = async () => {
  try {
    const connection = await mongoose.connect(dbUrl);
    if (connection) {
      console.log("Db is connected");
    } else {
      console.log("Not yet connected");
    }
  } catch (err) {
    console.error(`Error is ${err.message}`);
    process.exit(1);
  }
};

module.exports = connectToMongo;
