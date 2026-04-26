'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { API_ENDPOINTS } from '@/constants/api-endpoints';

// Notification Types List
const NOTIFICATION_TYPES = [
  { value: 'announcement', label: '📢 Announcement' },
  { value: 'general', label: 'ℹ️ General' },
  { value: 'fee_reminder', label: '💰 Fee Reminder' },
  { value: 'exam', label: '🎓 Exam Update' },
  { value: 'result', label: '📊 Result Declared' },
  { value: 'event', label: '🎉 Event' },
  { value: 'holiday', label: '🏖️ Holiday' },
];

export default function CreateNotification() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [branches, setBranches] = useState([]);
  const [status, setStatus] = useState({ type: '', message: '' });

  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'announcement',
    targetRole: 'student',
    targetBranch: 'all',
  });
  
  const getBrowserCookie = (name) => {
    if (typeof document === 'undefined') return null;
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
  };

  // 1. Page Load hote hi Branches fetch karo
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        console.log("🔵 Fetching branches started...");

       
        let token = getBrowserCookie('token') || getBrowserCookie('accessToken');

        if (!token) {
          token = localStorage.getItem('token') || localStorage.getItem('accessToken');
        }

        console.log("🔑 Token Found:", token ? "YES (Ready)" : "NO (Missing)");

        if (!token) {
          console.error("❌ No token found anywhere!");
          return;
        }

        // ✅ STEP 2: Token ke sath API call
        const response = await fetch(API_ENDPOINTS.SUPER_ADMIN.BRANCHES.DROPDOWN, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` // Token bhej diya
          }
        });

        console.log("🔵 Response Status:", response.status);

        if (response.status === 401) {
          console.error("❌ Error: 401 Unauthorized. Token invalid.");
          alert("Session Expired. Please Login Again.");
          return;
        }

        const result = await response.json();
        console.log("🔵 Full API Data:", result);

        if (result.success) {
          if (result.data && Array.isArray(result.data.branches)) {
            setBranches(result.data.branches);
          }
          else if (result.branches && Array.isArray(result.branches)) {
            setBranches(result.branches);
          }
          else if (Array.isArray(result.data)) { // Kabhi kabhi direct array bhi aa jata hai
            setBranches(result.data);
          }
        }

      } catch (error) {
        console.error('❌ Failed to fetch branches:', error);
      }
    };

    fetchBranches();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: '', message: '' });

    try {
      // Ensure we use the same robust token lookup as on page load
      let token = getBrowserCookie('token') || getBrowserCookie('accessToken') || localStorage.getItem('token') || localStorage.getItem('accessToken');

      if (!token) {
        setStatus({ type: 'error', message: '❌ You are not authenticated. Please login again.' });
        setLoading(false);
        return;
      }

      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch('/api/notifications/send', {
        method: 'POST',
        headers,
        body: JSON.stringify(formData),
      });

      console.log('🔵 /api/notifications/send status', response.status);

      let data;
      try {
        data = await response.json();
        console.log('🔵 /api/notifications/send response JSON:', data);
      } catch (err) {
        const text = await response.text();
        console.log('🔵 /api/notifications/send response text:', text);
        data = { message: text };
      }

      if (response.ok) {
        setStatus({ type: 'success', message: `✅ Success! ${data.message}` });
        setFormData({
          title: '',
          message: '',
          type: 'announcement',
          targetRole: 'student',
          targetBranch: 'all',
        });
      } else {
        setStatus({ type: 'error', message: `❌ Error: ${data.message || 'Failed to send'}` });
      }
    } catch (error) {
      console.error(error);
      setStatus({ type: 'error', message: '❌ Server Error. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="bg-white p-6 rounded-xl shadow border border-gray-100 mb-6 transition-shadow">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2 leading-tight tracking-tight">
          📢 Create Broadcast Notification
        </h1>
        <p className="text-gray-500 mt-1 text-sm">
          Super Admins can send push notifications to specific branches or the entire coaching network.
        </p>
      </div>

      {status.message && (
        <div role="status" className={`p-4 mb-6 rounded-lg text-sm font-medium transition-colors ${status.type === 'success'
          ? 'bg-green-50 text-green-700 border border-green-200'
          : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
          {status.message}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="md:col-span-2 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Select Branch <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <select
                        name="targetBranch"
                        value={formData.targetBranch}
                        onChange={handleChange}
                        className="w-full p-3 pl-4 border border-gray-300 rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none appearance-none cursor-pointer transition-shadow duration-150"
                      >
                        <option value="all" className="font-bold text-blue-600">🌍 All Branches (Global)</option>
                        <option disabled>──────────────</option>
                        {branches.length === 0 && <option disabled>Loading...</option>}
                        {branches.map((branch) => (
                          <option key={branch._id} value={branch._id}>🏢 {branch.name} ({branch.code})</option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Recipient Role <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <select
                        name="targetRole"
                        value={formData.targetRole}
                        onChange={handleChange}
                        className="w-full p-3 pl-4 border border-gray-300 rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none appearance-none transition-shadow duration-150"
                      >
                        <option value="student">👨‍🎓 Students</option>
                        <option value="parent">👨‍👩‍👦 Parents</option>
                        <option value="teacher">👩‍🏫 Teachers</option>
                        <option value="staff">💼 Staff</option>
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                      </div>
                    </div>
                  </div>
                </div>

                <hr className="border-gray-100" />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-1">
                    <label className="block text-sm font-bold text-gray-700 mb-2">Notification Type</label>
                    <select
                      name="type"
                      value={formData.type}
                      onChange={handleChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-shadow duration-150"
                    >
                      {NOTIFICATION_TYPES.map((type) => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-gray-700 mb-2">Title <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      name="title"
                      required
                      value={formData.title}
                      onChange={handleChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-shadow duration-150"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Message <span className="text-red-500">*</span></label>
                  <textarea
                    name="message"
                    required
                    rows="6"
                    value={formData.message}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none transition-shadow duration-150"
                  ></textarea>
                </div>
              </div>

              <aside className="md:col-span-1 bg-gradient-to-b from-white to-gray-50 p-4 rounded-lg border border-gray-100 min-w-0">
                <h3 className="text-sm font-semibold text-gray-600 mb-3">Live Preview</h3>
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 max-h-44 w-full overflow-y-auto overflow-x-hidden min-w-0">
                  <div className="flex items-start gap-3">
                    <div className="px-2 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-semibold whitespace-nowrap">{NOTIFICATION_TYPES.find(t => t.value === formData.type)?.label}</div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-gray-800 truncate">{formData.title || 'Notification title will appear here'}</h4>
                      <p className="text-xs text-gray-500 mt-1 truncate">{formData.targetRole.charAt(0).toUpperCase() + formData.targetRole.slice(1)} • {formData.targetBranch === 'all' ? 'All Branches' : branches.find(b=>b._id===formData.targetBranch)?.name || formData.targetBranch}</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-700 mt-3 break-words whitespace-pre-wrap max-h-28 overflow-y-auto overflow-x-hidden pr-2">{formData.message || 'Message preview...'}</p>
                </div>
                <div className="mt-4 text-xs text-gray-500">Tip: Keep the title short and the message concise for better push delivery.</div>
              </aside>
            </div>

            <div className="pt-4 flex justify-end gap-4">
              <button type="button" onClick={() => router.back()} className="px-6 py-3 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-200">Cancel</button>
              <button type="submit" disabled={loading} className={`px-8 py-3 text-white text-sm font-bold rounded-lg shadow-md ${loading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'} transition transform duration-150 active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500`}>
                {loading ? 'Sending...' : '🚀 Send Notification'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}