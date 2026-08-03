// src/pages/admin/EcomContentPage.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  FileText, 
  Briefcase, 
  Newspaper, 
  Plus, 
  Trash2, 
  Edit3, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle,
  FolderPlus,
  ExternalLink
} from 'lucide-react';
import { BACKEND_URL } from '../../store/authStore';

export default function EcomContentPage() {
  const [activeTab, setActiveTab] = useState('blog'); // blog, careers, press
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  // Data lists
  const [blogPosts, setBlogPosts] = useState([]);
  const [careers, setCareers] = useState([]);
  const [pressReleases, setPressReleases] = useState([]);

  // Modals visibility
  const [showBlogModal, setShowBlogModal] = useState(false);
  const [showCareerModal, setShowCareerModal] = useState(false);
  const [showPressModal, setShowPressModal] = useState(false);

  // Editing targets
  const [editingBlog, setEditingBlog] = useState(null);
  const [editingCareer, setEditingCareer] = useState(null);
  const [editingPress, setEditingPress] = useState(null);
  
  const [submitting, setSubmitting] = useState(false);

  // ------------------------------------------------------
  // Form States
  // ------------------------------------------------------
  // Blog Form
  const [blogTitle, setBlogTitle] = useState('');
  const [blogContent, setBlogContent] = useState('');
  const [blogExcerpt, setBlogExcerpt] = useState('');
  const [blogImage, setBlogImage] = useState('');
  const [blogCategory, setBlogCategory] = useState('Health');
  const [blogPublished, setBlogPublished] = useState(true);

  // Career Form
  const [careerTitle, setCareerTitle] = useState('');
  const [careerDesc, setCareerDesc] = useState('');
  const [careerReqs, setCareerReqs] = useState(''); // text area, split by newline
  const [careerResps, setCareerResps] = useState(''); // text area, split by newline
  const [careerLocation, setCareerLocation] = useState('Chennai');
  const [careerDept, setCareerDept] = useState('Operations');
  const [careerType, setCareerType] = useState('Full-time');
  const [careerExp, setCareerExp] = useState('1-3 Years');
  const [careerSalaryMin, setCareerSalaryMin] = useState('');
  const [careerSalaryMax, setCareerSalaryMax] = useState('');
  const [careerActive, setCareerActive] = useState(true);

  // Press Release Form
  const [pressTitle, setPressTitle] = useState('');
  const [pressSummary, setPressSummary] = useState('');
  const [pressContent, setPressContent] = useState('');
  const [pressLink, setPressLink] = useState('');
  const [pressImage, setPressImage] = useState('');
  const [pressPublished, setPressPublished] = useState(true);

  useEffect(() => {
    loadTabData();
  }, [activeTab]);

  const loadTabData = () => {
    if (activeTab === 'blog') fetchBlogPosts();
    if (activeTab === 'careers') fetchCareers();
    if (activeTab === 'press') fetchPressReleases();
  };

  // ------------------------------------------------------
  // API Fetch Handlers
  // ------------------------------------------------------
  const fetchBlogPosts = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/ecom/blog');
      if (res.data.success) {
        setBlogPosts(res.data.posts || []);
      }
    } catch (err) {
      console.error(err);
      setMessage({ text: 'Failed to fetch blog posts', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const fetchCareers = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/ecom/careers');
      if (res.data.success) {
        setCareers(res.data.careers || []);
      }
    } catch (err) {
      console.error(err);
      setMessage({ text: 'Failed to fetch careers', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const fetchPressReleases = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/ecom/press');
      if (res.data.success) {
        setPressReleases(res.data.releases || []);
      }
    } catch (err) {
      console.error(err);
      setMessage({ text: 'Failed to fetch press releases', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // ------------------------------------------------------
  // Form Trigger Handlers
  // ------------------------------------------------------
  const handleOpenBlog = (post = null) => {
    setEditingBlog(post);
    setBlogTitle(post ? post.title : '');
    setBlogContent(post ? post.content : '');
    setBlogExcerpt(post ? post.excerpt || '' : '');
    setBlogImage(post ? post.featuredImage || '' : '');
    setBlogCategory(post ? post.category || 'Health' : 'Health');
    setBlogPublished(post ? post.isPublished !== false : true);
    setShowBlogModal(true);
  };

  const handleOpenCareer = (job = null) => {
    setEditingCareer(job);
    setCareerTitle(job ? job.title : '');
    setCareerDesc(job ? job.description || '' : '');
    setCareerReqs(job ? (job.requirements || []).join('\n') : '');
    setCareerResps(job ? (job.responsibilities || []).join('\n') : '');
    setCareerLocation(job ? job.location || 'Chennai' : 'Chennai');
    setCareerDept(job ? job.department || 'Operations' : 'Operations');
    setCareerType(job ? job.employmentType || 'Full-time' : 'Full-time');
    setCareerExp(job ? job.experience || '1-3 Years' : '1-3 Years');
    setCareerSalaryMin(job ? String(job.salary?.min || '') : '');
    setCareerSalaryMax(job ? String(job.salary?.max || '') : '');
    setCareerActive(job ? job.isActive !== false : true);
    setShowCareerModal(true);
  };

  const handleOpenPress = (pr = null) => {
    setEditingPress(pr);
    setPressTitle(pr ? pr.title : '');
    setPressSummary(pr ? pr.summary : '');
    setPressContent(pr ? pr.content || '' : '');
    setPressLink(pr ? pr.externalLink || '' : '');
    setPressImage(pr ? pr.image || '' : '');
    setPressPublished(pr ? pr.isPublished !== false : true);
    setShowPressModal(true);
  };

  // ------------------------------------------------------
  // CRUD Submit Handlers
  // ------------------------------------------------------
  const handleSaveBlog = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage({ text: '', type: '' });
    const payload = {
      title: blogTitle.trim(),
      content: blogContent.trim(),
      excerpt: blogExcerpt.trim(),
      featuredImage: blogImage.trim(),
      category: blogCategory,
      isPublished: blogPublished
    };
    try {
      if (editingBlog) {
        await axios.put(`/ecom/blog/${editingBlog._id}`, payload);
        setMessage({ text: 'Blog post updated successfully!', type: 'success' });
      } else {
        await axios.post('/ecom/blog', payload);
        setMessage({ text: 'Blog post created successfully!', type: 'success' });
      }
      setShowBlogModal(false);
      fetchBlogPosts();
    } catch (err) {
      setMessage({ text: err.response?.data?.message || 'Failed to save blog post', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveCareer = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage({ text: '', type: '' });
    const payload = {
      title: careerTitle.trim(),
      description: careerDesc.trim(),
      requirements: careerReqs.split('\n').filter(r => r.trim() !== ''),
      responsibilities: careerResps.split('\n').filter(r => r.trim() !== ''),
      location: careerLocation.trim(),
      department: careerDept.trim(),
      employmentType: careerType,
      experience: careerExp.trim(),
      salaryMin: careerSalaryMin,
      salaryMax: careerSalaryMax,
      isActive: careerActive
    };
    try {
      if (editingCareer) {
        await axios.put(`/ecom/careers/${editingCareer._id}`, payload);
        setMessage({ text: 'Career opening updated successfully!', type: 'success' });
      } else {
        await axios.post('/ecom/careers', payload);
        setMessage({ text: 'Career opening posted successfully!', type: 'success' });
      }
      setShowCareerModal(false);
      fetchCareers();
    } catch (err) {
      setMessage({ text: err.response?.data?.message || 'Failed to save career opening', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSavePress = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage({ text: '', type: '' });
    const payload = {
      title: pressTitle.trim(),
      summary: pressSummary.trim(),
      content: pressContent.trim(),
      externalLink: pressLink.trim(),
      image: pressImage.trim(),
      isPublished: pressPublished
    };
    try {
      if (editingPress) {
        await axios.put(`/ecom/press/${editingPress._id}`, payload);
        setMessage({ text: 'Press release updated successfully!', type: 'success' });
      } else {
        await axios.post('/ecom/press', payload);
        setMessage({ text: 'Press release created successfully!', type: 'success' });
      }
      setShowPressModal(false);
      fetchPressReleases();
    } catch (err) {
      setMessage({ text: err.response?.data?.message || 'Failed to save press release', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  // ------------------------------------------------------
  // CRUD Delete Handlers
  // ------------------------------------------------------
  const handleDeleteBlog = async (id) => {
    if (!window.confirm('Delete this blog post?')) return;
    try {
      await axios.delete(`/ecom/blog/${id}`);
      setMessage({ text: 'Blog post deleted successfully', type: 'success' });
      fetchBlogPosts();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteCareer = async (id) => {
    if (!window.confirm('Delete this career opening?')) return;
    try {
      await axios.delete(`/ecom/careers/${id}`);
      setMessage({ text: 'Career opening deleted successfully', type: 'success' });
      fetchCareers();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeletePress = async (id) => {
    if (!window.confirm('Delete this press release?')) return;
    try {
      await axios.delete(`/ecom/press/${id}`);
      setMessage({ text: 'Press release deleted successfully', type: 'success' });
      fetchPressReleases();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <FileText className="w-5 h-5 text-rose-600" />
            Website Content
          </h2>
          <p className="text-slate-500 text-xs mt-0.5">Publish articles, announce news updates, and recruit talents on the website portal.</p>
        </div>
        <button
          onClick={() => {
            if (activeTab === 'blog') handleOpenBlog();
            if (activeTab === 'careers') handleOpenCareer();
            if (activeTab === 'press') handleOpenPress();
          }}
          className="inline-flex items-center space-x-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg shadow-rose-200 transition-all self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span className="capitalize">Add {activeTab === 'blog' ? 'Blog Post' : activeTab === 'careers' ? 'Job Opening' : 'Press Release'}</span>
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

      {/* Navigation tabs */}
      <div className="flex gap-1 border-b border-slate-200 pb-1">
        {[
          { key: 'blog', label: 'Blog Posts & Articles', icon: FileText },
          { key: 'press', label: 'Press Releases', icon: Newspaper },
          { key: 'careers', label: 'Careers & Hiring', icon: Briefcase }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === tab.key 
                ? 'bg-rose-600 text-white shadow-md' 
                : 'bg-slate-50 hover:bg-slate-100 text-slate-600'
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Dynamic Tab Contents */}
      {loading ? (
        <div className="flex justify-center items-center py-20 bg-white border border-slate-150 rounded-2xl">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600"></div>
        </div>
      ) : (
        <div className="bg-white border border-slate-150 rounded-2xl shadow-sm overflow-hidden">
          
          {/* 1. Blog Tab */}
          {activeTab === 'blog' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-slate-500 uppercase tracking-wider font-bold">
                    <th className="p-4">Cover</th>
                    <th className="p-4">Article Title</th>
                    <th className="p-4">Category</th>
                    <th className="p-4">Publish Date</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {blogPosts.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="p-12 text-center text-slate-400 italic">No blog posts published yet.</td>
                    </tr>
                  ) : (
                    blogPosts.map(post => (
                      <tr key={post._id} className="border-b border-slate-150 hover:bg-slate-50/50 transition-colors">
                        <td className="p-4">
                          <div className="w-12 h-9 bg-slate-100 rounded border border-slate-200 overflow-hidden flex items-center justify-center">
                            {post.featuredImage ? (
                              <img src={post.featuredImage.startsWith('http') ? post.featuredImage : `${BACKEND_URL}${post.featuredImage}`} alt="blog cover" className="object-cover w-full h-full" />
                            ) : <FileText className="w-4 h-4 text-slate-350" />}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="font-bold text-slate-800 text-xs truncate max-w-xs">{post.title}</div>
                          <div className="text-[10px] text-slate-400 truncate max-w-xs">{post.excerpt || 'No description preview.'}</div>
                        </td>
                        <td className="p-4 font-semibold text-slate-600">{post.category || 'General'}</td>
                        <td className="p-4 text-slate-500">
                          {new Date(post.createdAt).toLocaleDateString('en-IN')}
                        </td>
                        <td className="p-4">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase border ${
                            post.isPublished 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}>
                            {post.isPublished ? 'Published' : 'Draft'}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <div className="inline-flex space-x-1.5">
                            <button onClick={() => handleOpenBlog(post)} className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 px-3 py-1.5 rounded-xl font-bold cursor-pointer flex items-center gap-1">
                              <Edit3 className="w-3.5 h-3.5" /> Edit
                            </button>
                            <button onClick={() => handleDeleteBlog(post._id)} className="bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-100 p-2 rounded-xl cursor-pointer">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* 2. Press Tab */}
          {activeTab === 'press' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-slate-500 uppercase tracking-wider font-bold">
                    <th className="p-4">Date</th>
                    <th className="p-4">Press Title</th>
                    <th className="p-4">External Source</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pressReleases.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="p-12 text-center text-slate-400 italic">No press releases published yet.</td>
                    </tr>
                  ) : (
                    pressReleases.map(pr => (
                      <tr key={pr._id} className="border-b border-slate-150 hover:bg-slate-50/50 transition-colors">
                        <td className="p-4 text-slate-500 whitespace-nowrap">
                          {new Date(pr.date || pr.createdAt).toLocaleDateString('en-IN')}
                        </td>
                        <td className="p-4 font-bold text-slate-800">
                          {pr.title}
                        </td>
                        <td className="p-4">
                          {pr.externalLink ? (
                            <a href={pr.externalLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 font-semibold inline-flex items-center gap-1 hover:underline">
                              <span>View Source</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          ) : 'Internal Release'}
                        </td>
                        <td className="p-4">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase border ${
                            pr.isPublished 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}>
                            {pr.isPublished ? 'Published' : 'Draft'}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <div className="inline-flex space-x-1.5">
                            <button onClick={() => handleOpenPress(pr)} className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 px-3 py-1.5 rounded-xl font-bold cursor-pointer flex items-center gap-1">
                              <Edit3 className="w-3.5 h-3.5" /> Edit
                            </button>
                            <button onClick={() => handleDeletePress(pr._id)} className="bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-100 p-2 rounded-xl cursor-pointer">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* 3. Careers Tab */}
          {activeTab === 'careers' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-slate-500 uppercase tracking-wider font-bold">
                    <th className="p-4">Role Title</th>
                    <th className="p-4">Department</th>
                    <th className="p-4">Type</th>
                    <th className="p-4">Location</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {careers.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="p-12 text-center text-slate-400 italic">No job postings available.</td>
                    </tr>
                  ) : (
                    careers.map(job => (
                      <tr key={job._id} className="border-b border-slate-150 hover:bg-slate-50/50 transition-colors">
                        <td className="p-4 font-bold text-slate-800">{job.title}</td>
                        <td className="p-4 text-slate-600 font-semibold">{job.department}</td>
                        <td className="p-4 text-slate-500 font-medium">{job.employmentType}</td>
                        <td className="p-4 text-slate-500">{job.location}</td>
                        <td className="p-4">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase border ${
                            job.isActive !== false 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}>
                            {job.isActive !== false ? 'Active' : 'Closed'}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <div className="inline-flex space-x-1.5">
                            <button onClick={() => handleOpenCareer(job)} className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 px-3 py-1.5 rounded-xl font-bold cursor-pointer flex items-center gap-1">
                              <Edit3 className="w-3.5 h-3.5" /> Edit
                            </button>
                            <button onClick={() => handleDeleteCareer(job._id)} className="bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-100 p-2 rounded-xl cursor-pointer">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

        </div>
      )}

      {/* ------------------------------------------------------
          MODALS / FORMS
          ------------------------------------------------------ */}
      
      {/* 1. Blog Form Modal */}
      {showBlogModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white max-w-xl w-full rounded-2xl shadow-xl overflow-hidden animate-zoom-in my-8 max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-rose-50">
              <div className="flex items-center space-x-2">
                <FolderPlus className="w-5 h-5 text-rose-600" />
                <h3 className="font-black text-slate-800 text-sm uppercase tracking-wide">
                  {editingBlog ? 'Edit Blog Post' : 'Write New Blog Post'}
                </h3>
              </div>
              <button onClick={() => setShowBlogModal(false)} className="text-slate-400 hover:text-slate-600 font-bold p-1 rounded-lg hover:bg-slate-100 cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleSaveBlog} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-slate-500 font-bold mb-1">Post Title *</label>
                  <input
                    type="text"
                    required
                    value={blogTitle}
                    onChange={(e) => setBlogTitle(e.target.value)}
                    placeholder="Enter attractive article headline"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-rose-500 focus:bg-white rounded-xl focus:outline-none font-bold text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-bold mb-1">Category Category *</label>
                  <select
                    value={blogCategory}
                    onChange={(e) => setBlogCategory(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-rose-500 rounded-xl focus:outline-none cursor-pointer font-bold"
                  >
                    <option value="Health">Health & Diet</option>
                    <option value="Tradition">Pure Tradition</option>
                    <option value="Recipes">Spices & Recipes</option>
                    <option value="Corporate">Corporate News</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-500 font-bold mb-1">Featured Cover Image URL</label>
                  <input
                    type="text"
                    value={blogImage}
                    onChange={(e) => setBlogImage(e.target.value)}
                    placeholder="e.g. /images/blog/healthy-spices.jpg"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-rose-500 focus:bg-white rounded-xl focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-500 font-bold mb-1">Excerpt / Brief Summary</label>
                <input
                  type="text"
                  value={blogExcerpt}
                  onChange={(e) => setBlogExcerpt(e.target.value)}
                  placeholder="Short listing intro text..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-rose-500 focus:bg-white rounded-xl focus:outline-none font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-500 font-bold mb-1">Article Content *</label>
                <textarea
                  value={blogContent}
                  onChange={(e) => setBlogContent(e.target.value)}
                  rows="10"
                  required
                  placeholder="Write complete article details (HTML or plain text supported)..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 focus:border-rose-500 focus:bg-white rounded-xl focus:outline-none font-mono"
                ></textarea>
              </div>

              <div className="flex items-center space-x-2 pt-2 cursor-pointer">
                <input
                  type="checkbox"
                  id="blogPubCheck"
                  checked={blogPublished}
                  onChange={(e) => setBlogPublished(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500 cursor-pointer"
                />
                <label htmlFor="blogPubCheck" className="font-bold text-slate-700 cursor-pointer">Publish and show on blog listing index</label>
              </div>

              <div className="pt-4 flex space-x-3 border-t border-slate-100">
                <button type="button" onClick={() => setShowBlogModal(false)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-2.5 rounded-xl cursor-pointer">Cancel</button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold py-2.5 rounded-xl shadow-lg shadow-rose-200 transition-all text-center flex items-center justify-center cursor-pointer disabled:bg-slate-200"
                >
                  {submitting ? 'Saving...' : editingBlog ? 'Save Changes' : 'Create Article'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Press Form Modal */}
      {showPressModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white max-w-xl w-full rounded-2xl shadow-xl overflow-hidden animate-zoom-in my-8 max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-rose-50">
              <div className="flex items-center space-x-2">
                <FolderPlus className="w-5 h-5 text-rose-600" />
                <h3 className="font-black text-slate-800 text-sm uppercase tracking-wide">
                  {editingPress ? 'Edit Press Release' : 'Publish Press News'}
                </h3>
              </div>
              <button onClick={() => setShowPressModal(false)} className="text-slate-400 hover:text-slate-600 font-bold p-1 rounded-lg hover:bg-slate-100 cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleSavePress} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
              <div>
                <label className="block text-slate-500 font-bold mb-1">Headline Title *</label>
                <input
                  type="text"
                  required
                  value={pressTitle}
                  onChange={(e) => setPressTitle(e.target.value)}
                  placeholder="e.g. Mansara Foods bags Traditional Spices startup award"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-rose-500 focus:bg-white rounded-xl focus:outline-none font-bold text-slate-800"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-500 font-bold mb-1">External News Link (Optional)</label>
                  <input
                    type="text"
                    value={pressLink}
                    onChange={(e) => setPressLink(e.target.value)}
                    placeholder="https://timesofindia.com/news/..."
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-rose-500 focus:bg-white rounded-xl focus:outline-none font-semibold text-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-bold mb-1">News Image Cover URL</label>
                  <input
                    type="text"
                    value={pressImage}
                    onChange={(e) => setPressImage(e.target.value)}
                    placeholder="e.g. /images/press/award.jpg"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-rose-500 focus:bg-white rounded-xl focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-500 font-bold mb-1">Intro Summary *</label>
                <textarea
                  value={pressSummary}
                  onChange={(e) => setPressSummary(e.target.value)}
                  rows="3"
                  required
                  placeholder="Summary headline or brief excerpt..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-rose-500 focus:bg-white rounded-xl focus:outline-none font-medium"
                ></textarea>
              </div>

              <div>
                <label className="block text-slate-500 font-bold mb-1">News Content Body (Optional)</label>
                <textarea
                  value={pressContent}
                  onChange={(e) => setPressContent(e.target.value)}
                  rows="5"
                  placeholder="Type press release content detail details..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-rose-500 focus:bg-white rounded-xl focus:outline-none"
                ></textarea>
              </div>

              <div className="flex items-center space-x-2 pt-2 cursor-pointer">
                <input
                  type="checkbox"
                  id="pressPubCheck"
                  checked={pressPublished}
                  onChange={(e) => setPressPublished(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500 cursor-pointer"
                />
                <label htmlFor="pressPubCheck" className="font-bold text-slate-700 cursor-pointer">Publish and show immediately</label>
              </div>

              <div className="pt-4 flex space-x-3 border-t border-slate-100">
                <button type="button" onClick={() => setShowPressModal(false)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-2.5 rounded-xl cursor-pointer">Cancel</button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold py-2.5 rounded-xl shadow-lg shadow-rose-200 transition-all text-center flex items-center justify-center cursor-pointer disabled:bg-slate-200"
                >
                  {submitting ? 'Saving...' : editingPress ? 'Save Changes' : 'Create Release'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Careers Form Modal */}
      {showCareerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white max-w-xl w-full rounded-2xl shadow-xl overflow-hidden animate-zoom-in my-8 max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-rose-50">
              <div className="flex items-center space-x-2">
                <FolderPlus className="w-5 h-5 text-rose-600" />
                <h3 className="font-black text-slate-800 text-sm uppercase tracking-wide">
                  {editingCareer ? 'Edit Job Posting' : 'Post Career Opening'}
                </h3>
              </div>
              <button onClick={() => setShowCareerModal(false)} className="text-slate-400 hover:text-slate-600 font-bold p-1 rounded-lg hover:bg-slate-100 cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleSaveCareer} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-500 font-bold mb-1">Job Opening Title *</label>
                  <input
                    type="text"
                    required
                    value={careerTitle}
                    onChange={(e) => setCareerTitle(e.target.value)}
                    placeholder="e.g. Area Sales Manager"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-rose-500 focus:bg-white rounded-xl focus:outline-none font-bold text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-bold mb-1">Department / Vertical *</label>
                  <input
                    type="text"
                    required
                    value={careerDept}
                    onChange={(e) => setCareerDept(e.target.value)}
                    placeholder="e.g. Sales, Operations, Marketing"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-rose-500 focus:bg-white rounded-xl focus:outline-none font-semibold text-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-bold mb-1">Employment Type *</label>
                  <select
                    value={careerType}
                    onChange={(e) => setCareerType(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-rose-500 rounded-xl focus:outline-none cursor-pointer font-bold"
                  >
                    <option value="Full-time">Full-time Regular</option>
                    <option value="Part-time">Part-time Offer</option>
                    <option value="Contract">Freelancer / Contract</option>
                    <option value="Internship">College Internship</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-500 font-bold mb-1">Location Details *</label>
                  <input
                    type="text"
                    required
                    value={careerLocation}
                    onChange={(e) => setCareerLocation(e.target.value)}
                    placeholder="e.g. Chennai, Remote"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-rose-500 focus:bg-white rounded-xl focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-bold mb-1">Experience Required *</label>
                  <input
                    type="text"
                    required
                    value={careerExp}
                    onChange={(e) => setCareerExp(e.target.value)}
                    placeholder="e.g. 2-5 Years, Freshers"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-rose-500 focus:bg-white rounded-xl focus:outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-550 font-bold mb-1">Salary Min (₹/yr)</label>
                    <input
                      type="number"
                      value={careerSalaryMin}
                      onChange={(e) => setCareerSalaryMin(e.target.value)}
                      placeholder="Min Lakhs"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-rose-500 focus:bg-white rounded-xl focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-555 font-bold mb-1">Salary Max (₹/yr)</label>
                    <input
                      type="number"
                      value={careerSalaryMax}
                      onChange={(e) => setCareerSalaryMax(e.target.value)}
                      placeholder="Max Lakhs"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-rose-500 focus:bg-white rounded-xl focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-slate-500 font-bold mb-1">Job Description Overview *</label>
                <textarea
                  value={careerDesc}
                  onChange={(e) => setCareerDesc(e.target.value)}
                  rows="3"
                  required
                  placeholder="Outline the job objective and role summaries..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-rose-500 focus:bg-white rounded-xl focus:outline-none"
                ></textarea>
              </div>

              <div>
                <label className="block text-slate-500 font-bold mb-1">Requirements (one item per line) *</label>
                <textarea
                  value={careerReqs}
                  onChange={(e) => setCareerReqs(e.target.value)}
                  rows="4"
                  required
                  placeholder="e.g. Must have a driving license&#10;Excellent communication skills&#10;Prior retail field work..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-rose-500 focus:bg-white rounded-xl focus:outline-none font-medium"
                ></textarea>
              </div>

              <div>
                <label className="block text-slate-500 font-bold mb-1">Responsibilities (one item per line) *</label>
                <textarea
                  value={careerResps}
                  onChange={(e) => setCareerResps(e.target.value)}
                  rows="4"
                  required
                  placeholder="e.g. Meet targets for regional dealer additions&#10;Maintain product stock reports&#10;Coordinate with Chennai warehouse..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-rose-500 focus:bg-white rounded-xl focus:outline-none font-medium"
                ></textarea>
              </div>

              <div className="flex items-center space-x-2 pt-2 cursor-pointer">
                <input
                  type="checkbox"
                  id="careerActiveCheck"
                  checked={careerActive}
                  onChange={(e) => setCareerActive(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500 cursor-pointer"
                />
                <label htmlFor="careerActiveCheck" className="font-bold text-slate-700 cursor-pointer">Keep this job opening open and accepting responses</label>
              </div>

              <div className="pt-4 flex space-x-3 border-t border-slate-100">
                <button type="button" onClick={() => setShowCareerModal(false)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-2.5 rounded-xl cursor-pointer">Cancel</button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold py-2.5 rounded-xl shadow-lg shadow-rose-200 transition-all text-center flex items-center justify-center cursor-pointer disabled:bg-slate-200"
                >
                  {submitting ? 'Saving...' : editingCareer ? 'Save Changes' : 'Create Job Posting'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
