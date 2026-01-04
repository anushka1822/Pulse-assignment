require('dotenv').config();
const mongoose = require('mongoose');
const Video = require('../models/Video');

mongoose.connect(process.env.MONGO_URI)
    .then(async () => {
        const video = await Video.findOne().sort({ createdAt: -1 });
        if (video) {
            console.log('Latest Video Details:');
            console.log('ID:', video._id);
            console.log('Title:', video.title);
            console.log('Flagged:', video.isFlagged);
            console.log('Status:', video.status);
            console.log('Labels:', video.moderationLabels);
        } else {
            console.log('No videos found.');
        }
        process.exit();
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
