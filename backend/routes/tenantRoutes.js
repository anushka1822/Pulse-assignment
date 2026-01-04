const express = require('express');
const router = express.Router();
const { createTenant, getTenants } = require('../controllers/tenantController');
// potentially protect this in future phases, currently open for initial setup or add admin protection
const { protect } = require('../middleware/auth');

// Ideally this should be super-admin protected. 
router.post('/', createTenant);
router.get('/', getTenants);

module.exports = router;
