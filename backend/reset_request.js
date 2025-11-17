const mongoose = require('mongoose');
require('dotenv').config();
const AdminCustomGesture = require('./src/models/AdminCustomGesture');

async function resetRequest() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    // Reset the failed request back to pending
    const result = await AdminCustomGesture.findByIdAndUpdate(
      '691aa2f1ee40909c3bd04729',
      {
        status: 'pending',
        rejectReason: '',
        artifactPaths: null
      },
      { new: true }
    );

    if (result) {
      console.log('✅ Request reset to pending status');
      console.log('Request:', {
        id: result._id,
        status: result.status,
        adminId: result.adminId,
        gestures: result.gestures
      });
    } else {
      console.log('❌ Request not found');
    }

    await mongoose.disconnect();
  } catch (err) {
    console.error('❌ Error resetting request:', err.message);
  }
}

resetRequest();