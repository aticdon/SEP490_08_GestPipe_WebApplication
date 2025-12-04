#!/usr/bin/env node
/**
 * Reset database - remove all gesture set versions
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Import Version model
const Version = require('./src/models/Version');

async function resetDatabase() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    console.log('MongoDB URI:', process.env.MONGODB_URI ? 'Found' : 'Not found');
    
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI environment variable is not set');
    }
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Remove all gesture set versions
    console.log('🗑️  Removing all gesture set versions...');
    const result = await Version.deleteMany({ 
      gestureSetType: 'gestureset' 
    });
    
    console.log(`✅ Removed ${result.deletedCount} gesture set versions`);
    
    // List remaining versions
    const remainingVersions = await Version.find({});
    console.log(`📋 Remaining versions in database: ${remainingVersions.length}`);
    
    console.log('✅ Database reset completed!');
    
  } catch (error) {
    console.error('❌ Error resetting database:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

resetDatabase();