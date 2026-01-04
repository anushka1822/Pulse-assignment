const Tenant = require('../models/Tenant');

exports.createTenant = async (req, res) => {
    try {
        const { name, slug } = req.body;
        const tenant = await Tenant.create({ name, slug });
        res.status(201).json(tenant);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

exports.getTenants = async (req, res) => {
    try {
        const tenants = await Tenant.find();
        res.json(tenants);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
