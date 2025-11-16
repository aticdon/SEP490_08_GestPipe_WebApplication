# 📋 Phân Tích Unit Test Cases - GestPipe Project

## I. Tổng Quan Project

**Loại Project:** Full-Stack Web Application (Backend: Node.js/Express, Frontend: React)

**Công Nghệ Chính:**
- Backend: Express.js, MongoDB (Mongoose), JWT, bcrypt
- Frontend: React, Axios, React Router, i18next
- Database: MongoDB
- Authentication: JWT Token

---

## II. Phân Tích Cấu Trúc Backend

### A. Controllers Cần Test

#### 1. **authController.js** - Quản lý Xác thực
- ✅ `login()` - Đăng nhập admin/superadmin
- ✅ `changePassword()` - Đổi mật khẩu
- ✅ `updateProfile()` - Cập nhật hồ sơ
- ✅ `getCurrentAdmin()` - Lấy thông tin admin hiện tại
- ✅ `sendForgotPasswordOTP()` - Gửi OTP quên mật khẩu
- ✅ `verifyForgotPasswordOTP()` - Xác thực OTP
- ✅ `resetForgotPassword()` - Reset mật khẩu

#### 2. **gestureController.js** - Quản lý Gesture
- ✅ `listSamples()` - Lấy danh sách mẫu gesture (có pagination)
- ✅ `listLabels()` - Lấy danh sách nhãn pose
- ✅ `stats()` - Tính toán thống kê gesture

#### 3. **userController.js** - Quản lý User (cần check)

#### 4. **dashboardController.js** - Dashboard Analytics (cần check)

#### 5. **adminController.js** - Quản lý Admin (cần check)

#### 6. **translationController.js** - Quản lý Bản Dịch (cần check)

---

## III. Phân Tích Middleware

### A. authMiddleware.js
- ✅ `protect()` - Bảo vệ route (verify JWT)
- ✅ `authorize()` - Phân quyền role (admin, superadmin)

---

## IV. Phân Tích Models

### A. Admin.js
- Email validation
- Password hashing (SHA256)
- Pre-save hooks

### B. User.js
- Account status management
- Email verification

### C. GestureSample.js
- Gesture data storage

### D. GestureTrainingRun.js
- Training data

---

## V. Phân Tích Frontend Services

### A. authService.js
- ✅ `login()`
- ✅ `logout()`
- ✅ `getCurrentUser()`
- ✅ `changePassword()`
- ✅ `updateProfile()`
- ✅ `getCurrentAdmin()`
- ✅ `sendForgotPasswordOTP()`
- ✅ `verifyForgotPasswordOTP()`
- ✅ `resetForgotPassword()`

---

## VI. UNITTEST CASES - BACKEND

### 🔐 BACKEND: AUTH CONTROLLER TESTS

#### Test Suite: Login Function
```
1. [LOGIN_001] Login thành công với credentials hợp lệ
   - Input: email="admin@test.com", password="password123"
   - Expected: Trả về token, admin info, redirect='dashboard'
   - Status: 200 OK

2. [LOGIN_002] Login fail - Missing email
   - Input: email="", password="password123"
   - Expected: Error 400, message="Please provide email and password"
   - Status: 400 Bad Request

3. [LOGIN_003] Login fail - Missing password
   - Input: email="admin@test.com", password=""
   - Expected: Error 400
   - Status: 400 Bad Request

4. [LOGIN_004] Login fail - Invalid credentials
   - Input: email="admin@test.com", password="wrongpassword"
   - Expected: Error 401, message="Invalid email or password"
   - Status: 401 Unauthorized

5. [LOGIN_005] Login fail - Admin không tồn tại
   - Input: email="notexist@test.com", password="password123"
   - Expected: Error 401
   - Status: 401 Unauthorized

6. [LOGIN_006] Login fail - Account suspended
   - Input: email="suspended@test.com", password="password123"
   - Expected: Error 403, message="Account is suspended"
   - Status: 403 Forbidden

7. [LOGIN_007] Login thành công - First time with temporary password
   - Input: email="newadmin@test.com", password="temppass123"
   - Expected: 
     * Account status: inactive → active
     * isFirstLogin: true
     * redirect: 'change-password'
   - Status: 200 OK

8. [LOGIN_008] Login thành công - Account inactive (không phải first login)
   - Input: email="inactive@test.com", password="password123"
   - Expected: Cho phép login, status=200
   - Status: 200 OK
```

