'use client';

import React, { useState } from 'react';
import { 
  FileText, 
  Plus, 
  Search, 
  Download, 
  Eye, 
  Trash2, 
  FileIcon, 
  ExternalLink,
  BookOpen,
  Filter,
  FileVideo,
  FileCheck2,
  Share2
} from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Modal from '@/components/ui/modal';
import Dropdown from '@/components/ui/dropdown';
import { withAuth } from '@/hooks/useAuth';
import { ROLES } from '@/constants/roles';

function SubjectMaterialsPage() {
  const [materials, setMaterials] = useState([
    { id: '1', title: 'Calculus - Limits & Continuity', subject: 'Mathematics', classNum: 'Class 12', type: 'PDF', size: '2.4 MB', date: '2024-03-15', downloads: 156 },
    { id: '2', title: 'Organic Chemistry Notes', subject: 'Chemistry', classNum: 'Class 12', type: 'DOCX', size: '1.8 MB', date: '2024-03-12', downloads: 89 },
    { id: '3', title: 'Physics - Wave Optics Formulae', subject: 'Physics', classNum: 'Class 11', type: 'PDF', size: '0.9 MB', date: '2024-03-10', downloads: 210 },
    { id: '4', title: 'Biology - Cell Division Diagram', subject: 'Biology', classNum: 'Class 10', type: 'JPG', size: '4.5 MB', date: '2024-03-08', downloads: 45 },
    { id: '5', title: 'English - Past Papers (2020-2023)', subject: 'English', classNum: 'Class 12', type: 'ZIP', size: '12.2 MB', date: '2024-03-01', downloads: 342 },
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="p-4 md:p-8 space-y-8 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pt-10">
        <div className="flex items-center gap-5">
           <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-violet-700 rounded-3xl flex items-center justify-center shadow-xl shadow-indigo-100 border border-indigo-400/20">
              <FileText className="w-8 h-8 text-white" />
           </div>
           <div>
              <h1 className="text-3xl font-black text-slate-800 tracking-tight">Study Repository</h1>
              <p className="text-slate-500 font-semibold italic">Curate and distribute high-quality educational materials</p>
           </div>
        </div>
        <Button 
          onClick={() => setShowModal(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white p-6 h-auto rounded-[1.5rem] shadow-xl shadow-indigo-200 text-lg font-black gap-2 transition-all hover:scale-105 active:scale-95"
        >
          <Plus className="w-6 h-6" />
          Upload Material
        </Button>
      </div>

      {/* Analytics Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {[
          { label: 'Total Files', value: '458', icon: FileCheck2, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'Active Downloads', value: '1.2k', icon: Download, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Video Lectures', value: '42', icon: FileVideo, color: 'text-rose-600', bg: 'bg-rose-50' },
          { label: 'Cloud Storage', value: '68%', icon: Share2, color: 'text-amber-600', bg: 'bg-amber-50' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-3xl border border-slate-200/60 flex items-center justify-between group hover:border-indigo-200 transition-colors">
            <div>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">{stat.label}</p>
              <h3 className="text-2xl font-black text-slate-800 mt-1">{stat.value}</h3>
            </div>
            <div className={`w-12 h-12 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
              <stat.icon className="w-6 h-6" />
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        {/* Sidebar Filters */}
        <div className="xl:col-span-1 space-y-6">
          <Card className="rounded-3xl border-slate-200/60 shadow-sm sticky top-24">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-black flex items-center gap-2">
                <Filter className="w-5 h-5 text-indigo-600" />
                Refine Search
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Subject</label>
                <select className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-100 transition-all cursor-pointer appearance-none">
                  <option>All Subjects</option>
                  <option>Mathematics</option>
                  <option>Physics</option>
                  <option>Chemistry</option>
                  <option>Biology</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Class Level</label>
                <select className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-100 transition-all cursor-pointer appearance-none">
                  <option>All Classes</option>
                  <option>Class 9</option>
                  <option>Class 10</option>
                  <option>1st Year</option>
                  <option>2nd Year</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">File Format</label>
                <div className="flex flex-wrap gap-2 pt-1">
                  {['PDF', 'DOC', 'PPT', 'Video', 'Images'].map(f => (
                    <button key={f} className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-indigo-600 hover:text-white transition-all">
                      {f}
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Repository Grid */}
        <div className="xl:col-span-3 space-y-6">
          <div className="relative group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-300 group-focus-within:text-indigo-600 transition-colors" />
            <Input 
              placeholder="Search by file name or curriculum tag..."
              className="pl-16 pr-8 py-8 rounded-[2rem] border-slate-200 bg-white text-lg font-medium shadow-sm focus:ring-8 focus:ring-indigo-50/50 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {materials.map((file) => (
              <div key={file.id} className="group bg-white rounded-3xl border border-slate-200/60 p-6 hover:shadow-2xl hover:border-indigo-300 transition-all duration-300 relative overflow-hidden flex flex-col">
                {/* Background Pattern */}
                <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-indigo-50 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-700" />
                
                <div className="flex items-start justify-between mb-4 relative z-10">
                   <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xs ${
                     file.type === 'PDF' ? 'bg-rose-50 text-rose-600 border border-rose-100' :
                     file.type === 'DOCX' ? 'bg-blue-50 text-blue-600 border border-blue-100' :
                     file.type === 'ZIP' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                     'bg-indigo-50 text-indigo-600 border border-indigo-100'
                   }`}>
                     {file.type}
                   </div>
                   <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-2 bg-slate-50 hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 rounded-lg transition-all"><Eye className="w-4 h-4" /></button>
                      <button className="p-2 bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-all"><Trash2 className="w-4 h-4" /></button>
                   </div>
                </div>

                <div className="space-y-2 flex-grow relative z-10">
                  <h4 className="font-black text-slate-800 text-lg leading-tight group-hover:text-indigo-700 transition-colors">{file.title}</h4>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 bg-slate-100 text-slate-500 rounded-md">{file.subject}</span>
                    <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 bg-indigo-50 text-indigo-500 rounded-md">{file.classNum}</span>
                  </div>
                </div>

                <div className="mt-8 pt-4 border-t border-slate-50 flex items-center justify-between relative z-10">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Size: {file.size}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{file.date}</p>
                  </div>
                  <Button className="bg-slate-900 hover:bg-indigo-600 text-white rounded-xl h-10 px-4 flex items-center gap-2 text-xs font-black transition-all shadow-lg active:scale-95 shadow-slate-100">
                    <Download className="w-4 h-4" />
                    Download
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Upload Modal placeholder */}
      {showModal && (
        <Modal 
          open={showModal} 
          onClose={() => setShowModal(false)}
          title="Digital Asset Deployment"
          size="md"
        >
          <div className="p-8 space-y-6">
             <div className="border-4 border-dashed border-slate-100 rounded-[2rem] p-12 text-center group/drop hover:border-indigo-100 hover:bg-indigo-50/10 transition-all cursor-pointer">
                <div className="w-20 h-20 bg-indigo-100 rounded-[2rem] flex items-center justify-center mx-auto mb-4 group-hover/drop:scale-110 transition-transform">
                  <Plus className="w-10 h-10 text-indigo-600" />
                </div>
                <h4 className="text-xl font-black text-slate-800">Drag & Drop Files</h4>
                <p className="text-slate-500 font-medium">Supported: PDF, DOCX, ZIP, MP4 (Max 100MB)</p>
             </div>

             <div className="space-y-4">
               <div className="space-y-2">
                 <label className="text-sm font-bold text-slate-700 ml-1">Asset Name</label>
                 <Input placeholder="Enter a descriptive title..." className="py-6 rounded-2xl border-slate-200" />
               </div>
               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Categorization</label>
                    <select className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-700 outline-none">
                      <option>Mathematics</option>
                      <option>Physics</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Curriculum Level</label>
                    <select className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-700 outline-none">
                      <option>Class 12</option>
                      <option>1st Year</option>
                    </select>
                  </div>
               </div>
             </div>

             <div className="flex gap-4 pt-4">
                <Button onClick={() => setShowModal(false)} variant="outline" className="flex-1 py-6 rounded-2xl font-bold">Cancel</Button>
                <Button className="flex-1 py-6 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-lg shadow-indigo-100">Upload to Repository</Button>
             </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

const SubjectMaterialsPageWithAuth = withAuth(SubjectMaterialsPage, { requiredRole: ROLES.SUPER_ADMIN });
export default SubjectMaterialsPageWithAuth;
