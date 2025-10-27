# 📊 TỔNG HỢP DỰ ÁN DASHBOARD WEB - GESTPIPE

## 🎯 TỔNG QUAN DỰ ÁN

**Tên dự án**: GestPipe Admin Dashboard  
**Mục đích**: Hệ thống quản lý Admin và User cho ứng dụng điều khiển cử chỉ  
**Kiến trúc**: Full-stack MERN (MongoDB, Express.js, React.js, Node.js)

---

## 🏗️ KIẾN TRÚC HỆ THỐNG

```
dashboard_web/
├── backend/           # Node.js + Express.js API Server
├── frontend/          # React.js Single Page Application
└── package.json       # Root dependencies
```

---

## 🎨 FRONTEND - REACT.JS APPLICATION

### ⚙️ **CÔNG NGHỆ SỬ DỤNG**

#### **Core Framework & Libraries**
- ⚛️ **React 18.2.0** - UI Framework
- 🔄 **React Router DOM v6.30.1** - Client-side routing
- 📡 **Axios 1.12.2** - HTTP client để gọi API

#### **UI/UX Frameworks & Styling**
- 🎨 **Tailwind CSS 4.1.15** - Utility-first CSS framework (CHÍNH)
- 🎭 **PostCSS 8.5.6** - CSS preprocessor cho Tailwind
- 🔧 **Autoprefixer 10.4.21** - Tự động thêm vendor prefixes
- ✨ **Custom Tailwind Config** - Custom colors (cyan-primary, dark-bg)
- 🖼️ **Custom Backgrounds** - Background images với overlay effects

#### **Icons & Graphics**
- 🎯 **Lucide React 0.546.0** - Modern icon library
  - Sun/Moon icons (theme toggle)
  - Bell (notifications)
  - ChevronDown, Lock/Unlock, Plus, Search, Loader2
  - 50+ icons được sử dụng trong project

#### **Notifications & Alerts**
- 🔔 **React Toastify 11.0.5** - Toast notifications
  - Success, Error, Info, Warning messages
  - Customizable positioning & styling
- 🚨 **SweetAlert2 11.26.3** - Beautiful modal dialogs
  - Confirm dialogs (suspend/activate accounts)
  - Success/Error alerts
  - Custom dark theme styling

#### **Internationalization (i18n)**
- 🌍 **i18next 25.6.0** - Core i18n framework
- 🔄 **react-i18next 16.1.4** - React bindings cho i18next
- 🗣️ **Custom Backend Plugin** - Load translations từ MongoDB
- 🇻🇳🇬🇧 **2 ngôn ngữ**: Tiếng Việt (vi) và English (en)
- 📝 **308 translation keys** (154 vi + 154 en)

#### **Testing**
- 🧪 **@testing-library/react 16.3.0** - React component testing
- 🎭 **@testing-library/jest-dom 6.9.1** - Jest matchers
- 👤 **@testing-library/user-event 13.5.0** - User interaction simulation

#### **Other Libraries**
- 📊 **web-vitals 2.1.4** - Performance metrics

---

### 📄 **CÁC TRANG ĐÃ XÂY DỰNG**

#### **1. Login Page** (`Login.jsx`)
**Chức năng:**
- ✅ Form đăng nhập với email/password
- ✅ Toggle show/hide password
- ✅ JWT authentication
- ✅ Auto-redirect based on role (SuperAdmin/Admin)
- ✅ First login detection → force change password
- ✅ Welcome toast notification
- ✅ Responsive design với background image overlay

**Công nghệ:**
- React Hooks (useState)
- React Router (useNavigate)
- Lucide Icons (Eye, EyeOff)
- React Toastify
- Tailwind CSS (gradient buttons, glassmorphism effects)

---

#### **2. Dashboard Page** (`Dashboard.jsx`)
**Chức năng:**
- ✅ Tổng quan thống kê (Total Users, Online Users, Accuracy, Custom Actions)
- ✅ 3 Tabs: User Overview, Actions, Version
- ✅ Biểu đồ mock data (sẵn sàng tích hợp API)
- ✅ Header với logo, theme toggle, notification bell, user dropdown
- ✅ Sidebar navigation
- ✅ Đa ngôn ngữ (i18n)

