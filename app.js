const express = require("express");
const bodyParser = require("body-parser");
const InitiateMongoServer = require("./config/db");
const user = require("./routes/user");
const post = require("./routes/post");

var cors = require("cors");
InitiateMongoServer();

const app = express();

const PORT = process.env.PORT || 4000;


app.use(bodyParser.json());

app.use(cors());

app.get("/api", (req, res) => {
  res.json({"api": "working"})
});

app.use("/api/user", user);

app.use("/api/post", post);



app.listen(PORT, (req, res) => {
  console.log(`Server Started at PORT ${PORT}`);
});