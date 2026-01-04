const multer = require('multer');

// Use Memory Storage because we are piping directly to Amazon S3 
const storage = multer.memoryStorage();

// Requirement 37: File type validation (Verification of format) 
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('video/')) {
        cb(null, true);
    } else {
        // Requirement 43: Error handling and user feedback
        cb(new Error('Only video files are allowed'), false);
    }
};

// Requirement 37: Size verification (e.g., 100MB limit) 
module.exports = multer({
    storage,
    fileFilter,
    limits: { fileSize: 200 * 1024 * 1024 }
});