const express = require('express');
const router = express.Router();
const { createUser, getUsers } = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');

// All routes require login
router.use(protect);

// Only Admins can create users
router.post('/', authorize('Admin'), createUser);

// Admins can list users (maybe Editors too? sticking to Admin for management)
router.get('/', authorize('Admin'), getUsers);

module.exports = router;
