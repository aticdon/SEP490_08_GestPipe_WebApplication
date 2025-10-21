const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

// Helper: Hash password using SHA256
const hashPassword = (password) => {
  return crypto.createHash('sha256').update(password).digest('hex');
};

// Helper: Generate JWT token
const generateToken = (adminId, role) => {
  return jwt.sign(
    { id: adminId, role: role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' } // Token expires in 7 days
  );
};

// @desc    Login admin/superadmin
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Find admin and include temporaryPassword field
    const admin = await Admin.findOne({ email }).select('+temporaryPassword');

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    console.log('🔍 Login attempt for:', email);
    console.log('🔐 Hashed password in DB:', admin.password.substring(0, 20) + '...');
    console.log('🔑 Input password hashed:', hashPassword(password).substring(0, 20) + '...');

    // Check account status - Allow inactive to login for first time
    if (admin.accountStatus === 'suspended') {
      return res.status(403).json({
        success: false,
        message: 'Account is suspended. Please contact administrator.'
      });
    }

    // Hash the input password and compare
    const hashedPassword = hashPassword(password);
    
    if (hashedPassword !== admin.password) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if using temporary password (first login)
    const isUsingTempPassword = admin.temporaryPassword && 
                                hashedPassword === admin.temporaryPassword;

    // Auto-activate account on first login (inactive → active)
    if (admin.accountStatus === 'inactive' && isUsingTempPassword) {
      admin.accountStatus = 'active';
      await admin.save();
    }

    // Generate JWT token
    const token = generateToken(admin._id, admin.role);

    // Response data
    const responseData = {
      success: true,
      message: 'Login successful',
      token,
      admin: {
        id: admin._id,
        fullName: admin.fullName,
        email: admin.email,
        role: admin.role,
        accountStatus: admin.accountStatus,
        theme: admin.theme,
        uiLanguage: admin.uiLanguage,
        isFirstLogin: isUsingTempPassword // Flag for frontend
      }
    };

    // Add redirect instructions based on status
    if (isUsingTempPassword) {
      responseData.redirect = 'change-password';
      responseData.message = 'Please change your temporary password';
    } else {
      responseData.redirect = 'dashboard';
    }

    res.status(200).json(responseData);

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
};

// @desc    Change password (for first login or regular change)
// @route   POST /api/auth/change-password
// @access  Private
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const adminId = req.admin.id; // From auth middleware

    // Validation
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide current and new password'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long'
      });
    }

    // Find admin with temporaryPassword field
    const admin = await Admin.findById(adminId).select('+temporaryPassword');

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    // Verify current password
    const hashedCurrentPassword = hashPassword(currentPassword);
    if (hashedCurrentPassword !== admin.password) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    admin.password = newPassword; // Will be hashed by pre-save hook
    admin.temporaryPassword = null; // Clear temporary password
    admin.isFirstLogin = false; // Mark as not first login anymore
    
    await admin.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully',
      redirect: 'dashboard' // Always redirect to dashboard after password change
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during password change'
    });
  }
};

// @desc    Update profile
// @route   PUT /api/auth/profile
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    const adminId = req.admin.id;
    const { fullName, phoneNumber, birthday, theme, uiLanguage } = req.body;

    // Find admin
    const admin = await Admin.findById(adminId);

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    // Update fields if provided
    if (fullName !== undefined) admin.fullName = fullName;
    if (phoneNumber !== undefined) admin.phoneNumber = phoneNumber;
    if (birthday !== undefined) admin.birthday = birthday;
    if (theme !== undefined) admin.theme = theme;
    if (uiLanguage !== undefined) admin.uiLanguage = uiLanguage;

    await admin.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      admin: {
        id: admin._id,
        fullName: admin.fullName,
        email: admin.email,
        role: admin.role,
        phoneNumber: admin.phoneNumber,
        birthday: admin.birthday,
        theme: admin.theme,
        uiLanguage: admin.uiLanguage
      }
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during profile update'
    });
  }
};

// @desc    Get current admin info
// @route   GET /api/auth/me
// @access  Private
exports.getCurrentAdmin = async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin.id).select('-password -temporaryPassword');

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    res.status(200).json({
      success: true,
      admin
    });

  } catch (error) {
    console.error('Get current admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};
