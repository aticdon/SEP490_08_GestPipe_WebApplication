require('dotenv').config();
const mongoose = require('mongoose');
const Translation = require('../models/Translation');

// Sample translations - You will expand this based on Figma
const translations = [
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
  { language: 'vi', category: 'changePassword', key: 'firstLoginWarning', value: 'Đây là lần đăng nhập đầu tiên. Bạn phải đổi mật khẩu để tiếp tục.' },

  { language: 'en', category: 'changePassword', key: 'title', value: 'Change Password' },
  { language: 'en', category: 'changePassword', key: 'oldPassword', value: 'Old Password' },
  { language: 'en', category: 'changePassword', key: 'newPassword', value: 'New Password' },
  { language: 'en', category: 'changePassword', key: 'confirmPassword', value: 'Re-enter New Password' },
  { language: 'en', category: 'changePassword', key: 'submit', value: 'Change Password' },
  { language: 'en', category: 'changePassword', key: 'firstLoginWarning', value: 'This is your first login. You must change your password to continue.' },

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

  // Admin List
  { language: 'vi', category: 'adminList', key: 'title', value: 'Danh sách quản trị viên' },
  { language: 'vi', category: 'adminList', key: 'createNew', value: 'Tạo mới' },
  { language: 'vi', category: 'adminList', key: 'allAdmins', value: 'Tất cả quản trị viên' },
  { language: 'vi', category: 'adminList', key: 'active', value: 'Hoạt động' },
  { language: 'vi', category: 'adminList', key: 'inactive', value: 'Chưa kích hoạt' },
  { language: 'vi', category: 'adminList', key: 'suspended', value: 'Đã khóa' },
  { language: 'vi', category: 'adminList', key: 'searchAdmin', value: 'Tìm kiếm quản trị viên...' },
  { language: 'vi', category: 'adminList', key: 'name', value: 'Tên' },
  { language: 'vi', category: 'adminList', key: 'email', value: 'Email' },
  { language: 'vi', category: 'adminList', key: 'phone', value: 'Số điện thoại' },
  { language: 'vi', category: 'adminList', key: 'province', value: 'Tỉnh/Thành phố' },
  { language: 'vi', category: 'adminList', key: 'createDate', value: 'Ngày tạo' },
  { language: 'vi', category: 'adminList', key: 'status', value: 'Trạng thái' },
  { language: 'vi', category: 'adminList', key: 'action', value: 'Hành động' },
  { language: 'vi', category: 'adminList', key: 'noAdmins', value: 'Không tìm thấy quản trị viên' },
  { language: 'vi', category: 'adminList', key: 'loading', value: 'Đang tải...' },
  { language: 'vi', category: 'adminList', key: 'suspend', value: 'Khóa tài khoản' },
  { language: 'vi', category: 'adminList', key: 'activate', value: 'Kích hoạt' },
  { language: 'vi', category: 'adminList', key: 'confirmSuspend', value: 'Khóa tài khoản?' },
  { language: 'vi', category: 'adminList', key: 'confirmActivate', value: 'Kích hoạt tài khoản?' },
  { language: 'vi', category: 'adminList', key: 'suspendMessage', value: 'Bạn có chắc muốn khóa tài khoản quản trị viên này?' },
  { language: 'vi', category: 'adminList', key: 'activateMessage', value: 'Bạn có chắc muốn kích hoạt tài khoản quản trị viên này?' },
  { language: 'vi', category: 'adminList', key: 'yes', value: 'Đồng ý' },
  { language: 'vi', category: 'adminList', key: 'no', value: 'Hủy' },
  { language: 'vi', category: 'adminList', key: 'success', value: 'Thành công!' },
  { language: 'vi', category: 'adminList', key: 'error', value: 'Lỗi!' },

  { language: 'en', category: 'adminList', key: 'title', value: 'Admin List' },
  { language: 'en', category: 'adminList', key: 'createNew', value: 'Create New' },
  { language: 'en', category: 'adminList', key: 'allAdmins', value: 'All Admins' },
  { language: 'en', category: 'adminList', key: 'active', value: 'Active' },
  { language: 'en', category: 'adminList', key: 'inactive', value: 'Inactive' },
  { language: 'en', category: 'adminList', key: 'suspended', value: 'Suspended' },
  { language: 'en', category: 'adminList', key: 'searchAdmin', value: 'Search admin...' },
  { language: 'en', category: 'adminList', key: 'name', value: 'Name' },
  { language: 'en', category: 'adminList', key: 'email', value: 'Email' },
  { language: 'en', category: 'adminList', key: 'phone', value: 'Phone' },
  { language: 'en', category: 'adminList', key: 'province', value: 'Province/City' },
  { language: 'en', category: 'adminList', key: 'createDate', value: 'Create Date' },
  { language: 'en', category: 'adminList', key: 'status', value: 'Status' },
  { language: 'en', category: 'adminList', key: 'action', value: 'Action' },
  { language: 'en', category: 'adminList', key: 'noAdmins', value: 'No admins found' },
  { language: 'en', category: 'adminList', key: 'loading', value: 'Loading...' },
  { language: 'en', category: 'adminList', key: 'suspend', value: 'Suspend' },
  { language: 'en', category: 'adminList', key: 'activate', value: 'Activate' },
  { language: 'en', category: 'adminList', key: 'confirmSuspend', value: 'Suspend Account?' },
  { language: 'en', category: 'adminList', key: 'confirmActivate', value: 'Activate Account?' },
  { language: 'en', category: 'adminList', key: 'suspendMessage', value: 'Are you sure you want to suspend this admin account?' },
  { language: 'en', category: 'adminList', key: 'activateMessage', value: 'Are you sure you want to activate this admin account?' },
  { language: 'en', category: 'adminList', key: 'yes', value: 'Yes' },
  { language: 'en', category: 'adminList', key: 'no', value: 'Cancel' },
  { language: 'en', category: 'adminList', key: 'success', value: 'Success!' },
  { language: 'en', category: 'adminList', key: 'error', value: 'Error!' },

  // Create Admin
  { language: 'vi', category: 'createAdmin', key: 'title', value: 'Tạo quản trị viên mới' },
  { language: 'vi', category: 'createAdmin', key: 'email', value: 'Email' },
  { language: 'vi', category: 'createAdmin', key: 'fullName', value: 'Họ và tên' },
  { language: 'vi', category: 'createAdmin', key: 'phoneNumber', value: 'Số điện thoại' },
  { language: 'vi', category: 'createAdmin', key: 'province', value: 'Tỉnh/Thành phố' },
  { language: 'vi', category: 'createAdmin', key: 'selectProvince', value: 'Chọn tỉnh/thành phố' },
  { language: 'vi', category: 'createAdmin', key: 'createButton', value: 'Tạo tài khoản' },
  { language: 'vi', category: 'createAdmin', key: 'creating', value: 'Đang tạo...' },
  { language: 'vi', category: 'createAdmin', key: 'successTitle', value: 'Tạo thành công!' },
  { language: 'vi', category: 'createAdmin', key: 'accountCreated', value: 'Tài khoản quản trị viên đã được tạo' },
  { language: 'vi', category: 'createAdmin', key: 'tempPassword', value: 'Mật khẩu tạm thời' },
  { language: 'vi', category: 'createAdmin', key: 'copyPassword', value: 'Sao chép mật khẩu' },
  { language: 'vi', category: 'createAdmin', key: 'copied', value: 'Đã sao chép!' },
  { language: 'vi', category: 'createAdmin', key: 'important', value: 'Quan trọng' },
  { language: 'vi', category: 'createAdmin', key: 'importantNote', value: 'Hãy sao chép mật khẩu này và gửi cho quản trị viên mới. Mật khẩu sẽ không hiển thị lại!' },
  { language: 'vi', category: 'createAdmin', key: 'createAnother', value: 'Tạo quản trị viên khác' },
  { language: 'vi', category: 'createAdmin', key: 'backToList', value: 'Quay lại danh sách' },
  { language: 'vi', category: 'createAdmin', key: 'fillAllFields', value: 'Vui lòng điền đầy đủ thông tin bắt buộc' },

  { language: 'en', category: 'createAdmin', key: 'title', value: 'Create New Admin' },
  { language: 'en', category: 'createAdmin', key: 'email', value: 'Email' },
  { language: 'en', category: 'createAdmin', key: 'fullName', value: 'Full Name' },
  { language: 'en', category: 'createAdmin', key: 'phoneNumber', value: 'Phone Number' },
  { language: 'en', category: 'createAdmin', key: 'province', value: 'Province/City' },
  { language: 'en', category: 'createAdmin', key: 'selectProvince', value: 'Select province/city' },
  { language: 'en', category: 'createAdmin', key: 'createButton', value: 'Create Account' },
  { language: 'en', category: 'createAdmin', key: 'creating', value: 'Creating...' },
  { language: 'en', category: 'createAdmin', key: 'successTitle', value: 'Success!' },
  { language: 'en', category: 'createAdmin', key: 'accountCreated', value: 'Admin account has been created' },
  { language: 'en', category: 'createAdmin', key: 'tempPassword', value: 'Temporary Password' },
  { language: 'en', category: 'createAdmin', key: 'copyPassword', value: 'Copy Password' },
  { language: 'en', category: 'createAdmin', key: 'copied', value: 'Copied!' },
  { language: 'en', category: 'createAdmin', key: 'important', value: 'Important' },
  { language: 'en', category: 'createAdmin', key: 'importantNote', value: 'Please copy this password and send it to the new admin. It will not be shown again!' },
  { language: 'en', category: 'createAdmin', key: 'createAnother', value: 'Create Another Admin' },
  { language: 'en', category: 'createAdmin', key: 'backToList', value: 'Back to List' },
  { language: 'en', category: 'createAdmin', key: 'fillAllFields', value: 'Please fill in all required fields' },

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

  // Notifications - Toast Messages
  { language: 'vi', category: 'notifications', key: 'logoutMessage', value: 'Đang đăng xuất... Hẹn gặp lại! 👋' },
  { language: 'vi', category: 'notifications', key: 'profileUpdated', value: 'Cập nhật hồ sơ thành công! 🎉' },
  { language: 'vi', category: 'notifications', key: 'passwordChanged', value: 'Đổi mật khẩu thành công! 🎉' },
  { language: 'vi', category: 'notifications', key: 'adminCreated', value: 'Tạo tài khoản quản trị viên thành công! 🎉' },
  { language: 'vi', category: 'notifications', key: 'passwordCopied', value: 'Đã sao chép mật khẩu! 📋' },
  { language: 'vi', category: 'notifications', key: 'adminActivated', value: 'Kích hoạt tài khoản quản trị viên thành công!' },
  { language: 'vi', category: 'notifications', key: 'adminSuspended', value: 'Tạm khóa tài khoản quản trị viên thành công!' },
  { language: 'vi', category: 'notifications', key: 'userStatusUpdated', value: 'Cập nhật trạng thái người dùng thành công!' },

  { language: 'en', category: 'notifications', key: 'logoutMessage', value: 'Logging out... See you soon! 👋' },
  { language: 'en', category: 'notifications', key: 'profileUpdated', value: 'Profile updated successfully! 🎉' },
  { language: 'en', category: 'notifications', key: 'passwordChanged', value: 'Password changed successfully! 🎉' },
  { language: 'en', category: 'notifications', key: 'adminCreated', value: 'Admin account created successfully! 🎉' },
  { language: 'en', category: 'notifications', key: 'passwordCopied', value: 'Password copied to clipboard! 📋' },
  { language: 'en', category: 'notifications', key: 'adminActivated', value: 'Admin account activated successfully!' },
  { language: 'en', category: 'notifications', key: 'adminSuspended', value: 'Admin account suspended successfully!' },
  { language: 'en', category: 'notifications', key: 'userStatusUpdated', value: 'User status updated successfully!' },

  // Notifications - Error Messages
  { language: 'vi', category: 'notifications', key: 'nameRequired', value: 'Tên là bắt buộc!' },
  { language: 'vi', category: 'notifications', key: 'fillAllFields', value: 'Vui lòng điền đầy đủ các trường' },
  { language: 'vi', category: 'notifications', key: 'passwordMinLength', value: 'Mật khẩu mới phải có ít nhất 6 ký tự' },
  { language: 'vi', category: 'notifications', key: 'passwordsNotMatch', value: 'Mật khẩu mới không khớp' },
  { language: 'vi', category: 'notifications', key: 'failedLoadProfile', value: 'Không thể tải hồ sơ' },
  { language: 'vi', category: 'notifications', key: 'failedLoadAdmins', value: 'Không thể tải danh sách quản trị viên' },
  { language: 'vi', category: 'notifications', key: 'failedUpdateProfile', value: 'Cập nhật hồ sơ thất bại' },
  { language: 'vi', category: 'notifications', key: 'failedChangePassword', value: 'Đổi mật khẩu thất bại' },
  { language: 'vi', category: 'notifications', key: 'failedCreateAdmin', value: 'Tạo quản trị viên thất bại' },
  { language: 'vi', category: 'notifications', key: 'failedUpdateStatus', value: 'Cập nhật trạng thái thất bại' },
  { language: 'vi', category: 'notifications', key: 'fillRequiredFields', value: 'Vui lòng điền đầy đủ các trường bắt buộc' },

  { language: 'en', category: 'notifications', key: 'nameRequired', value: 'Name is required!' },
  { language: 'en', category: 'notifications', key: 'fillAllFields', value: 'Please fill in all fields' },
  { language: 'en', category: 'notifications', key: 'passwordMinLength', value: 'New password must be at least 6 characters' },
  { language: 'en', category: 'notifications', key: 'passwordsNotMatch', value: 'New passwords do not match' },
  { language: 'en', category: 'notifications', key: 'failedLoadProfile', value: 'Failed to load profile' },
  { language: 'en', category: 'notifications', key: 'failedLoadAdmins', value: 'Failed to load admins' },
  { language: 'en', category: 'notifications', key: 'failedUpdateProfile', value: 'Failed to update profile' },
  { language: 'en', category: 'notifications', key: 'failedChangePassword', value: 'Failed to change password' },
  { language: 'en', category: 'notifications', key: 'failedCreateAdmin', value: 'Failed to create admin' },
  { language: 'en', category: 'notifications', key: 'failedUpdateStatus', value: 'Failed to update admin status' },
  { language: 'en', category: 'notifications', key: 'fillRequiredFields', value: 'Please fill in all required fields' },

  // SweetAlert - Confirm Dialogs
  { language: 'vi', category: 'alerts', key: 'suspendTitle', value: 'Tạm khóa tài khoản?' },
  { language: 'vi', category: 'alerts', key: 'activateTitle', value: 'Kích hoạt tài khoản?' },
  { language: 'vi', category: 'alerts', key: 'suspendMessage', value: 'Bạn có chắc chắn muốn <strong>tạm khóa</strong> tài khoản quản trị viên này không?' },
  { language: 'vi', category: 'alerts', key: 'activateMessage', value: 'Bạn có chắc chắn muốn <strong>kích hoạt</strong> tài khoản quản trị viên này không?' },
  { language: 'vi', category: 'alerts', key: 'yesSuspend', value: 'Có, tạm khóa!' },
  { language: 'vi', category: 'alerts', key: 'yesActivate', value: 'Có, kích hoạt!' },
  { language: 'vi', category: 'alerts', key: 'cancel', value: 'Hủy' },
  { language: 'vi', category: 'alerts', key: 'success', value: 'Thành công!' },
  { language: 'vi', category: 'alerts', key: 'error', value: 'Lỗi!' },
  { language: 'vi', category: 'alerts', key: 'accountSuspended', value: 'Tài khoản quản trị viên đã được <strong>tạm khóa</strong> thành công!' },
  { language: 'vi', category: 'alerts', key: 'accountActivated', value: 'Tài khoản quản trị viên đã được <strong>kích hoạt</strong> thành công!' },

  { language: 'en', category: 'alerts', key: 'suspendTitle', value: 'Suspend Account?' },
  { language: 'en', category: 'alerts', key: 'activateTitle', value: 'Activate Account?' },
  { language: 'en', category: 'alerts', key: 'suspendMessage', value: 'Are you sure you want to <strong>suspend</strong> this admin account?' },
  { language: 'en', category: 'alerts', key: 'activateMessage', value: 'Are you sure you want to <strong>activate</strong> this admin account?' },
  { language: 'en', category: 'alerts', key: 'yesSuspend', value: 'Yes, suspend!' },
  { language: 'en', category: 'alerts', key: 'yesActivate', value: 'Yes, activate!' },
  { language: 'en', category: 'alerts', key: 'cancel', value: 'Cancel' },
  { language: 'en', category: 'alerts', key: 'success', value: 'Success!' },
  { language: 'en', category: 'alerts', key: 'error', value: 'Error!' },
  { language: 'en', category: 'alerts', key: 'accountSuspended', value: 'Admin account has been <strong>suspended</strong> successfully!' },
  { language: 'en', category: 'alerts', key: 'accountActivated', value: 'Admin account has been <strong>activated</strong> successfully!' },
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
