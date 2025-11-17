# 📚 Giải Thích Unit Test: auth.test.js & testHelpers.js

---

## I. TEST HELPERS.JS - Công Cụ Hỗ Trợ Testing

### 🎯 Mục Đích
`testHelpers.js` là một **file tiện ích** chứa các hàm được dùng lặp lại trong nhiều test files.

### 📝 Các Hàm Trong testHelpers.js

#### 1️⃣ `hashPassword(password)`
```javascript
const hashPassword = (password) => {
  return crypto.createHash('sha256').update(password).digest('hex');
};
```

**Làm gì?**
- Hash password từ **text thường** thành **chuỗi hex** (SHA256)
- Giống hệt cách password được hash trong `authController.js`

**Ví dụ:**
```javascript
hashPassword('password123')
// Output: ef92b778bafe771e892456c2fc15c6a40342a3a1f8ce8f2f24cfb1b35e73c2d0
```

**Tại sao cần?**
- Khi test login, bạn cần so sánh password nhập vào với password trong database
- Password trong DB được hash → phải hash input password giống cách hash trong DB

---

#### 2️⃣ `createTestAdminData(overrides)`
```javascript
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
```

**Làm gì?**
- Tạo **data giả** cho admin để test
- Có default values (fullName, email, password, v.v.)
- Cho phép override (thay đổi) các values mà bạn cần

**Ví dụ sử dụng:**
```javascript
// Tạo admin với default data
const admin1 = createTestAdminData();
console.log(admin1.email); // 'testadmin@test.com'

// Tạo admin nhưng thay đổi email và role
const admin2 = createTestAdminData({
  email: 'superadmin@test.com',
  role: 'superadmin'
});
console.log(admin2.email); // 'superadmin@test.com'
console.log(admin2.role);  // 'superadmin'
```

**Tại sao cần?**
- Không cần viết lại object data mỗi lần test
- Code ngắn gọn, dễ đọc hơn
- Dễ bảo trì (thay đổi 1 chỗ thay vì nhiều chỗ)

---

#### 3️⃣ `createTestUserData(overrides)`
```javascript
const createTestUserData = (overrides = {}) => {
  return {
    email: 'testuser@test.com',
    password_hash: hashPassword('testpass123'),
    account_status: 'inactive',
    ...overrides,
  };
};
```

**Làm gì?**
- Tạo **data giả cho User** để test
- Tương tự `createTestAdminData()` nhưng cho model User

---

#### 4️⃣ `clearDatabase()`
```javascript
const clearDatabase = async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
};
```

**Làm gì?**
- **Xóa sạch** tất cả dữ liệu trong database
- Chạy trước mỗi test để đảm bảo database sạch

**Tại sao cần?**
- Test 1 tạo admin → Test 2 không bị ảnh hưởng data từ Test 1
- Mỗi test độc lập với nhau
- Không có "contaminated data" từ test trước

**Ví dụ:**
```
Test 1: Tạo admin "test@test.com"
↓ clearDatabase()
Test 2: Tạo admin "test@test.com" (không bị conflict)
```

---

#### 5️⃣ `connectTestDB()`
```javascript
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
```

**Làm gì?**
- **Kết nối** tới MongoDB test database
- Kiểm tra connection status trước khi connect

**Tại sao cần?**
- Test cần access database (tạo, đọc, xóa data)
- Phải kết nối tới MongoDB trước

---

#### 6️⃣ `disconnectTestDB()`
```javascript
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
```

**Làm gì?**
- **Ngắt kết nối** tới MongoDB test database
- Cleanup sau khi test xong

**Tại sao cần?**
- Giải phóng resources
- Tránh memory leak
- Sạch sẽ khi kết thúc test

---

## II. AUTH.TEST.JS - File Test Login

### 🎯 Mục Đích
`auth.test.js` là **file test chính** để kiểm thử function `authController.login()`

### 📋 Cấu Trúc File

#### **Phần 1: Imports (Dòng 1-10)**
```javascript
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
```

**Giải thích:**
- Import các helpers từ `testHelpers.js`
- Import Admin model để tạo test data
- Import `authController` - file chứa function `login()` cần test

---

#### **Phần 2: Test Suite Setup (Dòng 12-27)**
```javascript
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
  });
});
```

**Giải thích từng part:**

