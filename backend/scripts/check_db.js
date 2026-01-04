require('dotenv').config();
const mongoose = require('mongoose');
const Video = require('../models/Video');
const User = require('../models/User');

mongoose.connect(process.env.MONGO_URI)
    .then(async () => {
        console.log('Connected to DB');
        const videos = await Video.find({});
        console.log('--- VIDEOS ---');
        console.log(JSON.stringify(videos, null, 2));

        const users = await User.find({ role: 'Admin' });
        console.log('--- ADMINS ---');
        console.log(users.map(u => ({ id: u._id, email: u.email, tenantId: u.tenantId })));

        process.exit();
    })
    .catch(err => console.error(err));