#### Test Suite: Change Password Function
```
9. [CHANGE_PWD_001] Đổi mật khẩu thành công
   - Input: currentPassword="oldpass123", newPassword="newpass123"
   - Expected: Status 200, message="Password changed successfully"
   - Status: 200 OK

10. [CHANGE_PWD_002] Fail - Missing currentPassword
    - Input: currentPassword="", newPassword="newpass123"
    - Expected: Error 400, message="Please provide current and new password"
    - Status: 400 Bad Request

11. [CHANGE_PWD_003] Fail - Missing newPassword
    - Input: currentPassword="oldpass123", newPassword=""
    - Expected: Error 400
    - Status: 400 Bad Request

12. [CHANGE_PWD_004] Fail - newPassword < 6 characters
    - Input: currentPassword="oldpass123", newPassword="new12"
    - Expected: Error 400, message="New password must be at least 6 characters long"
    - Status: 400 Bad Request

13. [CHANGE_PWD_005] Fail - currentPassword không đúng
    - Input: currentPassword="wrongpass123", newPassword="newpass123"
    - Expected: Error 401, message="Current password is incorrect"
    - Status: 401 Unauthorized

14. [CHANGE_PWD_006] Fail - Admin không tồn tại
    - Input: [valid current/new password], nhưng admin ID không tồn tại
    - Expected: Error 404, message="Admin not found"
    - Status: 404 Not Found

15. [CHANGE_PWD_007] Đổi mật khẩu - temporaryPassword được clear
    - Input: currentPassword="oldpass123", newPassword="newpass123"
    - Expected: temporaryPassword=null, isFirstLogin=false
    - Status: 200 OK
```

#### Test Suite: Update Profile Function
```
16. [UPDATE_PROFILE_001] Cập nhật hồ sơ thành công - All fields
    - Input: fullName="John Doe", phoneNumber="0123456789", birthday="1990-01-01", theme="dark", uiLanguage="en"
    - Expected: Status 200, tất cả fields được update
    - Status: 200 OK

17. [UPDATE_PROFILE_002] Cập nhật hồ sơ - Partial update
    - Input: fullName="Jane Doe", uiLanguage="vi"
    - Expected: Status 200, chỉ 2 fields được update
    - Status: 200 OK

18. [UPDATE_PROFILE_003] Update Profile - Admin không tồn tại
    - Input: [valid data], nhưng admin ID không tồn tại
    - Expected: Error 404, message="Admin not found"
    - Status: 404 Not Found

19. [UPDATE_PROFILE_004] Update Profile - Invalid theme
    - Input: theme="invalid"
    - Expected: Chỉ update khi theme hợp lệ (light/dark) hoặc skip
    - Status: 200 OK
```

#### Test Suite: Get Current Admin Function
```
20. [GET_CURRENT_001] Lấy thông tin admin hiện tại thành công
    - Input: Token hợp lệ
    - Expected: Status 200, trả về admin info (không password, temporaryPassword)
    - Status: 200 OK

21. [GET_CURRENT_002] Fail - Admin không tồn tại
    - Input: Token hợp lệ nhưng admin ID không tồn tại
    - Expected: Error 404, message="Admin not found"
    - Status: 404 Not Found
```

