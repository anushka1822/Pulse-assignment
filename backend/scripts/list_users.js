require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

mongoose.connect(process.env.MONGO_URI)
    .then(async () => {
        console.log('Connected to DB');
        const users = await User.find({});
        console.log('--- USERS ---');
        console.log(JSON.stringify(users.map(u => ({ id: u._id, name: u.name, email: u.email, role: u.role, tenantId: u.tenantId })), null, 2));
        process.exit();
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
