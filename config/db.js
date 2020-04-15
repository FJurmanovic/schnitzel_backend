const mongoose = require("mongoose");

const MONGOURI = "mongodb://localhost:27017/schnitzel?retryWrites=true&w=majority";

const InitiateMongoServer = async () => {
  try {
    await mongoose.connect(MONGOURI, {
        useUnifiedTopology: true,
        useNewUrlParser: true
    });
    console.log("Connected to DB !!");
  } 
  catch (e) {
    console.log(e);
    throw e;
  }
};

module.exports = InitiateMongoServer;