#### Test Suite: Forgot Password OTP Function
```
22. [FORGOT_PWD_001] Gửi OTP thành công
    - Input: email="admin@test.com"
    - Expected: 
      * Status 200
      * OTP được sinh (6 digits)
      * resetPasswordOTP != null
      * resetPasswordOTPExpires = now + 5 minutes
      * Email được gửi
    - Status: 200 OK

23. [FORGOT_PWD_002] Fail - Missing email
    - Input: email=""
    - Expected: Error 400, message="Please provide email"
    - Status: 400 Bad Request

24. [FORGOT_PWD_003] Fail - Admin không tồn tại
    - Input: email="notexist@test.com"
    - Expected: Error 404, message="Admin not found"
    - Status: 404 Not Found

25. [FORGOT_PWD_004] Email send failure - Graceful error
    - Input: email="admin@test.com" (mail service fail)
    - Expected: Error 500, message="Error sending OTP email"
    - Status: 500 Server Error
```

#### Test Suite: Verify OTP Function
```
26. [VERIFY_OTP_001] Xác thực OTP thành công
    - Input: email="admin@test.com", otp="123456"
    - Expected: 
      * Status 200
      * resetPasswordOTP=null
      * resetPasswordOTPExpires=null
    - Status: 200 OK

27. [VERIFY_OTP_002] Fail - Missing email
    - Input: email="", otp="123456"
    - Expected: Error 400
    - Status: 400 Bad Request

28. [VERIFY_OTP_003] Fail - Missing OTP
    - Input: email="admin@test.com", otp=""
    - Expected: Error 400
    - Status: 400 Bad Request

29. [VERIFY_OTP_004] Fail - OTP không đúng
    - Input: email="admin@test.com", otp="000000" (wrong OTP)
    - Expected: Error 401, message="Invalid OTP"
    - Status: 401 Unauthorized

30. [VERIFY_OTP_005] Fail - OTP đã hết hạn
    - Input: email="admin@test.com", otp="123456" (expired)
    - Expected: Error 401, message="OTP expired"
    - Status: 401 Unauthorized

31. [VERIFY_OTP_006] Fail - Admin không tồn tại hoặc chưa request OTP
    - Input: email="notexist@test.com", otp="123456"
    - Expected: Error 400, message="OTP not found or expired"
    - Status: 400 Bad Request
```

#### Test Suite: Reset Forgot Password Function
```
32. [RESET_PWD_001] Reset password thành công (sau verify OTP)
    - Input: email="admin@test.com", newPassword="newpass123"
    - Expected: Status 200, password được update, isFirstLogin=false
    - Status: 200 OK

33. [RESET_PWD_002] Fail - Missing email
    - Input: email="", newPassword="newpass123"
    - Expected: Error 400
    - Status: 400 Bad Request

34. [RESET_PWD_003] Fail - Missing newPassword
    - Input: email="admin@test.com", newPassword=""
    - Expected: Error 400
    - Status: 400 Bad Request

35. [RESET_PWD_004] Fail - newPassword < 6 characters
    - Input: email="admin@test.com", newPassword="new12"
    - Expected: Error 400
    - Status: 400 Bad Request

36. [RESET_PWD_005] Fail - Admin không tồn tại
    - Input: email="notexist@test.com", newPassword="newpass123"
    - Expected: Error 404, message="Admin not found"
    - Status: 404 Not Found

37. [RESET_PWD_006] Fail - OTP chưa được xác thực
    - Input: email="admin@test.com", newPassword="newpass123" (OTP still exists)
    - Expected: Error 400, message="OTP not verified yet"
    - Status: 400 Bad Request
```

---

### 🎭 BACKEND: GESTURE CONTROLLER TESTS