**Công nghệ:**
- React Hooks (useState, useEffect)
- useTranslation (i18n)
- ThemeContext (Dark/Light mode)
- Tailwind CSS (gradient cards, backdrop-blur, animations)
- Lucide Icons

---

#### **3. Profile Page** (`Profile.jsx`)
**Chức năng:**
- ✅ Hiển thị thông tin admin (Avatar, Name, Email, Phone, Birthday, Province)
- ✅ Gradient avatar với chữ cái đầu
- ✅ Edit profile button
- ✅ Card-based layout
- ✅ Đa ngôn ngữ

**Công nghệ:**
- React Hooks
- i18next translations
- Tailwind CSS (gradient cards, hover effects)
- adminService API integration

---

#### **4. Edit Profile Page** (`EditProfile.jsx`)
**Chức năng:**
- ✅ Form chỉnh sửa thông tin (Full Name, Email, Phone, Birthday, Province)
- ✅ Province dropdown (63 tỉnh thành Việt Nam)
- ✅ Date picker cho ngày sinh
- ✅ Validation (name required)
- ✅ Auto-save to localStorage
- ✅ Success toast notification
- ✅ Cancel button quay về Profile

**Công nghệ:**
- React Hooks (useState, useEffect)
- React Toastify
- i18next
- Tailwind CSS (form styling, gradient buttons)
- adminService.updateProfile API

---

#### **5. Change Password Page** (`ChangePassword.jsx`)
**Chức năng:**
- ✅ Form đổi mật khẩu (Old, New, Confirm Password)
- ✅ Toggle show/hide cho 3 password fields
- ✅ Validations:
  - All fields required
  - New password minimum 6 characters
  - Passwords must match
- ✅ Success notification → auto redirect
- ✅ Error handling

**Công nghệ:**
- React Hooks
- Lucide Icons (Eye, EyeOff, Lock)
- React Toastify
- i18next
- Tailwind CSS
- authService.changePassword API

---

#### **6. User List Page** (`UserList.jsx`)
**Chức năng:**
- ✅ Danh sách người dùng với mock data
- ✅ Search bar (tìm theo name/ID)
- ✅ Filter dropdown (All, Online, Offline, Locked)
- ✅ Table với columns: ID, Name, Age, Status, Join Date, Action
- ✅ Lock/Unlock user toggle
- ✅ Status badges (Online: green, Offline: gray, Locked: red)
- ✅ Toast notification khi update status
- ✅ Stats summary (Total, Online, Offline, Locked counts)

**Công nghệ:**
- React Hooks (useState, useEffect)
- i18next (đa ngôn ngữ)
- React Toastify
- Lucide Icons (Lock, Unlock, Search)
- Tailwind CSS (table, badges, hover effects)

---

#### **7. Admin List Page** (`AdminList.jsx`)
**Chức năng:**
- ✅ Danh sách admin (SuperAdmin chỉ có quyền xem)
- ✅ Search bar (tìm theo name/email)
- ✅ Filter dropdown (All, Active, Inactive, Suspended)
- ✅ Table với columns: ID, Name, Email, Phone, Create Date, Status, Action
- ✅ **SweetAlert2 confirm dialogs** cho suspend/activate
- ✅ Lock/Unlock admin accounts (với loading spinner)
- ✅ Status badges
- ✅ Stats summary
- ✅ Create New Admin button
- ✅ Real-time data từ MongoDB

**Công nghệ:**
- React Hooks
- **SweetAlert2** (beautiful confirm/success/error modals)
- React Toastify
- i18next (16 notification keys)
- Lucide Icons (Lock, Unlock, Plus, Search, Loader2)
- Tailwind CSS (glassmorphism, animations)
- adminService.getAllAdmins, toggleAdminStatus APIs

---

#### **8. Create Admin Page** (`CreateAdmin.jsx`)
**Chức năng:**
- ✅ Form tạo admin mới (Email, Full Name, Phone, Province)
- ✅ Province dropdown (63 tỉnh thành VN)
- ✅ Validation (all fields required)
- ✅ Auto-generate temporary password
- ✅ **Success screen** hiển thị:
  - Temporary password
  - Copy to clipboard button
  - Important warning message
  - Back to List / Create Another buttons
- ✅ Loading state during creation
- ✅ Error handling

