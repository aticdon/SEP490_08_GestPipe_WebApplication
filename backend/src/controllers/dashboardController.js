const User = require('../models/User');
const UserProfile = require('../models/UserProfile');
const Version = require('../models/Version');

// Danh sách ngành nghề chuẩn (dropdown list)
const OCCUPATION_LIST = [
  "IT", "Teacher", "Marketing", "Sales", "Finance",
  "Designer", "Healthcare", "Engineering", "Construction",
  "Legal", "Hospitality", "Science", "Administrative", "Student"
];

// Hàm chuẩn hóa occupation (nếu chọn từ dropdown thì đúng chuẩn, nếu là Other: nhập tự do)
function normalizeOccupation(occupation) {
  if (!occupation) return "Other";
  const cleaned = occupation.trim().toLowerCase();
  // So khớp occupation với dropdown (không phân biệt hoa/thường)
  for (const group of OCCUPATION_LIST) {
    if (cleaned === group.toLowerCase()) return group;
  }
  // Nếu không khớp nhóm nào (nghề nhập tay), trả về "Other"
  return "Other";
}

exports.getUserOverviewStats = async (req, res) => {
  try {
    // === Thống kê tổng số user, tăng trưởng user, user online như trước ===
    const now = new Date();
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    const [totalUsers, thisMonthUsers, lastMonthUsers, onlineUsers] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ created_at: { $gte: startOfThisMonth } }),
      User.countDocuments({ created_at: { $gte: startOfLastMonth, $lt: endOfLastMonth } }),
      User.countDocuments({ account_status: "activeonline" })
    ]);

    const growthRate = lastMonthUsers > 0
      ? (((thisMonthUsers - lastMonthUsers) / lastMonthUsers) * 100).toFixed(1)
      : (thisMonthUsers > 0 ? 100 : 0);

    // === Thống kê gender ===
    const genderAgg = await UserProfile.aggregate([
      { $group: { _id: "$gender", count: { $sum: 1 } } }
    ]);
    const genderCounts = { male: 0, female: 0, other: 0 };
    genderAgg.forEach(g => {
      if (["male", "female", "other"].includes(g._id)) {
        genderCounts[g._id] = g.count;
      } else {
        genderCounts.other += g.count;
      }
    });
    const totalGender = genderCounts.male + genderCounts.female + genderCounts.other || 1;
    const genderPercent = {
      male: ((genderCounts.male / totalGender) * 100).toFixed(1),
      female: ((genderCounts.female / totalGender) * 100).toFixed(1),
      other: ((genderCounts.other / totalGender) * 100).toFixed(1)
    };

    // === Thống kê occupation ===
    // User có thể chọn occupation từ dropdown hoặc nhập thủ công ở Other
    const occupationProfiles = await UserProfile.find({ occupation: { $ne: null } }, "occupation");
    let totalOccupationProfiles = occupationProfiles.length;
    const occupationCounts = {};
    occupationProfiles.forEach(u => {
      const group = normalizeOccupation(u.occupation);
      occupationCounts[group] = (occupationCounts[group] || 0) + 1;
    });
    // Sắp xếp occupation theo số lượng giảm dần
    const sortedOccupation = Object.entries(occupationCounts).sort((a, b) => b[1] - a[1]);
    const topN = 3;
    const topOccupations = sortedOccupation.filter(([group]) => group !== "Other").slice(0, topN);

    // Gom các occupation nhỏ và nghề nhập tay ("Other")
    let otherCount = 0;
    sortedOccupation.slice(topN).forEach(([group, count]) => {
      if (group !== "Other") otherCount += count;
    });
    otherCount += occupationCounts["Other"] || 0;
    const occupationPercent = topOccupations.map(([group, count]) => ({
      occupation: group,
      percent: ((count / totalOccupationProfiles) * 100).toFixed(1)
    }));
    if (otherCount > 0) {
      occupationPercent.push({
        occupation: "Other",
        percent: ((otherCount / totalOccupationProfiles) * 100).toFixed(1)
      });
    }

    // === Thống kê city/address (overview) theo đúng yêu cầu của bạn ===
    // Lấy top 3 address nhiều user nhất, các địa chỉ còn lại gộp vào Other
    const addressProfiles = await UserProfile.find({ address: { $ne: null, $ne: "" } }, "address");
    let totalAddressProfiles = addressProfiles.length;
    const addressCounts = {};
    addressProfiles.forEach(u => {
      const addr = u.address.trim();
      if (!addr) return;
      addressCounts[addr] = (addressCounts[addr] || 0) + 1;
    });
    const sortedAddress = Object.entries(addressCounts).sort((a, b) => b[1] - a[1]);
    const topAddressN = 3;
    const topAddresses = sortedAddress.slice(0, topAddressN); // lấy top 3 địa chỉ nhiều nhất
    let otherAddrCount = sortedAddress.slice(topAddressN).reduce((sum, [_, v]) => sum + v, 0);
    // Trả về cho dashboard (cityPercent là mảng các địa chỉ theo %)
    const cityPercent = topAddresses.map(([address, count]) => ({
      address,
      percent: ((count / totalAddressProfiles) * 100).toFixed(1)
    }));
    if (otherAddrCount > 0) {
      cityPercent.push({
        address: "Other",
        percent: ((otherAddrCount / totalAddressProfiles) * 100).toFixed(1)
      });
    }

    // 1. Lấy tất cả user profile có birth_date (và valid, đảm bảo > 16 tuổi)
