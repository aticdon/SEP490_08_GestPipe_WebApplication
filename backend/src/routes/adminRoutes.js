const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { protect, authorize } = require('../middlewares/authMiddleware');

// All routes require authentication and SuperAdmin role
router.post('/create', protect, authorize('superadmin'), adminController.createAdmin);
router.get('/list', protect, authorize('superadmin'), adminController.getAllAdmins);
router.put('/toggle-status/:id', protect, authorize('superadmin'), adminController.toggleAdminStatus);
router.delete('/:id', protect, authorize('superadmin'), adminController.deleteAdmin);

module.exports = router;
