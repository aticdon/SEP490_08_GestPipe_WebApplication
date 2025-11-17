// __tests__/controllers/auth.test.js
const mongoose = require('mongoose');
const {
  hashPassword,
  createTestAdminData,
  clearDatabase,
  connectTestDB,
  disconnectTestDB,
} = require('../helpers/testHelpers');
const Admin = require('../../src/models/Admin');
const authController = require('../../src/controllers/authController');

describe('Auth Controller - Login', () => {
  let mockReq, mockRes;

  beforeAll(async () => {
    await connectTestDB();
  });

  afterAll(async () => {
    await disconnectTestDB();
  });

  beforeEach(async () => {
    await clearDatabase();
    
    // Setup mock request & response
    mockReq = {
      body: {},
      headers: {},
      admin: {},
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      statusCode: null,
      _json: null,
    };

    // Capture response calls
    mockRes.status.mockImplementation((code) => {
      mockRes.statusCode = code;
      return mockRes;
    });

    mockRes.json.mockImplementation((data) => {
      mockRes._json = data;
      return mockRes;
    });
  });

  // ============ TEST CASES ============

  /**
   * Test Case 1: LOGIN_001 - Login thành công với credentials hợp lệ
   */
  test('[LOGIN_001] Should login successfully with valid credentials', async () => {
    // Arrange: Tạo test admin
    const adminData = createTestAdminData({
      email: 'admin@test.com',
      password: 'password123',
      accountStatus: 'active',
    });

    const admin = new Admin(adminData);
    await admin.save();

    mockReq.body = {
      email: 'admin@test.com',
      password: 'password123',
    };

    // Act: Gọi login function
    await authController.login(mockReq, mockRes);

    // Assert
    expect(mockRes.statusCode).toBe(200);
    expect(mockRes._json).toHaveProperty('success', true);
    expect(mockRes._json).toHaveProperty('token');
    expect(mockRes._json.token).toBeTruthy();
    expect(mockRes._json.admin).toHaveProperty('email', 'admin@test.com');
    expect(mockRes._json.admin).toHaveProperty('role', 'admin');
    expect(mockRes._json.redirect).toBe('dashboard');

    console.log('✅ [LOGIN_001] PASSED - Login successful with valid credentials');
  });

  /**
   * Test Case 2: LOGIN_002 - Login fail - Missing email
   */
  test('[LOGIN_002] Should fail login - Missing email', async () => {
    mockReq.body = {
      email: '',
      password: 'password123',
    };

    await authController.login(mockReq, mockRes);

    expect(mockRes.statusCode).toBe(400);
    expect(mockRes._json).toHaveProperty('success', false);
    expect(mockRes._json).toHaveProperty('message', 'Please provide email and password');

    console.log('✅ [LOGIN_002] PASSED - Login fails with missing email');
  });

  /**
   * Test Case 3: LOGIN_003 - Login fail - Missing password
   */
  test('[LOGIN_003] Should fail login - Missing password', async () => {
    mockReq.body = {
      email: 'admin@test.com',
      password: '',
    };

    await authController.login(mockReq, mockRes);

    expect(mockRes.statusCode).toBe(400);
    expect(mockRes._json).toHaveProperty('success', false);
    expect(mockRes._json).toHaveProperty('message', 'Please provide email and password');

    console.log('✅ [LOGIN_003] PASSED - Login fails with missing password');
  });

  /**
   * Test Case 4: LOGIN_004 - Login fail - Invalid credentials
   */
  test('[LOGIN_004] Should fail login - Invalid credentials (wrong password)', async () => {
    // Arrange: Tạo test admin
    const adminData = createTestAdminData({
      email: 'admin@test.com',
      password: 'correctpassword123',
    });

    const admin = new Admin(adminData);
    await admin.save();

    mockReq.body = {
      email: 'admin@test.com',
      password: 'wrongpassword123',
    };

    // Act
    await authController.login(mockReq, mockRes);

    // Assert
    expect(mockRes.statusCode).toBe(401);
    expect(mockRes._json).toHaveProperty('success', false);
    expect(mockRes._json).toHaveProperty('message', 'Invalid email or password');

    console.log('✅ [LOGIN_004] PASSED - Login fails with invalid password');
  });

  /**
   * Test Case 5: LOGIN_005 - Login fail - Admin không tồn tại
   */
  test('[LOGIN_005] Should fail login - Admin not found', async () => {
    mockReq.body = {
      email: 'notexist@test.com',
      password: 'password123',
    };

    await authController.login(mockReq, mockRes);

    expect(mockRes.statusCode).toBe(401);
    expect(mockRes._json).toHaveProperty('success', false);
    expect(mockRes._json).toHaveProperty('message', 'Invalid email or password');

    console.log('✅ [LOGIN_005] PASSED - Login fails when admin not found');
  });

  /**
   * Test Case 6: LOGIN_006 - Login fail - Account suspended
   */
  test('[LOGIN_006] Should fail login - Account suspended', async () => {
    // Arrange: Tạo suspended admin
    const adminData = createTestAdminData({
      email: 'suspended@test.com',
      password: 'password123',
      accountStatus: 'suspended',
    });

    const admin = new Admin(adminData);
    await admin.save();

    mockReq.body = {
      email: 'suspended@test.com',
      password: 'password123',
    };

    // Act
    await authController.login(mockReq, mockRes);

    // Assert
    expect(mockRes.statusCode).toBe(403);
    expect(mockRes._json).toHaveProperty('success', false);
    expect(mockRes._json.message).toContain('suspended');

    console.log('✅ [LOGIN_006] PASSED - Login fails when account suspended');
  });

  /**
   * Test Case 7: LOGIN_007 - Login thành công - First time with temporary password
   */
  test('[LOGIN_007] Should login successfully - First time with temporary password', async () => {
    // Arrange: Tạo admin with temporary password
    const adminData = createTestAdminData({
      email: 'newadmin@test.com',
      password: 'temppass123',
      accountStatus: 'inactive',
      isFirstLogin: true,
    });

    const admin = new Admin(adminData);
    admin.temporaryPassword = 'temppass123';
    await admin.save();

    mockReq.body = {
      email: 'newadmin@test.com',
      password: 'temppass123',
    };

    // Act
    await authController.login(mockReq, mockRes);

    // Assert
    expect(mockRes.statusCode).toBe(200);
    expect(mockRes._json).toHaveProperty('success', true);
    expect(mockRes._json.admin).toHaveProperty('isFirstLogin', true);
    expect(mockRes._json.redirect).toBe('change-password');
    expect(mockRes._json.message).toContain('change your temporary password');

    // Verify account status changed to active
    const updatedAdmin = await Admin.findOne({ email: 'newadmin@test.com' });
    expect(updatedAdmin.accountStatus).toBe('active');

    console.log('✅ [LOGIN_007] PASSED - First time login redirects to change password');
  });

  /**
   * Test Case 8: LOGIN_008 - Login thành công - Inactive account (non-first login)
   */
  test('[LOGIN_008] Should login successfully - Inactive account (non-first login)', async () => {
    // Arrange: Tạo inactive admin (không phải first login)
    const adminData = createTestAdminData({
      email: 'inactive@test.com',
      password: 'password123',
      accountStatus: 'inactive',
      isFirstLogin: false,
    });

    const admin = new Admin(adminData);
    await admin.save();

    mockReq.body = {
      email: 'inactive@test.com',
      password: 'password123',
    };

    // Act
    await authController.login(mockReq, mockRes);

    // Assert
    expect(mockRes.statusCode).toBe(200);
    expect(mockRes._json).toHaveProperty('success', true);
    expect(mockRes._json).toHaveProperty('token');

    console.log('✅ [LOGIN_008] PASSED - Inactive non-first login allowed');
  });

  /**
   * Test Case 9: LOGIN_009 - Email case sensitivity
   */
  test('[LOGIN_009] Should login successfully - Email case insensitive', async () => {
    // Arrange: Tạo admin
    const adminData = createTestAdminData({
      email: 'TestAdmin@Test.Com',
      password: 'password123',
    });

    const admin = new Admin(adminData);
    await admin.save();

    mockReq.body = {
      email: 'testadmin@test.com',
      password: 'password123',
    };

    // Act
    await authController.login(mockReq, mockRes);

    // Assert
    expect(mockRes.statusCode).toBe(200);
    expect(mockRes._json).toHaveProperty('success', true);

    console.log('✅ [LOGIN_009] PASSED - Email is case insensitive');
  });

  /**
   * Test Case 10: LOGIN_010 - Test JWT token contains correct admin ID
   */
  test('[LOGIN_010] Should generate valid JWT token with correct admin ID', async () => {
    const jwt = require('jsonwebtoken');

    // Arrange: Tạo admin
    const adminData = createTestAdminData({
      email: 'admin@test.com',
      password: 'password123',
    });

    const admin = new Admin(adminData);
    await admin.save();
    const adminId = admin._id;

    mockReq.body = {
      email: 'admin@test.com',
      password: 'password123',
    };

    // Act
    await authController.login(mockReq, mockRes);

    // Assert
    const token = mockRes._json.token;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    expect(decoded).toHaveProperty('id', adminId.toString());
    expect(decoded).toHaveProperty('role', 'admin');
    expect(decoded).toHaveProperty('iat');
    expect(decoded).toHaveProperty('exp');

    console.log('✅ [LOGIN_010] PASSED - JWT token valid with correct admin ID');
  });

  // ============ END OF TEST CASES ============
});
