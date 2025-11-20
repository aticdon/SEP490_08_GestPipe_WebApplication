const express = require('express');
const router = express.Router();
const { getUserOverviewStats, getVersionOverviewStats } = require('../controllers/dashboardController');

// Import middleware đúng đường dẫn và tên export
const { protect, authorize } = require('../middlewares/authMiddleware');

// Bảo vệ route bằng token và chỉ admin được phép
router.get('/user-overview', protect, authorize('superadmin'), getUserOverviewStats);

// Bảo vệ route bằng token và chỉ admin được phép
router.get('/version-overview', protect, authorize('superadmin'), getVersionOverviewStats);

module.exports = router;
