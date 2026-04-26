'use client';

import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Pencil, Save, X, Camera, Loader2, Phone, Mail, User as UserIcon, MapPin } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import apiClient from '@/lib/api-client';
import { toast } from 'sonner';

export default function ProfilePage() {
  const { user: authUser, refreshUser } = useAuth();
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    address: {
      street: '',
      city: '',
      state: '',
      postalCode: '',
      country: ''
    }
  });
  const [avatarPreview, setAvatarPreview] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/api/users/profile');
      if (response.success) {
        setUser(response.user);
        const userAddress = response.user.details?.address || response.user.address || {
          street: '',
          city: '',
          state: '',
          postalCode: '',
          country: ''
        };
        setFormData({
          first_name: response.user.first_name || '',
          last_name: response.user.last_name || '',
          email: response.user.email || '',
          phone: response.user.phone || '',
          address: userAddress
        });
      }
    } catch (error) {
      console.error('Fetch profile error:', error);
      toast.error('Failed to load profile details');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Image size should be less than 2MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const updatePayload = {
        ...formData,
        avatar: avatarPreview
      };

      const response = await apiClient.put('/api/users/profile', updatePayload);
      
      if (response.success) {
        toast.success('Profile updated successfully');
        setIsEditing(false);
        setUser(prev => ({ ...prev, ...response.user }));
        await refreshUser(); // Update global auth state
      } else {
        toast.error(response.error || 'Update failed');
      }
    } catch (error) {
      console.error('Update error:', error);
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
            Profile Settings
          </h1>
          <p className="text-gray-500 mt-1">Manage your account information and preferences</p>
        </div>
        <div className="flex gap-3">
          {isEditing ? (
            <>
              <Button variant="outline" onClick={() => setIsEditing(false)} disabled={saving}>
                <X className="h-4 w-4 mr-2" /> Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving} className="bg-gradient-to-r from-blue-600 to-indigo-600">
                {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Save Changes
              </Button>
            </>
          ) : (
            <Button onClick={() => setIsEditing(true)} className="bg-primary hover:shadow-lg transition-all">
              <Pencil className="h-4 w-4 mr-2" /> Edit Profile
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Profile Card */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="overflow-hidden border-none shadow-xl bg-white/50 backdrop-blur-sm">
            <div className="h-24 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600"></div>
            <CardContent className="relative pt-0 pb-8">
              <div className="flex flex-col items-center -mt-12">
                <div className="relative group">
                  <div className="w-24 h-24 rounded-2xl overflow-hidden border-4 border-white shadow-2xl bg-white">
                    {avatarPreview || user.avatar_url ? (
                      <img 
                        src={avatarPreview || user.avatar_url} 
                        alt="Profile" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-3xl font-bold text-gray-400">
                        {user.first_name?.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  {isEditing && (
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute inset-0 bg-black/40 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl"
                    >
                      <Camera className="h-6 w-6" />
                    </button>
                  )}
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    hidden 
                    accept="image/*" 
                    onChange={handleFileChange} 
                  />
                </div>
                
                <div className="text-center mt-4">
                  <h2 className="text-xl font-bold text-gray-900">
                    {user.first_name} {user.last_name}
                  </h2>
                  <p className="text-sm text-gray-500 font-medium">{user.email}</p>
                  
                  <div className="mt-4 inline-flex items-center px-4 py-1.5 rounded-xl text-xs font-bold tracking-wider uppercase bg-blue-50 text-blue-600 border border-blue-100">
                    {user.role?.replace('_', ' ')}
                  </div>
                </div>

                <div className="mt-8 grid grid-cols-2 gap-4 w-full border-t border-gray-100 pt-6">
                  <div className="text-center">
                    <p className="text-lg font-bold text-gray-900">{user.is_active ? 'Active' : 'Inactive'}</p>
                    <p className="text-xs text-gray-400 uppercase tracking-tighter">Status</p>
                  </div>
                  <div className="text-center border-l border-gray-100">
                    <p className="text-lg font-bold text-gray-900">
                      {user.created_at ? new Date(user.created_at).getFullYear() : '2024'}
                    </p>
                    <p className="text-xs text-gray-400 uppercase tracking-tighter">Joined</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Contacts */}
          <Card className="border-none shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-gray-400">Contact Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 group">
                <div className="p-2 rounded-lg bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <Phone className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">Phone Number</p>
                  <p className="text-sm font-medium">{user.phone}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 group">
                <div className="p-2 rounded-lg bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                  <Mail className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">Official Email</p>
                  <p className="text-sm font-medium">{user.email}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Forms */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserIcon className="h-5 w-5 text-primary" />
                Individual Profile
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-600">First Name</label>
                  {isEditing ? (
                    <input
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                      placeholder="Enter first name"
                    />
                  ) : (
                    <p className="px-4 py-2.5 bg-gray-50 rounded-xl text-gray-700 font-medium">{user.first_name}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-600">Last Name</label>
                  {isEditing ? (
                    <input
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                      placeholder="Enter last name"
                    />
                  ) : (
                    <p className="px-4 py-2.5 bg-gray-50 rounded-xl text-gray-700 font-medium">{user.last_name}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-600">Email Address</label>
                  {isEditing ? (
                    <input
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                      placeholder="example@coaching.com"
                    />
                  ) : (
                    <p className="px-4 py-2.5 bg-gray-50 rounded-xl text-gray-700 font-medium">{user.email}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-600">Mobile Number</label>
                  {isEditing ? (
                    <input
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                      placeholder="+92 XXX XXXXXXX"
                    />
                  ) : (
                    <p className="px-4 py-2.5 bg-gray-50 rounded-xl text-gray-700 font-medium">{user.phone}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                Address Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-600">Street Address</label>
                  {isEditing ? (
                    <input
                      name="address.street"
                      value={formData.address.street}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                      placeholder="123 Academic St"
                    />
                  ) : (
                    <p className="px-4 py-2.5 bg-gray-50 rounded-xl text-gray-700 font-medium">
                      {user.details?.address?.street || user.address?.street || 'N/A'}
                    </p>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-600">City</label>
                    {isEditing ? (
                      <input
                        name="address.city"
                        value={formData.address.city}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                        placeholder="Karachi"
                      />
                    ) : (
                      <p className="px-4 py-2.5 bg-gray-50 rounded-xl text-gray-700 font-medium">
                        {user.details?.address?.city || user.address?.city || 'N/A'}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-600">State / Province</label>
                    {isEditing ? (
                      <input
                        name="address.state"
                        value={formData.address.state}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                        placeholder="Sindh"
                      />
                    ) : (
                      <p className="px-4 py-2.5 bg-gray-50 rounded-xl text-gray-700 font-medium">
                        {user.details?.address?.state || user.address?.state || 'N/A'}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Role Specific Read-only Info */}
          <Card className="border-none shadow-lg bg-gray-50">
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase tracking-widest text-gray-400">Account Role Info</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                <div>
                  <p className="text-xs text-gray-400 uppercase">Registration ID</p>
                  <p className="text-sm font-bold text-gray-700">{user.registration_no || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase">Branch Name</p>
                  <p className="text-sm font-bold text-gray-700">{user.branch?.name || 'All Branches'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase">Last Login</p>
                  <p className="text-sm font-bold text-gray-700">
                    {user.last_login_at ? new Date(user.last_login_at).toLocaleDateString() : 'Today'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}