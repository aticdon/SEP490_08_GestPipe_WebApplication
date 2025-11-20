import React, { useEffect, useState, useCallback, useRef } from 'react'; // Thêm useCallback, useRef
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import dashboardService from '../services/dashboardService'; 
// (Bỏ import Sun, Moon, Bell, ChevronDown)
import { toast } from 'react-toastify'; // Bỏ ToastContainer
import 'react-toastify/dist/ReactToastify.css';
import authService from '../services/authService';
import { useTheme } from '../utils/ThemeContext';
// (Bỏ import Logo, backgroundImage, Sidebar)
import { PieChart, Pie, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell} from "recharts";
import { motion } from 'framer-motion'; // <-- THÊM
import { Loader2 } from 'lucide-react'; // <-- THÊM

// Hiệu ứng
const pageVariants = {
  initial: { opacity: 0, x: "20px" },
  animate: { opacity: 1, x: "0px" },
  exit: { opacity: 0, x: "-20px" },
  transition: { type: 'tween', ease: 'anticipate', duration: 0.3 }
};

// ====================================================================
// COMPONENT CHÍNH: Dashboard
// ====================================================================
const Dashboard = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  // const [admin, setAdmin] = useState(null); // Bỏ
  const { theme } = useTheme(); // Bỏ toggleTheme
  // const [showUserDropdown, setShowUserDropdown] = useState(false); // Bỏ
  const [activeTab, setActiveTab] = useState(t('dashboard.userOverview'));

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/');
      return;
    }

    const adminData = authService.getCurrentUser();
    if (!adminData || adminData.role !== 'superadmin') {
      navigate('/user-list'); // Chỉ superadmin mới vào được dashboard
      return;
    }
    // (Bỏ setAdmin)
  }, [navigate]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/');
      return;
    }

    const adminData = authService.getCurrentUser();
    if (!adminData || adminData.role !== 'superadmin') {
      navigate('/user-list'); // Chỉ superadmin mới vào được dashboard
      return;
    }
    // (Bỏ setAdmin)
  }, [navigate]);

  // (Bỏ handleLogout)
  // (Bỏ Loading screen)

  return (
    // (Bỏ div layout)
    <motion.main 
      className="flex-1 overflow-y-auto p-8 font-montserrat flex flex-col" // Tự cuộn
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageVariants}
      transition={pageVariants.transition}
    >
      {/* Tabs Navigation (Style "kính mờ") */}
      <div className="flex gap-3 mb-6 flex-shrink-0">
        {[t('dashboard.userOverview'), t('dashboard.gesture'), t('dashboard.version')].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2 rounded-lg font-semibold transition-all
                        border border-transparent
                        ${
              activeTab === tab
                ? "bg-white text-gray-900" // Active
                : "bg-black/30 text-gray-300 hover:text-white hover:border-white/50" // Inactive
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {/* Thêm key để React re-render khi đổi tab */}
      <div key={activeTab}>
        {activeTab === t('dashboard.userOverview') && <UserOverviewTab theme={theme} />}
        {activeTab === t('dashboard.gesture') && <GestureTab theme={theme} />}
        {activeTab === t('dashboard.version') && <VersionTab theme={theme} />}
      </div>
      
    </motion.main>
    // (Bỏ div layout)
  );
};

