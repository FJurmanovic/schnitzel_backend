const express = require("express");
const bodyParser = require("body-parser");
const InitiateMongoServer = require("./config/db");

var cors = require("cors");
InitiateMongoServer();

const app = express();

const PORT = process.env.PORT || 4000;

app.use(bodyParser.json());

app.use(cors());

app.get("/", (req, res) => {
  res.json({ message: "API Working" });
});

app.listen(PORT, (req, res) => {
  console.log(`Server Started at PORT ${PORT}`);
});