const jwt_decode = require("jwt-decode");

//Middleware that takes token and decodes it into the userId

module.exports = function(req, res, next) {
  let token = '';
  console.log(req.header("header"))
  if(!req.header("token")){
    token = req.body["token"];
  }else{ 
    token = req.header("token");
  }
  if (!token) return res.status(401).json({ message: "Auth Error" });

  try {
    const decoded = jwt_decode(token);
    req.user = decoded.user;
    next();
  } catch (e) {
    console.error(e);
    res.status(500).send({ message: "Invalid Token" });
  }
};