// ====================================================================
// TAB 1: User Overview
// ====================================================================
const UserOverviewTab = ({ theme }) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await dashboardService.fetchDashboardUser();
        if (res.success) {
          setStats(res.data);
        }
      } catch (err) {
        console.error("❌ Failed to fetch dashboard data:", err);
        toast.error(t('dashboard.failedToLoadUserOverview'));
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={48} className="text-cyan-500 animate-spin" />
      </div>
    );
  }

  if (!stats) {
    return <div className="text-center text-red-400">{t('dashboard.noDataAvailable')}</div>;
  }

  // === Chuẩn hóa dữ liệu để hiển thị ===
  const genderData = [
    { name: t('dashboard.male'), value: parseFloat(stats.genderPercent.male || 0) },
    { name: t('dashboard.female'), value: parseFloat(stats.genderPercent.female || 0) },
    { name: t('dashboard.other'), value: parseFloat(stats.genderPercent.other || 0) },
  ];
  const GENDER_COLORS = ["#00BFFF", "#FFFFFF", "#002E66"]; // Xanh, Trắng, Xanh đậm

  const ageData = Object.entries(stats.agePercent).map(([name, value]) => ({
    name,
    value: parseFloat(value),
  }));

  const occupationData = stats.occupationPercent.map(o => ({
    name: o.occupation,
    value: parseFloat(o.percent),
  }));

  const cityData = stats.cityPercent.map(c => ({
    name: c.address,
    value: parseFloat(c.percent),
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* === Tổng Users, Online Users === */}
      <div className="grid grid-rows-2 gap-6 lg:col-span-2">
        <div className="grid grid-cols-2 gap-6">
          <ChartCard title={t('dashboard.totalUsers')}>
            <p className="text-4xl font-bold text-cyan-400">{stats.totalUsers}</p>
            <p className="text-sm text-green-500">
              +{stats.growthRate}% {t('dashboard.comparedToLastMonth')}
            </p>
          </ChartCard>
          <ChartCard title={t('dashboard.onlineUsers')}>
            <p className="text-4xl font-bold text-cyan-400">{stats.onlineUsers}</p>
          </ChartCard>
        </div>

        {/* Accuracy và Requests */}
        <div className="grid grid-cols-2 gap-6">
          <ChartCard title={t('dashboard.accuracyRate')}>
            <p className="text-4xl font-bold text-cyan-400">96.1%</p>
          </ChartCard>
          <ChartCard title={t('dashboard.totalRequests')}>
            <p className="text-4xl font-bold text-cyan-400">115</p>
            <p className="text-sm text-green-500">+56 {t('dashboard.today')}</p>
          </ChartCard>
        </div>
      </div>

      {/* === Gender === */}
      <ChartCard title={t('dashboard.gender')} className="row-span-2">
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={genderData}
              dataKey="value"
              outerRadius={100}
              innerRadius={60}
              labelLine={false}
              label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
            >
              {genderData.map((_, i) => (
                <Cell key={i} fill={GENDER_COLORS[i % GENDER_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'rgba(0,0,0,0.8)', 
                borderColor: 'rgba(255,255,255,0.2)',
                borderRadius: '10px'
              }} 
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="flex justify-center gap-4 mt-4 text-white">
          {genderData.map((entry, index) => (
            <div key={index} className="flex items-center gap-2">
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: GENDER_COLORS[index % GENDER_COLORS.length] }}
              ></span>
              <span>{entry.name}</span>
            </div>
          ))}
        </div>
      </ChartCard>

      {/* === Occupation, Age, City === */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:col-span-3">
        <ChartCard title={t('dashboard.occupation')}>
          <ul className="flex flex-col justify-center space-y-5">
            {occupationData.map(item => (
              <li key={item.name} className="flex justify-between text-base">
                <span className="text-white">{item.name}</span>
                <span className="font-semibold text-cyan-400">{item.value}%</span>
              </li>
            ))}
          </ul>
        </ChartCard>

        <ChartCard title={t('dashboard.age')}>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart layout="vertical" data={ageData}>
              <XAxis type="number" hide />
              <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#FFFFFF', fontSize: 14 }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(0,0,0,0.8)', 
                  borderColor: 'rgba(255,255,255,0.2)',
                  borderRadius: '10px'
                }}
                cursor={{fill: 'rgba(255,255,255,0.1)'}} 
              />
              <Bar dataKey="value" fill="#00BFFF" radius={[0, 10, 10, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title={t('dashboard.topCities')}>
          <ul className="flex flex-col justify-center space-y-5">
            {cityData.map(item => (
              <li key={item.name} className="flex justify-between text-base">
                <span className="text-white">{item.name}</span>
                <span className="font-semibold text-cyan-400">{item.value}%</span>
              </li>
            ))}
          </ul>
        </ChartCard>
      </div>
    </div>
  );
};


/* ================= GestureTab ================= */
const GestureTab = ({ theme }) => {
  const { t } = useTranslation();
  const allocationData = [
    { name: t('dashboard.defaultGestures'), value: 78 },
    { name: t('dashboard.customUserGestures'), value: 22 },
  ];
  const ALLOCATION_COLORS = ["#00BFFF", "#002E66"];

  const topGestures = [
    { name: "Next", value: 90 },
    { name: "Prev", value: 80 },
    { name: "Zoom in", value: 65 },
    { name: "Start", value: 50 },
    { name: "Previous", value: 40 },
  ];

  const aiData = [{ name: t('dashboard.success'), value: 92 }, { name: t('dashboard.fail'), value: 8 }];
  const AI_COLORS = ["#00BFFF", "#002E66"];

  return (
    <div className="flex flex-col gap-6">
      {/* === Hàng 1: Allocation & Top 5 Gestures === */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ChartCard title={t('dashboard.allocationUsingGestures')}>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie 
                data={allocationData} 
                dataKey="value" 
                outerRadius={100} 
                labelLine={false} 
                label={({ percent }) => `${(percent*100).toFixed(0)}%`}
              >
                {allocationData.map((_, i) => (
                  <Cell key={`cell-${i}`} fill={ALLOCATION_COLORS[i]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(0,0,0,0.8)', 
                  borderColor: 'rgba(255,255,255,0.2)',
                  borderRadius: '10px'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 mt-4 text-white">
            {allocationData.map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: ALLOCATION_COLORS[index] }}></span>
                <span>{item.name}: {item.value}%</span>
              </div>
            ))}
          </div>
        </ChartCard>

        <ChartCard title={t('dashboard.top5GesturesChange')}>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart 
              layout="vertical" 
              data={topGestures} 
              margin={{ left: 20, right: 20 }}
            >
              <XAxis type="number" hide />
              <YAxis 
                dataKey="name" 
                type="category" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#FFFFFF', fontSize: 14 }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(0,0,0,0.8)', 
                  borderColor: 'rgba(255,255,255,0.2)',
                  borderRadius: '10px'
                }} 
                cursor={{fill: 'rgba(255,255,255,0.1)'}}
              />
              <Bar dataKey="value" fill="#00BFFF" radius={[0,10,10,0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* === Hàng 2: Training & AI === */}
      <div className="flex justify-center">
        <div className="w-full md:w-1/2">
          <ChartCard title={t('dashboard.trainingAndAi')}>
            <div className="flex justify-between items-center">
              <div className="space-y-2 text-lg text-gray-200">
                <p>{t('dashboard.today')}: 15</p>
                <p>{t('dashboard.thisMonth')}: 150</p>
              </div>
              <div className="w-1/2 h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={aiData} dataKey="value" innerRadius={60} outerRadius={80} startAngle={90} endAngle={450}>
                      <Cell fill={AI_COLORS[0]} />
                      <Cell fill={AI_COLORS[1]} />
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(0,0,0,0.8)', 
                        borderColor: 'rgba(255,255,255,0.2)',
                        borderRadius: '10px'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            <p className="text-center text-cyan-400 font-semibold mt-2 text-lg">{t('dashboard.successRate')}: 92%</p>
          </ChartCard>
        </div>
      </div>
    </div>
  );
};

/* ================= VersionTab ================= */
const VersionTab = ({ theme }) => {
  const { t } = useTranslation();
  const [versionData, setVersionData] = useState([]);
  const [recentUpdateData, setRecentUpdateData] = useState({
    latest_release: "",
    release_date: "",
    new_features: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await dashboardService.fetchDashboardVersion();
        if (result.success && result.data) {
          setVersionData(result.data.versionAdoption || []); 
          setRecentUpdateData(result.data.recentUpdate || {});
        }
      } catch (err) {
        console.error("Failed to fetch version data:", err);
        toast.error(t('dashboard.failedToLoadVersion'));
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={48} className="text-cyan-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
      {/* Version Adoption */}
      <ChartCard title={t('dashboard.versionAdoption')}>
        <div className="flex flex-col divide-y divide-white/10">
          {versionData.length > 0 ? versionData.map((v,i)=>(
            <div key={i} className="flex justify-between py-2 text-sm font-medium">
              <span className="text-white">{v.version_name}</span>
              <span className="text-cyan-400">{v.user_count.toLocaleString()}</span>
            </div>
          )) : <p className="text-gray-400">{t('dashboard.noVersionData')}</p>}
        </div>
      </ChartCard>

      {/* Recent Updates */}
      <ChartCard title={t('dashboard.recentUpdates')}>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <span className="text-gray-300">{t('dashboard.latestRelease')}:</span>
          <span className="text-cyan-400">{recentUpdateData.latest_release}</span>
          <span className="text-gray-300">{t('dashboard.releaseDate')}:</span>
          <span className="text-cyan-400">
            {
              recentUpdateData.release_date ?
              (typeof recentUpdateData.release_date === "string"
                ? recentUpdateData.release_date
                : new Date(recentUpdateData.release_date).toLocaleDateString("vi-VN")) // Sửa format
              : ""
            }
          </span>
          <span className="text-gray-300 col-span-2">{t('dashboard.newFeatures')}:</span>
          <ul className="list-disc ml-5 text-cyan-400 space-y-1 col-span-2">
            {Array.isArray(recentUpdateData.new_features) && recentUpdateData.new_features.length > 0
              ? recentUpdateData.new_features.map((f,i)=>(
                  <li key={i}>+ {f}</li>
                ))
              : <li>{t('dashboard.noNewFeatures')}</li>}
          </ul>
        </div>
      </ChartCard>
    </div>
  );
};


/* ================= ChartCard (Style "Kính mờ") ================= */
const ChartCard = ({ title, children, className = '' }) => (
  <div className={`p-6 rounded-2xl border border-white/20 
                   bg-black/50 backdrop-blur-lg shadow-xl
                   ${className}`}>
    <h3 className="text-lg font-semibold mb-4 text-white">{title}</h3>
    {children}
  </div>
);

export default Dashboard;
