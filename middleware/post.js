const jwt_decode = require("jwt-decode");

//Middleware that takes token and decodes it into userId

module.exports = function(req, res, next) {
  const token = req.header("token");
  if (!token) return res.status(401).json({ message: "Auth Error" });

  try {
    const decoded = jwt_decode(token);
    req.post = decoded.post;
    next();
  } catch (e) {
    console.error(e);
    res.status(500).send({ message: "Invalid Token" });
  }
};