**Công nghệ:**
- React Hooks
- React Toastify
- i18next (18 translation keys)
- Lucide Icons (Mail, User, Phone, MapPin, Copy, Check)
- Tailwind CSS (form, gradient buttons, success screen)
- adminService.createAdmin API

---

### 🧩 **COMPONENTS**

#### **1. Sidebar Component** (`Sidebar.jsx`)
**Chức năng:**
- ✅ Navigation menu với icons
- ✅ Dashboard link
- ✅ User Management link
- ✅ Admin Management link (chỉ SuperAdmin)
- ✅ Active state highlighting
- ✅ Theme-aware styling
- ✅ LanguageSwitcher component ở bottom
- ✅ Version display

**Công nghệ:**
- React Router (Link, useLocation)
- i18next
- Lucide Icons (LayoutDashboard, Users, UserCog)
- Tailwind CSS (active states, hover effects)

---

#### **2. LanguageSwitcher Component** (`LanguageSwitcher.jsx`)
**Chức năng:**
- ✅ Toggle giữa tiếng Việt (🇻🇳) và English (🇬🇧)
- ✅ Flag buttons
- ✅ Active state với gradient background
- ✅ Auto-sync với MongoDB (update user.uiLanguage)
- ✅ Auto-sync với localStorage
- ✅ Real-time UI update

**Công nghệ:**
- React Hooks
- LanguageContext (changeLanguage function)
- Flag images (PNG)
- Tailwind CSS (gradient borders, hover effects)
- API call để update uiLanguage

---

### 🎨 **STYLING & DESIGN SYSTEM**

#### **Tailwind CSS Configuration**
```javascript
Custom Colors:
- cyan-primary: #5CF4F0 (accent color)
- cyan-secondary: #00B8D4
- dark-bg: #0A0A0A (dark theme background)

Custom Font:
- Montserrat (primary font family)
```

#### **Design Patterns sử dụng:**
- ✨ **Glassmorphism** (backdrop-blur, semi-transparent backgrounds)
- 🌈 **Gradient buttons** (from-blue-600 to-cyan-500)
- 🎯 **Gradient cards** (stats cards với gradient backgrounds)
- 🖼️ **Background overlays** (bg-gray-900/85 over images)
- 🔄 **Smooth transitions** (hover effects, color transitions)
- 📱 **Responsive design** (mobile-friendly)
- 🌓 **Dark/Light theme** (ThemeContext)

#### **Không sử dụng Bootstrap** ❌
- Project này **100% Tailwind CSS**
- Không có dependency Bootstrap trong package.json

---

### 🔐 **AUTHENTICATION & AUTHORIZATION**

**authService.js:**
- ✅ login(email, password) - JWT authentication
- ✅ logout() - Clear localStorage
- ✅ getCurrentUser() - Get admin từ localStorage
- ✅ changePassword(oldPassword, newPassword)
- ✅ isAuthenticated() - Check token validity

**adminService.js:**
- ✅ getProfile(adminId) - Get admin profile
- ✅ updateProfile(adminId, data) - Update profile
- ✅ getAllAdmins() - Get all admins (SuperAdmin only)
- ✅ toggleAdminStatus(adminId) - Suspend/Activate admin
- ✅ createAdmin(email, fullName, phoneNumber, province) - Create new admin

---

### 🌍 **INTERNATIONALIZATION (i18n)**

#### **Cấu trúc i18n:**
```javascript
i18n.js - Configuration file
  ├── Custom Backend Plugin (fetch translations từ MongoDB)
  └── Fallback language: 'en'

LanguageContext.js - State management
  ├── Load language từ user.uiLanguage
  ├── changeLanguage() - Update DB & localStorage
  └── Auto-sync across app
```

#### **Translation Categories:**
```javascript
1. sidebar (5 keys) - Dashboard, Actions, Admin/User Management
2. dashboard (20 keys) - Stats, charts, tabs
3. profile (16 keys) - Profile info, edit profile
4. editProfile (14 keys) - Form labels, buttons
5. changePassword (11 keys) - Password fields, validations
6. userList (20 keys) - Filters, table headers, actions
7. adminList (28 keys) - Filters, table, actions, status
8. createAdmin (18 keys) - Form, success screen
9. common (8 keys) - Search, Edit, Delete, Logout
10. notifications (16 keys) - Toast messages
11. alerts (11 keys) - SweetAlert dialogs

Total: 308 keys (154 vi + 154 en)
```

