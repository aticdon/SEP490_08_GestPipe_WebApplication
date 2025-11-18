# 🎯 Visual Guide: Auth Test Flow

---

## 1️⃣ TEST HELPERS.JS - CÔNG CỤ HỖ TRỢ

```
testHelpers.js
│
├─ hashPassword(password)
│  └─ 📝 "password123" → "ef92b778bafe771e89245..."
│     Mục đích: Hash password như trong code thực
│
├─ createTestAdminData(overrides)
│  │
│  ├─ Default: {
│  │   fullName: 'Test Admin',
│  │   email: 'testadmin@test.com',
│  │   password: 'testpassword123',
│  │   role: 'admin',
│  │   accountStatus: 'active'
│  │ }
│  │
│  └─ Có thể thay đổi:
│     createTestAdminData({
│       email: 'newadmin@test.com',  ← Thay đổi email
│       role: 'superadmin'            ← Thay đổi role
│     })
│
├─ createTestUserData(overrides)
│  └─ Tương tự createTestAdminData nhưng cho User model
│
├─ clearDatabase()
│  │
│  ├─ Trước Test 1:
│  │  DB: [empty]
│  │
│  ├─ Test 1 tạo admin:
│  │  DB: [admin1]
│  │
│  ├─ clearDatabase():
│  │  DB: [empty]  ← Xóa sạch
│  │
│  └─ Test 2 chạy với DB sạch
│
├─ connectTestDB()
│  │
│  └─ Kết nối: App ←→ Test MongoDB
│     mongodb://localhost:27017/gestpipe-test
│
└─ disconnectTestDB()
   └─ Ngắt: App ✖ Test MongoDB
      Giải phóng resources
```

---

## 2️⃣ AUTH.TEST.JS - FILE TEST CHÍNH

### 📊 Cấu Trúc File

```
auth.test.js
│
├─ 📥 IMPORTS (Dòng 1-10)
│  ├─ mongoose
│  ├─ testHelpers.js (hashPassword, createTestAdminData, ...)
│  ├─ Admin model
│  └─ authController (file chứa login() cần test)
│
├─ 🔧 SETUP (Dòng 12-33)
│  │
│  ├─ beforeAll() → connectTestDB()
│  │  Chạy 1 lần duy nhất trước tất cả tests
│  │
│  ├─ afterAll() → disconnectTestDB()
│  │  Chạy 1 lần duy nhất sau tất cả tests
│  │
│  ├─ beforeEach() → clearDatabase()
│  │  Chạy trước MỖI test
│  │
│  └─ setupMockReqRes()
│     Tạo giả lập request/response objects
│
├─ ✅ TEST CASES (10 tests)
│  │
│  ├─ [LOGIN_001] Login success
│  ├─ [LOGIN_002] Missing email
│  ├─ [LOGIN_003] Missing password
│  ├─ [LOGIN_004] Wrong password
│  ├─ [LOGIN_005] Admin not found
│  ├─ [LOGIN_006] Account suspended
│  ├─ [LOGIN_007] First time login
│  ├─ [LOGIN_008] Inactive account
│  ├─ [LOGIN_009] Email case insensitive
│  └─ [LOGIN_010] JWT token valid
│
└─ Mỗi test follow Arrange → Act → Assert pattern
```

---

## 3️⃣ MOCK REQUEST & RESPONSE OBJECTS

### 🎭 Request (mockReq)

```javascript
mockReq = {
  body: {
    email: 'admin@test.com',
    password: 'password123'
  },
  headers: {
    authorization: 'Bearer token...'
  },
  admin: {
    id: '123',
    role: 'admin'
  }
}

// Ứng dụng thực:
app.post('/login', (req, res) => {
  console.log(req.body);      ← Email & password
  console.log(req.headers);   ← Authorization
  console.log(req.admin);     ← Admin info
})
```

### 🎭 Response (mockRes)

