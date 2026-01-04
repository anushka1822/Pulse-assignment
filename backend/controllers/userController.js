const User = require('../models/User');
const bcrypt = require('bcryptjs');

// Admin adds a user to their own tenant
exports.createUser = async (req, res) => {
    try {
        const { name, email, password, role, tenantId } = req.body;

        // Ensure only Super Admin can add users
        if (req.user.role !== 'Admin') {
            return res.status(403).json({ message: 'Only Admins can add users' });
        }

        // Validate role assignment
        if (!['Editor', 'Viewer'].includes(role)) {
            return res.status(400).json({ message: 'Invalid role. Choose Editor or Viewer' });
        }

        if (!tenantId) {
            return res.status(400).json({ message: 'Tenant ID is required' });
        }

        let user = await User.findOne({ email });
        if (user) return res.status(400).json({ message: 'User already exists' });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = await User.create({
            name,
            email,
            password: hashedPassword,
            role,
            tenantId
        });

        res.status(201).json({ id: newUser._id, name: newUser.name, email: newUser.email, role: newUser.role, tenantId: newUser.tenantId });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getUsers = async (req, res) => {
    try {
        let query = {};

        if (req.user.role === 'Admin') {
            // Super Admin: Can filter by tenantId if provided
            if (req.query.tenantId) {
                query.tenantId = req.query.tenantId;
            }
            // If no tenantId, maybe return all? Or just return nothing found? 
            // Let's allow returning all if no tenant specified, or handle as needed.
            // But usually we want to see users OF a tenant.
        } else {
            // Tenant Users: Scoped to their tenant
            query.tenantId = req.user.tenantId;
        }

        const users = await User.find(query).select('-password').populate('tenantId', 'name');
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