#### **Đặc điểm:**
- ✅ Login page: English only (không dịch)
- ✅ Sau login: Tất cả dịch theo user preference
- ✅ Notifications & Alerts: Fully translated
- ✅ Real-time language switching

---

### 🎭 **THEME SYSTEM**

**ThemeContext.js:**
- ✅ Dark/Light mode toggle
- ✅ Persist to localStorage
- ✅ Auto-apply to document.documentElement
- ✅ Consistent styling across all pages

**Theme Colors:**
```javascript
Dark Theme:
- Background: bg-gray-900/85
- Cards: bg-gray-800
- Text: text-white, text-gray-300
- Borders: border-gray-700
- Accent: cyan-primary (#5CF4F0)

Light Theme:
- Background: bg-gray-50/85
- Cards: bg-white
- Text: text-gray-900, text-gray-700
- Borders: border-gray-200
- Accent: blue-500
```

---

## 🔙 BACKEND - NODE.JS + EXPRESS.JS API

### ⚙️ **CÔNG NGHỆ SỬ DỤNG**

#### **Core Framework**
- 🟢 **Node.js** - JavaScript runtime
- 🚂 **Express.js 4.18.2** - Web framework
- 🔄 **CORS 2.8.5** - Cross-Origin Resource Sharing
- 📦 **Nodemon 2.0.20** - Auto-restart development server

#### **Database**
- 🍃 **MongoDB** - NoSQL database
- 🔌 **Mongoose 6.8.0** - ODM (Object Data Modeling)
- 📊 **3 Models**: Admin, AdminRequest, Translation

#### **Security & Authentication**
- 🔐 **JSON Web Token (JWT) 9.0.2** - Token-based auth
- 🔒 **bcryptjs 2.4.3** - Password hashing (SHA256)
- 🔑 **crypto (built-in Node.js)** - Password hashing

#### **Environment**
- 🌐 **dotenv 16.0.3** - Environment variables management

---

### 📊 **DATABASE MODELS**

#### **1. Admin Model** (`Admin.js`)
```javascript
Schema Fields:
- fullName: String (required)
- email: String (unique, lowercase, validated)
- password: String (hashed with SHA256)
- temporaryPassword: String (for first login)
- isFirstLogin: Boolean (default: true)
- isProfileCompleted: Boolean (default: false)
- role: enum ['admin', 'superadmin']
- accountStatus: enum ['active', 'inactive', 'suspended']
- theme: enum ['light', 'dark'] (default: 'light')
- uiLanguage: enum ['en', 'vi'] (default: 'vi')
- birthday: Date
- phoneNumber: String
- province: String
- timestamps: createdAt, updatedAt

Middleware:
- Pre-save hook: Auto-hash password với SHA256
```

#### **2. AdminRequest Model** (`AdminRequest.js`)
```javascript
Schema Fields:
- email: String (required, unique)
- fullName: String (required)
- phoneNumber: String
- province: String
- status: enum ['pending', 'approved', 'rejected']
- requestDate: Date (default: now)
- processedDate: Date
- processedBy: ObjectId (reference to Admin)
- temporaryPassword: String
```

#### **3. Translation Model** (`Translation.js`)
```javascript
Schema Fields:
- language: enum ['en', 'vi'] (required)
- category: String (required)
  (sidebar, dashboard, profile, notifications, alerts, etc.)
- key: String (required)
  (e.g., 'title', 'email', 'logoutMessage')
- value: String (required)
  (translated text)
- timestamps: createdAt, updatedAt

Indexes:
- Compound unique index: [language, category, key]
```

---

### 🛣️ **API ROUTES**

#### **Authentication Routes** (`authRoutes.js`)
```javascript
POST /api/auth/login
  - Body: { email, password }
  - Response: { token, admin, redirect }
  - Logic: Check credentials, generate JWT, detect first login

POST /api/auth/change-password
  - Headers: Authorization: Bearer <token>
  - Body: { oldPassword, newPassword }
  - Response: { message }
  - Logic: Verify old password, hash new password, save
```