#### Test Suite: List Samples Function
```
38. [LIST_SAMPLES_001] Lấy danh sách samples thành công - Default pagination
    - Input: Không có query params
    - Expected: Status 200, data với pagination (page=1, limit=25)
    - Status: 200 OK

39. [LIST_SAMPLES_002] Lấy danh sách samples - Custom pagination
    - Input: page=2, limit=10
    - Expected: Status 200, skip=10, limit=10
    - Status: 200 OK

40. [LIST_SAMPLES_003] Lấy danh sách samples - Max limit
    - Input: page=1, limit=500
    - Expected: Status 200, limit=200 (capped at 200)
    - Status: 200 OK

41. [LIST_SAMPLES_004] Lấy danh sách samples - Filter by poseLabel
    - Input: poseLabel="peace"
    - Expected: Status 200, chỉ samples có pose_label="peace"
    - Status: 200 OK

42. [LIST_SAMPLES_005] Lấy danh sách samples - Filter by gestureType
    - Input: gestureType="static"
    - Expected: Status 200, chỉ samples có gesture_type="static"
    - Status: 200 OK

43. [LIST_SAMPLES_006] Lấy danh sách samples - Invalid gestureType
    - Input: gestureType="invalid"
    - Expected: Status 200, không filter gesture_type
    - Status: 200 OK

44. [LIST_SAMPLES_007] Lấy danh sách samples - Combine filters
    - Input: poseLabel="peace", gestureType="static", page=1, limit=20
    - Expected: Status 200, filtered & paginated
    - Status: 200 OK

45. [LIST_SAMPLES_008] Lấy danh sách samples - Negative page number
    - Input: page=-1
    - Expected: Status 200, page=1 (fallback)
    - Status: 200 OK

46. [LIST_SAMPLES_009] Lấy danh sách samples - Zero limit
    - Input: limit=0
    - Expected: Status 200, limit=25 (fallback)
    - Status: 200 OK

47. [LIST_SAMPLES_010] Lấy danh sách samples - Empty result
    - Input: poseLabel="nonexistent"
    - Expected: Status 200, data=[], total=0
    - Status: 200 OK
```

#### Test Suite: List Labels Function
```
48. [LIST_LABELS_001] Lấy danh sách nhãn thành công
    - Input: Không có params
    - Expected: Status 200, array của unique pose_labels
    - Status: 200 OK

49. [LIST_LABELS_002] Lấy danh sách nhãn - Empty
    - Input: Không có samples
    - Expected: Status 200, data=[]
    - Status: 200 OK
```

#### Test Suite: Statistics Function
```
50. [STATS_001] Tính toán thống kê thành công
    - Input: Không có params
    - Expected: Status 200, counts, types, motionCenter
    - Status: 200 OK

51. [STATS_002] Thống kê - Breakdown by pose_label
    - Input: Không có params
    - Expected: Status 200, counts=[{pose_label, samples}]
    - Status: 200 OK

52. [STATS_003] Thống kê - Breakdown by gesture_type
    - Input: Không có params
    - Expected: Status 200, types={static: X, dynamic: Y}
    - Status: 200 OK

53. [STATS_004] Thống kê - Motion center calculation
    - Input: Không có params
    - Expected: Status 200, motionCenter={deltaXAvg, deltaYAvg}
    - Status: 200 OK

54. [STATS_005] Thống kê - Empty samples
    - Input: Không có samples
    - Expected: Status 200, counts=[], types={static:0, dynamic:0}
    - Status: 200 OK
```

---

### 🔐 BACKEND: AUTH MIDDLEWARE TESTS

#### Test Suite: Protect Middleware
```
55. [PROTECT_001] Protect - Valid token
    - Input: token hợp lệ trong header "Authorization: Bearer <token>"
    - Expected: req.admin được set, next() được gọi
    - Status: Pass

56. [PROTECT_002] Protect - Missing token
    - Input: Không có Authorization header
    - Expected: Error 401, message="Not authorized"
    - Status: 401 Unauthorized

57. [PROTECT_003] Protect - Invalid token format
    - Input: Authorization header không bắt đầu bằng "Bearer"
    - Expected: Error 401, message="Not authorized"
    - Status: 401 Unauthorized

58. [PROTECT_004] Protect - Invalid JWT signature
    - Input: Token bị tamper
    - Expected: Error 401, message="Invalid token"
    - Status: 401 Unauthorized

59. [PROTECT_005] Protect - Token expired
    - Input: Token hết hạn (7 days)
    - Expected: Error 401, message="Token expired"
    - Status: 401 Unauthorized

60. [PROTECT_006] Protect - Admin không tồn tại
    - Input: Token hợp lệ nhưng admin ID không tồn tại
    - Expected: Error 401, message="Admin no longer exists"
    - Status: 401 Unauthorized

61. [PROTECT_007] Protect - Admin account không active
    - Input: Token hợp lệ nhưng account status ≠ "active"
    - Expected: Error 403, message="Account is [status]"
    - Status: 403 Forbidden
```

