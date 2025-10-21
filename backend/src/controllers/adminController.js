const crypto = require('crypto');
const Admin = require('../models/Admin');

// Helper: Generate random password
const generateRandomPassword = () => {
  return crypto.randomBytes(8).toString('hex'); // 16 characters
};

// Helper: Hash password
const hashPassword = (password) => {
  return crypto.createHash('sha256').update(password).digest('hex');
};

// @desc    Create new admin (SuperAdmin only)
// @route   POST /api/admin/create
// @access  Private (SuperAdmin)
exports.createAdmin = async (req, res) => {
  try {
    console.log('🚀 Create Admin called with body:', req.body);
    const { email, fullName, phoneNumber, province } = req.body;

    // Validation
    if (!email || !fullName) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and full name'
      });
    }

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({
        success: false,
        message: 'Admin with this email already exists'
      });
    }

    // Generate temporary password
    const tempPassword = generateRandomPassword();

    // Create new admin (password will be hashed by pre-save hook)
    const newAdmin = new Admin({
      fullName,
      email,
      phoneNumber: phoneNumber || null,
      province: province || null,
      password: tempPassword, // Plain password - will be hashed by pre-save hook
      temporaryPassword: tempPassword, // Plain password - will be hashed by pre-save hook
      role: 'admin',
      accountStatus: 'inactive', // Default status is INACTIVE
      isFirstLogin: true,
      theme: 'dark',
      uiLanguage: 'vi'
    });

    await newAdmin.save();

    console.log('✅ Admin created successfully!');
    console.log('📧 Email:', newAdmin.email);
    console.log('🔑 Temporary Password:', tempPassword);

    res.status(201).json({
      success: true,
      message: 'Admin created successfully',
      admin: {
        id: newAdmin._id,
        fullName: newAdmin.fullName,
        email: newAdmin.email,
        role: newAdmin.role
      },
      temporaryPassword: tempPassword // Return plain password for SuperAdmin to send via email
    });

  } catch (error) {
    console.error('Create admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during admin creation'
    });
  }
};

// @desc    Get all admins (SuperAdmin only)
// @route   GET /api/admin/list
// @access  Private (SuperAdmin)
exports.getAllAdmins = async (req, res) => {
  try {
    const admins = await Admin.find({ role: 'admin' })
      .select('-password -temporaryPassword')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: admins.length,
      admins
    });

  } catch (error) {
    console.error('Get admins error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Delete admin (SuperAdmin only)
// @route   DELETE /api/admin/:id
// @access  Private (SuperAdmin)
exports.deleteAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    const admin = await Admin.findById(id);

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    if (admin.role === 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'Cannot delete SuperAdmin'
      });
    }

    await Admin.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Admin deleted successfully'
    });

  } catch (error) {
    console.error('Delete admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Toggle admin status (active <-> suspended)
// @route   PUT /api/admin/toggle-status/:id
// @access  Private (SuperAdmin)
exports.toggleAdminStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const admin = await Admin.findById(id);

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    // Prevent changing status of superadmin
    if (admin.role === 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'Cannot change SuperAdmin status'
      });
    }

    // Toggle status: active <-> suspended
    if (admin.accountStatus === 'active') {
      admin.accountStatus = 'suspended';
    } else if (admin.accountStatus === 'suspended') {
      admin.accountStatus = 'active';
    } else {
      // If status is inactive, set to active
      admin.accountStatus = 'active';
    }

    await admin.save();

    console.log(`✅ Admin ${admin.email} status changed to ${admin.accountStatus}`);

    res.status(200).json({
      success: true,
      message: 'Admin status updated successfully',
      admin: {
        _id: admin._id,
        email: admin.email,
        fullName: admin.fullName,
        accountStatus: admin.accountStatus
      }
    });

  } catch (error) {
    console.error('Toggle status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};
