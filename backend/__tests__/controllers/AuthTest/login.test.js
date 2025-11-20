const mongoose = require('mongoose');
const {
  hashPassword,
  createTestAdminData,
  clearDatabase,
  connectTestDB,
  disconnectTestDB,
} = require('../../helpers/testHelpers');
const Admin = require('../../../src/models/Admin');
const authController = require('../../../src/controllers/authController');

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
    mockReq = { body: {}, headers: {}, admin: {} };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      statusCode: null,
      _json: null,
    };
    mockRes.status.mockImplementation((code) => {
      mockRes.statusCode = code;
      return mockRes;
    });
    mockRes.json.mockImplementation((data) => {
      mockRes._json = data;
      return mockRes;
    });
  });

  // TC1: Login thành công
  test('TC1: Login thành công', async () => {
    const adminData = createTestAdminData({
      email: 'admin@test.com',
      password: 'password123',
      accountStatus: 'active',
    });
    const admin = new Admin(adminData);
    await admin.save();
    mockReq.body = { email: 'admin@test.com', password: 'password123' };

    await authController.login(mockReq, mockRes);

    expect(mockRes.statusCode).toBe(200);
    expect(mockRes._json.success).toBe(true);
    expect(mockRes._json.token).toBeTruthy();
  });

  // TC2: Login không thành công - email sai
  test('TC2: Login không thành công - email sai', async () => {
    const adminData = createTestAdminData({
      email: 'realadmin@test.com',
      password: 'password123',
      accountStatus: 'active',
    });
    await new Admin(adminData).save();
    mockReq.body = { email: 'wrongadmin@test.com', password: 'password123' };

    await authController.login(mockReq, mockRes);

    expect(mockRes.statusCode).toBe(401);
    expect(mockRes._json.success).toBe(false);
    expect(mockRes._json.message).toMatch(/Invalid email or password/);
  });

  // TC3: Login không thành công - mật khẩu sai
  test('TC3: Login không thành công - mật khẩu sai', async () => {
    const adminData = createTestAdminData({
      email: 'admin@test.com',
      password: 'rightpassword',
      accountStatus: 'active',
    });
    await new Admin(adminData).save();
    mockReq.body = { email: 'admin@test.com', password: 'wrongpassword' };

    await authController.login(mockReq, mockRes);

    expect(mockRes.statusCode).toBe(401);
    expect(mockRes._json.success).toBe(false);
    expect(mockRes._json.message).toMatch(/Invalid email or password/);
  });

  // TC4: Login không thành công - email không đúng định dạng
  test('TC4: Login không thành công - email không đúng định dạng', async () => {
    mockReq.body = { email: 'not-an-email', password: 'password123' };

    await authController.login(mockReq, mockRes);

    // Nếu code không validate email format ở controller, lúc findOne sẽ không tìm thấy
    expect(mockRes.statusCode).toBe(401);
    expect(mockRes._json.success).toBe(false);
    expect(mockRes._json.message).toMatch(/Invalid email or password/);
  });

  // TC5: Login không thành công - mật khẩu không đúng định dạng
  test('TC5: Login không thành công - mật khẩu không đúng định dạng', async () => {
    mockReq.body = { email: 'admin@test.com', password: '123' }; // Quá ngắn, đúng với schema

    await authController.login(mockReq, mockRes);

    // Vì không có admin, hoặc nếu có cũng fail khi password quá ngắn
    expect([400, 401]).toContain(mockRes.statusCode);
    expect(mockRes._json.success).toBe(false);
  });

  // TC6: Login không thành công - tài khoản admin bị khóa
  test('TC6: Login không thành công - admin bị khóa', async () => {
    const adminData = createTestAdminData({
      email: 'locked@test.com',
      password: 'password123',
      accountStatus: 'suspended',
    });
    await new Admin(adminData).save();
    mockReq.body = { email: 'locked@test.com', password: 'password123' };

    await authController.login(mockReq, mockRes);

    expect(mockRes.statusCode).toBe(403);
    expect(mockRes._json.success).toBe(false);
    expect(mockRes._json.message).toMatch(/Account is suspended/);
  });

  // TC7: Login không thành công - tài khoản không tồn tại
  test('TC7: Login không thành công - tài khoản không tồn tại', async () => {
    mockReq.body = { email: 'notfound@test.com', password: 'password123' };

    await authController.login(mockReq, mockRes);

    expect(mockRes.statusCode).toBe(401);
    expect(mockRes._json.success).toBe(false);
    expect(mockRes._json.message).toMatch(/Invalid email or password/);
  });

  // TC8: Login thành công - lần đầu đăng nhập với mật khẩu tạm
  test('TC8: Login thành công - lần đầu đăng nhập với mật khẩu tạm', async () => {
    // Tạo admin với mật khẩu tạm
    const tempPassword = 'temppass001';
    const adminData = createTestAdminData({
      email: 'newadmin@test.com',
      password: tempPassword,
      accountStatus: 'inactive',
      isFirstLogin: true,
      temporaryPassword: hashPassword(tempPassword),
    });
    const admin = new Admin(adminData);
    await admin.save();
    mockReq.body = { email: 'newadmin@test.com', password: tempPassword };

    await authController.login(mockReq, mockRes);

    expect(mockRes.statusCode).toBe(200);
    expect(mockRes._json.admin.isFirstLogin).toBe(true);
    expect(mockRes._json.redirect).toBe('change-password');

    // Kiểm tra status đã chuyển active
    const updatedAdmin = await Admin.findOne({ email: 'newadmin@test.com' });
    expect(updatedAdmin.accountStatus).toBe('active');
  });

  // TC9: Login không thành công - lần đầu đăng nhập - nhập sai mật khẩu tạm
  test('TC9: Login không thành công - sai mật khẩu tạm khi lần đầu', async () => {
    const tempPassword = 'temppass002';
    const adminData = createTestAdminData({
      email: 'firstlogin@test.com',
      password: tempPassword,
      accountStatus: 'inactive',
      isFirstLogin: true,
      temporaryPassword: hashPassword(tempPassword),
    });
    await new Admin(adminData).save();
    mockReq.body = { email: 'firstlogin@test.com', password: 'wrongtemp' };

    await authController.login(mockReq, mockRes);

    expect(mockRes.statusCode).toBe(401);
    expect(mockRes._json.success).toBe(false);
  });

  // TC10: Login không thành công - Trống email
  test('TC10: Login không thành công - Trống email', async () => {
    mockReq.body = { email: '', password: 'password123' };

    await authController.login(mockReq, mockRes);

    expect(mockRes.statusCode).toBe(400);
    expect(mockRes._json.success).toBe(false);
    expect(mockRes._json.message).toMatch(/provide email and password/i);
  });

  // TC11: Login không thành công - Trống password
  test('TC11: Login không thành công - Trống password', async () => {
    mockReq.body = { email: 'admin@test.com', password: '' };

    await authController.login(mockReq, mockRes);

    expect(mockRes.statusCode).toBe(400);
    expect(mockRes._json.success).toBe(false);
    expect(mockRes._json.message).toMatch(/provide email and password/i);
  });

  // TC12: Login không thành công - lỗi server nội bộ
  test('TC12: Login không thành công - lỗi server nội bộ', async () => {
    // Giả lập lỗi DB
    jest.spyOn(Admin, 'findOne').mockImplementationOnce(() => { throw new Error("Fake server error"); });
    mockReq.body = { email: 'admin@test.com', password: 'password123' };

    await authController.login(mockReq, mockRes);

    expect(mockRes.statusCode).toBe(500);
    expect(mockRes._json.success).toBe(false);
    expect(mockRes._json.message).toMatch(/Server error/);
  });

  // TC13: Login không thành công - email nhập ký tự đặc biệt hoặc SQL injection
  test('TC13: Login không thành công - email SQL injection', async () => {
    mockReq.body = { email: "admin@test.com'; DROP TABLE Admin; --", password: 'password123' };

    await authController.login(mockReq, mockRes);

    // Không match admin, báo lỗi như tài khoản sai
    expect([400,401]).toContain(mockRes.statusCode);
    expect(mockRes._json.success).toBe(false);
  });

  // TC14: Login không thành công - mật khẩu chứa ký tự đặc biệt/độ dài quá lớn/quá nhỏ.
  test('TC14: Login không thành công - mật khẩu đặc biệt/quá ngắn/quá dài', async () => {
    // Mật khẩu quá ngắn
    mockReq.body = { email: 'admin@test.com', password: '12' };
    await authController.login(mockReq, mockRes);
    expect([400,401]).toContain(mockRes.statusCode);

    // Mật khẩu quá dài
    mockReq.body = { email: 'admin@test.com', password: 'a'.repeat(1000) };
    await authController.login(mockReq, mockRes);
    expect([400,401]).toContain(mockRes.statusCode);

    // Mật khẩu chứa ký tự đặc biệt
    mockReq.body = { email: 'admin@test.com', password: "abc!@#'%--" };
    await authController.login(mockReq, mockRes);
    expect([400,401]).toContain(mockRes.statusCode);
  });
});