// __tests__/helpers/testHelpers.js
const crypto = require('crypto');
const mongoose = require('mongoose');

/**
 * Hash password using SHA256 (same as in authController)
 */
const hashPassword = (password) => {
  return crypto.createHash('sha256').update(password).digest('hex');
};

/**
 * Create test admin data
 */
const createTestAdminData = (overrides = {}) => {
  return {
    fullName: 'Test Admin',
    email: 'testadmin@test.com',
    password: 'testpassword123',
    role: 'admin',
    accountStatus: 'active',
    ...overrides,
  };
};

/**
 * Create test user data
 */
const createTestUserData = (overrides = {}) => {
  return {
    email: 'testuser@test.com',
    password_hash: hashPassword('testpass123'),
    account_status: 'inactive',
    ...overrides,
  };
};

/**
 * Clear all collections
 */
const clearDatabase = async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
};

/**
 * Connect to test database
 */
const connectTestDB = async () => {
  try {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGO_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
    }
  } catch (error) {
    console.error('Error connecting to test database:', error);
    throw error;
  }
};

/**
 * Disconnect from test database
 */
const disconnectTestDB = async () => {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  } catch (error) {
    console.error('Error disconnecting from test database:', error);
    throw error;
  }
};

module.exports = {
  hashPassword,
  createTestAdminData,
  createTestUserData,
  clearDatabase,
  connectTestDB,
  disconnectTestDB,
};