#### Test Suite: Authorize Middleware
```
62. [AUTHORIZE_001] Authorize - User có role hợp lệ
    - Input: User role="superadmin", required roles=["superadmin", "admin"]
    - Expected: next() được gọi
    - Status: Pass

63. [AUTHORIZE_002] Authorize - User không có role hợp lệ
    - Input: User role="admin", required roles=["superadmin"]
    - Expected: Error 403, message="Role 'admin' is not authorized"
    - Status: 403 Forbidden

64. [AUTHORIZE_003] Authorize - Multiple allowed roles
    - Input: User role="admin", required roles=["superadmin", "admin"]
    - Expected: next() được gọi
    - Status: Pass
```

---

### 💾 BACKEND: MODEL TESTS

#### Test Suite: Admin Model
```
65. [ADMIN_MODEL_001] Create admin - Valid data
    - Input: {fullName, email, password, role}
    - Expected: Document được tạo, password được hash
    - Status: Success

66. [ADMIN_MODEL_002] Create admin - Email validation
    - Input: email="invalid-email"
    - Expected: Validation error, message="Please use a valid email address"
    - Status: Error

67. [ADMIN_MODEL_003] Create admin - Unique email constraint
    - Input: email="existing@test.com"
    - Expected: Duplicate key error
    - Status: Error

68. [ADMIN_MODEL_004] Create admin - Password hashing
    - Input: password="plaintext123"
    - Expected: password được hash SHA256, plaintext không được lưu
    - Status: Success

69. [ADMIN_MODEL_005] Admin pre-save hook - Hash temporaryPassword
    - Input: temporaryPassword="temp123"
    - Expected: temporaryPassword được hash SHA256
    - Status: Success

70. [ADMIN_MODEL_006] Admin model - Default values
    - Input: Chỉ cung cấp required fields
    - Expected: 
      * role="admin"
      * accountStatus="active"
      * theme="light"
      * uiLanguage="vi"
      * isFirstLogin=true
    - Status: Success
```

#### Test Suite: User Model
```
71. [USER_MODEL_001] Create user - Valid data
    - Input: {email, password_hash, account_status}
    - Expected: Document được tạo
    - Status: Success

72. [USER_MODEL_002] User - Default account_status
    - Input: Không cung cấp account_status
    - Expected: account_status="inactive"
    - Status: Success

73. [USER_MODEL_003] User - Email required
    - Input: Không cung cấp email
    - Expected: Validation error
    - Status: Error

74. [USER_MODEL_004] User - Valid enum account_status
    - Input: account_status="activeonline"
    - Expected: Document được tạo
    - Status: Success

75. [USER_MODEL_005] User - Invalid enum account_status
    - Input: account_status="invalid_status"
    - Expected: Validation error
    - Status: Error
```

---

## VII. UNITTEST CASES - FRONTEND

### 🔐 FRONTEND: AUTH SERVICE TESTS

#### Test Suite: Login Service
```
76. [FE_LOGIN_001] Login service - Successful login
    - Input: email="admin@test.com", password="password123"
    - Expected: 
      * Response data với token, admin info
      * HTTP status 200
    - Status: Success

77. [FE_LOGIN_002] Login service - Server error
    - Input: Server trả về 500
    - Expected: Error được throw
    - Status: Error

78. [FE_LOGIN_003] Login service - Network error
    - Input: Network không khả dụng
    - Expected: Error được throw (AxiosError)
    - Status: Error
```

