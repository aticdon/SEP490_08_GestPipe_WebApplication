import React, { useState } from 'react';
import { Copy, Check, LayoutGrid, Hand, Users, User, Settings, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import adminService from '../services/adminService';
import Logo from '../assets/images/Logo.png';

const CreateAdmin = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    fullName: '',
    phoneNumber: '',
    province: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null);
  const [copied, setCopied] = useState(false);

  // Danh sách tỉnh/thành phố Việt Nam
  const provinces = [
    'An Giang', 'Bà Rịa - Vũng Tàu', 'Bạc Liêu', 'Bắc Kạn', 'Bắc Giang', 
    'Bắc Ninh', 'Bến Tre', 'Bình Dương', 'Bình Định', 'Bình Phước', 
    'Bình Thuận', 'Cà Mau', 'Cao Bằng', 'Cần Thơ', 'Đà Nẵng', 
    'Đắk Lắk', 'Đắk Nông', 'Điện Biên', 'Đồng Nai', 'Đồng Tháp', 
    'Gia Lai', 'Hà Giang', 'Hà Nam', 'Hà Nội', 'Hà Tĩnh', 
    'Hải Dương', 'Hải Phòng', 'Hậu Giang', 'Hòa Bình', 'Hưng Yên', 
    'Khánh Hòa', 'Kiên Giang', 'Kon Tum', 'Lai Châu', 'Lâm Đồng', 
    'Lạng Sơn', 'Lào Cai', 'Long An', 'Nam Định', 'Nghệ An', 
    'Ninh Bình', 'Ninh Thuận', 'Phú Thọ', 'Phú Yên', 'Quảng Bình', 
    'Quảng Nam', 'Quảng Ngãi', 'Quảng Ninh', 'Quảng Trị', 'Sóc Trăng', 
    'Sơn La', 'Tây Ninh', 'Thái Bình', 'Thái Nguyên', 'Thanh Hóa', 
    'Thừa Thiên Huế', 'Tiền Giang', 'TP. Hồ Chí Minh', 'Trà Vinh', 
    'Tuyên Quang', 'Vĩnh Long', 'Vĩnh Phúc', 'Yên Bái'
  ];

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Validate form
    if (!formData.email || !formData.fullName || !formData.phoneNumber || !formData.province) {
      setError('Please fill in all required fields');
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);

    try {
      const response = await adminService.createAdmin(
        formData.email, 
        formData.fullName,
        formData.phoneNumber,
        formData.province
      );
      setSuccess(response);
      toast.success('Admin account created successfully!');
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to create admin';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(success.temporaryPassword);
    setCopied(true);
    toast.success('Password copied to clipboard!', { autoClose: 2000 });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFinish = () => {
    setSuccess(null);
    setFormData({
      email: '',
      fullName: '',
      phoneNumber: '',
      province: ''
    });
  };

  // Success Modal
  if (success) {
    return (
      <div className="min-h-screen bg-dark-bg">
        {/* Same sidebar and header */}
        <div className="flex">
          {/* Sidebar - same as main form */}
          <div className="w-64 bg-black/50 border-r border-cyan-primary/20 min-h-screen p-6">
            <div className="mb-8">
              <img src={Logo} alt="GestPipe Logo" className="h-16 mx-auto" />
            </div>
            
            <div className="space-y-2">
              <button 
                onClick={() => navigate('/dashboard')}
                className="w-full flex items-center gap-3 px-4 py-3 text-gray-400 hover:bg-gray-800/50 rounded-lg transition-colors"
              >
                <LayoutGrid size={20} />
                <span>OverView</span>
              </button>
              <button className="w-full flex items-center gap-3 px-4 py-3 text-gray-400 hover:bg-gray-800/50 rounded-lg transition-colors">
                <Hand size={20} />
                <span>Gestures Control</span>
              </button>
              <button className="w-full flex items-center gap-3 px-4 py-3 bg-cyan-primary/20 text-cyan-primary rounded-lg">
                <Users size={20} />
                <span>Admin</span>
              </button>
              <button className="w-full flex items-center gap-3 px-4 py-3 text-gray-400 hover:bg-gray-800/50 rounded-lg transition-colors">
                <User size={20} />
                <span>User</span>
              </button>
              <button className="w-full flex items-center gap-3 px-4 py-3 text-gray-400 hover:bg-gray-800/50 rounded-lg transition-colors">
                <Settings size={20} />
                <span>Version</span>
              </button>
            </div>

            <div className="absolute bottom-6 left-6 flex gap-2">
              <span className="w-8 h-8 bg-red-600 rounded flex items-center justify-center text-white text-xs font-bold">VI</span>
              <span className="w-8 h-8 bg-white rounded flex items-center justify-center text-gray-800 text-xs font-bold">EN</span>
            </div>
          </div>

          {/* Success Content */}
          <div className="flex-1 p-8">
            <div className="max-w-2xl mx-auto">
              <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-2 border-green-500/50 rounded-2xl p-8 mb-6">
                <div className="text-center mb-6">
                  <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Check size={40} className="text-white" />
                  </div>
                  <h2 className="text-3xl font-bold text-white mb-2">
                    Admin Created Successfully!
                  </h2>
                  <p className="text-cyan-primary">
                    Please send the temporary password to the admin via email
                  </p>
                </div>

                <div className="bg-black/40 rounded-xl p-6 space-y-4 border border-cyan-primary/30">
                  <div>
                    <label className="text-sm font-medium text-gray-400">Full Name:</label>
                    <p className="text-white text-xl font-semibold">{success.admin.fullName}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-400">Email:</label>
                    <p className="text-white text-xl font-semibold">{success.admin.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-400">Temporary Password:</label>
                    <div className="flex items-center gap-3 mt-2">
                      <code className="flex-1 bg-yellow-500/20 text-yellow-300 px-4 py-3 rounded-lg font-mono text-lg font-bold border-2 border-yellow-500/50">
                        {success.temporaryPassword}
                      </code>
                      <button
                        onClick={copyToClipboard}
                        className="p-3 bg-cyan-primary hover:bg-cyan-secondary text-black rounded-lg transition-colors"
                        title="Copy password"
                      >
                        {copied ? <Check size={24} /> : <Copy size={24} />}
                      </button>
                    </div>
                    {copied && (
                      <p className="text-green-400 text-sm mt-2 font-semibold">✓ Copied to clipboard!</p>
                    )}
                  </div>
                </div>

                <div className="bg-yellow-500/20 border-2 border-yellow-500/50 rounded-lg p-4 mt-6">
                  <p className="text-yellow-300 text-sm">
                    ⚠️ <strong>Important:</strong> Save this password! It won't be shown again.
                  </p>
                </div>

                <button
                  onClick={handleFinish}
                  className="w-full mt-6 py-4 bg-gradient-to-r from-blue-600 to-cyan-primary text-white font-bold text-lg rounded-xl hover:shadow-lg hover:shadow-cyan-primary/50 transition-all"
                >
                  Create Another Admin
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main Create Admin Form
  return (
    <div className="min-h-screen bg-dark-bg">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-black/50 border-r border-cyan-primary/20 min-h-screen p-6">
          <div className="mb-8">
            <img src={Logo} alt="GestPipe Logo" className="h-16 mx-auto" />
          </div>
          
          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative">
              <input
                type="text"
                placeholder="Search..."
                className="w-full px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-gray-300 placeholder-gray-500 focus:outline-none focus:border-cyan-primary"
              />
            </div>
          </div>

          {/* Menu Items */}
          <div className="space-y-2">
            <button 
              onClick={() => navigate('/dashboard')}
              className="w-full flex items-center gap-3 px-4 py-3 text-gray-400 hover:bg-gray-800/50 rounded-lg transition-colors"
            >
              <LayoutGrid size={20} />
              <span>OverView</span>
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-3 text-gray-400 hover:bg-gray-800/50 rounded-lg transition-colors">
              <Hand size={20} />
              <span>Gestures Control</span>
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-3 bg-cyan-primary/20 text-cyan-primary rounded-lg">
              <Users size={20} />
              <span>Admin</span>
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-3 text-gray-400 hover:bg-gray-800/50 rounded-lg transition-colors">
              <User size={20} />
              <span>User</span>
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-3 text-gray-400 hover:bg-gray-800/50 rounded-lg transition-colors">
              <Settings size={20} />
              <span>Version</span>
            </button>
          </div>

          {/* Language Selector */}
          <div className="absolute bottom-6 left-6 flex gap-2">
            <span className="w-8 h-8 bg-red-600 rounded flex items-center justify-center text-white text-xs font-bold">VI</span>
            <span className="w-8 h-8 bg-white rounded flex items-center justify-center text-gray-800 text-xs font-bold">EN</span>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {/* Header */}
          <div className="bg-black/30 border-b border-cyan-primary/20 px-8 py-4 flex justify-between items-center">
            <h1 className="text-2xl font-bold">
              <span className="text-cyan-primary">Gest</span>
              <span className="text-cyan-secondary">Pipe</span>
            </h1>
            <div className="flex items-center gap-4">
              <button className="p-2 text-gray-400 hover:text-cyan-primary">
                <Settings size={20} />
              </button>
              <button className="p-2 text-gray-400 hover:text-cyan-primary">
                🔔
              </button>
              <button className="p-2 text-gray-400 hover:text-cyan-primary">
                <User size={20} />
              </button>
            </div>
          </div>

          {/* Form Container */}
          <div className="p-8">
            <div className="max-w-2xl mx-auto">
              <div className="bg-gradient-to-br from-gray-900/50 to-black/50 border border-cyan-primary/30 rounded-2xl p-8 backdrop-blur-sm">
                <h2 className="text-2xl font-bold text-white mb-8">Create Admin Account</h2>

                {error && (
                  <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Full Name */}
                  <div>
                    <label className="block text-white text-sm font-medium mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 bg-white text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-primary"
                      placeholder="Nguyen Thanh Huy"
                    />
                  </div>

                  {/* Gmail */}
                  <div>
                    <label className="block text-white text-sm font-medium mb-2">
                      Gmail
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 bg-white text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-primary"
                      placeholder="Admin1@gmail.com"
                    />
                  </div>

                  {/* Phone Number */}
                  <div>
                    <label className="block text-white text-sm font-medium mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      name="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 bg-white text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-primary"
                      placeholder="034538294"
                    />
                  </div>

                  {/* Province/City */}
                  <div>
                    <label className="block text-white text-sm font-medium mb-2">
                      Address
                    </label>
                    <div className="relative">
                      <select
                        name="province"
                        value={formData.province}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 bg-white text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-primary appearance-none cursor-pointer"
                      >
                        <option value="">Province/City</option>
                        {provinces.map((province) => (
                          <option key={province} value={province}>
                            {province}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={20} />
                    </div>
                  </div>

                  {/* Submit Buttons */}
                  <div className="flex gap-4 pt-4">
                    <button
                      type="button"
                      onClick={() => navigate('/dashboard')}
                      className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-cyan-primary text-white font-bold rounded-lg hover:shadow-lg hover:shadow-cyan-primary/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? 'Creating...' : 'Create Admin'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateAdmin;