```javascript
mockRes = {
  statusCode: 200,
  _json: {
    success: true,
    token: 'jwt_token...',
    admin: { email: 'admin@test.com', role: 'admin' },
    redirect: 'dashboard'
  },
  status: jest.fn(),  // Track res.status(200)
  json: jest.fn()     // Track res.json({...})
}

// Ứng dụng thực:
res.status(200).json({
  success: true,
  token: 'jwt_token...',
  admin: { ... },
  redirect: 'dashboard'
})
```

---

## 4️⃣ TEST FLOW - CHI TIẾT LÀM VIỆC

### 📅 Timeline - Test [LOGIN_001]

```
Time → 

[00:00] npm test
        ↓
[00:01] Load auth.test.js
        ↓
[00:02] beforeAll() 
        ├─ connectTestDB()
        ├─ Connection: ✅ SUCCESS
        ↓
[00:03] beforeEach()
        ├─ clearDatabase()
        ├─ Database: [empty]
        ├─ Mock setup
        ↓
[00:04] TEST START: [LOGIN_001]
        ├─ ARRANGE:
        │  ├─ Create admin data:
        │  │  email: 'admin@test.com'
        │  │  password: 'password123'
        │  ├─ Save to DB
        │  ├─ Database: [admin1]
        │  └─ Setup mockReq.body
        │
        ├─ ACT:
        │  ├─ Call: authController.login(mockReq, mockRes)
        │  ├─ Function processes:
        │  │  ├─ Find admin by email
        │  │  ├─ Hash input password
        │  │  ├─ Compare hashes ✅
        │  │  ├─ Generate JWT token
        │  │  └─ Return 200 response
        │  └─ mockRes updated
        │
        ├─ ASSERT:
        │  ├─ expect(mockRes.statusCode).toBe(200) ✅
        │  ├─ expect(mockRes._json.success).toBe(true) ✅
        │  ├─ expect(mockRes._json.token).toBeTruthy() ✅
        │  ├─ expect(mockRes._json.admin.email).toBe('admin@test.com') ✅
        │  └─ All assertions PASS ✅
        │
[00:05] TEST END: [LOGIN_001] ✅ PASSED
        ↓
[00:06] beforeEach()
        ├─ clearDatabase()
        ├─ Database: [empty]
        ↓
[00:07] TEST START: [LOGIN_002]
        ├─ ... (tiếp tục với test khác)

...

[00:25] TEST END: [LOGIN_010] ✅ PASSED
        ↓
[00:26] afterAll()
        ├─ disconnectTestDB()
        ├─ Connection: ✖ CLOSED
        ↓
[00:27] Test Summary:
        ├─ Test Suites: 1 passed, 1 total ✅
        ├─ Tests: 10 passed, 10 total ✅
        ├─ Time: 0.95s
```

---

## 5️⃣ SINGLE TEST CASE - [LOGIN_001] CHI TIẾT

