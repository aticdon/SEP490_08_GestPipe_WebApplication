const mongoose = require('mongoose');
const GestureSample = require('./src/models/GestureSample');

async function checkGestures() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/gesture_control');
    const gestures = await GestureSample.find({}, 'gesture_name is_static right_fingers');
    console.log('Gesture templates in database:');
    gestures.forEach(g => {
      console.log(`${g.gesture_name}: static=${g.is_static}, fingers=${JSON.stringify(g.right_fingers)}`);
    });
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkGestures();