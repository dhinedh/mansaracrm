// src/pages/admin/UserManagement.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  Users, 
  Plus, 
  Search, 
  Shield, 
  KeyRound, 
  Power, 
  Trash2, 
  Mail, 
  User, 
  Clock, 
  X, 
  CheckCircle2, 
  UserCog
} from 'lucide-react';

export default function UserManagement() {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState({ text: '', type: '' });

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [staffRole, setStaffRole] = useState('VIEWER');
  const [isActive, setIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/auth/staff');
      setStaff(res.data.data || []);
    } catch (err) {
      console.error('Error fetching staff users:', err);
      setMessage({ text: 'Failed to load staff directory.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage({ text: '', type: '' });
    try {
      await axios.post('/auth/staff/create', {
        name,
        email,
        password,
        staffRole
      });
      setMessage({ text: '✓ Staff user created successfully!', type: 'success' });
      setShowAddModal(false);
      resetForm();
      fetchStaff();
    } catch (err) {
      setMessage({ text: err.response?.data?.message || 'Failed to create staff user.', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;
    setSubmitting(true);
    setMessage({ text: '', type: '' });
    try {
      await axios.put(`/auth/staff/${selectedUser.id}`, {
        name,
        staffRole,
        isActive,
        password: password || undefined
      });
      setMessage({ text: '✓ Staff user updated successfully!', type: 'success' });
      setShowEditModal(false);
      resetForm();
      fetchStaff();
    } catch (err) {
      setMessage({ text: err.response?.data?.message || 'Failed to update staff user.', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this staff user?')) return;
    try {
      await axios.delete(`/auth/staff/${id}`);
      setMessage({ text: '✓ Staff user deleted successfully.', type: 'success' });
      fetchStaff();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete staff user.');
    }
  };

  const handleToggleActive = async (user) => {
    try {
      await axios.put(`/auth/staff/${user.id}`, {
        isActive: !user.isActive
      });
      setMessage({ text: `✓ Staff user successfully ${!user.isActive ? 'activated' : 'deactivated'}.`, type: 'success' });
      fetchStaff();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status.');
    }
  };

  const openAdd = () => {
    resetForm();
    setShowAddModal(true);
  };

  const openEdit = (user) => {
    setSelectedUser(user);
    setName(user.name);
    setEmail(user.email);
    setStaffRole(user.staffRole);
    setIsActive(user.isActive);
    setPassword('');
    setShowEditModal(true);
  };

  const resetForm = () => {
    setName('');
    setEmail('');
    setPassword('');
    setStaffRole('VIEWER');
    setIsActive(true);
    setSelectedUser(null);
  };

  const filteredStaff = staff.filter(s => {
    const term = search.toLowerCase();
    return (
      s.name.toLowerCase().includes(term) ||
      s.email.toLowerCase().includes(term) ||
      s.staffRole.toLowerCase().includes(term)
    );
  });

  const getRoleBadge = (role) => {
    const base = 'text-[9px] font-black px-2 py-0.5 rounded-full border uppercase tracking-wider';
    switch (role) {
      case 'ADMIN':
        return <span className={`${base} bg-purple-50 text-purple-750 border-purple-150`}>Super Admin</span>;
      case 'ECOM_MANAGER':
        return <span className={`${base} bg-blue-50 text-blue-750 border-blue-150`}>Ecom Manager</span>;
      case 'B2B_MANAGER':
        return <span className={`${base} bg-rose-50 text-rose-750 border-rose-150`}>B2B Manager</span>;
      case 'SUPPORT_AGENT':
        return <span className={`${base} bg-emerald-50 text-emerald-750 border-emerald-150`}>Support Agent</span>;
      case 'FINANCE_OFFICER':
        return <span className={`${base} bg-amber-50 text-amber-750 border-amber-150`}>Finance Officer</span>;
      default:
        return <span className={`${base} bg-slate-50 text-slate-700 border-slate-200`}>Viewer</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight">Staff Privilege Management</h2>
          <p className="text-slate-500 text-xs">Create admin users, assign granular roles, and restrict platform capabilities.</p>
        </div>
        <button
          onClick={openAdd}
          className="inline-flex items-center space-x-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg shadow-rose-200 transition-all self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Create Staff User</span>
        </button>
      </div>

      {message.text && (
        <div className={`px-4 py-3 rounded-xl text-xs font-semibold flex items-center space-x-2 ${
          message.type === 'success'
            ? 'bg-emerald-50 text-emerald-800 border border-emerald-100'
            : 'bg-rose-50 text-rose-800 border border-rose-100'
        }`}>
          {message.type === 'success' && <CheckCircle2 className="w-4 h-4 shrink-0" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Search Bar */}
      <div className="bg-white p-4 border border-slate-150 rounded-2xl shadow-sm">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by staff name, email, or role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 focus:border-rose-500 focus:bg-white rounded-xl focus:outline-none transition-all"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600" />
        </div>
      ) : filteredStaff.length === 0 ? (
        <div className="bg-white border border-slate-100 rounded-2xl p-12 text-center">
          <Users className="w-10 h-10 text-slate-200 mx-auto mb-3" />
          <p className="font-bold text-slate-400 text-sm">No staff users found.</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-150 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider">
                  <th className="p-4">Staff Member</th>
                  <th className="p-4">Email ID</th>
                  <th className="p-4">Privilege Role</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4">Last Login</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStaff.map((u) => (
                  <tr key={u.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors">
                    {/* Name */}
                    <td className="p-4">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-black uppercase text-xs">
                          {u.name.charAt(0)}
                        </div>
                        <span className="font-bold text-slate-800 text-xs">{u.name}</span>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="p-4">
                      <div className="flex items-center space-x-2 text-slate-600">
                        <Mail className="w-3.5 h-3.5 shrink-0" />
                        <span>{u.email}</span>
                      </div>
                    </td>

                    {/* Privilege Role */}
                    <td className="p-4">
                      {getRoleBadge(u.staffRole)}
                    </td>

                    {/* Status */}
                    <td className="p-4 text-center">
                      <button
                        onClick={() => handleToggleActive(u)}
                        className={`text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase transition-all select-none border cursor-pointer ${
                          u.isActive
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100'
                            : 'bg-rose-50 text-rose-700 border-rose-100 hover:bg-rose-100'
                        }`}
                      >
                        {u.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>

                    {/* Last Login */}
                    <td className="p-4">
                      <div className="flex items-center space-x-2 text-slate-600">
                        <Clock className="w-3.5 h-3.5 shrink-0" />
                        <span>{u.lastLogin ? new Date(u.lastLogin).toLocaleString() : 'Never logged in'}</span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => openEdit(u)}
                          className="p-1.5 hover:bg-slate-50 border border-slate-200 rounded-lg text-slate-650 hover:text-slate-800 flex items-center cursor-pointer transition-colors"
                          title="Edit User settings"
                        >
                          <UserCog className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(u.id)}
                          className="p-1.5 hover:bg-rose-50 border border-rose-100 rounded-lg text-rose-600 flex items-center cursor-pointer transition-colors"
                          title="Delete staff account"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white max-w-md w-full rounded-2xl shadow-xl overflow-hidden animate-zoom-in my-8">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-rose-50">
              <div>
                <h3 className="font-black text-slate-800 text-sm uppercase tracking-wide">Create Staff User</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Define privileges and assign platform capabilities</p>
              </div>
              <button 
                onClick={() => { setShowAddModal(false); resetForm(); }} 
                className="text-slate-400 hover:text-slate-600 font-bold p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-4 text-xs">
              <div className="space-y-1">
                <label className="block text-slate-500 font-bold mb-1">Full Name *</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 focus:border-rose-500 focus:bg-white rounded-xl focus:outline-none"
                    placeholder="e.g. Deepika Arun"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-slate-500 font-bold mb-1">Email Address *</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 focus:border-rose-500 focus:bg-white rounded-xl focus:outline-none"
                    placeholder="e.g. manager@mansarafoods.com"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-slate-500 font-bold mb-1">Login Password *</label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 focus:border-rose-500 focus:bg-white rounded-xl focus:outline-none"
                    placeholder="Min 6 characters"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-slate-500 font-bold mb-1">Privilege Role *</label>
                <div className="relative">
                  <Shield className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <select
                    value={staffRole}
                    onChange={e => setStaffRole(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 focus:border-rose-500 rounded-xl focus:outline-none cursor-pointer"
                  >
                    <option value="ADMIN">Super Admin (Full Access)</option>
                    <option value="B2B_MANAGER">B2B Manager (Inventory/Dealers/Billing)</option>
                    <option value="ECOM_MANAGER">E-Com Manager (Web shop content/Orders)</option>
                    <option value="FINANCE_OFFICER">Finance Officer (Billing Ledgers/Reports)</option>
                    <option value="SUPPORT_AGENT">Support Agent (Customer Support Desk)</option>
                    <option value="VIEWER">Viewer (Read-only Dashboard access)</option>
                  </select>
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-rose-600 hover:bg-rose-700 disabled:bg-rose-450 text-white font-bold py-3 rounded-xl shadow-lg transition-all text-xs flex items-center justify-center space-x-2 cursor-pointer"
                >
                  {submitting ? 'Creating Staff Account...' : 'Create Staff Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white max-w-md w-full rounded-2xl shadow-xl overflow-hidden animate-zoom-in my-8">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="font-black text-slate-800 text-sm uppercase tracking-wide">Edit Staff User</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Modify permissions or reset password for {selectedUser.email}</p>
              </div>
              <button 
                onClick={() => { setShowEditModal(false); resetForm(); }} 
                className="text-slate-400 hover:text-slate-600 font-bold p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="p-6 space-y-4 text-xs">
              <div className="space-y-1">
                <label className="block text-slate-500 font-bold mb-1">Full Name *</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 focus:border-rose-500 focus:bg-white rounded-xl focus:outline-none font-bold"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-slate-400 font-bold mb-1">Email Address (Cannot Change)</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    disabled
                    value={email}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 cursor-not-allowed font-medium"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-slate-500 font-bold mb-1">Update Password (Leave blank to keep current)</label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 focus:border-rose-500 focus:bg-white rounded-xl focus:outline-none"
                    placeholder="Enter new password to reset"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-slate-500 font-bold mb-1">Privilege Role *</label>
                <div className="relative">
                  <Shield className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <select
                    value={staffRole}
                    onChange={e => setStaffRole(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 focus:border-rose-500 rounded-xl focus:outline-none cursor-pointer font-bold"
                  >
                    <option value="ADMIN">Super Admin (Full Access)</option>
                    <option value="B2B_MANAGER">B2B Manager (Inventory/Dealers/Billing)</option>
                    <option value="ECOM_MANAGER">E-Com Manager (Web shop content/Orders)</option>
                    <option value="FINANCE_OFFICER">Finance Officer (Billing Ledgers/Reports)</option>
                    <option value="SUPPORT_AGENT">Support Agent (Customer Support Desk)</option>
                    <option value="VIEWER">Viewer (Read-only Dashboard access)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between py-2.5 border-y border-slate-100">
                <span className="font-bold text-slate-600">Account status active</span>
                <button
                  type="button"
                  onClick={() => setIsActive(!isActive)}
                  className={`inline-flex items-center space-x-1 text-[10px] font-black px-3 py-1.5 rounded-lg border uppercase cursor-pointer select-none transition-all ${
                    isActive
                      ? 'bg-emerald-50 border-emerald-100 text-emerald-700 hover:bg-emerald-100'
                      : 'bg-rose-50 border-rose-100 text-rose-700 hover:bg-rose-100'
                  }`}
                >
                  <Power className="w-3.5 h-3.5" />
                  <span>{isActive ? 'Active' : 'Deactivated'}</span>
                </button>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-rose-600 hover:bg-rose-700 disabled:bg-rose-450 text-white font-bold py-3 rounded-xl shadow-lg transition-all text-xs flex items-center justify-center space-x-2 cursor-pointer"
                >
                  {submitting ? 'Saving Changes...' : 'Save Settings'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
