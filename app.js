const express = require("express");
const bodyParser = require("body-parser");
const InitiateMongoServer = require("./config/db");
const user = require("./routes/user");
const post = require("./routes/post");
var path = require('path');

var cors = require("cors");
InitiateMongoServer();

const app = express();

const PORT = process.env.PORT || 4000; //Backend server will start at port 4000 if there's no "PORT" in .env


app.use(bodyParser.json()); //Middleware for handling http post request

app.use(cors()); //Cross-Origin Resource Sharing (CORS), it gives access to our frontend running at different origin

app.use('/', express.static(path.join(__dirname, 'dist'))) //'/' route will be used by static files built from frontend

app.get("/api", (req, res) => {
  res.json({"api": "working"}) //'/api' route will give only {"api": "working"} result
});

app.use("/api/user", user); //'/api/user' route gives results based on user routes

app.use("/api/post", post); //'/api/post' rout gives results based on post routes



app.listen(PORT, (req, res) => {  //Starts the server
  console.log(`Server Started at PORT ${PORT}`);
});