| Code | Ý Nghĩa |
|------|---------|
| `describe()` | Nhóm tất cả login tests lại |
| `beforeAll()` | Chạy 1 lần duy nhất **trước tất cả tests** - kết nối DB |
| `afterAll()` | Chạy 1 lần duy nhất **sau tất cả tests** - ngắt DB |
| `beforeEach()` | Chạy **trước mỗi test** - xóa DB, setup mock data |

**Timeline:**
```
beforeAll() → kết nối DB
  ↓
  beforeEach() → xóa DB, setup mock
  Test 1 chạy
  afterEach() (nếu có)
  ↓
  beforeEach() → xóa DB, setup mock
  Test 2 chạy
  afterEach() (nếu có)
  ↓
  ...
afterAll() → ngắt DB
```

---

#### **Phần 3: Mock Request & Response (Dòng 19-33)**
```javascript
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
```

**Giải thích:**

| Object | Dùng Để |
|--------|---------|
| `mockReq` | **Giả lập** request từ client |
| `mockReq.body` | Dữ liệu client gửi lên (email, password) |
| `mockRes` | **Giả lập** response từ server |
| `mockRes.status()` | Giả lập `res.status(200).json(...)` |
| `jest.fn()` | Tạo mock function để track được nó có được gọi không |

**Ví dụ:**
```javascript
mockReq.body = { email: 'test@test.com', password: 'pass123' };
await authController.login(mockReq, mockRes);
// mockRes.status() được gọi với 200 hoặc 401, v.v.
```

---

### 🧪 Chi Tiết 1 Test Case

#### **Test Case 1: [LOGIN_001] - Đăng nhập thành công**

```javascript
test('[LOGIN_001] Should login successfully with valid credentials', async () => {
  // === ARRANGE (Chuẩn bị) ===
  const adminData = createTestAdminData({
    email: 'admin@test.com',
    password: 'password123',
    accountStatus: 'active',
  });

  const admin = new Admin(adminData);
  await admin.save();  // Lưu vào database

  mockReq.body = {
    email: 'admin@test.com',
    password: 'password123',
  };

  // === ACT (Thực thi) ===
  await authController.login(mockReq, mockRes);

  // === ASSERT (Kiểm tra) ===
  expect(mockRes.statusCode).toBe(200);
  expect(mockRes._json).toHaveProperty('success', true);
  expect(mockRes._json).toHaveProperty('token');
  expect(mockRes._json.token).toBeTruthy();
  expect(mockRes._json.admin).toHaveProperty('email', 'admin@test.com');
  expect(mockRes._json.redirect).toBe('dashboard');
});
```

**Phân tích từng phần:**

##### **ARRANGE - Chuẩn bị (Setup)**
```javascript
const adminData = createTestAdminData({...});
const admin = new Admin(adminData);
await admin.save();
```
- Tạo admin giả
- Lưu vào test database
- Chuẩn bị dữ liệu cho test

##### **ACT - Thực thi (Execute)**
```javascript
mockReq.body = { email: 'admin@test.com', password: 'password123' };
await authController.login(mockReq, mockRes);
```
- Giả lập client gửi login request
- Gọi function `login()` cần test

##### **ASSERT - Kiểm tra (Verify)**
```javascript
expect(mockRes.statusCode).toBe(200);
expect(mockRes._json).toHaveProperty('success', true);
expect(mockRes._json).toHaveProperty('token');
```
- Kiểm tra response status code = 200 ✅
- Kiểm tra response có `success: true` ✅
- Kiểm tra response có `token` ✅

**Nếu kiểm tra thất bại:**
```
❌ Expected: 200
❌ Actual: 401

Test FAIL!
```

---

### 📊 10 Test Cases & Ý Nghĩa

| Test Case | Kiểm Tra | Lý Do |
|-----------|----------|-------|
| LOGIN_001 | ✅ Đăng nhập thành công | Happy path - trường hợp bình thường |
| LOGIN_002 | ❌ Missing email | Validation - xử lý input không hợp lệ |
| LOGIN_003 | ❌ Missing password | Validation - xử lý input không hợp lệ |
| LOGIN_004 | ❌ Wrong password | Security - password sai không được login |
| LOGIN_005 | ❌ Admin không tồn tại | Edge case - email không có trong DB |
| LOGIN_006 | ❌ Account suspended | Business logic - tài khoản bị khóa |
| LOGIN_007 | ✅ First time login | Special flow - lần đầu login redirect to change-password |
| LOGIN_008 | ✅ Inactive account | Edge case - tài khoản inactive vẫn login được |
| LOGIN_009 | ✅ Email case insensitive | Feature - email không phân biệt hoa/thường |
| LOGIN_010 | ✅ JWT token hợp lệ | Security - token có đúng thông tin không |

