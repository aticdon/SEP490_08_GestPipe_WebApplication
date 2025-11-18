require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const crypto = require('crypto');

// Sample users data with Vietnamese names and data
const sampleUsers = [
  {
    fullName: 'Nguyễn Văn An',
    email: 'an.nguyen@example.com',
    password: '123456', // Will be hashed
    isEmailVerified: true,
    avatar: null,
    birthday: new Date('2000-05-15'),
    gender: 'male',
    phoneNumber: '0901234567',
    province: 'Hồ Chí Minh',
    accountStatus: 'active',
    theme: 'dark',
    uiLanguage: 'vi',
    lastLogin: new Date(),
    registerSource: 'local',
    occupation: 'Engineer',
    city: 'Ho Chi Minh',
    isOnline: true
  },
  {
    fullName: 'Trần Thị Bích',
    email: 'bich.tran@example.com',
    password: '123456',
    isEmailVerified: true,
    avatar: null,
    birthday: new Date('2001-08-22'),
    gender: 'female',
    phoneNumber: '0912345678',
    province: 'Hà Nội',
    accountStatus: 'active',
    theme: 'light',
    uiLanguage: 'en',
    lastLogin: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    registerSource: 'local',
    occupation: 'Teacher',
    city: 'Ha Noi',
    isOnline: false
  },
  {
    fullName: 'Lê Hoàng Cường',
    email: 'cuong.le@example.com',
    password: '123456',
    isEmailVerified: true,
    avatar: null,
    birthday: new Date('1998-03-10'),
    gender: 'male',
    phoneNumber: '0923456789',
    province: 'Đà Nẵng',
    accountStatus: 'active',
    theme: 'dark',
    uiLanguage: 'vi',
    lastLogin: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
    registerSource: 'local',
    occupation: 'Student',
    city: 'Da Nang',
    isOnline: true
  },
  {
    fullName: 'Phạm Hương Linh',
    email: 'linh.pham@example.com',
    password: '123456',
    isEmailVerified: true,
    avatar: null,
    birthday: new Date('1995-12-05'),
    gender: 'female',
    phoneNumber: '0934567890',
    province: 'Cần Thơ',
    accountStatus: 'active',
    theme: 'light',
    uiLanguage: 'vi',
    lastLogin: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
    registerSource: 'local',
    occupation: 'Designer',
    city: 'Can Tho',
    isOnline: false
  },
  {
    fullName: 'Vũ Minh Đức',
    email: 'duc.vu@example.com',
    password: '123456',
    isEmailVerified: true,
    avatar: null,
    birthday: new Date('1997-07-20'),
    gender: 'male',
    phoneNumber: '0945678901',
    province: 'Hải Phòng',
    accountStatus: 'active',
    theme: 'dark',
    uiLanguage: 'en',
    lastLogin: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    registerSource: 'local',
    occupation: 'Developer',
    city: 'Hai Phong',
    isOnline: false
  },
  {
    fullName: 'Đỗ Thúy Hằng',
    email: 'hang.do@example.com',
    password: '123456',
    isEmailVerified: true,
    avatar: null,
    birthday: new Date('2002-01-14'),
    gender: 'female',
    phoneNumber: '0956789012',
    province: 'Hồ Chí Minh',
    accountStatus: 'active',
    theme: 'light',
    uiLanguage: 'vi',
    lastLogin: new Date(),
    registerSource: 'local',
    occupation: 'Student',
    city: 'Ho Chi Minh',
    isOnline: true
  },
  {
    fullName: 'Trần Văn Phú',
    email: 'phu.tran@example.com',
    password: '123456',
    isEmailVerified: true,
    avatar: null,
    birthday: new Date('1996-06-30'),
    gender: 'male',
    phoneNumber: '0967890123',
    province: 'Hà Nội',
    accountStatus: 'active',
    theme: 'dark',
    uiLanguage: 'vi',
    lastLogin: new Date(Date.now() - 3 * 60 * 60 * 1000),
    registerSource: 'local',
    occupation: 'Manager',
    city: 'Ha Noi',
    isOnline: true
  },
  {
    fullName: 'Nguyễn Thị Thu Trang',
    email: 'trang.nguyen@example.com',
    password: '123456',
    isEmailVerified: true,
    avatar: null,
    birthday: new Date('1999-09-18'),
    gender: 'female',
    phoneNumber: '0978901234',
    province: 'Quảng Ninh',
    accountStatus: 'active',
    theme: 'light',
    uiLanguage: 'en',
    lastLogin: new Date(Date.now() - 12 * 60 * 60 * 1000),
    registerSource: 'local',
    occupation: 'Analyst',
    city: 'Quang Ninh',
    isOnline: false
  },
  {
    fullName: 'Bùi Quốc Khánh',
    email: 'khanh.bui@example.com',
    password: '123456',
    isEmailVerified: true,
    avatar: null,
    birthday: new Date('1994-11-22'),
    gender: 'male',
    phoneNumber: '0989012345',
    province: 'Hồ Chí Minh',
    accountStatus: 'active',
    theme: 'dark',
    uiLanguage: 'vi',
    lastLogin: new Date(),
    registerSource: 'local',
    occupation: 'Engineer',
    city: 'Ho Chi Minh',
    isOnline: true
  },
  {
    fullName: 'Hoàng Mỹ Linh',
    email: 'linh.hoang@example.com',
    password: '123456',
    isEmailVerified: true,
    avatar: null,
    birthday: new Date('2000-04-08'),
    gender: 'female',
    phoneNumber: '0990123456',
    province: 'Thành phố Hồ Chí Minh',
    accountStatus: 'active',
    theme: 'light',
    uiLanguage: 'vi',
    lastLogin: new Date(Date.now() - 30 * 60 * 1000),
    registerSource: 'local',
    occupation: 'Teacher',
    city: 'Ho Chi Minh',
    isOnline: true
  }
];

const seedUsers = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ MongoDB connected');

    // Clear existing users (except admins)
    await User.deleteMany({});
    console.log('✓ Cleared existing users');

    // Insert new users
    const insertedUsers = await User.insertMany(sampleUsers);
    console.log('✓ Users seeded successfully!');
    console.log(`✓ Total users created: ${insertedUsers.length}`);

    // Print summary
    console.log('\n📊 User Statistics:');
    const totalUsers = await User.countDocuments();
    const maleUsers = await User.countDocuments({ gender: 'male' });
    const femaleUsers = await User.countDocuments({ gender: 'female' });
    const onlineUsers = await User.countDocuments({ isOnline: true });

    console.log(`  - Total Users: ${totalUsers}`);
    console.log(`  - Male: ${maleUsers}`);
    console.log(`  - Female: ${femaleUsers}`);
    console.log(`  - Online: ${onlineUsers}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding users:', error.message);
    process.exit(1);
  }
};

seedUsers();