```
describe('Auth Controller - Login')
│
└─ test('[LOGIN_001] Should login successfully with valid credentials')
   │
   ├─ ARRANGE (Chuẩn bị dữ liệu)
   │  │
   │  ├─ const adminData = createTestAdminData({...})
   │  │  └─ {
   │  │     fullName: 'Test Admin',
   │  │     email: 'admin@test.com',
   │  │     password: 'password123',
   │  │     role: 'admin',
   │  │     accountStatus: 'active'
   │  │    }
   │  │
   │  ├─ const admin = new Admin(adminData)
   │  │  └─ Tạo object Admin model
   │  │
   │  ├─ await admin.save()
   │  │  └─ Lưu vào MongoDB
   │  │     Database:
   │  │     {
   │  │       _id: ObjectId('...'),
   │  │       email: 'admin@test.com',
   │  │       password: 'ef92b778bafe771e89245...' (SHA256 hash),
   │  │       role: 'admin',
   │  │       accountStatus: 'active'
   │  │     }
   │  │
   │  └─ mockReq.body = {
   │     email: 'admin@test.com',
   │     password: 'password123'
   │    }
   │     └─ Giả lập client request
   │
   ├─ ACT (Thực thi function)
   │  │
   │  ├─ await authController.login(mockReq, mockRes)
   │  │
   │  └─ Bên trong login():
   │     ├─ if (!email || !password) ✅ PASS (có cả 2)
   │     ├─ const admin = await Admin.findOne({ email })
   │     │  └─ Tìm admin từ DB ✅ FOUND
   │     ├─ const hashedPassword = hashPassword('password123')
   │     │  └─ 'ef92b778bafe771e89245...'
   │     ├─ if (hashedPassword !== admin.password) ✅ MATCH
   │     ├─ const token = generateToken(admin._id, admin.role)
   │     │  └─ JWT token: 'eyJhbGc...'
   │     ├─ res.status(200).json({
   │     │   success: true,
   │     │   token: 'eyJhbGc...',
   │     │   admin: { id, fullName, email, role, ... },
   │     │   redirect: 'dashboard'
   │     │ })
   │     └─ Return response
   │
   └─ ASSERT (Kiểm tra kết quả)
      │
      ├─ expect(mockRes.statusCode).toBe(200)
      │  ✅ PASS: mockRes.statusCode = 200
      │
      ├─ expect(mockRes._json).toHaveProperty('success', true)
      │  ✅ PASS: mockRes._json.success = true
      │
      ├─ expect(mockRes._json).toHaveProperty('token')
      │  ✅ PASS: mockRes._json.token = 'eyJhbGc...'
      │
      ├─ expect(mockRes._json.token).toBeTruthy()
      │  ✅ PASS: token có giá trị
      │
      ├─ expect(mockRes._json.admin).toHaveProperty('email', 'admin@test.com')
      │  ✅ PASS: email = 'admin@test.com'
      │
      ├─ expect(mockRes._json.redirect).toBe('dashboard')
      │  ✅ PASS: redirect = 'dashboard'
      │
      └─ ✅ TEST PASSED - All assertions correct!
```

---

## 6️⃣ DATABASE STATE TRONG TEST

```
┌─────────────────────────────────────────────┐
│         Test 1: [LOGIN_001]                 │
├─────────────────────────────────────────────┤
│                                             │
│  beforeEach(): clearDatabase()              │
│  Database: [empty]                          │
│                                             │
│  ARRANGE: Create & save admin               │
│  Database: [                                │
│    {                                        │
│      _id: ObjectId(...),                    │
│      email: 'admin@test.com',               │
│      password: 'hash123...',                │
│      role: 'admin',                         │
│      accountStatus: 'active'                │
│    }                                        │
│  ]                                          │
│                                             │
│  ACT: Call login()                          │
│  Response: { success: true, token: ... }    │
│                                             │
│  ASSERT: Check response ✅                  │
│                                             │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│         Test 2: [LOGIN_002]                 │
├─────────────────────────────────────────────┤
│                                             │
│  beforeEach(): clearDatabase()              │
│  Database: [empty] ← Previous data deleted! │
│                                             │
│  ARRANGE: Setup mock                        │
│  Database: [empty]                          │
│                                             │
│  ACT: Call login()                          │
│  Response: { success: false, ... }          │
│                                             │
│  ASSERT: Check response ✅                  │
│                                             │
└─────────────────────────────────────────────┘
```

---

## 7️⃣ JEST MATCHERS - CÁC KIỂM TRA

```javascript
// Kiểm tra giá trị
expect(statusCode).toBe(200)                    // Bằng
expect(success).toEqual(true)                   // Bằng (deep compare)
expect(value).toBeTruthy()                      // Truthy
expect(value).toBeFalsy()                       // Falsy

// Kiểm tra property
expect(obj).toHaveProperty('token')             // Có property
expect(obj).toHaveProperty('email', 'test@...') // Có property + value

// Kiểm tra array/string
expect(array).toContain('item')                 // Chứa
expect(string).toMatch(/pattern/)               // Match regex

// Kiểm tra hàm
expect(mockFn).toHaveBeenCalled()               // Được gọi
expect(mockFn).toHaveBeenCalledWith(arg1, arg2) // Gọi với args

// Kiểm tra error
expect(() => {...}).toThrow()                   // Throw error
expect(() => {...}).toThrow('message')          // Throw message
```

