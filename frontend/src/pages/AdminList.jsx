import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutGrid, Hand, Users, User, Settings, Lock, Unlock, Plus, Search as SearchIcon } from 'lucide-react';
import adminService from '../services/adminService';
import Logo from '../assets/images/Logo.png';

const AdminList = () => {
  const navigate = useNavigate();
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      const response = await adminService.getAllAdmins();
      setAdmins(response.admins || []);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load admins');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (adminId, currentStatus) => {
    // TODO: Implement toggle status API
    console.log('Toggle status for admin:', adminId, currentStatus);
  };

  // Filter admins
  const filteredAdmins = admins.filter(admin => {
    const matchesSearch = admin.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         admin.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || admin.accountStatus === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB'); // DD-MM-YYYY format
  };

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

          {/* Content */}
          <div className="p-8">
            {/* Action Bar */}
            <div className="flex justify-between items-center mb-6">
              <div className="flex gap-4">
                <button 
                  onClick={() => navigate('/create-admin')}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-primary text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-cyan-primary/50 transition-all"
                >
                  <Plus size={20} />
                  Add new admin
                </button>
                
                <div className="relative">
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-6 py-3 bg-gray-700/50 text-white border border-gray-600 rounded-lg appearance-none cursor-pointer pr-10 hover:bg-gray-700 transition-colors"
                  >
                    <option value="all">All Status</option>
                    <option value="inactive">Inactive</option>
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
              </div>

              {/* Search Box */}
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search Admin..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyan-primary w-80"
                />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400">
                {error}
              </div>
            )}

            {/* Admin Table */}
            {loading ? (
              <div className="text-center py-12 text-cyan-primary text-xl">Loading...</div>
            ) : (
              <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700 rounded-xl overflow-hidden backdrop-blur-sm">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-700/50 border-b border-gray-600">
                      <th className="px-6 py-4 text-left text-sm font-semibold text-white">ID</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-white">Name</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-white">Gmail</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-white">Phone Number</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-white">Create Date</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-white">Status</th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-white">Toggle</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAdmins.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="px-6 py-12 text-center text-gray-400">
                          No admins found
                        </td>
                      </tr>
                    ) : (
                      filteredAdmins.map((admin, index) => (
                        <tr 
                          key={admin._id} 
                          className="border-b border-gray-700/50 hover:bg-gray-800/30 transition-colors"
                        >
                          <td className="px-6 py-4 text-gray-300">
                            {String(index + 1).padStart(3, '0')}
                          </td>
                          <td className="px-6 py-4 text-white font-medium">{admin.fullName}</td>
                          <td className="px-6 py-4 text-gray-300">{admin.email}</td>
                          <td className="px-6 py-4 text-gray-300">{admin.phoneNumber || 'N/A'}</td>
                          <td className="px-6 py-4 text-gray-300">{formatDate(admin.createdAt)}</td>
                          <td className="px-6 py-4">
                            <span className={`px-3 py-1 rounded text-sm font-medium ${
                              admin.accountStatus === 'active' 
                                ? 'bg-green-500/20 text-green-400' 
                                : admin.accountStatus === 'inactive'
                                ? 'bg-gray-500/20 text-gray-400'
                                : 'bg-red-500/20 text-red-400'
                            }`}>
                              {admin.accountStatus.charAt(0).toUpperCase() + admin.accountStatus.slice(1)}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <button
                              onClick={() => handleToggleStatus(admin._id, admin.accountStatus)}
                              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                              title={admin.accountStatus === 'active' ? 'Deactivate' : 'Activate'}
                            >
                              {admin.accountStatus === 'active' ? (
                                <Unlock size={20} className="text-green-400" />
                              ) : (
                                <Lock size={20} className="text-gray-400" />
                              )}
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Stats */}
            <div className="mt-6 flex gap-4">
              <div className="bg-gray-800/50 border border-gray-700 rounded-lg px-6 py-3">
                <span className="text-gray-400 text-sm">Total Admins: </span>
                <span className="text-white font-bold text-lg">{admins.length}</span>
              </div>
              <div className="bg-green-500/20 border border-green-500/50 rounded-lg px-6 py-3">
                <span className="text-green-400 text-sm">Active: </span>
                <span className="text-green-400 font-bold text-lg">
                  {admins.filter(a => a.accountStatus === 'active').length}
                </span>
              </div>
              <div className="bg-gray-500/20 border border-gray-500/50 rounded-lg px-6 py-3">
                <span className="text-gray-400 text-sm">Inactive: </span>
                <span className="text-gray-400 font-bold text-lg">
                  {admins.filter(a => a.accountStatus === 'inactive').length}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminList;
