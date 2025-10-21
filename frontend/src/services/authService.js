import axios from 'axios';

const API_URL = 'http://localhost:5000/api/auth';

const authService = {
  // Login
  login: async (email, password) => {
    const response = await axios.post(`${API_URL}/login`, { email, password });
    return response.data;
  },

  // Change Password
  changePassword: async (currentPassword, newPassword) => {
    const token = localStorage.getItem('token');
    const response = await axios.post(
      `${API_URL}/change-password`,
      { currentPassword, newPassword },
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
    return response.data;
  },

  // Update Profile
  updateProfile: async (profileData) => {
    const token = localStorage.getItem('token');
    const response = await axios.put(
      `${API_URL}/profile`,
      profileData,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
    return response.data;
  },

  // Get Current Admin
  getCurrentAdmin: async () => {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/me`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  },

  // Get Current User (alias for getCurrentAdmin, for convenience)
  getCurrentUser: () => {
    const adminData = localStorage.getItem('admin');
    return adminData ? JSON.parse(adminData) : null;
  },

  // Logout
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('admin');
  }
};

export default authService;