#### Test Suite: Logout Service
```
79. [FE_LOGOUT_001] Logout service - Remove token
    - Input: localStorage.token="some_token"
    - Expected: localStorage.token được xóa
    - Status: Success

80. [FE_LOGOUT_002] Logout service - Remove admin data
    - Input: localStorage.admin="{...}"
    - Expected: localStorage.admin được xóa
    - Status: Success
```

#### Test Suite: Get Current User Service
```
81. [FE_GET_CURRENT_001] Get current user - Valid data in localStorage
    - Input: localStorage.admin='{"id":"123","email":"test@test.com"}'
    - Expected: Trả về parsed object
    - Status: Success

82. [FE_GET_CURRENT_002] Get current user - No data in localStorage
    - Input: localStorage.admin không tồn tại
    - Expected: Trả về null
    - Status: Success

83. [FE_GET_CURRENT_003] Get current user - Invalid JSON
    - Input: localStorage.admin="invalid_json"
    - Expected: Error được throw (JSON parse error)
    - Status: Error
```

#### Test Suite: Change Password Service
```
84. [FE_CHANGE_PWD_001] Change password - Success
    - Input: currentPassword="old123", newPassword="new123"
    - Expected: 
      * POST request với token trong header
      * Status 200
    - Status: Success

85. [FE_CHANGE_PWD_002] Change password - Missing token
    - Input: localStorage.token không tồn tại
    - Expected: Request không có Authorization header hoặc error
    - Status: Error

86. [FE_CHANGE_PWD_003] Change password - Invalid current password
    - Input: currentPassword="wrongpass", newPassword="new123"
    - Expected: Server error 401
    - Status: Error
```

#### Test Suite: Update Profile Service
```
87. [FE_UPDATE_PROFILE_001] Update profile - Success
    - Input: {fullName: "New Name", theme: "dark"}
    - Expected: 
      * PUT request với token
      * Status 200
    - Status: Success

88. [FE_UPDATE_PROFILE_002] Update profile - Missing token
    - Input: localStorage.token không tồn tại
    - Expected: Error
    - Status: Error
```

#### Test Suite: Get Current Admin Service
```
89. [FE_GET_ADMIN_001] Get current admin - Success
    - Input: Token hợp lệ
    - Expected: 
      * GET request với token
      * Status 200
      * Trả về admin object
    - Status: Success

90. [FE_GET_ADMIN_002] Get current admin - Token expired
    - Input: Token expired
    - Expected: Server error 401
    - Status: Error
```

#### Test Suite: Forgot Password Services
```
91. [FE_FORGOT_PWD_001] Send OTP - Success
    - Input: email="admin@test.com"
    - Expected: 
      * POST request
      * Status 200
      * message="OTP sent to email"
    - Status: Success

92. [FE_FORGOT_PWD_002] Send OTP - Admin not found
    - Input: email="notexist@test.com"
    - Expected: Server error 404
    - Status: Error

93. [FE_VERIFY_OTP_001] Verify OTP - Success
    - Input: email="admin@test.com", otp="123456"
    - Expected: 
      * POST request
      * Status 200
      * message="OTP verified"
    - Status: Success

94. [FE_VERIFY_OTP_002] Verify OTP - Invalid OTP
    - Input: email="admin@test.com", otp="000000"
    - Expected: Server error 401
    - Status: Error

95. [FE_RESET_PWD_001] Reset password - Success
    - Input: email="admin@test.com", newPassword="newpass123"
    - Expected: 
      * POST request
      * Status 200
    - Status: Success

96. [FE_RESET_PWD_002] Reset password - Invalid newPassword
    - Input: email="admin@test.com", newPassword="new12"
    - Expected: Server error 400
    - Status: Error
```

---

### 🔒 FRONTEND: AUTHENTICATION FLOW TESTS

