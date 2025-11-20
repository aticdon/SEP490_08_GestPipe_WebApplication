
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
  const [emailError, setEmailError] = useState('');
  const [otpError, setOtpError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Step 1: Send OTP
  const handleSendOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');
    setEmailError('');

    // Client-side validation
    if (!email.trim()) {
      setEmailError('Email is required');
      setLoading(false);
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setEmailError('Please enter a valid email address');
      setLoading(false);
      return;
    }

    try {
      const res = await authService.sendForgotPasswordOTP(email);
      if (res.success) {
        setStep(2);
        setMessage('OTP has been sent to your email. Please check your inbox.');
      } else {
        const errorData = res;
        const errorType = errorData?.errorType;
        
        if (errorType === 'email_not_found') {
          setEmailError(errorData.message || 'Email not found in system');
        } else {
          setError(errorData.message || 'Failed to send OTP');
        }
      }
    } catch (err) {
      const errorData = err?.response?.data;
      const errorType = errorData?.errorType;
      
      if (errorType === 'email_not_found') {
        setEmailError(errorData.message || 'Email not found in system');
      } else {
        setError(errorData?.message || 'Failed to send OTP');
      }
    }
    setLoading(false);
  };

  // Step 2: Verify OTP
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');
    setOtpError('');

    // Client-side validation
    if (!otp.trim()) {
      setOtpError('OTP is required');
      setLoading(false);
      return;
    }

    if (!/^\d{6}$/.test(otp.trim())) {
      setOtpError('Please enter a valid 6-digit OTP');
      setLoading(false);
      return;
    }

    try {
      const res = await authService.verifyForgotPasswordOTP(email, otp);
      if (res.success) {
        setStep(3);
        setMessage('OTP is valid. You can set a new password.');
      } else {
        const errorData = res;
        const errorType = errorData?.errorType;
        
        if (errorType === 'otp_not_found' || errorType === 'invalid_otp' || errorType === 'otp_expired') {
          setOtpError(errorData.message || 'Invalid or expired OTP');
        } else {
          setError(errorData.message || 'Failed to verify OTP');
        }
      }
    } catch (err) {
      const errorData = err?.response?.data;
      const errorType = errorData?.errorType;
      
      if (errorType === 'otp_not_found' || errorType === 'invalid_otp' || errorType === 'otp_expired') {
        setOtpError(errorData.message || 'Invalid or expired OTP');
      } else {
        setError(errorData?.message || 'Failed to verify OTP');
      }
    }
    setLoading(false);
  };

  // Step 3: Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');
    setPasswordError('');
    setConfirmPasswordError('');

    // Client-side validation
    let hasErrors = false;

    if (!newPassword.trim()) {
      setPasswordError('New password is required');
      hasErrors = true;
    } else if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      hasErrors = true;
    }

    if (!confirmPassword.trim()) {
      setConfirmPasswordError('Confirm password is required');
      hasErrors = true;
    } else if (newPassword.trim() && newPassword !== confirmPassword) {
      setConfirmPasswordError('Passwords do not match');
      hasErrors = true;
    }

    if (hasErrors) {
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
            <form onSubmit={handleSendOTP} noValidate className="space-y-5 flex flex-col items-center">
              <div className="w-full">
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={e => {
                    setEmail(e.target.value);
                    setEmailError(''); // Clear error when user types
                  }}
                  className={`w-full px-5 py-3.5 bg-gray-200 rounded-xl text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 transition-all ${
                    emailError ? 'ring-2 ring-yellow-500' : 'focus:ring-cyan-primary/50'
                  }`}
                />
                {emailError && (
                  <p className="text-yellow-500 text-sm mt-1.5 ml-1">{emailError}</p>
                )}
              </div>
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
            <form onSubmit={handleVerifyOTP} noValidate className="space-y-5 flex flex-col items-center">
              <div className="w-full">
                <input
                  type="text"
                  placeholder="Enter OTP"
                  value={otp}
                  onChange={e => {
                    setOtp(e.target.value);
                    setOtpError(''); // Clear error when user types
                  }}
                  className={`w-full px-5 py-3.5 bg-gray-200 rounded-xl text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 transition-all ${
                    otpError ? 'ring-2 ring-yellow-500' : 'focus:ring-cyan-primary/50'
                  }`}
                />
                {otpError && (
                  <p className="text-yellow-500 text-sm mt-1.5 ml-1">{otpError}</p>
                )}
              </div>
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
            <form onSubmit={handleResetPassword} noValidate className="space-y-5 flex flex-col items-center">
              <div className="w-full">
                <input
                  type="password"
                  placeholder="New Password"
                  value={newPassword}
                  onChange={e => {
                    setNewPassword(e.target.value);
                    setPasswordError(''); // Clear error when user types
                  }}
                  className={`w-full px-5 py-3.5 bg-gray-200 rounded-xl text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 transition-all ${
                    passwordError ? 'ring-2 ring-yellow-500' : 'focus:ring-cyan-primary/50'
                  }`}
                />
                {passwordError && (
                  <p className="text-yellow-500 text-sm mt-1.5 ml-1">{passwordError}</p>
                )}
              </div>
              <div className="w-full">
                <input
                  type="password"
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={e => {
                    setConfirmPassword(e.target.value);
                    setConfirmPasswordError(''); // Clear error when user types
                  }}
                  className={`w-full px-5 py-3.5 bg-gray-200 rounded-xl text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 transition-all ${
                    confirmPasswordError ? 'ring-2 ring-yellow-500' : 'focus:ring-cyan-primary/50'
                  }`}
                />
                {confirmPasswordError && (
                  <p className="text-yellow-500 text-sm mt-1.5 ml-1">{confirmPasswordError}</p>
                )}
              </div>
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
