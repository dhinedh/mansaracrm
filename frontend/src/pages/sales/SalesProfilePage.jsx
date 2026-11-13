// src/pages/sales/SalesProfilePage.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuthStore } from '../../store/authStore';
import { 
  User, Lock, ShieldCheck, MapPin, Phone, 
  Briefcase, CheckCircle2, AlertCircle, Save, RefreshCw 
} from 'lucide-react';

export default function SalesProfilePage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Profile form
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileStatus, setProfileStatus] = useState(null); // { type: 'success' | 'error', text: '' }

  // Password form (Module 1)
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPass, setChangingPass] = useState(false);
  const [passwordStatus, setPasswordStatus] = useState(null); // { type: 'success' | 'error', text: '' }

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/field-sales/profile');
      if (res.data?.success) {
        setProfile(res.data.data);
        setName(res.data.data.user?.name || '');
        setPhone(res.data.data.user?.phone || res.data.data.phone || '');
        setEmergencyContact(res.data.data.emergencyContact || '');
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileStatus(null);
    try {
      const res = await axios.put('/field-sales/profile', {
        name,
        phone,
        emergencyContact
      });
      if (res.data?.success) {
        setProfileStatus({ 
          type: 'success', 
          text: res.data.message || 'Profile details updated successfully!' 
        });
        // Sync user state in authStore if name/phone changed
        useAuthStore.getState().fetchCurrentUser?.();
        fetchProfile();
      } else {
        setProfileStatus({ 
          type: 'error', 
          text: res.data?.message || 'Failed to update profile' 
        });
      }
    } catch (err) {
      setProfileStatus({ 
        type: 'error', 
        text: err.response?.data?.message || 'Failed to update profile. Please try again.' 
      });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordStatus(null);

    if (!currentPassword) {
      setPasswordStatus({ type: 'error', text: 'Please enter your current password' });
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      setPasswordStatus({ type: 'error', text: 'New password must be at least 6 characters long' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordStatus({ type: 'error', text: 'New password and confirm password do not match' });
      return;
    }

    setChangingPass(true);
    try {
      const res = await axios.post('/field-sales/change-password', {
        currentPassword,
        newPassword
      });
      if (res.data?.success) {
        setPasswordStatus({ 
          type: 'success', 
          text: 'Password changed successfully! Use your new password on next login.' 
        });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPasswordStatus({ 
          type: 'error', 
          text: res.data?.message || 'Failed to change password' 
        });
      }
    } catch (err) {
      setPasswordStatus({ 
        type: 'error', 
        text: err.response?.data?.message || 'Failed to change password. Please verify your current password.' 
      });
    } finally {
      setChangingPass(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          Salesperson Profile & Account Settings
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Module 1 & 34: Manage profile credentials, security password and assigned beat configuration
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Profile Card */}
        <div className="bg-white border border-slate-200 p-6 rounded-3xl space-y-4 shadow-xs">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-200">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl border border-amber-200">
              <User className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">Employee Information</h3>
              <p className="text-xs text-slate-500">{profile?.employeeCode || 'SALES-001'} • {profile?.designation || 'Senior Area Sales Executive'}</p>
            </div>
          </div>

          {/* Inline Profile Alert Banner */}
          {profileStatus && (
            <div className={`p-3 rounded-2xl text-xs flex items-center gap-2.5 animate-in fade-in ${
              profileStatus.type === 'success' 
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' 
                : 'bg-rose-50 border border-rose-200 text-rose-800'
            }`}>
              {profileStatus.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span className="font-semibold flex-1">{profileStatus.text}</span>
            </div>
          )}

          <form onSubmit={handleUpdateProfile} className="space-y-3 text-xs">
            <div>
              <label className="block font-bold text-slate-600 uppercase mb-1">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (profileStatus) setProfileStatus(null);
                }}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-amber-500 shadow-2xs"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-600 uppercase mb-1">Official Email Address</label>
              <input
                type="email"
                disabled
                value={profile?.user?.email || 'sales@mansarafoods.com'}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-500 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-600 uppercase mb-1">Mobile Phone Number</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  if (profileStatus) setProfileStatus(null);
                }}
                placeholder="+91 98765 12345"
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-amber-500 shadow-2xs"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-600 uppercase mb-1">Emergency Contact / Remarks</label>
              <input
                type="text"
                value={emergencyContact}
                onChange={(e) => {
                  setEmergencyContact(e.target.value);
                  if (profileStatus) setProfileStatus(null);
                }}
                placeholder="Name & Contact number"
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-amber-500 shadow-2xs"
              />
            </div>

            <div className="pt-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase">Assigned Territory Beat:</span>
              <p className="text-xs font-semibold text-amber-700 mt-0.5">
                {profile?.activeBeatRoute || 'Beat A - North Retail Hub'}
              </p>
            </div>

            <button
              type="submit"
              disabled={savingProfile}
              className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md active:scale-95 mt-4 disabled:opacity-60"
            >
              {savingProfile ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>{savingProfile ? 'Saving Changes...' : 'Update Profile Details'}</span>
            </button>
          </form>
        </div>

        {/* Change Password Card */}
        <div className="bg-white border border-slate-200 p-6 rounded-3xl space-y-4 shadow-xs">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-200">
            <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl border border-rose-200">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">Security & Password</h3>
              <p className="text-xs text-slate-500">Update your salesperson sign-in password</p>
            </div>
          </div>

          {/* Inline Password Alert Banner */}
          {passwordStatus && (
            <div className={`p-3 rounded-2xl text-xs flex items-center gap-2.5 animate-in fade-in ${
              passwordStatus.type === 'success' 
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' 
                : 'bg-rose-50 border border-rose-200 text-rose-800'
            }`}>
              {passwordStatus.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span className="font-semibold flex-1">{passwordStatus.text}</span>
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-3 text-xs">
            <div>
              <label className="block font-bold text-slate-600 uppercase mb-1">Current Password *</label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => {
                  setCurrentPassword(e.target.value);
                  if (passwordStatus) setPasswordStatus(null);
                }}
                placeholder="••••••••"
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-rose-500 shadow-2xs"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-600 uppercase mb-1">New Password *</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  if (passwordStatus) setPasswordStatus(null);
                }}
                placeholder="••••••••"
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-rose-500 shadow-2xs"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-600 uppercase mb-1">Confirm New Password *</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (passwordStatus) setPasswordStatus(null);
                }}
                placeholder="••••••••"
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-rose-500 shadow-2xs"
              />
            </div>

            <button
              type="submit"
              disabled={changingPass}
              className="w-full bg-rose-600 hover:bg-rose-500 text-white font-black py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md active:scale-95 mt-6 text-white-forced disabled:opacity-60"
            >
              {changingPass ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
              <span>{changingPass ? 'Updating Security...' : 'Change Password'}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
