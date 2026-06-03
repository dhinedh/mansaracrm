// src/pages/auth/ForgotPasswordPage.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Mail, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [tokenInfo, setTokenInfo] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const response = await axios.post('/auth/forgot-password', { email });
      setSuccess(true);
      // For developer/CRM testing friendliness, display the generated token
      if (response.data.developmentToken) {
        setTokenInfo(response.data.developmentToken);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-tr from-[#1c0f0d] via-[#2a1714] to-[#1c0f0d] flex flex-col justify-center items-center px-4">
      <div className="max-w-md w-full bg-white/95 backdrop-blur-md p-8 rounded-3xl shadow-2xl border border-white/10 relative overflow-hidden">
        
        <button
          onClick={() => navigate('/login')}
          className="absolute top-6 left-6 p-2 rounded-lg text-slate-500 hover:bg-slate-50 flex items-center space-x-1"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        <div className="text-center mb-8 mt-4">
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Reset Password</h2>
          <p className="text-slate-500 text-xs mt-1">Enter your registered email to get temporary reset token</p>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-100 text-rose-700 text-xs px-4 py-3 rounded-xl mb-6 font-semibold animate-pulse">
            {error}
          </div>
        )}

        {success ? (
          <div className="text-center py-6 space-y-4">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800">Instructions Generated</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              We have generated a password reset token for your account. In production, this would be emailed to you.
            </p>
            {tokenInfo && (
              <div className="bg-emerald-50/50 border border-emerald-100 text-emerald-800 p-4 rounded-2xl text-left space-y-2">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-emerald-600">Dev Reset Token:</span>
                <code className="block font-mono bg-white p-2 rounded border border-emerald-100/50 break-all select-all font-bold text-sm text-center">
                  {tokenInfo}
                </code>
              </div>
            )}
            
            <button
              onClick={() => navigate('/login')}
              className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-3 rounded-xl text-sm transition-all"
            >
              Back to Login
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="partner@mansarafoods.com"
                  className="w-full pl-11 pr-4 py-3 text-sm bg-slate-50 border border-slate-200 focus:border-rose-500 focus:bg-white rounded-xl focus:outline-none transition-all duration-200"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-rose-600/10 flex items-center justify-center space-x-2"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <span>Request Token</span>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
