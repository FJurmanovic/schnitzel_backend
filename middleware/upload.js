const multer = require("multer");
const path = require("path");
const fs = require("fs");



const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        console.log(req.headers)
        let pth = `./public/${req.headers.type}/${req.headers.id}`;
        fs.mkdirSync(pth, { recursive: true });
        cb(null, pth)
    },
    filename: function (req, file, cb) {
        ext = path.extname(file.originalname)
        cb(null, req.headers.id +  ext)
        
    }
  });

const upload = multer({ storage: storage });

module.exports = upload;