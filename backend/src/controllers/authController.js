const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const { formatAdminDocument, formatDateTimeWithOffset } = require('../utils/dateFormatter');

// @desc    Reset password after OTP verified
// @route   POST /api/auth/reset-password
// @access  Public
exports.resetForgotPassword = async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    if (!email || !newPassword) {
      return res.status(400).json({ success: false, message: 'Please provide email and new password' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
    }
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin not found' });
    }
    // Chỉ cho đổi mật khẩu nếu OTP đã được xác thực (resetPasswordOTP == null và resetPasswordOTPExpires == null)
    if (admin.resetPasswordOTP || admin.resetPasswordOTPExpires) {
      return res.status(400).json({ success: false, message: 'OTP not verified yet' });
    }
    admin.password = newPassword; // Sẽ được hash bởi pre-save hook
    admin.isFirstLogin = false;
    await admin.save();
    return res.status(200).json({ success: true, message: 'Password reset successfully. You can now login.' });
  } catch (error) {
    console.error('Reset forgot password error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
// @desc    Verify OTP for forgot password
// @route   POST /api/auth/verify-otp
// @access  Public
exports.verifyForgotPasswordOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Please provide email and OTP' });
    }
    const admin = await Admin.findOne({ email });
    if (!admin || !admin.resetPasswordOTP || !admin.resetPasswordOTPExpires) {
      return res.status(400).json({ success: false, message: 'OTP not found or expired' });
    }
    // Check OTP and expiry
    const now = new Date();
    if (admin.resetPasswordOTP !== otp) {
      return res.status(401).json({ success: false, message: 'Invalid OTP' });
    }
    if (admin.resetPasswordOTPExpires < now) {
      return res.status(401).json({ success: false, message: 'OTP expired' });
    }
    // Mark OTP as verified (optional: clear OTP)
    admin.resetPasswordOTP = null;
    admin.resetPasswordOTPExpires = null;
    await admin.save();
    return res.status(200).json({ success: true, message: 'OTP verified. You can now reset your password.' });
  } catch (error) {
    console.error('Verify forgot password OTP error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const { sendMail } = require('../utils/mailer');
exports.sendForgotPasswordOTP = async (req, res) => {
  try {
    const { email } = req.body;
      console.log(`🔍 [ForgotPassword] Request OTP for: ${email}`);
    if (!email) {
      console.log('❌ [ForgotPassword] Missing email');
      return res.status(400).json({ success: false, message: 'Please provide email' });
    }
    const admin = await Admin.findOne({ email });
    if (!admin) {
      console.log(`❌ [ForgotPassword] Admin not found: ${email}`);
      return res.status(404).json({ success: false, message: 'Admin not found' });
    }
    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    // Set expiry 5 minutes
    const expires = new Date(Date.now() + 5 * 60 * 1000);
    admin.resetPasswordOTP = otp;
    admin.resetPasswordOTPExpires = expires;
    await admin.save();
    console.log(`✅ [ForgotPassword] OTP generated for ${email}: ${otp}`);
    try {
      await sendMail({
        to: admin.email,
        subject: 'GestPipe Password Reset OTP',
        text:
          `Dear ${admin.fullName},\n\n` +
          `You requested to reset your password on GestPipe.\n` +
          `Your OTP code: ${otp}\n` +
          `This code is valid for 5 minutes.\n\n` +
          `If you did not request this, please ignore this email.\n\n` +
          `Best regards,\nGestPipe Team`,
        html:
          `<div style='font-family:Montserrat,sans-serif;color:#222;background:#f8fafc;padding:32px;border-radius:12px;max-width:480px;margin:auto;'>` +
          `<div style='text-align:center;margin-bottom:24px;'><img src='https://raw.githubusercontent.com/aticdon/SEP490_08_GestPipe_WebApplication/master/frontend/src/assets/images/Logo.png' alt='GestPipe Logo' style='height:64px;'/></div>` +
          `<h2 style='color:#00B8D4;text-align:center;margin-bottom:24px;'>Password Reset OTP</h2>` +
          `<p style='font-size:16px;color:#333;'>Dear <b style='color:#6c2eb6;'>${admin.fullName}</b>,</p>` +
          `<p style='font-size:16px;color:#333;'>You requested to reset your password on <b>GestPipe</b>.</p>` +
          `<p style='font-size:18px;margin:24px 0;'><b style='color:#222;'>Your OTP code:</b> <span style='background:#e0f7fa;padding:6px 14px;border-radius:6px;color:#00B8D4;font-weight:bold;font-size:20px;'>${otp}</span></p>` +
          `<p style='font-size:15px;color:#333;'>This code is valid for <b>5 minutes</b>.</p>` +
          `<hr style='margin:32px 0;border:none;border-top:1px solid #eee;'/>` +
          `<p style='font-size:15px;color:#333;'>If you did not request this, please ignore this email.</p>` +
          `<div style='margin-top:32px;text-align:left;'>` +
          `<p style='font-size:15px;color:#222;'>Best regards,</p>` +
          `<p style='font-size:15px;color:#00B8D4;font-weight:bold;'>GestPipe Team</p>` +
          `</div>` +
          `</div>`
      });
      console.log(`📧 [ForgotPassword] OTP email sent to: ${email}`);
    } catch (mailErr) {
      console.error(`❌ [ForgotPassword] Error sending OTP email to ${email}:`, mailErr);
      return res.status(500).json({ success: false, message: 'Error sending OTP email' });
    }
    return res.status(200).json({ success: true, message: 'OTP sent to email' });
  } catch (error) {
    console.error('❌ [ForgotPassword] Send forgot password OTP error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

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
        gesture_request_status: admin.gesture_request_status,
        theme: admin.theme,
        uiLanguage: admin.uiLanguage,
        isFirstLogin: isUsingTempPassword,
        createdAt: formatDateTimeWithOffset(admin.createdAt),
        updatedAt: formatDateTimeWithOffset(admin.updatedAt)
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
    const formattedAdmin = formatAdminDocument(admin);

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
    const formattedAdmin = formatAdminDocument(admin);

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      admin: {
        id: formattedAdmin._id,
        fullName: formattedAdmin.fullName,
        email: formattedAdmin.email,
        role: formattedAdmin.role,
        phoneNumber: formattedAdmin.phoneNumber,
        birthday: formattedAdmin.birthday,
        theme: formattedAdmin.theme,
        uiLanguage: formattedAdmin.uiLanguage,
        createdAt: formattedAdmin.createdAt,
        updatedAt: formattedAdmin.updatedAt
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

    const formattedAdmin = formatAdminDocument(admin);

    res.status(200).json({
      success: true,
      admin: formattedAdmin
    });

  } catch (error) {
    console.error('Get current admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};