#### **Admin Routes** (`adminRoutes.js`)
```javascript
GET /api/admin/profile/:adminId
  - Headers: Authorization: Bearer <token>
  - Response: { admin }
  - Logic: Get admin by ID

PUT /api/admin/update-profile/:adminId
  - Headers: Authorization: Bearer <token>
  - Body: { fullName, birthday, phoneNumber, province, uiLanguage }
  - Response: { admin }
  - Logic: Update admin profile

GET /api/admin/all
  - Headers: Authorization: Bearer <token>
  - Response: { admins }
  - Logic: Get all admins (SuperAdmin only)

PUT /api/admin/toggle-status/:adminId
  - Headers: Authorization: Bearer <token>
  - Response: { admin }
  - Logic: Toggle accountStatus (active ↔ suspended)

POST /api/admin/create
  - Headers: Authorization: Bearer <token>
  - Body: { email, fullName, phoneNumber, province }
  - Response: { admin, temporaryPassword }
  - Logic: Create admin với auto-generated password
```

#### **Translation Routes** (`translationRoutes.js`)
```javascript
GET /api/translations/:language
  - Response: { translations: {...} }
  - Logic: Fetch all translations by language
  - Format: Nested object { category: { key: value } }
```

---

### 🔧 **MIDDLEWARES**

#### **authMiddleware.js**
```javascript
verifyToken(req, res, next)
  - Verify JWT token từ header
  - Attach admin data to req.admin
  - Return 401 if invalid/expired token
```

---

### 🌱 **SEED SCRIPTS**

#### **1. createSuperAdmin.js**
```javascript
Purpose: Tạo SuperAdmin account ban đầu
Credentials:
  - Email: superadmin@gestpipe.com
  - Password: SuperAdmin@123
  - Role: superadmin
  - Status: active
  - Theme: dark
  - Language: vi

Run: npm run seed:superadmin
```

#### **2. seedTranslations.js**
```javascript
Purpose: Seed 308 translation keys vào MongoDB
Categories: 11 categories
Languages: Vietnamese (vi) + English (en)

Run: node src/seeds/seedTranslations.js
```

---

### 🔐 **SECURITY FEATURES**

1. ✅ **JWT Authentication** - Token-based auth với expiration
2. ✅ **Password Hashing** - SHA256 hash cho tất cả passwords
3. ✅ **Temporary Password** - First login force change password
4. ✅ **Protected Routes** - authMiddleware verify token
5. ✅ **CORS Configuration** - Allow frontend origin only
6. ✅ **Email Validation** - Regex validation cho email format
7. ✅ **Role-based Access** - SuperAdmin/Admin permissions

---

## 🎯 **TÍNH NĂNG ĐÃ HOÀN THÀNH**

### ✅ **Authentication & Authorization**
- [x] Login với JWT
- [x] Logout
- [x] Change password (first login + manual)
- [x] Protected routes (authMiddleware)
- [x] Role-based access (SuperAdmin/Admin)

### ✅ **User Management**
- [x] View user list (mock data)
- [x] Search users
- [x] Filter users (status)
- [x] Lock/Unlock users
- [x] User statistics

### ✅ **Admin Management** (SuperAdmin Only)
- [x] View admin list (MongoDB)
- [x] Search admins
- [x] Filter admins (status)
- [x] Suspend/Activate admins (với SweetAlert confirm)
- [x] Create new admin
- [x] Auto-generate temporary password
- [x] Admin statistics

### ✅ **Profile Management**
- [x] View profile
- [x] Edit profile (name, phone, birthday, province)
- [x] Update profile API
- [x] Auto-save to localStorage

### ✅ **Internationalization (i18n)**
- [x] Vietnamese + English
- [x] 308 translation keys
- [x] MongoDB-backed translations
- [x] Real-time language switching
- [x] User-specific language preference
- [x] Translated notifications & alerts

### ✅ **Theme System**
- [x] Dark/Light mode
- [x] Persistent theme (localStorage)
- [x] Theme toggle in header
- [x] Consistent styling across pages

### ✅ **UI/UX Features**
- [x] Responsive design
- [x] Toast notifications (React Toastify)
- [x] Beautiful modal dialogs (SweetAlert2)
- [x] Loading states (spinners)
- [x] Gradient backgrounds
- [x] Glassmorphism effects
- [x] Hover animations
- [x] Status badges
- [x] Icon library (Lucide)

