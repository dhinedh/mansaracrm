// src/pages/auth/ForgotPasswordPage.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  MessageSquare, 
  Lock, 
  ArrowLeft, 
  Loader2, 
  CheckCircle2, 
  KeyRound, 
  RefreshCw,
  Mail,
  ShieldCheck
} from 'lucide-react';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Request OTP, 2: Enter OTP & Reset, 3: Success
  const [identifier, setIdentifier] = useState('');
  const [maskedPhone, setMaskedPhone] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [devOtp, setDevOtp] = useState('');
  
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');

  // Step 1: Submit email/phone to request WhatsApp OTP
  const handleRequestOtp = async (e) => {
    e?.preventDefault();
    if (!identifier.trim()) return;

    setLoading(true);
    setError('');
    setInfoMessage('');

    try {
      const response = await axios.post('/auth/forgot-password', {
        identifier: identifier.trim()
      });

      const data = response.data?.data || {};
      setMaskedPhone(data.maskedPhone || 'your registered WhatsApp number');
      setUserEmail(data.email || identifier);
      if (data.developmentOtp) {
        setDevOtp(data.developmentOtp);
      }

      setStep(2);
      setInfoMessage(response.data?.message || 'OTP sent successfully to your WhatsApp.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP. Please check your registered email or phone number.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Submit OTP & new password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!otp.trim()) {
      setError('Please enter the 6-digit OTP sent to your WhatsApp.');
      return;
    }
    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please verify.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await axios.post('/auth/reset-password', {
        identifier: userEmail || identifier,
        token: otp.trim(),
        newPassword
      });

      setStep(3);
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or expired OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP handler
  const handleResendOtp = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.post('/auth/forgot-password', {
        identifier: userEmail || identifier
      });
      const data = response.data?.data || {};
      if (data.developmentOtp) {
        setDevOtp(data.developmentOtp);
      }
      setInfoMessage('A new OTP has been dispatched to your WhatsApp.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend OTP.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-tr from-[#1c0f0d] via-[#2a1714] to-[#1c0f0d] flex flex-col justify-center items-center px-4 py-8">
      <div className="max-w-md w-full bg-white/95 backdrop-blur-md p-8 rounded-3xl shadow-2xl border border-white/10 relative overflow-hidden">
        
        {/* Top Back Button */}
        <button
          onClick={() => {
            if (step === 2) {
              setStep(1);
              setError('');
              setInfoMessage('');
            } else {
              navigate('/login');
            }
          }}
          className="absolute top-6 left-6 p-2 rounded-xl text-slate-500 hover:bg-slate-100/80 transition-colors flex items-center space-x-1"
          title="Back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        {/* Header Section */}
        <div className="text-center mb-6 mt-4">
          <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-inner border border-emerald-100">
            {step === 3 ? (
              <CheckCircle2 className="w-7 h-7" />
            ) : step === 2 ? (
              <KeyRound className="w-7 h-7" />
            ) : (
              <MessageSquare className="w-7 h-7" />
            )}
          </div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">
            {step === 3 ? 'Password Reset Complete' : step === 2 ? 'Verify WhatsApp OTP' : 'Reset Password'}
          </h2>
          <p className="text-slate-500 text-xs mt-1 leading-relaxed">
            {step === 3
              ? 'Your password has been updated successfully.'
              : step === 2
              ? `Enter the 6-digit OTP sent to your WhatsApp (${maskedPhone})`
              : 'Enter your registered email or WhatsApp phone number'}
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-rose-50 border border-rose-100 text-rose-700 text-xs px-4 py-3 rounded-xl mb-5 font-semibold leading-snug">
            {error}
          </div>
        )}

        {/* Info Alert */}
        {infoMessage && step === 2 && (
          <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs px-4 py-3 rounded-xl mb-5 font-semibold leading-snug">
            {infoMessage}
          </div>
        )}

        {/* STEP 1: Request OTP */}
        {step === 1 && (
          <form onSubmit={handleRequestOtp} className="space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                Registered Email or WhatsApp Number
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 flex items-center space-x-1">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="e.g. partner@mansarafoods.com or 9876543210"
                  className="w-full pl-11 pr-4 py-3 text-sm bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-xl focus:outline-none transition-all duration-200"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-emerald-600/20 flex items-center justify-center space-x-2 transition-all active:scale-[0.99]"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <MessageSquare className="w-4 h-4" />
                  <span>Send OTP via WhatsApp</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* STEP 2: Verify OTP & New Password */}
        {step === 2 && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            
            {/* Dev OTP Box for instant testing */}
            {devOtp && (
              <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-3 text-amber-900 text-xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-[10px] uppercase tracking-wider text-amber-700 flex items-center space-x-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Dev WhatsApp OTP:</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setOtp(devOtp)}
                    className="text-[10px] font-bold text-amber-800 underline hover:text-amber-950"
                  >
                    Auto-Fill
                  </button>
                </div>
                <code className="block font-mono bg-white/90 p-2 rounded-lg border border-amber-200 text-center font-bold text-base tracking-widest text-amber-950 select-all">
                  {devOtp}
                </code>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                6-Digit WhatsApp OTP
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="123456"
                  className="w-full pl-11 pr-4 py-3 text-base font-mono font-bold tracking-widest bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-xl focus:outline-none transition-all duration-200 text-slate-800"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                New Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-4 py-3 text-sm bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-xl focus:outline-none transition-all duration-200"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Confirm New Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-4 py-3 text-sm bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-xl focus:outline-none transition-all duration-200"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-emerald-600/20 flex items-center justify-center space-x-2 transition-all active:scale-[0.99] mt-2"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <span>Verify & Reset Password</span>
              )}
            </button>

            <div className="flex items-center justify-between text-xs pt-2">
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={loading}
                className="text-emerald-600 font-bold hover:underline flex items-center space-x-1"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Resend OTP</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setStep(1);
                  setOtp('');
                  setError('');
                }}
                className="text-slate-500 font-medium hover:underline"
              >
                Change Email / Phone
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: Success Screen */}
        {step === 3 && (
          <div className="text-center py-4 space-y-5">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-md">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-800">Password Reset Successful</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Your password has been changed. You can now log into your B2B Partner account with your new password.
              </p>
            </div>

            <button
              onClick={() => navigate('/login')}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 rounded-xl text-sm transition-all shadow-md active:scale-[0.99]"
            >
              Back to Login
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
