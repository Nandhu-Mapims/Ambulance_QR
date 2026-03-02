const path = require('path');

const uploadEvidence = (req, res, next) => {
  if (!req.file) {
    const err = new Error('No file uploaded');
    err.statusCode = 400;
    return next(err);
  }

  const fileUrl = `/uploads/${req.file.filename}`;
  res.status(201).json({ success: true, url: fileUrl, filename: req.file.filename });
};

module.exports = { uploadEvidence };
