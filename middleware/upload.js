const multer = require("multer");
const path = require("path");
const fs = require("fs");

const DatauriParser  = require('datauri/parser');

require('dotenv').config()

const cloudinary = require('cloudinary').v2

cloudinary.config({ //Configurates cloudinary 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});
//Middleware for adding images to disk before sending it to cloudinary

const storage = multer.memoryStorage();

const dUri = new DatauriParser();
const multerUploads = multer({ storage }).single('file');

const dataUri = req => dUri.format(path.extname(req.file.originalname).toString(), req.file.buffer);

module.exports = { multerUploads, dataUri };