---

## 8️⃣ SETUP LIFECYCLE HOOKS

```
┌──────────────────────────────────────────────────┐
│           TEST FILE LIFECYCLE                    │
├──────────────────────────────────────────────────┤
│                                                  │
│  describe('Auth Controller - Login', () => {    │
│                                                  │
│    beforeAll(async () => {                      │
│      // ✅ Chạy 1 lần duy nhất                   │
│      // Dùng cho: Connect DB, init resources     │
│      await connectTestDB();                      │
│    });                                           │
│                                                  │
│    beforeEach(async () => {                     │
│      // ✅ Chạy TRƯỚC MỖI TEST                   │
│      // Dùng cho: Clear DB, reset state          │
│      await clearDatabase();                      │
│      setupMockReqRes();                          │
│    });                                           │
│                                                  │
│    test('[LOGIN_001]', () => { ... });          │
│    test('[LOGIN_002]', () => { ... });          │
│    // ... more tests                             │
│                                                  │
│    afterEach(async () => {                      │
│      // ✅ Chạy SAU MỖI TEST                     │
│      // Dùng cho: Cleanup                        │
│      // (Nếu cần)                                │
│    });                                           │
│                                                  │
│    afterAll(async () => {                       │
│      // ✅ Chạy 1 lần duy nhất                   │
│      // Dùng cho: Close DB, cleanup resources    │
│      await disconnectTestDB();                   │
│    });                                           │
│                                                  │
│  });                                             │
│                                                  │
└──────────────────────────────────────────────────┘

Timeline:
beforeAll() ──→ (1 lần)
  ├─ beforeEach() ──→ Test 1
  ├─ beforeEach() ──→ Test 2
  ├─ beforeEach() ──→ Test 3
  └─ ...
      ↓
afterAll() ──→ (1 lần)
```

---

## 9️⃣ TEST RESULT OUTPUT

```
 PASS  __tests__/controllers/auth.test.js
  Auth Controller - Login
    √ [LOGIN_001] Should login successfully with valid credentials (56 ms)
    √ [LOGIN_002] Should fail login - Missing email (18 ms)
    √ [LOGIN_003] Should fail login - Missing password (4 ms)
    √ [LOGIN_004] Should fail login - Invalid credentials (16 ms)
    √ [LOGIN_005] Should fail login - Admin not found (8 ms)
    √ [LOGIN_006] Should fail login - Account suspended (19 ms)
    √ [LOGIN_007] Should login successfully - First time (22 ms)
    √ [LOGIN_008] Should login successfully - Inactive account (11 ms)
    √ [LOGIN_009] Should login successfully - Email case insensitive (10 ms)
    √ [LOGIN_010] Should generate valid JWT token (13 ms)

Test Suites: 1 passed, 1 total
Tests:       10 passed, 10 total
Snapshots:   0 total
Time:        0.95 s

✅ ALL TESTS PASSED!
```

---

## 🔟 TÓM TẮT

### testHelpers.js:
```
🛠️  Công cụ hỗ trợ test
├─ Hash password
├─ Tạo fake data
├─ Xóa DB
├─ Connect/Disconnect DB
```

### auth.test.js:
```
🧪 File test thực tế
├─ 10 test cases
├─ Mock request/response
├─ Arrange → Act → Assert
├─ Kiểm thử login() function
```

### Flow:
```
beforeAll() → beforeEach() → TEST → [repeat] → afterAll()
```

### Benefit:
```
✅ Tự động kiểm thử code
✅ Catch bugs sớm
✅ Regression testing
✅ Documentation
✅ Confidence khi refactor
```

