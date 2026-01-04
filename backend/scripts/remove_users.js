require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

mongoose.connect(process.env.MONGO_URI)
    .then(async () => {
        console.log('Connected to DB');

        const emails = ['editor@pulse.com', 'editor@gen.com'];
        console.log('Searching for users with emails:', emails);

        const users = await User.find({ email: { $in: emails } });

        if (users.length === 0) {
            console.log('No matching users found.');
        } else {
            console.log('Found users:', users.map(u => ({ id: u._id, name: u.name, email: u.email })));

            const result = await User.deleteMany({ email: { $in: emails } });
            console.log('Deleted users result:', result);
        }

        process.exit();
    })
    .catch(err => {
        console.error('Error:', err);
        process.exit(1);
    });