#### Test Suite: Protected Route Component
```
97. [PROTECTED_ROUTE_001] Access protected route - Authenticated user
    - Input: localStorage.token exists, localStorage.admin.role="superadmin"
    - Expected: Children rendered
    - Status: Success

98. [PROTECTED_ROUTE_002] Access protected route - Not authenticated
    - Input: localStorage.token không tồn tại
    - Expected: Redirect to "/"
    - Status: Success

99. [PROTECTED_ROUTE_003] Access protected route - Insufficient role
    - Input: User role="admin", required role="superadmin"
    - Expected: Redirect to allowed page hoặc "/"
    - Status: Success

100. [PROTECTED_ROUTE_004] Access protected route - Superadmin accessing admin page
    - Input: Superadmin truy cập admin-only page
    - Expected: Có thể truy cập (superadmin có all permissions) hoặc redirect
    - Status: Success/Check logic
```

---

## VIII. INTEGRATION TESTS

### 🔄 INTEGRATION: Authentication Flow
```
101. [INTEGRATION_AUTH_001] Complete login flow
    - Steps:
      1. POST /api/auth/login
      2. Save token & admin to localStorage
      3. Verify token in GET /api/auth/me
    - Expected: All steps successful

102. [INTEGRATION_AUTH_002] First-time login flow
    - Steps:
      1. Login với temporary password
      2. Account status: inactive → active
      3. Redirect to /change-password
      4. Change password successfully
      5. Redirect to /dashboard
    - Expected: All steps successful

103. [INTEGRATION_AUTH_003] Forgot password flow
    - Steps:
      1. POST /api/auth/forgot-password
      2. Receive OTP email
      3. POST /api/auth/verify-otp
      4. POST /api/auth/reset-password
      5. Login với new password
    - Expected: All steps successful
```

### 🎭 INTEGRATION: Gesture Workflow
```
104. [INTEGRATION_GESTURE_001] Complete gesture workflow
    - Steps:
      1. GET /api/gestures/labels
      2. GET /api/gestures/list (with label filter)
      3. GET /api/gestures/stats
    - Expected: All steps successful

105. [INTEGRATION_GESTURE_002] Gesture pagination workflow
    - Steps:
      1. GET /api/gestures/list (page=1, limit=10)
      2. Verify pagination: page, limit, total, pages
      3. GET /api/gestures/list (page=2, limit=10)
      4. Verify data differs from page 1
    - Expected: Pagination working correctly
```

---

## IX. DATABASE TESTS

### 💾 DATABASE: Connection & Operations
```
106. [DB_001] MongoDB connection successful
    - Expected: Connection established to MongoDB

107. [DB_002] Create document in Admin collection
    - Expected: Document saved with correct schema

108. [DB_003] Query with filters
    - Expected: Filtered results returned

109. [DB_004] Pagination query
    - Expected: Correct skip/limit applied

110. [DB_005] Aggregation pipeline
    - Expected: Aggregation results correct
```

---

## X. ERROR HANDLING & EDGE CASES

### ⚠️ Error Handling Tests
```
111. [ERROR_001] Null input handling
112. [ERROR_002] Undefined input handling
113. [ERROR_003] Invalid data types
114. [ERROR_004] SQL/NoSQL injection attempts
115. [ERROR_005] XSS attempts in input
116. [ERROR_006] CSRF token validation
117. [ERROR_007] Rate limiting
118. [ERROR_008] Concurrent requests
119. [ERROR_009] Large file uploads
120. [ERROR_010] Timeout handling
```

---

## XI. SECURITY TESTS

### 🔒 Security Tests
```
121. [SECURITY_001] Password hash verification (not plaintext stored)
122. [SECURITY_002] JWT token validation
123. [SECURITY_003] CORS validation
124. [SECURITY_004] Protected route authorization
125. [SECURITY_005] OTP token expiry
126. [SECURITY_006] Temporary password force change
127. [SECURITY_007] Password length requirements
128. [SECURITY_008] Email format validation
129. [SECURITY_009] Account status checks
130. [SECURITY_010] Role-based access control (RBAC)
```

