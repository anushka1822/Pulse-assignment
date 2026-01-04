require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Tenant = require('../models/Tenant');
const User = require('../models/User');
const Video = require('../models/Video');

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB Connected for Seeding'))
    .catch(err => {
        console.error(err);
        process.exit(1);
    });

const seed = async () => {
    try {
        console.log('Clearing existing data...');
        await Tenant.deleteMany({});
        await User.deleteMany({});
        await Video.deleteMany({});

        console.log('Creating Tenants...');
        const tenantA = await Tenant.create({ name: 'Alpha Corp', slug: 'alpha-corp' });
        const tenantB = await Tenant.create({ name: 'Beta Ltd', slug: 'beta-ltd' });

        console.log('Creating Users...');
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('password123', salt);

        // Alpha Tenant Editor
        await User.create({
            name: 'Alpha Editor',
            email: 'editor@alpha.com',
            password: hashedPassword,
            role: 'Editor',
            tenantId: tenantA._id
        });

        // Alpha Tenant Viewer
        await User.create({
            name: 'Alpha Viewer',
            email: 'viewer@alpha.com',
            password: hashedPassword,
            role: 'Viewer',
            tenantId: tenantA._id
        });

        // (Beta Admin removed - Tenants don't have individual Admins anymore)

        // Super Admin (No Tenant)
        await User.create({
            name: 'Super Admin',
            email: 'super@admin.com',
            password: hashedPassword,
            role: 'Admin',
            // No tenantId
        });

        console.log('Data Seeded Successfully!');
        console.log('-----------------------------------');
        console.log('Alpha Admin: admin@alpha.com / password123');
        console.log('Alpha Editor: editor@alpha.com / password123');
        console.log('Alpha Viewer: viewer@alpha.com / password123');
        console.log('Beta Admin: admin@beta.com / password123');
        console.log('-----------------------------------');
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

seed();