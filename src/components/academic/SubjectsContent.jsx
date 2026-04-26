'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  BookOpen, 
  Plus, 
  Edit, 
  Download,
  Eye,
  Link as LinkIcon,
  Activity,
  Shield,
  FileCheck,
  Zap,
  X,
  Building2,
  Trash2,
  Loader2,
  Layout
} from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Modal from '@/components/ui/modal';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import apiClient from '@/lib/api-client';
import { useAuth } from '@/hooks/useAuth';

export default function SubjectsContent() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  const [subjects, setSubjects] = useState([]);
  const [branches, setBranches] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    subject_code: '',
    class_id: '',
    branch_id: '',
    files: []
  });

  // Effect to sync branch_id for Branch Admins
  useEffect(() => {
    if (!isSuperAdmin && user?.branch_id) {
      setFormData(prev => ({ ...prev, branch_id: user.branch_id }));
    }
  }, [isSuperAdmin, user?.branch_id]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [subjectsRes, branchesRes, classesRes] = await Promise.all([
        apiClient.get('/api/subjects'),
        isSuperAdmin ? apiClient.get('/api/super-admin/branches') : Promise.resolve([]),
        apiClient.get('/api/classes')
      ]);

      setSubjects(subjectsRes || []);
      // Handle the nested data structure from Super Admin branches API
      setBranches(branchesRes?.data?.branches || branchesRes || []); 
      setClasses(classesRes || []);
    } catch (error) {
      console.error('Error loading subjects data:', error);
      toast.error('Failed to load subjects data');
    } finally {
      setLoading(false);
    }
  }, [isSuperAdmin]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAddNew = () => {
    setEditingSubject(null);
    setFormData({
      name: '',
      subject_code: '',
      class_id: '',
      branch_id: isSuperAdmin ? '' : (user?.branch_id || ''),
      files: []
    });
    setShowModal(true);
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFormData(prev => ({
      ...prev,
      files: [...prev.files, ...selectedFiles]
    }));
  };

  const removeFile = (index) => {
    setFormData(prev => ({
      ...prev,
      files: prev.files.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.class_id) {
      toast.error("Please select a class");
      return;
    }

    try {
      setSubmitting(true);
      
      const data = new FormData();
      data.append('name', formData.name);
      data.append('subject_code', formData.subject_code);
      data.append('class_id', formData.class_id);
      data.append('branch_id', formData.branch_id);
      
      formData.files.forEach(file => {
        data.append('files', file);
      });

      if (editingSubject) {
        await apiClient.put(`/api/subjects/${editingSubject.id}`, formData); // PUT usually doesn't take form data for files in this API, but let's assume details only for now as per route.js
        toast.success('Subject updated successfully');
      } else {
        await apiClient.post('/api/subjects', data);
        toast.success('Subject created successfully');
      }

      setShowModal(false);
      loadData();
    } catch (error) {
      console.error('Submit error:', error);
      toast.error(error.response?.data?.error || 'Failed to save subject');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this subject and all its materials?')) return;
    
    try {
      await apiClient.delete(`/api/subjects/${id}`);
      toast.success('Subject deleted');
      loadData();
    } catch (error) {
      toast.error('Failed to delete subject');
    }
  };

  const filteredSubjects = subjects.filter(sub => 
    sub.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sub.subject_code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
        <p className="text-slate-500 font-medium animate-pulse">Loading Subject Repository...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
             <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl">
               <BookOpen className="w-8 h-8 text-indigo-600" />
             </div>
             Subject Repository
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm">
            Manage academic subjects and learning materials
          </p>
        </div>

        <div className="flex items-center gap-3 w-full lg:w-auto">
          <Input 
            placeholder="Search subjects..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full lg:w-64"
          />
          <Button onClick={handleAddNew} className="bg-indigo-600 hover:bg-indigo-700 whitespace-nowrap">
            <Plus className="w-4 h-4 mr-2" />
            Add Subject
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover:shadow-md transition-all border-none bg-white dark:bg-slate-900 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Subjects</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{subjects.length}</p>
              </div>
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-2xl">
                <Shield className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-all border-none bg-white dark:bg-slate-900 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Assets</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                  {subjects.reduce((acc, sub) => acc + (sub.materials?.length || 0), 0)}
                </p>
              </div>
              <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl">
                <FileCheck className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-all border-none bg-white dark:bg-slate-900 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Status</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                  {subjects.filter(s => s.is_active).length}
                </p>
              </div>
              <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-2xl">
                <Zap className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-all border-none bg-white dark:bg-slate-900 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Branches</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                  {new Set(subjects.map(s => s.branch_id)).size}
                </p>
              </div>
              <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-2xl">
                <Building2 className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Subjects View */}
      <div className="grid grid-cols-1 gap-6">
        {filteredSubjects.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800">
            <BookOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">No Subjects Found</h3>
            <p className="text-slate-500 mt-2">Start by adding a new academic subject to the repository.</p>
            <Button onClick={handleAddNew} variant="outline" className="mt-6">
              Add Your First Subject
            </Button>
          </div>
        ) : (
          filteredSubjects.map((sub) => (
            <Card key={sub.id} className="overflow-hidden border-none shadow-sm bg-white dark:bg-slate-900/50 group">
              <CardHeader className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-6 py-6 overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none group-hover:scale-110 transition-transform">
                   <BookOpen className="w-32 h-32 text-indigo-600" />
                </div>
                
                <div className="flex items-center gap-4 relative z-10">
                   <div className="w-14 h-14 bg-indigo-600 text-white rounded-2xl flex items-center justify-center font-bold text-lg shadow-lg shadow-indigo-600/20">
                     {sub.subject_code || 'N/A'}
                   </div>
                   <div>
                     <CardTitle className="text-xl font-bold text-slate-900 dark:text-white">{sub.name}</CardTitle>
                     <div className="flex flex-wrap items-center gap-3 mt-1.5">
                       <span className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 px-2.5 py-1 rounded-lg">
                         <Layout className="w-3.5 h-3.5" />
                         {sub.class?.name || 'Unassigned'}
                       </span>
                       <span className="text-slate-300 dark:text-slate-700">•</span>
                       <span className={`text-[10px] uppercase tracking-wider font-black px-2 py-0.5 rounded-md ${
                         sub.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                       }`}>
                         {sub.is_active ? 'Active' : 'Inactive'}
                       </span>
                     </div>
                   </div>
                </div>

                <div className="flex gap-2 relative z-10">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-9 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800"
                    onClick={() => {
                      setEditingSubject(sub);
                      setFormData({
                        name: sub.name,
                        subject_code: sub.subject_code || '',
                        class_id: sub.class_id,
                        branch_id: sub.branch_id,
                        files: []
                      });
                      setShowModal(true);
                    }}
                  >
                    <Edit className="w-4 h-4 mr-2 text-indigo-600" />
                    Edit
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-9 border-rose-200 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20"
                    onClick={() => handleDelete(sub.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0 border-t dark:border-slate-800">
                 <div className="overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-slate-50/50 dark:bg-slate-800/30">
                        <TableRow>
                           <TableHead className="px-6 h-12 text-[11px] uppercase tracking-widest font-black text-slate-500">Asset Title</TableHead>
                           <TableHead className="h-12 text-[11px] uppercase tracking-widest font-black text-slate-500">Resource Type</TableHead>
                           <TableHead className="text-right h-12 text-[11px] uppercase tracking-widest font-black text-slate-500 pr-6">Access</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                         {sub.materials?.map((mat, index) => (
                           <TableRow key={index} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors border-slate-100 dark:border-slate-800">
                              <TableCell className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-200 text-sm">{mat.title}</TableCell>
                              <TableCell>
                                 <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase ${
                                   mat.type?.toLowerCase() === 'pdf' ? 'bg-rose-50 text-rose-600 dark:bg-rose-900/20' : 'bg-blue-50 text-blue-600 dark:bg-blue-900/20'
                                 }`}>
                                   {mat.type || 'RAW'}
                                 </span>
                              </TableCell>
                              <TableCell className="text-right pr-6">
                                <div className="flex justify-end gap-2">
                                   <a href={mat.url} target="_blank" rel="noopener noreferrer">
                                     <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full hover:bg-indigo-50 text-indigo-600">
                                       <Eye className="w-4 h-4" />
                                     </Button>
                                   </a>
                                   <a href={mat.url} download>
                                     <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full hover:bg-emerald-50 text-emerald-600">
                                       <Download className="w-4 h-4" />
                                     </Button>
                                   </a>
                                </div>
                              </TableCell>
                           </TableRow>
                         ))}
                         {(!sub.materials || sub.materials.length === 0) && (
                           <TableRow>
                             <TableCell colSpan={3} className="text-center py-10 text-slate-400 text-sm italic">
                               No assets available for this subject yet.
                             </TableCell>
                           </TableRow>
                         )}
                      </TableBody>
                    </Table>
                 </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <Modal 
          open={showModal} 
          onClose={() => setShowModal(false)}
          title={editingSubject ? 'Update Subject Definitions' : 'Add New Subject'}
          size="lg"
        >
           <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[85vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Subject Name</label>
                    <Input 
                      placeholder="e.g. Zoology" 
                      className="h-11 rounded-xl" 
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                    />
                 </div>
                 <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Subject Code</label>
                    <Input 
                      placeholder="e.g. ZOO-101" 
                      className="h-11 rounded-xl"
                      value={formData.subject_code}
                      onChange={(e) => setFormData({...formData, subject_code: e.target.value})}
                    />
                 </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {isSuperAdmin && (
                   <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Target Campus</label>
                      <select 
                        className="w-full h-11 px-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-transparent outline-none text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 transition-all"
                        required
                        value={formData.branch_id}
                        onChange={(e) => {
                          const newBranchId = e.target.value;
                          setFormData({
                            ...formData, 
                            branch_id: newBranchId,
                            class_id: '' // Reset class when branch changes
                          });
                        }}
                      >
                        <option value="">Select Branch</option>
                        {branches.map(b => (
                          <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                      </select>
                   </div>
                 )}
                 <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Target Class</label>
                    <select 
                      className="w-full h-11 px-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-transparent outline-none text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 transition-all"
                      required
                      disabled={!formData.branch_id}
                      value={formData.class_id}
                      onChange={(e) => setFormData({...formData, class_id: e.target.value})}
                    >
                      <option value="">{formData.branch_id ? 'Select Class' : 'Pick a Branch first'}</option>
                      {classes
                        .filter(cls => cls.branch_id === formData.branch_id)
                        .map(cls => (
                          <option key={cls.id} value={cls.id}>{cls.name}</option>
                        ))}
                    </select>
                 </div>
              </div>

              {/* Material Asset Upload Area */}
              <div className="space-y-4 pt-4 border-t dark:border-slate-800">
                 <div className="flex items-center justify-between">
                    <h3 className="font-bold flex items-center gap-2 text-slate-800 dark:text-slate-200">
                      <LinkIcon className="w-5 h-5 text-indigo-600" />
                      Asset Repository
                    </h3>
                    {!editingSubject && (
                      <label className="cursor-pointer">
                        <Input 
                          type="file" 
                          className="hidden" 
                          multiple 
                          onChange={handleFileChange}
                        />
                        <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 rounded-lg text-xs font-bold hover:bg-indigo-100 transition-colors">
                          <Plus className="w-4 h-4" />
                          Upload Materials
                        </div>
                      </label>
                    )}
                 </div>

                 {editingSubject ? (
                   <p className="text-xs text-amber-600 bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg border border-amber-100 dark:border-amber-900/30">
                     Note: For now, you can only modify subject details. To update materials, please delete and re-add the subject or use the dedicated asset manager (coming soon).
                   </p>
                 ) : (
                   <div className="space-y-3">
                      {formData.files.map((file, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                           <div className="flex items-center gap-3">
                              <div className="p-2 bg-white dark:bg-slate-900 rounded-lg shadow-sm">
                                <FileCheck className="w-4 h-4 text-emerald-600" />
                              </div>
                              <div>
                                <p className="text-sm font-bold truncate max-w-[200px]">{file.name}</p>
                                <p className="text-[10px] text-slate-500 uppercase">{(file.size / 1024).toFixed(1)} KB</p>
                              </div>
                           </div>
                           <button 
                             type="button" 
                             onClick={() => removeFile(idx)}
                             className="p-1.5 bg-rose-50 text-rose-600 rounded-full hover:bg-rose-100 transition-colors"
                           >
                             <X className="w-3.5 h-3.5" />
                           </button>
                        </div>
                      ))}
                      {formData.files.length === 0 && (
                        <div className="py-8 text-center bg-slate-50 dark:bg-slate-800/20 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800">
                           <Zap className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                           <p className="text-slate-500 text-xs font-medium">Select PDF or Document files to link as assets.</p>
                        </div>
                      )}
                   </div>
                 )}
              </div>

              <div className="flex gap-4 pt-6">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowModal(false)} 
                  className="flex-1 h-12 font-bold rounded-xl"
                  disabled={submitting}
                >
                  Discard
                </Button>
                <Button 
                  type="submit" 
                  className="flex-1 h-12 font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700"
                  disabled={submitting}
                >
                  {submitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    editingSubject ? 'Save Changes' : 'Initialize Subject'
                  )}
                </Button>
              </div>
           </form>
        </Modal>
      )}
    </div>
  );
}
