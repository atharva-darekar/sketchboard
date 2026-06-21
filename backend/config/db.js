require("dotenv").config();
const mongoose = require("mongoose");
const dbURL = process.env.MONGODB_URL;

const connectToDatabase = async () => {
  try {
    await mongoose.connect(dbURL);
    console.log("Succesfully connected to database");
  } catch (error) {
    console.log(`Error to connect to datbase ${error.message}`);
  }
};

module.exports = connectToDatabase;
