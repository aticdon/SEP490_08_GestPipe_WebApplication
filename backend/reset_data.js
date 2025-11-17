const mongoose = require('mongoose');
require('dotenv').config();
const AdminCustomGesture = require('./src/models/AdminCustomGesture');
const AdminGestureSamples = require('./src/models/AdminGestureSamples');

async function resetData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    // Clear all custom gesture requests
    await AdminCustomGesture.deleteMany({});
    console.log('✅ Cleared AdminCustomGesture collection');

    // Clear all gesture samples
    await AdminGestureSamples.deleteMany({});
    console.log('✅ Cleared AdminGestureSamples collection');

    // Reset admin gesture_request_status
    const Admin = require('./src/models/Admin');
    await Admin.updateMany({}, { gesture_request_status: 'enabled' });
    console.log('✅ Reset admin gesture_request_status to enabled');

    console.log('🎉 Database reset complete!');
    await mongoose.disconnect();
  } catch (err) {
    console.error('❌ Error resetting data:', err.message);
  }
}

resetData();