### ✅ **Dashboard**
- [x] User statistics cards
- [x] 3 tabs (User Overview, Actions, Version)
- [x] Mock chart data (ready for integration)

---

## 📦 **PACKAGE DEPENDENCIES SUMMARY**

### **Frontend (React)**
```json
Production:
- react: 18.2.0
- react-dom: 18.2.0
- react-router-dom: 6.30.1
- axios: 1.12.2
- i18next: 25.6.0
- react-i18next: 16.1.4
- lucide-react: 0.546.0
- react-toastify: 11.0.5
- sweetalert2: 11.26.3
- web-vitals: 2.1.4

Dev Dependencies:
- react-scripts: 5.0.1
- tailwindcss: 4.1.15 (CHÍNH)
- postcss: 8.5.6
- autoprefixer: 10.4.21
- @testing-library/react: 16.3.0
- @testing-library/jest-dom: 6.9.1
```

### **Backend (Node.js)**
```json
Production:
- express: 4.18.2
- mongoose: 6.8.0
- jsonwebtoken: 9.0.2
- bcryptjs: 2.4.3
- cors: 2.8.5
- dotenv: 16.0.3

Dev Dependencies:
- nodemon: 2.0.20
```

---

## 🚀 **DEVELOPMENT WORKFLOW**

### **Start Development Servers:**
```bash
# Backend (Port 5000)
cd backend
npm start

# Frontend (Port 3000)
cd frontend
npm start
```

### **Seed Database:**
```bash
# Create SuperAdmin
cd backend
npm run seed:superadmin

# Seed Translations
cd backend
node src/seeds/seedTranslations.js
```

### **Build for Production:**
```bash
cd frontend
npm run build
```

---

## 📊 **PROJECT STATISTICS**

- **Total Files**: 70+ files
- **Total Pages**: 8 pages
- **Total Components**: 2 components (Sidebar, LanguageSwitcher)
- **Total API Routes**: 9 routes
- **Total Models**: 3 models
- **Total Translation Keys**: 308 keys (154 vi + 154 en)
- **Lines of Code**: ~5,000+ LOC (estimated)

---

## 🎨 **UI/UX HIGHLIGHTS**

### **Tailwind CSS Features Used:**
- ✅ Utility classes (flex, grid, padding, margin, etc.)
- ✅ Responsive breakpoints (sm:, md:, lg:, xl:)
- ✅ Dark mode variants (dark:)
- ✅ Hover states (hover:)
- ✅ Gradients (bg-gradient-to-r)
- ✅ Backdrop blur (backdrop-blur-sm)
- ✅ Transitions (transition-all, transition-colors)
- ✅ Animations (animate-spin for loaders)
- ✅ Custom colors (cyan-primary, dark-bg)
- ✅ Shadow effects (shadow-lg, shadow-cyan-500/50)

### **No Bootstrap** ❌
- **100% Tailwind CSS** - Không sử dụng Bootstrap trong toàn bộ project
- Custom components với Tailwind utility classes
- Responsive grid system của Tailwind

---

## 🔮 **FUTURE ENHANCEMENTS (Có thể mở rộng)**

- [ ] Real-time notifications với WebSocket
- [ ] User activity logs
- [ ] Advanced analytics với charts (Chart.js/Recharts)
- [ ] File upload (avatar images)
- [ ] Email notifications
- [ ] Password reset via email
- [ ] Two-factor authentication (2FA)
- [ ] Admin audit logs
- [ ] Export data to CSV/Excel
- [ ] Advanced search filters
- [ ] Pagination for large datasets

---

## 📝 **NOTES**

- **Database**: MongoDB (cloud-hosted recommended)
- **Authentication**: JWT-based (token in localStorage)
- **Styling**: 100% Tailwind CSS (no Bootstrap)
- **Icons**: Lucide React (modern, lightweight)
- **Notifications**: React Toastify + SweetAlert2
- **i18n**: MongoDB-backed translations (dynamic)

---

## 👨‍💻 **AUTHOR**

**Project**: GestPipe Admin Dashboard  
**Repository**: SEP490_08_GestPipe_WebApplication  
**Branch**: master  
**Last Updated**: October 27, 2025

---

## 📄 **LICENSE**

ISC

---

**🎉 Project Summary Complete!**
