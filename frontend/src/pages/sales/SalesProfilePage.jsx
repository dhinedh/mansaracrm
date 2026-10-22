// src/pages/sales/SalesProfilePage.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  User, Lock, ShieldCheck, MapPin, Phone, 
  Briefcase, CheckCircle2, AlertCircle, Save 
} from 'lucide-react';

export default function SalesProfilePage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Profile form
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  // Password form (Module 1)
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPass, setChangingPass] = useState(false);

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
    try {
      const res = await axios.put('/field-sales/profile', {
        name,
        phone,
        emergencyContact
      });
      if (res.data?.success) {
        alert('Profile details updated successfully!');
        fetchProfile();
      }
    } catch (err) {
      alert('Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      alert('New password and confirm password do not match');
      return;
    }

    setChangingPass(true);
    try {
      const res = await axios.post('/field-sales/change-password', {
        currentPassword,
        newPassword
      });
      if (res.data?.success) {
        alert('Password changed successfully!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to change password');
    } finally {
      setChangingPass(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
          Salesperson Profile & Account Settings
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Module 1 & 34: Manage profile credentials, security password and assigned beat configuration
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Profile Card */}
        <div className="bg-slate-800/80 border border-white/10 p-6 rounded-3xl space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-white/10">
            <div className="p-3 bg-amber-500/10 text-amber-400 rounded-2xl">
              <User className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">Employee Information</h3>
              <p className="text-xs text-slate-400">{profile?.employeeCode || 'SALES-001'} • {profile?.designation || 'Field Executive'}</p>
            </div>
          </div>

          <form onSubmit={handleUpdateProfile} className="space-y-3 text-xs">
            <div>
              <label className="block font-bold text-slate-300 uppercase mb-1">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-300 uppercase mb-1">Official Email Address</label>
              <input
                type="email"
                disabled
                value={profile?.user?.email || 'sales@mansarafoods.com'}
                className="w-full bg-slate-900/50 border border-white/5 rounded-xl px-3 py-2 text-xs text-slate-400 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-300 uppercase mb-1">Mobile Phone Number</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 12345"
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-300 uppercase mb-1">Emergency Contact / Remarks</label>
              <input
                type="text"
                value={emergencyContact}
                onChange={(e) => setEmergencyContact(e.target.value)}
                placeholder="Name & Contact number"
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="pt-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Assigned Territory Beat:</span>
              <p className="text-xs font-semibold text-amber-400 mt-0.5">
                {profile?.activeBeatRoute || 'Beat A - North Chennai Commercial Beat'}
              </p>
            </div>

            <button
              type="submit"
              disabled={savingProfile}
              className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md active:scale-95 mt-4"
            >
              <Save className="w-4 h-4" />
              <span>{savingProfile ? 'Saving Changes...' : 'Update Profile Details'}</span>
            </button>
          </form>
        </div>

        {/* Change Password Card */}
        <div className="bg-slate-800/80 border border-white/10 p-6 rounded-3xl space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-white/10">
            <div className="p-3 bg-rose-500/10 text-rose-400 rounded-2xl">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">Security & Password</h3>
              <p className="text-xs text-slate-400">Update your salesperson sign-in password</p>
            </div>
          </div>

          <form onSubmit={handleChangePassword} className="space-y-3 text-xs">
            <div>
              <label className="block font-bold text-slate-300 uppercase mb-1">Current Password *</label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-300 uppercase mb-1">New Password *</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-300 uppercase mb-1">Confirm New Password *</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
              />
            </div>

            <button
              type="submit"
              disabled={changingPass}
              className="w-full bg-rose-600 hover:bg-rose-500 text-white font-black py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md active:scale-95 mt-6"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{changingPass ? 'Updating Security...' : 'Change Password'}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
