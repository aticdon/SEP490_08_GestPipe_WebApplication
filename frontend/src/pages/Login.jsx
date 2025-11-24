import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, Loader2 } from 'lucide-react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { motion } from 'framer-motion';
import authService from '../services/authService';
import logo from '../assets/images/Logo.png';
import backgroundImage from '../assets/backgrounds/background.jpg';
import { useTheme } from '../utils/ThemeContext';

const Login = () => {
  const { theme } = useTheme();
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

    // Client-side validation
    const newErrors = { email: '', password: '', general: '' };
    let hasErrors = false;

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
      hasErrors = true;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = 'Please enter a valid email address';
      hasErrors = true;
    }

    if (!formData.password.trim()) {
      newErrors.password = 'Password is required';
      hasErrors = true;
    }

    if (hasErrors) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);

    try {
      const response = await authService.login(formData.email, formData.password);
      
      // Save token to localStorage
      localStorage.setItem('token', response.token);
      localStorage.setItem('admin', JSON.stringify(response.admin));

      // Show success toast
      toast.success(`Welcome back, ${response.admin.fullName}! 🎉`, {
        position: "top-right",
        autoClose: 2000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });

      // Redirect based on response
      if (response.redirect === 'change-password') {
        navigate('/change-password');
      } else {
        // Redirect based on role
        if (response.admin.role === 'superadmin') {
          navigate('/dashboard');
        } else if (response.admin.role === 'admin') {
          navigate('/user-list');
        }
      }
      
    } catch (err) {
      const errorData = err.response?.data;
      const errorType = errorData?.errorType;
      const errorMessage = errorData?.message || 'Login failed';
      
      // Handle specific error types
      if (errorType === 'email_not_found') {
        setErrors({ 
          email: errorMessage, 
          password: '', 
          general: '' 
        });
      } else if (errorType === 'wrong_password') {
        setErrors({ 
          email: '', 
          password: errorMessage, 
          general: '' 
        });
      } else {
        // General error
        setErrors({ 
          email: '', 
          password: '', 
          general: errorMessage 
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center relative overflow-hidden font-montserrat pb-32"
      style={{
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <ToastContainer theme="dark" />
      {/* Dark overlay with blur */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"></div>
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md px-6 mx-auto"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <img src={logo} alt="GestPipe Logo" className="mx-auto w-80 drop-shadow-[0_0_15px_rgba(6,182,212,0.5)]" />
        </div>

        {/* Login Form */}
        <div className="backdrop-blur-xl bg-black/40 rounded-3xl p-8 shadow-2xl border border-white/10 relative overflow-hidden">
          {/* Decorative gradient blob */}
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-cyan-500/20 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl"></div>

          <div className="relative z-10">
            <h2 className="text-3xl font-bold text-white text-center mb-2">
              Welcome Back
            </h2>
            <p className="text-gray-400 text-center mb-8 text-sm">
              Sign in to continue to GestPipe Admin
            </p>

            {errors.general && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm text-center"
              >
                {errors.general}
              </motion.div>
            )}

            <form onSubmit={handleSubmit} noValidate className="space-y-5">
              {/* Email Input */}
              <div className="space-y-1.5">
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-cyan-400 transition-colors" size={20} />
                  <input
                    type="email"
                    name="email"
                    placeholder="Email address"
                    value={formData.email}
                    onChange={handleChange}
                    className={`w-full pl-12 pr-5 py-3.5 bg-black/20 border rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all ${
                      errors.email 
                        ? 'border-red-500/50 focus:border-red-500' 
                        : 'border-white/10 focus:border-cyan-500/50'
                    }`}
                  />
                </div>
                {errors.email && (
                  <p className="text-red-400 text-xs ml-1">{errors.email}</p>
                )}
              </div>

              {/* Password Input */}
              <div className="space-y-1.5">
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-cyan-400 transition-colors" size={20} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    placeholder="Password"
                    value={formData.password}
                    onChange={handleChange}
                    className={`w-full pl-12 pr-12 py-3.5 bg-black/20 border rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all ${
                      errors.password 
                        ? 'border-red-500/50 focus:border-red-500' 
                        : 'border-white/10 focus:border-cyan-500/50'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-red-400 text-xs ml-1">{errors.password}</p>
                )}
              </div>

              {/* Forgot Password Link */}
              <div className="flex justify-end">
                <a
                  href="/forgot-password"
                  className="text-cyan-400 hover:text-cyan-300 transition-colors text-sm font-medium"
                >
                  Forgot Password?
                </a>
              </div>

              {/* Login Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-bold rounded-xl 
                         hover:from-cyan-500 hover:to-blue-500 hover:shadow-lg hover:shadow-cyan-500/20 
                         active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed 
                         flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
