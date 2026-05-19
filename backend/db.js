const mongoose = require('mongoose');
const mongoURL = process.env.MONGO_URI || "mongodb://localhost:27017/TRAVIS";

const connectToMongo = async () =>{
    await mongoose.connect(mongoURL);
    console.log("Connected to MongoDB successfully.");
}

module.exports = connectToMongo;