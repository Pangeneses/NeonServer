const express = require('express');
const multer = require('multer');

const path = require('path');
const imageController = require('../controllers/images.controller');

const router = express.Router();
const { v4: uuidv4 } = require('uuid');

const storage = multer.diskStorage({

  destination: (req, file, cb) => {
    cb(null, 'images/');
  },
  filename: (req, file, cb) => {

    const ext = path.extname(file.originalname);
    
    const uniqueName = `${uuidv4()}${ext}`;
    
    cb(null, uniqueName);

  }

});

const upload = multer({ storage, limits: { fileSize: 4194304 } });

router.post('/', upload.single('file'), imageController.uploadImage);

router.delete('/:filename', imageController.deleteImage);
  
module.exports = router;