const ageProfiles = await UserProfile.find({ birth_date: { $ne: null } }, "birth_date");
let totalAgeProfiles = ageProfiles.length;

// 2. Khởi tạo đếm cho 4 nhóm tuổi
const ageGroups = {
  "16-24": 0,
  "25-34": 0,
  "35-50": 0,
  "50+": 0
};
const today = new Date();

ageProfiles.forEach(u => {
  const birth = new Date(u.birth_date);
  if (isNaN(birth)) return; // skip invalid
  // Tính tuổi
  let age = today.getFullYear() - birth.getFullYear();
  if (
    today.getMonth() < birth.getMonth() ||
    (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())
  ) {
    age--;
  }
  // Phân nhóm tuổi
  if (age >= 16 && age <= 24) ageGroups["16-24"]++;
  else if (age >= 25 && age <= 34) ageGroups["25-34"]++;
  else if (age >= 35 && age <= 50) ageGroups["35-50"]++;
  else if (age > 50) ageGroups["50+"]++;
  // Dưới 16 tuổi: không tính vào phân tích dashboard
});

// Chuẩn hóa phần trăm cho mỗi nhóm
const agePercent = {};
const totalValid = ageGroups["16-24"] + ageGroups["25-34"] + ageGroups["35-50"] + ageGroups["50+"] || 1;
for (const group in ageGroups) {
  agePercent[group] = ((ageGroups[group] / totalValid) * 100).toFixed(1);
}

    // === Response cho Dashboard ===
    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        growthRate,
        onlineUsers,
        genderPercent,
        occupationPercent,
        cityPercent,
        agePercent // phần trăm địa chỉ top 3 và Other
      }
    });

  } catch (error) {
    console.error("Error fetching user overview stats:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.getVersionOverviewStats = async (req, res) => {
  try {
    // 1. Lấy danh sách version, sort theo downloads DESC, lấy top 5
    const adoptionVersions = await Version.find({}, 'name downloads')
      .sort({ downloads: -1 }).limit(5);

    // Chuẩn hoá cho frontend
    const versionAdoption = adoptionVersions.map(ver => ({
      version_name: ver.name,
      user_count: ver.downloads
    }));

    // 2. Lấy version mới nhất (theo release_date gần nhất)
    const latestVersion = await Version.findOne()
      .sort({ release_date: -1 }) // Gần nhất đầu
      .select('name release_name release_date description');

    // Xử lý tính năng mới
    // Nếu description là object Array/list feature
    let newFeatures = [];
    if (latestVersion && latestVersion.description) {
      if (Array.isArray(latestVersion.description)) {
        newFeatures = latestVersion.description;
      } else if (typeof latestVersion.description === 'object' && Array.isArray(latestVersion.description.features)) {
        newFeatures = latestVersion.description.features;
      } else if (typeof latestVersion.description === "string") {
        newFeatures = latestVersion.description.split('\n');
      }
    }

    res.status(200).json({
      success: true,
      data: {
        versionAdoption,
        recentUpdate: latestVersion ? {
          latest_release: latestVersion.name,
          release_date: latestVersion.release_date,
          new_features: newFeatures // array of string
        } : {}
      }
    });
  } catch (error) {
    console.error("Error fetching version overview stats:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};