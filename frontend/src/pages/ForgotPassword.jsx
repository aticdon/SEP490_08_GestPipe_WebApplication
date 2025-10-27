
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import logo from '../assets/images/Logo.png';
import backgroundImage from '../assets/backgrounds/background.jpg';


const ForgotPassword = () => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Step 1: Send OTP
  const handleSendOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');
    try {
      const res = await authService.sendForgotPasswordOTP(email);
      if (res.success) {
        setStep(2);
        setMessage('OTP has been sent to your email. Please check your inbox.');
      } else {
        setError(res.message || 'Failed to send OTP');
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to send OTP');
    }
    setLoading(false);
  };

  // Step 2: Verify OTP
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');
    try {
      const res = await authService.verifyForgotPasswordOTP(email, otp);
      if (res.success) {
        setStep(3);
        setMessage('OTP is valid. You can set a new password.');
      } else {
        setError(res.message || 'Invalid or expired OTP');
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to verify OTP');
    }
    setLoading(false);
  };

  // Step 3: Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }
    try {
      const res = await authService.resetForgotPassword(email, newPassword);
      if (res.success) {
        setMessage('Password changed successfully! Redirecting to login...');
        setTimeout(() => {
          navigate('/');
        }, 1200);
      } else {
        setError(res.message || 'Failed to change password');
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to change password');
    }
    setLoading(false);
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
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/20"></div>
      <div className="relative z-10 w-full max-w-md px-6">
        {/* Logo */}
        <div className="text-center mb-8">
          <img src={logo} alt="GestPipe Logo" className="mx-auto w-96 mb-8" />
        </div>
        <div className="backdrop-blur-md rounded-2xl p-10 shadow-2xl border border-gray-600/30" style={{
          background: 'linear-gradient(135deg, #232a34 0%, #2b3647 60%, #1a2636 100%)',
          color: '#eaf6fb'
        }}>
          <h2 className="text-4xl font-bold text-cyan-primary text-center mb-8 capitalize tracking-wide whitespace-nowrap">
            Forgot Password
          </h2>
          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-700 text-sm text-center">
              {error}
            </div>
          )}
          {message && (
            <div className="mb-4 p-3 bg-green-500/20 border border-green-500/50 rounded-lg text-green-700 text-sm text-center">
              {message}
            </div>
          )}
          {step === 1 && (
            <form onSubmit={handleSendOTP} className="space-y-5 flex flex-col items-center">
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full px-5 py-3.5 bg-gray-200 rounded-xl text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-primary/50 transition-all"
              />
              <button
                type="submit"
                className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-cyan-primary text-white font-bold rounded-xl hover:shadow-lg hover:shadow-cyan-primary/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-lg"
                disabled={loading}
              >
                {loading ? 'Sending...' : 'Send OTP'}
              </button>
            </form>
          )}
          {step === 2 && (
            <form onSubmit={handleVerifyOTP} className="space-y-5 flex flex-col items-center">
              <input
                type="text"
                placeholder="Enter OTP"
                value={otp}
                onChange={e => setOtp(e.target.value)}
                required
                className="w-full px-5 py-3.5 bg-gray-200 rounded-xl text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-primary/50 transition-all"
              />
              <button
                type="submit"
                className="w-full py-3.5 bg-gradient-to-r from-green-600 to-cyan-primary text-white font-bold rounded-xl hover:shadow-lg hover:shadow-cyan-primary/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-lg"
                disabled={loading}
              >
                {loading ? 'Verifying...' : 'Verify OTP'}
              </button>
            </form>
          )}
          {step === 3 && (
            <form onSubmit={handleResetPassword} className="space-y-5 flex flex-col items-center">
              <input
                type="password"
                placeholder="New Password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-5 py-3.5 bg-gray-200 rounded-xl text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-primary/50 transition-all"
              />
              <input
                type="password"
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-5 py-3.5 bg-gray-200 rounded-xl text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-primary/50 transition-all"
              />
              <button
                type="submit"
                className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-cyan-primary text-white font-bold rounded-xl hover:shadow-lg hover:shadow-cyan-primary/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-lg"
                disabled={loading}
              >
                {loading ? 'Changing...' : 'Change Password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
