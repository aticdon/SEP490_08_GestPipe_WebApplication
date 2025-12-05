const mongoose = require('mongoose');
const UserGestureRequest = require('./src/models/UserGestureRequests');

const MONGODB_URI = 'mongodb+srv://khangle:ldk112405@gestpipe.wtn5zaa.mongodb.net/GestPipeDb?retryWrites=true&w=majority';

async function check() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to DB');

    console.log('Testing aggregation...');
    
    const pipeline = [
        { $match: { "status.state": { $in: ["Successful", "approved"] } } },
        { $group: { _id: "$pose_label", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 }
    ];

    const results = await UserGestureRequest.aggregate(pipeline);
    console.log('Aggregation results:', JSON.stringify(results, null, 2));

    // Check if simple find works
    const simpleFind = await UserGestureRequest.find({ "status.state": { $in: ["Successful", "approved"] } }).limit(2);
    console.log('Simple find results (limit 2):', JSON.stringify(simpleFind, null, 2));

  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}

check();
