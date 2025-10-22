require('dotenv').config();
const mongoose = require('mongoose');
const Translation = require('../models/Translation');

// Sample translations - You will expand this based on Figma
const translations = [
  // Login page
  { language: 'vi', category: 'login', key: 'title', value: 'Đăng nhập' },
  { language: 'vi', category: 'login', key: 'email', value: 'Email' },
  { language: 'vi', category: 'login', key: 'password', value: 'Mật khẩu' },
  { language: 'vi', category: 'login', key: 'submit', value: 'Đăng nhập' },
  
  { language: 'en', category: 'login', key: 'title', value: 'Login' },
  { language: 'en', category: 'login', key: 'email', value: 'Email' },
  { language: 'en', category: 'login', key: 'password', value: 'Password' },
  { language: 'en', category: 'login', key: 'submit', value: 'Login' },

  // Sidebar
  { language: 'vi', category: 'sidebar', key: 'dashboard', value: 'Tổng quan' },
  { language: 'vi', category: 'sidebar', key: 'actions', value: 'Thao tác' },
  { language: 'vi', category: 'sidebar', key: 'adminManagement', value: 'Quản trị viên' },
  { language: 'vi', category: 'sidebar', key: 'userManagement', value: 'Người dùng' },
  { language: 'vi', category: 'sidebar', key: 'version', value: 'Phiên bản' },

  { language: 'en', category: 'sidebar', key: 'dashboard', value: 'Dashboard' },
  { language: 'en', category: 'sidebar', key: 'actions', value: 'Actions' },
  { language: 'en', category: 'sidebar', key: 'adminManagement', value: 'Admin Management' },
  { language: 'en', category: 'sidebar', key: 'userManagement', value: 'User Management' },
  { language: 'en', category: 'sidebar', key: 'version', value: 'Version' },

  // Dashboard - Tabs
  { language: 'vi', category: 'dashboard', key: 'title', value: 'Tổng quan' },
  { language: 'vi', category: 'dashboard', key: 'userOverview', value: 'Tổng quan người dùng' },
  { language: 'vi', category: 'dashboard', key: 'actions', value: 'Thao tác' },
  { language: 'vi', category: 'dashboard', key: 'version', value: 'Phiên bản' },
  
  { language: 'en', category: 'dashboard', key: 'title', value: 'Dashboard' },
  { language: 'en', category: 'dashboard', key: 'userOverview', value: 'User Overview' },
  { language: 'en', category: 'dashboard', key: 'actions', value: 'Actions' },
  { language: 'en', category: 'dashboard', key: 'version', value: 'Version' },

  // Dashboard - Stats Cards
  { language: 'vi', category: 'dashboard', key: 'totalUsers', value: 'Tổng số người dùng' },
  { language: 'vi', category: 'dashboard', key: 'comparedLastMonth', value: '+12% Compared to last month' },
  { language: 'vi', category: 'dashboard', key: 'onlineUsers', value: 'Đang trực tuyến' },
  { language: 'vi', category: 'dashboard', key: 'accuracyRate', value: 'Tỷ lệ chính xác' },
  { language: 'vi', category: 'dashboard', key: 'customActions', value: 'Lượt tùy chỉnh thao tác' },
  { language: 'vi', category: 'dashboard', key: 'todayCount', value: '+56 Today' },

  { language: 'en', category: 'dashboard', key: 'totalUsers', value: 'Total Users' },
  { language: 'en', category: 'dashboard', key: 'comparedLastMonth', value: '+12% Compared to last month' },
  { language: 'en', category: 'dashboard', key: 'onlineUsers', value: 'Online Users' },
  { language: 'en', category: 'dashboard', key: 'accuracyRate', value: 'Accuracy Rate' },
  { language: 'en', category: 'dashboard', key: 'customActions', value: 'Custom Actions' },
  { language: 'en', category: 'dashboard', key: 'todayCount', value: '+56 Today' },

  // Dashboard - Charts
  { language: 'vi', category: 'dashboard', key: 'gender', value: 'Giới tính' },
  { language: 'vi', category: 'dashboard', key: 'male', value: 'Nam' },
  { language: 'vi', category: 'dashboard', key: 'female', value: 'Nữ' },
  { language: 'vi', category: 'dashboard', key: 'other', value: 'Khác' },
  
  { language: 'en', category: 'dashboard', key: 'gender', value: 'Gender' },
  { language: 'en', category: 'dashboard', key: 'male', value: 'Male' },
  { language: 'en', category: 'dashboard', key: 'female', value: 'Female' },
  { language: 'en', category: 'dashboard', key: 'other', value: 'Other' },

  { language: 'vi', category: 'dashboard', key: 'occupation', value: 'Nghề nghiệp' },
  { language: 'vi', category: 'dashboard', key: 'teacher', value: 'Giáo viên' },
  { language: 'vi', category: 'dashboard', key: 'engineer', value: 'Kỹ sư' },
  { language: 'vi', category: 'dashboard', key: 'student', value: 'Sinh viên' },
  
  { language: 'en', category: 'dashboard', key: 'occupation', value: 'Occupation' },
  { language: 'en', category: 'dashboard', key: 'teacher', value: 'Teacher' },
  { language: 'en', category: 'dashboard', key: 'engineer', value: 'Engineer' },
  { language: 'en', category: 'dashboard', key: 'student', value: 'Student' },

  { language: 'vi', category: 'dashboard', key: 'age', value: 'Tuổi' },
  { language: 'vi', category: 'dashboard', key: 'age16_24', value: '16 - 24' },
  { language: 'vi', category: 'dashboard', key: 'age25_34', value: '25 - 34' },
  { language: 'vi', category: 'dashboard', key: 'age35_50', value: '35 - 50' },
  { language: 'vi', category: 'dashboard', key: 'age50plus', value: '50+' },
  
  { language: 'en', category: 'dashboard', key: 'age', value: 'Age' },
  { language: 'en', category: 'dashboard', key: 'age16_24', value: '16 - 24' },
  { language: 'en', category: 'dashboard', key: 'age25_34', value: '25 - 34' },
  { language: 'en', category: 'dashboard', key: 'age35_50', value: '35 - 50' },
  { language: 'en', category: 'dashboard', key: 'age50plus', value: '50+' },

  { language: 'vi', category: 'dashboard', key: 'cities', value: 'Thành phố khác' },
  { language: 'vi', category: 'dashboard', key: 'hoChiMinh', value: 'Hồ Chí Minh' },
  { language: 'vi', category: 'dashboard', key: 'haNoi', value: 'Hà Nội' },
  { language: 'vi', category: 'dashboard', key: 'canTho', value: 'Cần Thơ' },
  { language: 'vi', category: 'dashboard', key: 'otherCity', value: 'Thành phố khác' },
  
  { language: 'en', category: 'dashboard', key: 'cities', value: 'Cities' },
  { language: 'en', category: 'dashboard', key: 'hoChiMinh', value: 'Ho Chi Minh' },
  { language: 'en', category: 'dashboard', key: 'haNoi', value: 'Ha Noi' },
  { language: 'en', category: 'dashboard', key: 'canTho', value: 'Can Tho' },
  { language: 'en', category: 'dashboard', key: 'otherCity', value: 'Other City' },

  // Profile
  { language: 'vi', category: 'profile', key: 'title', value: 'Hồ sơ' },
  { language: 'vi', category: 'profile', key: 'name', value: 'Họ và tên' },
  { language: 'vi', category: 'profile', key: 'email', value: 'Email' },
  { language: 'vi', category: 'profile', key: 'phone', value: 'Số điện thoại' },
  { language: 'vi', category: 'profile', key: 'address', value: 'Địa chỉ' },
  { language: 'vi', category: 'profile', key: 'role', value: 'Vai trò' },
  { language: 'vi', category: 'profile', key: 'dateOfBirth', value: 'Ngày sinh' },
  { language: 'vi', category: 'profile', key: 'createdAt', value: 'Ngày tạo' },
  { language: 'vi', category: 'profile', key: 'changePassword', value: 'Đổi mật khẩu' },
  { language: 'vi', category: 'profile', key: 'edit', value: 'Chỉnh sửa' },

  { language: 'en', category: 'profile', key: 'title', value: 'Profile' },
  { language: 'en', category: 'profile', key: 'name', value: 'Full Name' },
  { language: 'en', category: 'profile', key: 'email', value: 'Email' },
  { language: 'en', category: 'profile', key: 'phone', value: 'Phone Number' },
  { language: 'en', category: 'profile', key: 'address', value: 'Address' },
  { language: 'en', category: 'profile', key: 'role', value: 'Role' },
  { language: 'en', category: 'profile', key: 'dateOfBirth', value: 'Date of Birth' },
  { language: 'en', category: 'profile', key: 'createdAt', value: 'Created At' },
  { language: 'en', category: 'profile', key: 'changePassword', value: 'Change Password' },
  { language: 'en', category: 'profile', key: 'edit', value: 'Edit' },

  // Change Password
  { language: 'vi', category: 'changePassword', key: 'title', value: 'Đổi mật khẩu' },
  { language: 'vi', category: 'changePassword', key: 'oldPassword', value: 'Mật khẩu cũ' },
  { language: 'vi', category: 'changePassword', key: 'newPassword', value: 'Mật khẩu mới' },
  { language: 'vi', category: 'changePassword', key: 'confirmPassword', value: 'Nhập lại mật khẩu mới' },
  { language: 'vi', category: 'changePassword', key: 'submit', value: 'Đổi mật khẩu' },

  { language: 'en', category: 'changePassword', key: 'title', value: 'Change Password' },
  { language: 'en', category: 'changePassword', key: 'oldPassword', value: 'Old Password' },
  { language: 'en', category: 'changePassword', key: 'newPassword', value: 'New Password' },
  { language: 'en', category: 'changePassword', key: 'confirmPassword', value: 'Re-enter New Password' },
  { language: 'en', category: 'changePassword', key: 'submit', value: 'Change Password' },

  // Edit Profile
  { language: 'vi', category: 'editProfile', key: 'title', value: 'Chỉnh sửa hồ sơ' },
  { language: 'vi', category: 'editProfile', key: 'name', value: 'Họ và tên' },
  { language: 'vi', category: 'editProfile', key: 'birthday', value: 'Ngày sinh' },
  { language: 'vi', category: 'editProfile', key: 'email', value: 'Email' },
  { language: 'vi', category: 'editProfile', key: 'phone', value: 'Số điện thoại' },
  { language: 'vi', category: 'editProfile', key: 'province', value: 'Tỉnh/Thành phố' },
  { language: 'vi', category: 'editProfile', key: 'save', value: 'Lưu thay đổi' },
  { language: 'vi', category: 'editProfile', key: 'cancel', value: 'Hủy' },

  { language: 'en', category: 'editProfile', key: 'title', value: 'Edit Profile' },
  { language: 'en', category: 'editProfile', key: 'name', value: 'Full Name' },
  { language: 'en', category: 'editProfile', key: 'birthday', value: 'Birthday' },
  { language: 'en', category: 'editProfile', key: 'email', value: 'Email' },
  { language: 'en', category: 'editProfile', key: 'phone', value: 'Phone Number' },
  { language: 'en', category: 'editProfile', key: 'province', value: 'Province/City' },
  { language: 'en', category: 'editProfile', key: 'save', value: 'Save Changes' },
  { language: 'en', category: 'editProfile', key: 'cancel', value: 'Cancel' },

  // User List
  { language: 'vi', category: 'userList', key: 'title', value: 'Danh sách người dùng' },
  { language: 'vi', category: 'userList', key: 'gesturesControl', value: 'Điều khiển thao tác' },
  { language: 'vi', category: 'userList', key: 'user', value: 'Người dùng' },
  { language: 'vi', category: 'userList', key: 'version', value: 'Phiên bản' },
  { language: 'vi', category: 'userList', key: 'allUser', value: 'Tất cả người dùng' },
  { language: 'vi', category: 'userList', key: 'online', value: 'Trực tuyến' },
  { language: 'vi', category: 'userList', key: 'offline', value: 'Ngoại tuyến' },
  { language: 'vi', category: 'userList', key: 'locked', value: 'Đã khóa' },
  { language: 'vi', category: 'userList', key: 'inactive', value: 'Không hoạt động' },
  { language: 'vi', category: 'userList', key: 'searchUser', value: 'Tìm kiếm người dùng...' },
  { language: 'vi', category: 'userList', key: 'id', value: 'ID' },
  { language: 'vi', category: 'userList', key: 'name', value: 'Tên' },
  { language: 'vi', category: 'userList', key: 'occupation', value: 'Nghề nghiệp' },
  { language: 'vi', category: 'userList', key: 'createDate', value: 'Ngày tạo' },
  { language: 'vi', category: 'userList', key: 'status', value: 'Trạng thái' },
  { language: 'vi', category: 'userList', key: 'toggle', value: 'Chuyển đổi' },
  { language: 'vi', category: 'userList', key: 'noUsers', value: 'Không tìm thấy người dùng' },
  { language: 'vi', category: 'userList', key: 'loading', value: 'Đang tải...' },

  { language: 'en', category: 'userList', key: 'title', value: 'User List' },
  { language: 'en', category: 'userList', key: 'gesturesControl', value: 'Gestures Control' },
  { language: 'en', category: 'userList', key: 'user', value: 'User' },
  { language: 'en', category: 'userList', key: 'version', value: 'Version' },
  { language: 'en', category: 'userList', key: 'allUser', value: 'All User' },
  { language: 'en', category: 'userList', key: 'online', value: 'Online' },
  { language: 'en', category: 'userList', key: 'offline', value: 'Offline' },
  { language: 'en', category: 'userList', key: 'locked', value: 'Locked' },
  { language: 'en', category: 'userList', key: 'inactive', value: 'Inactive' },
  { language: 'en', category: 'userList', key: 'searchUser', value: 'Search User...' },
  { language: 'en', category: 'userList', key: 'id', value: 'ID' },
  { language: 'en', category: 'userList', key: 'name', value: 'Name' },
  { language: 'en', category: 'userList', key: 'occupation', value: 'Occupation' },
  { language: 'en', category: 'userList', key: 'createDate', value: 'Create Date' },
  { language: 'en', category: 'userList', key: 'status', value: 'Status' },
  { language: 'en', category: 'userList', key: 'toggle', value: 'Toggle' },
  { language: 'en', category: 'userList', key: 'noUsers', value: 'No users found' },
  { language: 'en', category: 'userList', key: 'loading', value: 'Loading...' },

  // Common
  { language: 'vi', category: 'common', key: 'save', value: 'Lưu' },
  { language: 'vi', category: 'common', key: 'cancel', value: 'Hủy' },
  { language: 'vi', category: 'common', key: 'delete', value: 'Xóa' },
  { language: 'vi', category: 'common', key: 'edit', value: 'Sửa' },
  { language: 'vi', category: 'common', key: 'search', value: 'Tìm kiếm' },
  { language: 'vi', category: 'common', key: 'logout', value: 'Đăng xuất' },

  { language: 'en', category: 'common', key: 'save', value: 'Save' },
  { language: 'en', category: 'common', key: 'cancel', value: 'Cancel' },
  { language: 'en', category: 'common', key: 'delete', value: 'Delete' },
  { language: 'en', category: 'common', key: 'edit', value: 'Edit' },
  { language: 'en', category: 'common', key: 'search', value: 'Search' },
  { language: 'en', category: 'common', key: 'logout', value: 'Logout' },
];

const seedTranslations = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected');

    // Clear existing translations
    await Translation.deleteMany({});
    console.log('Cleared existing translations');

    // Insert new translations
    await Translation.insertMany(translations);
    console.log('Translations seeded successfully!');
    console.log(`Total translations: ${translations.length}`);

    process.exit(0);
  } catch (error) {
    console.error('Error seeding translations:', error);
    process.exit(1);
  }
};

seedTranslations();
