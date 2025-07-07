const fs = require('fs');

const path = require('path');

exports.uploadImage = (req, res) => {

  if (!req.file) {

    return res.status(400).json({ message: 'No file uploaded' });

  }

  const fileInfo = {
    originalName: req.file.originalname,
    mimeType: req.file.mimetype,
    filename: req.file.filename,
    size: req.file.size,
    path: req.file.path,
  };

  res.status(200).json({
    message: 'Image uploaded successfully',
    file: fileInfo
  });

};

exports.deleteImage = (req, res) => {
  
  const filename = req.params.filename;
  
  const safeFilename = path.basename(filename);

  const filePath = path.join(process.cwd(), 'images', safeFilename);

  fs.unlink(filePath, (err) => {
    
    if (err) {
      
      console.error('Error deleting file:', err);
      
      return res.status(500).json({ message: 'Failed to delete image' });
    
    }
    
    res.json({ message: 'Image deleted successfully' });
  
  });

};