---

## III. Flow Cơ Bản của Test

### 🔄 Quy Trình Chạy Test

```
1. npm test
   ↓
2. Jest tìm tất cả file *.test.js
   ↓
3. Chạy auth.test.js
   ↓
4. beforeAll() → connectTestDB()
   ↓
5. beforeEach() → clearDatabase()
   ├─ Test 1: LOGIN_001
   │ ├─ Arrange: Tạo admin test
   │ ├─ Act: Gọi login()
   │ └─ Assert: Kiểm tra response
   │
   ├─ beforeEach() → clearDatabase()
   ├─ Test 2: LOGIN_002
   │ ├─ Arrange: Setup mock
   │ ├─ Act: Gọi login()
   │ └─ Assert: Kiểm tra response
   │
   └─ ... (Test 3-10)
   ↓
6. afterAll() → disconnectTestDB()
   ↓
7. Hiển thị kết quả: ✅ 10 passed
```

---

## IV. Ví Dụ Chi Tiết Từng Bước

### 🔐 Test: LOGIN_004 (Sai password)

```javascript
test('[LOGIN_004] Should fail login - Invalid credentials', async () => {
  // STEP 1: Tạo admin trong DB
  const admin = new Admin({
    fullName: 'Test Admin',
    email: 'admin@test.com',
    password: 'correctpassword123',  // Password đúng
    role: 'admin',
    accountStatus: 'active',
  });
  await admin.save();
  // Database bây giờ có:
  // { email: 'admin@test.com', password: 'hash(correctpassword123)' }

  // STEP 2: Client gửi request login với password sai
  mockReq.body = {
    email: 'admin@test.com',
    password: 'wrongpassword123',  // Password sai!
  };

  // STEP 3: Gọi login function
  await authController.login(mockReq, mockRes);

  // STEP 4: Kiểm tra response
  expect(mockRes.statusCode).toBe(401);  // Unauthorized
  expect(mockRes._json.success).toBe(false);
  expect(mockRes._json.message).toBe('Invalid email or password');
});
```

**Bên trong `authController.login()`:**
```javascript
// 1. DB lấy admin ra
const admin = await Admin.findOne({ email: 'admin@test.com' });
// → Tìm thấy admin với password: hash(correctpassword123)

// 2. Hash password client gửi
const hashedPassword = hashPassword('wrongpassword123');
// → hash(wrongpassword123) ≠ hash(correctpassword123)

// 3. So sánh
if (hashedPassword !== admin.password) {
  return res.status(401).json({
    success: false,
    message: 'Invalid email or password'
  });
}

// ✅ Test expect: statusCode === 401 ✅
```

---

## V. Tóm Tắt

### testHelpers.js:
```
✅ hashPassword()          → Hash password như trong code thực
✅ createTestAdminData()   → Tạo fake admin data
✅ createTestUserData()    → Tạo fake user data
✅ clearDatabase()         → Xóa sạch DB trước mỗi test
✅ connectTestDB()         → Kết nối DB test
✅ disconnectTestDB()      → Ngắt kết nối DB
```

### auth.test.js:
```
✅ Kiểm thử login() function
✅ 10 test cases: success + failures + edge cases
✅ Mock request/response object
✅ Arrange → Act → Assert pattern
✅ Tất cả tests độc lập với nhau
```

### Benefit:
```
✅ Đảm bảo code hoạt động đúng
✅ Catch bugs sớm
✅ Dễ refactor code (tests sẽ báo lỗi)
✅ Documentation (test case cho thấy code hoạt động như thế nào)
✅ Regression testing (đảm bảo fix 1 bug không gây bug khác)
```

---

## VI. Bạn Muốn Tiếp Theo?

1. ✅ Thêm test cases cho `changePassword()`, `updateProfile()`?
2. ✅ Tạo test cho `gestureController` (listSamples, stats)?
3. ✅ Tạo integration test (test flow liên tục)?
4. ✅ Giải thích cách mock HTTP requests?

