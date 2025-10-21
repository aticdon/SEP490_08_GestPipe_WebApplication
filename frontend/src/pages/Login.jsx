import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import authService from '../services/authService';
import logo from '../assets/images/Logo.png';
import backgroundImage from '../assets/backgrounds/background.jpg';

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({
    email: '',
    password: '',
    general: ''
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    // Clear errors when user types
    setErrors({
      email: '',
      password: '',
      general: ''
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({ email: '', password: '', general: '' });
    setLoading(true);

    try {
      const response = await authService.login(formData.email, formData.password);
      
      // Save token to localStorage
      localStorage.setItem('token', response.token);
      localStorage.setItem('admin', JSON.stringify(response.admin));

      // Redirect based on response
      if (response.redirect === 'change-password') {
        navigate('/change-password');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Invalid username or password';
      
      // Show general error message at the bottom
      setErrors({ 
        email: '', 
        password: '', 
        general: errorMessage 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/20"></div>
      
      <div className="relative z-10 w-full max-w-md px-6">
        {/* Logo */}
        <div className="text-center mb-8">
          <img src={logo} alt="GestPipe Logo" className="mx-auto w-96 mb-8" />
        </div>

        {/* Login Form */}
        <div className="backdrop-blur-md bg-gray-800/40 rounded-2xl p-10 shadow-2xl border border-gray-600/30">
          <h2 className="text-6xl font-bold text-cyan-primary text-center mb-10 capitalize tracking-wide">
            Login
          </h2>

          {errors.general && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm">
              {errors.general}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5 flex flex-col items-center">
            {/* Email Input */}
            <div className="w-full">
              <input
                type="email"
                name="email"
                placeholder="User name"
                value={formData.email}
                onChange={handleChange}
                required
                className={`w-full px-5 py-3.5 bg-gray-200 rounded-xl text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 transition-all ${
                  errors.email ? 'ring-2 ring-red-500' : 'focus:ring-cyan-primary/50'
                }`}
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1.5 ml-1">{errors.email}</p>
              )}
            </div>

            {/* Password Input */}
            <div className="relative w-full">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
                required
                className={`w-full px-5 py-3.5 bg-gray-200 rounded-xl text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 transition-all pr-12 ${
                  errors.password ? 'ring-2 ring-red-500' : 'focus:ring-cyan-primary/50'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-cyan-primary hover:text-cyan-primary/80 transition-colors"
              >
                {showPassword ? <EyeOff size={22} /> : <Eye size={22} />}
              </button>
              {errors.password && (
                <p className="text-red-500 text-sm mt-1.5 ml-1">{errors.password}</p>
              )}
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-1/2 py-3.5 bg-gradient-to-r from-blue-600 to-cyan-primary text-white font-bold rounded-xl hover:shadow-lg hover:shadow-cyan-primary/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-lg"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>

            {/* Error Message */}
            {errors.general && (
              <div className="w-full text-center">
                <p className="text-red-500 text-sm">{errors.general}</p>
              </div>
            )}

            {/* Forgot Password Link */}
            <div className="text-center pt-2">
              <a
                href="/forgot-password"
                className="text-cyan-primary hover:text-cyan-primary/80 transition-colors text-sm"
              >
                Forgot Password?
              </a>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
