const express = require('express');
const router = express.Router();
const { uploadVideo, getVideos, updateVideo, deleteVideo } = require('../controllers/videoController');
const { streamVideo } = require('../controllers/streamController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Admin/Editor can upload
router.post('/upload', protect, authorize('Admin', 'Editor'), upload.single('video'), uploadVideo);

// Get all videos for the tenant
router.get('/', protect, getVideos);

// Everyone (Viewer/Editor/Admin) can stream
router.get('/stream/:id', protect, streamVideo);

// Update/Publish/Flag video
router.patch('/:id', protect, authorize('Admin', 'Editor'), updateVideo);
router.delete('/:id', protect, authorize('Admin', 'Editor'), deleteVideo); // Placeholder if needed, but mainly we need patch

module.exports = router;