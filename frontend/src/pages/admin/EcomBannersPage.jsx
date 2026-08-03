// src/pages/admin/EcomBannersPage.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  Image as ImageIcon, 
  Plus, 
  Trash2, 
  Edit3, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle,
  FolderPlus,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { BACKEND_URL } from '../../store/authStore';

export default function EcomBannersPage() {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all'); // all, home, products, about, contact
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [page, setPage] = useState('home');
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [image, setImage] = useState('');
  const [mobileImage, setMobileImage] = useState('');
  const [link, setLink] = useState('');
  const [order, setOrder] = useState('0');
  const [active, setActive] = useState(true);

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/ecom/banners');
      if (res.data.success) {
        setBanners(res.data.banners || []);
      }
    } catch (err) {
      console.error(err);
      setMessage({ text: 'Failed to fetch banners', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingBanner(null);
    setPage(activeTab === 'all' ? 'home' : activeTab);
    setTitle('');
    setSubtitle('');
    setImage('');
    setMobileImage('');
    setLink('');
    setOrder('0');
    setActive(true);
    setShowFormModal(true);
  };

  const handleOpenEdit = (banner) => {
    setEditingBanner(banner);
    setPage(banner.page || 'home');
    setTitle(banner.title || '');
    setSubtitle(banner.subtitle || '');
    setImage(banner.image || '');
    setMobileImage(banner.mobileImage || '');
    setLink(banner.link || '');
    setOrder(String(banner.order || 0));
    setActive(banner.active !== false);
    setShowFormModal(true);
  };

  const handleSaveBanner = async (e) => {
    e.preventDefault();
    if (!image.trim()) {
      setMessage({ text: 'Banner image is required', type: 'error' });
      return;
    }
    setSubmitting(true);
    setMessage({ text: '', type: '' });

    const payload = {
      page,
      title: title.trim(),
      subtitle: subtitle.trim(),
      image: image.trim(),
      mobileImage: mobileImage.trim(),
      link: link.trim(),
      order: parseInt(order) || 0,
      active
    };

    try {
      if (editingBanner) {
        await axios.put(`/ecom/banners/${editingBanner._id}`, payload);
        setMessage({ text: 'Banner updated successfully!', type: 'success' });
      } else {
        await axios.post('/ecom/banners', payload);
        setMessage({ text: 'Banner created successfully!', type: 'success' });
      }
      setShowFormModal(false);
      fetchBanners();
    } catch (err) {
      setMessage({ text: err.response?.data?.message || 'Failed to save banner', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteBanner = async (id) => {
    if (!window.confirm('Are you sure you want to delete this banner?')) return;
    try {
      await axios.delete(`/ecom/banners/${id}`);
      setMessage({ text: 'Banner deleted successfully!', type: 'success' });
      fetchBanners();
    } catch (err) {
      console.error(err);
      setMessage({ text: 'Failed to delete banner', type: 'error' });
    }
  };

  const handleToggleActive = async (banner) => {
    const nextActive = banner.active === false;
    try {
      await axios.put(`/ecom/banners/${banner._id}`, { active: nextActive });
      setBanners(prev => prev.map(b => b._id === banner._id ? { ...b, active: nextActive } : b));
      setMessage({ text: `Banner ${nextActive ? 'activated' : 'deactivated'} successfully!`, type: 'success' });
    } catch (err) {
      console.error(err);
      setMessage({ text: 'Failed to update status', type: 'error' });
    }
  };

  const filteredBanners = banners.filter(b => 
    activeTab === 'all' ? true : b.page === activeTab
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-rose-600" />
            Banners & Hero
          </h2>
          <p className="text-slate-500 text-xs mt-0.5">Control front-page promotional slides and secondary landing page hero banners.</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center space-x-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg shadow-rose-200 transition-all self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Banner</span>
        </button>
      </div>

      {/* Message feedback */}
      {message.text && (
        <div className={`px-4 py-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
          message.type === 'success'
            ? 'bg-emerald-50 text-emerald-800 border border-emerald-100'
            : 'bg-rose-50 text-rose-800 border border-rose-100'
        }`}>
          {message.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          {message.text}
          <button onClick={() => setMessage({ text: '', type: '' })} className="ml-auto text-slate-400 hover:text-slate-600 font-bold">✕</button>
        </div>
      )}

      {/* Section Tabs & Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-1">
        <div className="flex flex-wrap gap-1">
          {['all', 'home', 'products', 'about', 'contact'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer ${
                activeTab === tab 
                  ? 'bg-rose-600 text-white shadow-md' 
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-600'
              }`}
            >
              {tab === 'all' ? 'All Banners' : `${tab} page`}
            </button>
          ))}
        </div>
        <button
          onClick={fetchBanners}
          className="inline-flex items-center space-x-1.5 text-xs bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 px-4 py-2 rounded-xl transition-colors cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Listing Grid */}
      {loading ? (
        <div className="flex justify-center items-center py-20 bg-white border border-slate-150 rounded-2xl">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600"></div>
        </div>
      ) : filteredBanners.length === 0 ? (
        <div className="py-24 text-center text-xs text-slate-400 font-semibold italic bg-white border border-slate-150 rounded-2xl flex flex-col items-center justify-center gap-2">
          <ImageIcon className="w-8 h-8 text-slate-350 stroke-1" />
          <span>No banners found in this category. Click Add New Banner to get started.</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBanners.map((banner) => (
            <div key={banner._id} className="bg-white border border-slate-150 rounded-2xl shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow relative">
              {/* Status and Sort Order Badges */}
              <div className="absolute top-3 left-3 z-10 flex gap-1">
                <span className="bg-slate-900/80 backdrop-blur-sm text-white text-[8px] font-black uppercase px-2 py-0.5 rounded-full shadow-sm">
                  Order: {banner.order || 0}
                </span>
                <span className="bg-rose-600/90 backdrop-blur-sm text-white text-[8px] font-black uppercase px-2 py-0.5 rounded-full shadow-sm capitalize">
                  {banner.page}
                </span>
              </div>
              <div className="absolute top-3 right-3 z-10">
                <span className={`inline-block px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase border ${
                  banner.active !== false 
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                    : 'bg-slate-100 text-slate-600 border-slate-200'
                }`}>
                  {banner.active !== false ? 'Active' : 'Inactive'}
                </span>
              </div>

              {/* Banner Image */}
              <div className="h-40 bg-slate-50 border-b border-slate-100 flex items-center justify-center overflow-hidden">
                {banner.image ? (
                  <img
                    src={banner.image.startsWith('http') || banner.image.startsWith('data:') ? banner.image : `${BACKEND_URL}${banner.image.startsWith('/') ? '' : '/'}${banner.image}`}
                    alt={banner.title}
                    className="object-cover h-full w-full"
                    onError={(e) => { e.target.src = 'https://placehold.co/600x300?text=Banner+Image'; }}
                  />
                ) : (
                  <div className="text-slate-300 flex flex-col items-center space-y-1">
                    <ImageIcon className="w-10 h-10 stroke-1" />
                    <span className="text-[9px] uppercase tracking-wider font-bold">No Image</span>
                  </div>
                )}
              </div>

              {/* Detail Contents */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-1">
                  <h3 className="font-bold text-slate-800 text-xs truncate">{banner.title || 'Untitled Banner'}</h3>
                  <p className="text-[11px] text-slate-400 line-clamp-2 h-7 leading-relaxed">
                    {banner.subtitle || 'No subtitle provided.'}
                  </p>
                  {banner.link && (
                    <div className="text-[10px] text-slate-500 font-semibold truncate pt-1">
                      Link: <span className="text-blue-600">{banner.link}</span>
                    </div>
                  )}
                </div>

                <div className="flex space-x-2 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => handleToggleActive(banner)}
                    className={`flex-1 inline-flex items-center justify-center px-2 py-1.5 rounded-xl border text-[10px] font-bold transition-colors cursor-pointer ${
                      banner.active !== false
                        ? 'bg-rose-50 text-rose-600 border-rose-100 hover:bg-rose-100'
                        : 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100'
                    }`}
                  >
                    {banner.active !== false ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    onClick={() => handleOpenEdit(banner)}
                    className="flex-1 inline-flex items-center justify-center space-x-1 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 py-1.5 rounded-xl text-[10px] font-bold cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => handleDeleteBanner(banner._id)}
                    className="inline-flex items-center justify-center bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-100 p-2 rounded-xl cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Form Modal */}
      {showFormModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white max-w-md w-full rounded-2xl shadow-xl overflow-hidden animate-zoom-in my-8">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-rose-50">
              <div className="flex items-center space-x-2">
                <FolderPlus className="w-5 h-5 text-rose-600" />
                <h3 className="font-black text-slate-800 text-sm uppercase tracking-wide">
                  {editingBanner ? 'Edit Banner Configuration' : 'Create Banner Promotion'}
                </h3>
              </div>
              <button 
                onClick={() => setShowFormModal(false)} 
                className="text-slate-400 hover:text-slate-600 font-bold p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveBanner} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-500 font-bold mb-1">Target Page *</label>
                  <select
                    value={page}
                    onChange={(e) => setPage(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-rose-500 rounded-xl focus:outline-none cursor-pointer font-bold"
                  >
                    <option value="home">Home (Carousel)</option>
                    <option value="products">Products List</option>
                    <option value="about">About Us</option>
                    <option value="contact">Contact Us</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-500 font-bold mb-1">Sort Order Position</label>
                  <input
                    type="number"
                    value={order}
                    onChange={(e) => setOrder(e.target.value)}
                    placeholder="e.g. 0, 1, 2"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-rose-500 focus:bg-white rounded-xl focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-500 font-bold mb-1">Banner Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Millet Porridge 20% Off"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-rose-500 focus:bg-white rounded-xl focus:outline-none font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-500 font-bold mb-1">Banner Subtitle / Description</label>
                <input
                  type="text"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  placeholder="e.g. Enjoy healthy morning breakfasts with traditional grains."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-rose-500 focus:bg-white rounded-xl focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-500 font-bold mb-1">Desktop Image URL *</label>
                <input
                  type="text"
                  required
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  placeholder="e.g. /images/banners/slider1.jpg"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-rose-500 focus:bg-white rounded-xl focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-500 font-bold mb-1">Mobile Image URL (Optional)</label>
                <input
                  type="text"
                  value={mobileImage}
                  onChange={(e) => setMobileImage(e.target.value)}
                  placeholder="e.g. /images/banners/slider1_mobile.jpg"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-rose-500 focus:bg-white rounded-xl focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-500 font-bold mb-1">Redirect Link (e.g. /products/slug)</label>
                <input
                  type="text"
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  placeholder="e.g. /products/millet-mix"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-rose-500 focus:bg-white rounded-xl focus:outline-none"
                />
              </div>

              <div className="flex items-center space-x-2 pt-2 cursor-pointer">
                <input
                  type="checkbox"
                  id="activeCheck"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500 cursor-pointer"
                />
                <label htmlFor="activeCheck" className="font-bold text-slate-700 cursor-pointer">Activate banner immediately</label>
              </div>

              <div className="pt-4 flex space-x-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowFormModal(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-2.5 rounded-xl text-center cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold py-2.5 rounded-xl shadow-lg shadow-rose-200 transition-all text-center flex items-center justify-center cursor-pointer disabled:bg-slate-200 disabled:shadow-none"
                >
                  {submitting ? 'Saving...' : editingBanner ? 'Save Changes' : 'Create Banner'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
