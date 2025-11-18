const crypto = require('crypto');
const Admin = require('../models/Admin');
const { sendMail } = require('../utils/mailer');
const { formatAdminDocument } = require('../utils/dateFormatter');

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
  console.log('🕒 Timestamp:', new Date().toISOString());
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
    const formattedAdmin = formatAdminDocument(newAdmin);

    console.log('✅ Admin created successfully!');
    console.log('📧 Email:', newAdmin.email);
    console.log('🔑 Temporary Password:', tempPassword);


    // Send professional email to new admin with logo, color, greeting, signature
    try {
      console.log('📨 Preparing to send email to:', newAdmin.email);
      await sendMail({
        to: newAdmin.email,
        subject: 'Welcome to GestPipe Admin Portal',
        text:
          `Dear ${newAdmin.fullName},\n\n` +
          `Congratulations! Your admin account has been successfully created on GestPipe.\n` +
          `Your temporary password: ${tempPassword}\n` +
          `For security, please log in and change your password immediately upon first access.\n\n` +
          `If you have any questions, feel free to contact our support team.\n\n` +
          `Best regards,\nGestPipe Team`,
        html:
          `<div style='font-family:Montserrat,sans-serif;color:#222;background:#f8fafc;padding:32px;border-radius:12px;max-width:480px;margin:auto;'>` +
          `<div style='text-align:center;margin-bottom:24px;'><img src='https://raw.githubusercontent.com/aticdon/SEP490_08_GestPipe_WebApplication/master/frontend/src/assets/images/Logo.png' alt='GestPipe Logo' style='height:64px;'/></div>` +
          `<h2 style='color:#00B8D4;text-align:center;margin-bottom:24px;'>Welcome to GestPipe Admin Portal</h2>` +
          `<p style='font-size:16px;color:#333;'>Dear <b style='color:#6c2eb6;'>${newAdmin.fullName}</b>,</p>` +
          `<p style='font-size:16px;color:#333;'>Congratulations! Your admin account has been <b style='color:#00B8D4;'>successfully created</b> on <b>GestPipe</b>.</p>` +
          `<p style='font-size:16px;margin:24px 0;'><b style='color:#222;'>Your temporary password:</b> <span style='background:#e0f7fa;padding:6px 14px;border-radius:6px;color:#00B8D4;font-weight:bold;'>${tempPassword}</span></p>` +
          `<p style='font-size:15px;color:#333;'>For security, please <b>log in and change your password immediately</b> upon first access.</p>` +
          `<hr style='margin:32px 0;border:none;border-top:1px solid #eee;'/>` +
          `<p style='font-size:15px;color:#333;'>If you have any questions, feel free to contact our support team.</p>` +
          `<div style='margin-top:32px;text-align:left;'>` +
          `<p style='font-size:15px;color:#222;'>Best regards,</p>` +
          `<p style='font-size:15px;color:#00B8D4;font-weight:bold;'>GestPipe Team</p>` +
          `</div>` +
          `</div>`
      });
      console.log('📧 Email sent to new admin:', newAdmin.email);
    } catch (mailErr) {
      console.error('❌ Failed to send email:', mailErr);
    }

    res.status(201).json({
      success: true,
      message: 'Admin created successfully',
      admin: {
        id: formattedAdmin._id,
        fullName: formattedAdmin.fullName,
        email: formattedAdmin.email,
        role: formattedAdmin.role,
        createdAt: formattedAdmin.createdAt
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

    const formattedAdmins = admins.map(formatAdminDocument);

    res.status(200).json({
      success: true,
      count: formattedAdmins.length,
      admins: formattedAdmins
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

    const formattedAdmin = formatAdminDocument(admin);

    console.log(`✅ Admin ${admin.email} status changed to ${admin.accountStatus}`);

    res.status(200).json({
      success: true,
      message: 'Admin status updated successfully',
      admin: {
        _id: formattedAdmin._id,
        email: formattedAdmin.email,
        fullName: formattedAdmin.fullName,
        accountStatus: formattedAdmin.accountStatus,
        createdAt: formattedAdmin.createdAt,
        updatedAt: formattedAdmin.updatedAt
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

// @desc    Update admin profile
// @route   PUT /api/admin/update-profile/:id
// @access  Private (Admin & SuperAdmin - own profile only)
exports.updateProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const { fullName, birthday, phoneNumber, province, uiLanguage } = req.body;

    // Check if admin exists
    const admin = await Admin.findById(id);
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    // Update fields
    if (fullName) admin.fullName = fullName;
    if (birthday) admin.birthday = birthday;
    if (phoneNumber) admin.phoneNumber = phoneNumber;
    if (province) admin.province = province;
    if (uiLanguage) admin.uiLanguage = uiLanguage;

    await admin.save();
    const formattedAdmin = formatAdminDocument(admin);

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      admin: {
        _id: formattedAdmin._id,
        fullName: formattedAdmin.fullName,
        email: formattedAdmin.email,
        birthday: formattedAdmin.birthday,
        phoneNumber: formattedAdmin.phoneNumber,
        province: formattedAdmin.province,
        role: formattedAdmin.role,
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

// @desc    Get admin profile by ID
// @route   GET /api/admin/profile/:id
// @access  Private (Admin & SuperAdmin - own profile only)
exports.getProfile = async (req, res) => {
  try {
    const { id } = req.params;

    const admin = await Admin.findById(id).select('-password -temporaryPassword');
    
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    const formattedAdmin = formatAdminDocument(admin);

    res.status(200).json({
      success: true,
        admin: {
          _id: formattedAdmin._id,
          fullName: formattedAdmin.fullName,
          email: formattedAdmin.email,
          birthday: formattedAdmin.birthday,
          phoneNumber: formattedAdmin.phoneNumber,
          province: formattedAdmin.province,
          role: formattedAdmin.role,
          gesture_request_status: formattedAdmin.gesture_request_status,
          createdAt: formattedAdmin.createdAt,
          updatedAt: formattedAdmin.updatedAt
        }
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};
