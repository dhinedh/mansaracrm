// src/pages/admin/EcomReviewsPage.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  Star, 
  Trash2, 
  Check, 
  X, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle,
  MessageSquare,
  Image as ImageIcon
} from 'lucide-react';
import { BACKEND_URL } from '../../store/authStore';

export default function EcomReviewsPage() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all'); // all, approved, pending
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/ecom/reviews');
      if (res.data.success) {
        setReviews(res.data.reviews || []);
      }
    } catch (err) {
      console.error(err);
      setMessage({ text: 'Failed to fetch reviews', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleApproveStatus = async (id, approveState) => {
    try {
      const res = await axios.put(`/ecom/reviews/${id}/approve`, { isApproved: approveState });
      if (res.data.success) {
        setReviews(prev => prev.map(r => r._id === id ? { ...r, isApproved: approveState } : r));
        setMessage({ 
          text: `Review successfully ${approveState ? 'approved' : 'marked as pending'}.`, 
          type: 'success' 
        });
      }
    } catch (err) {
      console.error(err);
      setMessage({ text: 'Failed to update review status', type: 'error' });
    }
  };

  const handleDeleteReview = async (id) => {
    if (!window.confirm('Are you sure you want to delete this review?')) return;
    try {
      const res = await axios.delete(`/ecom/reviews/${id}`);
      if (res.data.success) {
        setReviews(prev => prev.filter(r => r._id !== id));
        setMessage({ text: 'Review deleted successfully.', type: 'success' });
      }
    } catch (err) {
      console.error(err);
      setMessage({ text: 'Failed to delete review', type: 'error' });
    }
  };

  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star
          key={i}
          className={`w-3.5 h-3.5 ${
            i <= rating ? 'text-amber-500 fill-amber-500' : 'text-slate-200'
          }`}
        />
      );
    }
    return <div className="flex gap-0.5">{stars}</div>;
  };

  const filteredReviews = reviews.filter(r => {
    if (activeTab === 'approved') return r.isApproved === true;
    if (activeTab === 'pending') return r.isApproved !== true;
    return true;
  });

  // Calculate metrics
  const avgRating = reviews.length > 0 
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1) 
    : '0.0';
  const pendingCount = reviews.filter(r => r.isApproved !== true).length;
  const approvedCount = reviews.filter(r => r.isApproved === true).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-rose-600" />
            Product Reviews
          </h2>
          <p className="text-slate-500 text-xs mt-0.5">Moderate customer feedback, ratings, and testimonials published on products.</p>
        </div>
        <button
          onClick={fetchReviews}
          className="inline-flex items-center space-x-1.5 text-xs bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 px-4 py-2.5 rounded-xl transition-colors cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-150 p-4 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-rose-50 text-rose-600">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] text-slate-400 font-bold uppercase">Total reviews</div>
            <div className="text-lg font-black text-slate-800">{reviews.length}</div>
          </div>
        </div>

        <div className="bg-white border border-slate-150 p-4 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-amber-50 text-amber-500">
            <Star className="w-5 h-5 fill-amber-500 text-amber-500" />
          </div>
          <div>
            <div className="text-[10px] text-slate-400 font-bold uppercase">Average Rating</div>
            <div className="text-lg font-black text-slate-800">{avgRating} / 5.0</div>
          </div>
        </div>

        <div className="bg-white border border-slate-150 p-4 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] text-slate-400 font-bold uppercase">Approved</div>
            <div className="text-lg font-black text-slate-800">{approvedCount}</div>
          </div>
        </div>

        <div className="bg-white border border-slate-150 p-4 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-amber-50 text-amber-600">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] text-slate-400 font-bold uppercase">Pending Check</div>
            <div className="text-lg font-black text-slate-800">{pendingCount}</div>
          </div>
        </div>
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

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200 pb-1">
        {[
          { key: 'all', label: 'All Reviews' },
          { key: 'approved', label: `Approved (${approvedCount})` },
          { key: 'pending', label: `Pending (${pendingCount})` }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer ${
              activeTab === tab.key 
                ? 'bg-rose-600 text-white shadow-md' 
                : 'bg-slate-50 hover:bg-slate-100 text-slate-600'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Listing Grid */}
      {loading ? (
        <div className="flex justify-center items-center py-20 bg-white border border-slate-150 rounded-2xl">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600"></div>
        </div>
      ) : filteredReviews.length === 0 ? (
        <div className="py-24 text-center text-xs text-slate-400 font-semibold italic bg-white border border-slate-150 rounded-2xl flex flex-col items-center justify-center gap-2">
          <MessageSquare className="w-8 h-8 text-slate-355 stroke-1" />
          <span>No product reviews found.</span>
        </div>
      ) : (
        <div className="bg-white border border-slate-150 rounded-2xl shadow-sm overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-slate-500 uppercase tracking-wider font-bold">
                <th className="p-4">Date</th>
                <th className="p-4">Product Info</th>
                <th className="p-4">Customer Name</th>
                <th className="p-4">Rating</th>
                <th className="p-4">Feedback / Comment</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredReviews.map((review) => {
                const pName = review.product?.name || 'Unknown Product';
                const uName = review.user?.name || 'Guest User';
                return (
                  <tr key={review._id} className="border-b border-slate-150 hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 text-slate-500 whitespace-nowrap">
                      {new Date(review.createdAt).toLocaleDateString('en-IN', {
                        day: '2-digit', month: 'short', year: 'numeric'
                      })}
                    </td>
                    <td className="p-4">
                      <div className="font-bold text-slate-800">{pName}</div>
                      {review.product?.sku && (
                        <div className="text-[10px] text-slate-400">SKU: {review.product.sku}</div>
                      )}
                    </td>
                    <td className="p-4 font-bold text-slate-700">
                      {uName}
                    </td>
                    <td className="p-4">
                      {renderStars(review.rating)}
                    </td>
                    <td className="p-4 max-w-sm">
                      <div className="text-slate-700 leading-relaxed font-medium">{review.comment}</div>
                      {review.images && review.images.length > 0 && (
                        <div className="flex gap-1.5 mt-2">
                          {review.images.map((img, i) => (
                            <a 
                              key={i} 
                              href={img.startsWith('http') ? img : `${BACKEND_URL}${img}`} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="w-8 h-8 rounded border border-slate-200 overflow-hidden flex items-center justify-center bg-slate-50"
                            >
                              <img src={img.startsWith('http') ? img : `${BACKEND_URL}${img}`} alt="review upload" className="object-cover h-full w-full" />
                            </a>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="p-4">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase border ${
                        review.isApproved 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                          : 'bg-amber-50 text-amber-700 border-amber-100'
                      }`}>
                        {review.isApproved ? 'Approved' : 'Pending'}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <div className="inline-flex space-x-1.5">
                        {!review.isApproved ? (
                          <button
                            onClick={() => handleApproveStatus(review._id, true)}
                            className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-150 p-1.5 rounded-xl cursor-pointer"
                            title="Approve Review"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleApproveStatus(review._id, false)}
                            className="bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-150 p-1.5 rounded-xl cursor-pointer"
                            title="Mark Pending"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteReview(review._id)}
                          className="bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-100 p-1.5 rounded-xl cursor-pointer"
                          title="Delete Review"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
