'use client';

import React, { useState } from 'react';
import { 
  BookOpen, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  FileText, 
  Download,
  Eye,
  Layers,
  CheckCircle,
  X,
  PlusCircle,
  Link as LinkIcon,
  Activity,
  Shield,
  FileCheck,
  Zap,
  MoreVertical,
  Building2
} from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Modal from '@/components/ui/modal';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { withAuth } from '@/hooks/useAuth';
import { ROLES } from '@/constants/roles';

function SubjectsPage() {
  const [subjects, setSubjects] = useState([
    { 
      id: '1', 
      name: 'Mathematics', 
      code: 'MATH-12', 
      group: 'Pre-Engineering', 
      status: 'active',
      branches: 2,
      materials: [
        { id: 'm1', title: 'Calculus Ch-1 Notes', type: 'PDF', size: '2.4 MB' },
        { id: 'm2', title: 'Integration Short Tricks', type: 'Video', duration: '15:20' }
      ]
    },
    { 
      id: '2', 
      name: 'Biology', 
      code: 'BIO-11', 
      group: 'Pre-Medical', 
      status: 'active',
      branches: 3,
      materials: [
        { id: 'm3', title: 'Human Anatomy Atlas', type: 'PDF', size: '12.8 MB' }
      ]
    }
  ]);

  const [branches] = useState([
    { id: 'b1', name: 'Main Campus' },
    { id: 'b2', name: 'North Branch' },
    { id: 'b3', name: 'South Branch' }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    group: 'Pre-Medical',
    selectedBranches: [],
    materials: [{ title: '', type: 'PDF', url: '' }]
  });

  const handleAddNew = () => {
    setEditingSubject(null);
    setFormData({
      name: '',
      code: '',
      group: 'Pre-Medical',
      selectedBranches: branches.map(b => b.id), // All branches by default
      materials: [{ title: '', type: 'PDF', url: '' }]
    });
    setShowModal(true);
  };

  const addMaterialRow = () => {
    setFormData({
      ...formData,
      materials: [...formData.materials, { title: '', type: 'PDF', url: '' }]
    });
  };

  const removeMaterialRow = (index) => {
    const newMaterials = formData.materials.filter((_, i) => i !== index);
    setFormData({ ...formData, materials: newMaterials });
  };

  const updateMaterialField = (index, field, value) => {
    const newMaterials = [...formData.materials];
    newMaterials[index] = { ...newMaterials[index], [field]: value };
    setFormData({ ...formData, materials: newMaterials });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.selectedBranches.length === 0) return;
    toast.success(editingSubject ? 'Subject updated' : 'Subject provisioned across selected branches');
    setShowModal(false);
  };

  return (
    <div className="p-4 md:p-6 space-y-6 min-h-screen">
      {/* Header Matching Dashboard */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pt-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
             <BookOpen className="w-8 h-8 text-blue-600" />
             Subject Repository
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm md:text-base">
            Manage academic subjects and learning materials
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
          <Button onClick={handleAddNew} className="whitespace-nowrap">
            <Plus className="w-4 h-4 mr-2" />
            Add Subject
          </Button>
        </div>
      </div>

      {/* Stats Cards Matching Dashboard */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm font-medium text-gray-600 dark:text-gray-400">Total Subjects</p>
                <p className="text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100">{subjects.length}</p>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
                <Shield className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm font-medium text-gray-600 dark:text-gray-400">Learning Assets</p>
                <p className="text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100">85</p>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full">
                <FileCheck className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm font-medium text-gray-600 dark:text-gray-400">Storage Used</p>
                <p className="text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100">2.4 GB</p>
              </div>
              <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-full">
                <Zap className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm font-medium text-gray-600 dark:text-gray-400">Avg Material/Sub</p>
                <p className="text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100">4.2</p>
              </div>
              <div className="p-3 bg-orange-100 dark:bg-orange-900 rounded-full">
                <Activity className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Subjects View with Material Repository */}
      <div className="grid grid-cols-1 gap-6">
        {subjects.map((sub) => (
          <Card key={sub.id}>
            <CardHeader className="flex flex-row items-center justify-between border-b dark:border-gray-800">
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-lg flex items-center justify-center font-bold">
                    {sub.code}
                  </div>
                  <div>
                    <CardTitle className="text-xl">{sub.name}</CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-500 font-medium tracking-wider">{sub.group}</span>
                      <span className="text-gray-300">•</span>
                      <span className="text-xs text-indigo-500 font-bold bg-indigo-50 dark:bg-indigo-900/40 px-2 py-0.5 rounded-full">Deployed in {sub.branches} {sub.branches === 1 ? 'Campus' : 'Campuses'}</span>
                    </div>
                  </div>
               </div>
               <div className="flex gap-2">
                 <Button variant="outline" size="sm">
                   <Edit className="w-4 h-4 mr-2" />
                   Modify
                 </Button>
               </div>
            </CardHeader>
            <CardContent className="p-0">
               <Table>
                 <TableHeader className="bg-gray-50 dark:bg-gray-800/50">
                    <TableRow>
                       <TableHead className="px-6">Material Title</TableHead>
                       <TableHead>Type</TableHead>
                       <TableHead>Size/Duration</TableHead>
                       <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                 </TableHeader>
                 <TableBody>
                    {sub.materials.map((mat) => (
                      <TableRow key={mat.id}>
                         <TableCell className="px-6 font-medium">{mat.title}</TableCell>
                         <TableCell>
                            <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase ${
                              mat.type === 'PDF' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
                            }`}>
                              {mat.type}
                            </span>
                         </TableCell>
                         <TableCell className="text-gray-500 text-sm">{mat.size || mat.duration}</TableCell>
                         <TableCell className="text-right">
                           <div className="flex justify-end gap-2">
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <Download className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <Eye className="w-4 h-4" />
                              </Button>
                           </div>
                         </TableCell>
                      </TableRow>
                    ))}
                    {sub.materials.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-6 text-gray-400">No materials linked yet.</TableCell>
                      </TableRow>
                    )}
                 </TableBody>
               </Table>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create/Edit Modal Integrated */}
      {showModal && (
        <Modal 
          open={showModal} 
          onClose={() => setShowModal(false)}
          title={editingSubject ? 'Update Subject Definitions' : 'Add New Subject'}
          size="lg"
        >
           <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
              {/* Branch Selection UI */}
              <div className="space-y-3 pb-6 border-b dark:border-gray-800">
                 <h3 className="text-sm font-bold flex items-center gap-2">
                   <Building2 className="w-5 h-5 text-blue-500" />
                   Target Branches
                 </h3>
                 <p className="text-xs text-gray-500 pb-2">Select the campuses where this subject will be taught.</p>
                 <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {branches.map(branch => (
                      <label key={branch.id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg cursor-pointer border border-transparent hover:border-blue-200 transition-all">
                        <input 
                          type="checkbox" 
                          className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                          checked={formData.selectedBranches.includes(branch.id)}
                          onChange={(e) => {
                            const newSelection = e.target.checked 
                              ? [...formData.selectedBranches, branch.id]
                              : formData.selectedBranches.filter(id => id !== branch.id);
                            setFormData({...formData, selectedBranches: newSelection});
                          }}
                        />
                        <span className="text-sm font-medium">{branch.name}</span>
                      </label>
                    ))}
                 </div>
                 {formData.selectedBranches.length === 0 && (
                   <p className="text-xs text-red-500 font-medium pt-1">At least one branch must be selected.</p>
                 )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 <div className="space-y-2">
                    <label className="text-sm font-medium">Subject Title</label>
                    <Input placeholder="e.g. Zoology" className="bg-transparent" required/>
                 </div>
                 <div className="space-y-2">
                    <label className="text-sm font-medium">Catalog Code</label>
                    <Input placeholder="e.g. ZOO-101" className="bg-transparent" required/>
                 </div>
                 <div className="space-y-2">
                    <label className="text-sm font-medium">Academic Group</label>
                    <select className="w-full h-10 px-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-transparent outline-none">
                       <option>Pre-Medical</option>
                       <option>Pre-Engineering</option>
                    </select>
                 </div>
              </div>

              <div className="space-y-4 pt-4 border-t dark:border-gray-800">
                 <div className="flex items-center justify-between">
                    <h3 className="font-bold flex items-center gap-2">
                      <LinkIcon className="w-5 h-5 text-blue-500" />
                      Asset Repository
                    </h3>
                    <Button type="button" variant="outline" size="sm" onClick={addMaterialRow}>
                      <Plus className="w-4 h-4 mr-1" />
                      Link Asset
                    </Button>
                 </div>

                 <div className="space-y-3">
                    {formData.materials.map((mat, idx) => (
                      <div key={idx} className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl relative border border-transparent hover:border-blue-200">
                         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-1">
                               <label className="text-[10px] font-bold text-gray-500 uppercase">Label</label>
                               <Input placeholder="e.g. Chapter 1 Notes" value={mat.title} onChange={(e) => updateMaterialField(idx, 'title', e.target.value)} />
                            </div>
                            <div className="space-y-1">
                               <label className="text-[10px] font-bold text-gray-500 uppercase">Type</label>
                               <select 
                                 className="w-full h-10 px-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-transparent outline-none"
                                 value={mat.type}
                                 onChange={(e) => updateMaterialField(idx, 'type', e.target.value)}
                               >
                                  <option>PDF Document</option>
                                  <option>Video Link</option>
                               </select>
                            </div>
                            <div className="space-y-1">
                               <label className="text-[10px] font-bold text-gray-500 uppercase">Resource Source</label>
                               <Input placeholder="URL or ID" value={mat.url} onChange={(e) => updateMaterialField(idx, 'url', e.target.value)} />
                            </div>
                         </div>
                         {formData.materials.length > 1 && (
                           <button 
                             type="button" 
                             onClick={() => removeMaterialRow(idx)}
                             className="absolute -top-2 -right-2 bg-red-100 text-red-600 p-1 rounded-full"
                           >
                             <X className="w-3 h-3" />
                           </button>
                         )}
                      </div>
                    ))}
                 </div>
              </div>

              <div className="flex gap-4 pt-6">
                <Button type="button" variant="outline" onClick={() => setShowModal(false)} className="flex-1 font-bold">Discard</Button>
                <Button type="submit" disabled={formData.selectedBranches.length === 0} className="flex-1 font-bold">Initialize Subject</Button>
              </div>
           </form>
        </Modal>
      )}
    </div>
  );
}

const SubjectsPageWithAuth = withAuth(SubjectsPage, { requiredRole: ROLES.SUPER_ADMIN });
export default SubjectsPageWithAuth;