---

## XII. PERFORMANCE TESTS

### ⚡ Performance Tests
```
131. [PERF_001] List 10,000 samples - Response time < 1s
132. [PERF_002] Statistics aggregation - Response time < 2s
133. [PERF_003] Login request - Response time < 500ms
134. [PERF_004] Concurrent login requests - Handle 100 simultaneously
135. [PERF_005] Database query optimization
136. [PERF_006] Memory leak detection
137. [PERF_007] Large pagination handling
138. [PERF_008] Token generation performance
```

---

## XIII. TESTING TOOLS RECOMMENDATIONS

### Backend Testing Stack
```
Framework: Jest / Mocha
HTTP Client: Supertest (for API testing)
Mock/Stub: Sinon.js / Jest mocks
Database: MongoDB Memory Server
Code Coverage: Istanbul / Jest coverage
```

### Frontend Testing Stack
```
Framework: Jest / React Testing Library / Vitest
HTTP Mock: MSW (Mock Service Worker)
Component Testing: React Testing Library
E2E Testing: Cypress / Playwright
Code Coverage: Istanbul / Jest coverage
```

---

## XIV. Test Case Summary

| Category | Count | Status |
|----------|-------|--------|
| Auth Controller | 37 | ✅ Defined |
| Gesture Controller | 17 | ✅ Defined |
| Auth Middleware | 8 | ✅ Defined |
| Admin Model | 6 | ✅ Defined |
| User Model | 5 | ✅ Defined |
| Frontend Services | 21 | ✅ Defined |
| Integration | 5 | ✅ Defined |
| Database | 5 | ✅ Defined |
| Error Handling | 10 | ✅ Defined |
| Security | 10 | ✅ Defined |
| Performance | 8 | ✅ Defined |
| **TOTAL** | **~140** | ✅ |

---

## XV. Implementation Priority

### Phase 1: Critical (High Priority)
- [x] Login/Logout tests
- [x] Authentication middleware tests
- [x] Password management tests
- [x] Role-based access control tests
- [x] Model validation tests

### Phase 2: Important (Medium Priority)
- [ ] Gesture controller tests
- [ ] Admin profile management
- [ ] User management
- [ ] Dashboard analytics

### Phase 3: Enhancement (Low Priority)
- [ ] Integration tests
- [ ] Performance tests
- [ ] Security penetration tests
- [ ] Load testing

---

## XVI. Execution Plan

### Step 1: Setup Test Environment
```bash
# Backend
npm install --save-dev jest supertest sinon dotenv

# Frontend
npm install --save-dev @testing-library/react @testing-library/jest-dom msw
```

### Step 2: Create Test Directory Structure
```
backend/
├── __tests__/
│   ├── controllers/
│   │   ├── auth.test.js
│   │   ├── gesture.test.js
│   │   └── admin.test.js
│   ├── middlewares/
│   │   └── auth.test.js
│   ├── models/
│   │   ├── Admin.test.js
│   │   └── User.test.js
│   └── integration/
│       └── auth.integration.test.js

frontend/src/
├── __tests__/
│   ├── services/
│   │   └── authService.test.js
│   ├── components/
│   │   └── ProtectedRoute.test.js
│   └── integration/
│       └── auth.integration.test.js
```

### Step 3: Write and Execute Tests
- Phase 1: Critical tests (Target: 1-2 weeks)
- Phase 2: Important tests (Target: 2-3 weeks)
- Phase 3: Enhancement tests (Target: 1-2 weeks)

### Step 4: Coverage Goals
- Target Coverage: > 80%
  - Statements: > 80%
  - Branches: > 75%
  - Functions: > 80%
  - Lines: > 80%

---

**Document Date:** November 16, 2025
**Status:** Unit Test Planning Complete
**Next Steps:** Implementation Phase
