const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const Admin = require('./src/models/Admin');

async function createSuperAdminToken() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    // Find superadmin
    const superadmin = await Admin.findOne({ role: 'superadmin' }).select('_id email role fullName');
    if (!superadmin) {
      console.log('No superadmin found. Creating one...');

      // Create superadmin if not exists
      const newSuperadmin = await Admin.create({
        email: 'superadmin@test.com',
        fullName: 'Super Admin',
        role: 'superadmin',
        password: 'password123', // Will be hashed by pre-save hook
        accountStatus: 'active'
      });

      console.log('Created superadmin:', newSuperadmin._id);
      superadmin = newSuperadmin;
    }

    // Create JWT token
    const token = jwt.sign(
      { id: superadmin._id },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    console.log('Superadmin ID:', superadmin._id);
    console.log('JWT Token:');
    console.log(token);

    await mongoose.disconnect();
  } catch (err) {
    console.error('Error:', err.message);
  }
}

createSuperAdminToken();