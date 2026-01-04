const mongoose = require('mongoose');
const Video = require('./models/Video');
require('dotenv').config();

async function checkVideoDetails() {
    await mongoose.connect(process.env.MONGO_URI);
    const video = await Video.findOne().sort({ createdAt: -1 });
    console.log('Latest Video Metadata:');
    console.log(JSON.stringify(video, null, 2));
    process.exit(0);
}

checkVideoDetails();
