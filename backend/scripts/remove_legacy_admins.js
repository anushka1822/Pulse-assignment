require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

mongoose.connect(process.env.MONGO_URI)
    .then(async () => {
        console.log('Connected to DB for cleanup');

        // Delete Users who are 'Admin' BUT have a tenantId (Legacy)
        const result = await User.deleteMany({
            role: 'Admin',
            tenantId: { $ne: null }
        });

        console.log(`Deleted ${result.deletedCount} legacy Tenant Admins.`);
        process.exit();
    })
    .catch(err => console.error(err));
