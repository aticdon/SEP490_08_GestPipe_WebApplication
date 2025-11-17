const mongoose = require('mongoose');
require('dotenv').config();
const AdminCustomGesture = require('./src/models/AdminCustomGesture');

async function checkRequests() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const requests = await AdminCustomGesture.find({}).select('_id status adminId gestures').lean();
    console.log('Current requests:');
    requests.forEach(r => {
      console.log(`ID: ${r._id}, Status: ${r.status}, Admin: ${r.adminId}, Gestures: ${r.gestures?.length || 0}`);
    });
    await mongoose.disconnect();
  } catch (err) {
    console.error('Error:', err.message);
  }
}

checkRequests();