'use client';

import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Eye, 
  Edit, 
  Trash2, 
  ClipboardCheck, 
  FileText, 
  Calendar, 
  BookOpen, 
  Building2,
  IdCard,
  BarChart2,
  Clock,
  Layers,
  GraduationCap
} from 'lucide-react';
import { format } from 'date-fns';

const ExamTable = ({ 
  exams = [], 
  onView, 
  onEdit, 
  onDelete, 
  onResults,
  onAdmitCard,
  onReports,
  userRole = 'branch-admin',
  loading = false
}) => {
  
  const getStatusStyle = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed': return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
      case 'ongoing':
      case 'active': return 'bg-blue-500/10 text-blue-600 border-blue-500/20 relative overflow-hidden';
      case 'scheduled': return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
      default: return 'bg-slate-500/10 text-slate-600 border-slate-500/20';
    }
  };

  const formatDateRange = (subjects) => {
    if (!subjects || subjects.length === 0) return "TBA";
    const dates = subjects.map(s => s.date).filter(Boolean).sort();
    if (dates.length === 0) return "TBA";
    
    try {
      if (dates.length === 1) return format(new Date(dates[0]), "MMMM d, yyyy");
      return `${format(new Date(dates[0]), "MMM d")} - ${format(new Date(dates[dates.length-1]), "MMM d, yyyy")}`;
    } catch (e) {
      return "Invalid Date";
    }
  };

  if (loading && exams.length === 0) {
    return (
      <div className="py-24 flex flex-col items-center justify-center">
        <div className="relative w-16 h-16 mb-4">
          <div className="absolute inset-0 border-4 border-indigo-100 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
        </div>
        <p className="text-slate-500 font-medium animate-pulse">Loading examinations...</p>
      </div>
    );
  }

  return (
    <div className="w-full bg-white rounded-xl border border-slate-200/60 overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/80 border-b border-slate-200/60 hover:bg-slate-50/80">
              <TableHead className="py-4 pl-6 font-semibold text-slate-700 text-[13px] uppercase tracking-wider">Exam Details</TableHead>
              {userRole === 'super-admin' && <TableHead className="py-4 font-semibold text-slate-700 text-[13px] uppercase tracking-wider">Branch</TableHead>}
              <TableHead className="py-4 font-semibold text-slate-700 text-[13px] uppercase tracking-wider">Class & Section</TableHead>
              <TableHead className="py-4 font-semibold text-slate-700 text-[13px] uppercase tracking-wider">Subjects</TableHead>
              <TableHead className="py-4 font-semibold text-slate-700 text-[13px] uppercase tracking-wider">Schedule</TableHead>
              <TableHead className="py-4 font-semibold text-slate-700 text-[13px] uppercase tracking-wider">Status</TableHead>
              <TableHead className="py-4 pr-6 text-right font-semibold text-slate-700 text-[13px] uppercase tracking-wider">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {exams.length === 0 ? (
              <TableRow>
                <TableCell colSpan={userRole === 'super-admin' ? 7 : 6} className="h-64 text-center">
                  <div className="flex flex-col items-center justify-center text-slate-400">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-3">
                      <BookOpen className="w-8 h-8 text-slate-300" />
                    </div>
                    <p className="text-base font-medium text-slate-600">No examinations found</p>
                    <p className="text-sm mt-1">Create a new exam to get started</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              exams.map((exam) => {
                const subjects = exam.subjects || [];
                const subjectNames = subjects.map(s => s.subject_name || s.subjectId?.name || s.subject?.name || "Subject").join(", ");

                return (
                  <TableRow 
                    key={exam._id || exam.id} 
                    className="group border-b border-slate-100 hover:bg-indigo-50/30 transition-all duration-200"
                  >
                    <TableCell className="pl-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-indigo-50 to-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 shadow-sm border border-indigo-100/50 group-hover:scale-105 group-hover:shadow-md transition-all duration-300">
                          <GraduationCap className="w-6 h-6" />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-900 text-[15px] group-hover:text-indigo-700 transition-colors">
                            {exam.title}
                          </span>
                          <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider mt-0.5 flex items-center gap-1">
                            <Layers className="w-3 h-3" />
                            {exam.examType || exam.exam_type || "Examination"}
                          </span>
                        </div>
                      </div>
                    </TableCell>

                    {userRole === 'super-admin' && (
                      <TableCell className="py-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-100 text-sm font-medium text-slate-700">
                          <Building2 className="w-4 h-4 text-indigo-500" />
                          {exam.branchId?.name || exam.branch?.name || 'All Branches'}
                        </div>
                      </TableCell>
                    )}

                    <TableCell className="py-4">
                      <div className="flex flex-col gap-1.5">
                        <div className="inline-flex items-center w-fit px-2.5 py-1 rounded-md bg-indigo-50 border border-indigo-100/50 text-indigo-700 text-xs font-semibold">
                          {exam.classId?.name || exam.class?.name || "Class"}
                        </div>
                        {(exam.section || exam.sectionId) && (
                          <div className="text-[12px] font-medium text-slate-500 flex items-center gap-1 ml-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                            Sec: {exam.sectionId?.name || exam.section?.name || exam.section || "All"}
                          </div>
                        )}
                      </div>
                    </TableCell>

                    <TableCell className="py-4">
                      <div className="flex items-center gap-3" title={subjectNames}>
                        <div className="flex -space-x-2.5 overflow-hidden p-1">
                          {subjects.slice(0, 3).map((sub, i) => (
                            <div 
                              key={i} 
                              className="inline-flex h-8 w-8 rounded-full ring-2 ring-white bg-gradient-to-br from-slate-100 to-slate-200 items-center justify-center text-[11px] font-bold text-slate-700 shadow-sm group-hover:-translate-y-0.5 transition-transform" 
                              style={{ transitionDelay: `${i * 50}ms` }}
                            >
                              {(sub.subject_name || sub.subjectId?.name || "?")[0]?.toUpperCase()}
                            </div>
                          ))}
                          {subjects.length > 3 && (
                            <div className="inline-flex h-8 w-8 rounded-full ring-2 ring-white bg-slate-800 items-center justify-center text-[10px] font-bold text-white shadow-sm group-hover:-translate-y-0.5 transition-transform" style={{ transitionDelay: '150ms' }}>
                              +{subjects.length - 3}
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-slate-700">{subjects.length}</span>
                          <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Subjects</span>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="py-4">
                      <div className="inline-flex items-center gap-2.5 px-3 py-2 rounded-lg bg-slate-50 border border-slate-100 group-hover:bg-white group-hover:border-indigo-100 group-hover:shadow-sm transition-all">
                        <Calendar className="w-4 h-4 text-indigo-500" />
                        <span className="text-sm font-medium text-slate-700">{formatDateRange(subjects)}</span>
                      </div>
                    </TableCell>

                    <TableCell className="py-4">
                      <div className={`inline-flex items-center justify-center px-3 py-1 rounded-full border text-xs font-bold uppercase tracking-wider ${getStatusStyle(exam.status)}`}>
                        {exam.status || "Scheduled"}
                        {(exam.status?.toLowerCase() === 'ongoing' || exam.status?.toLowerCase() === 'active') && (
                          <span className="relative flex h-2 w-2 ml-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                          </span>
                        )}
                      </div>
                    </TableCell>

                    <TableCell className="py-4 pr-6">
                      <div className="flex items-center justify-end gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                        
                        {onResults && (
                          <Button 
                            variant="outline" 
                            size="icon" 
                            className="h-8 w-8 text-emerald-600 border-emerald-200 bg-emerald-50/50 hover:bg-emerald-100 hover:border-emerald-300 shadow-sm"
                            onClick={() => onResults(exam)}
                            title="Enter Marks"
                          >
                            <ClipboardCheck className="w-4 h-4" />
                          </Button>
                        )}

                        {onView && (
                          <Button 
                            variant="outline" 
                            size="icon" 
                            className="h-8 w-8 text-indigo-600 border-indigo-200 bg-indigo-50/50 hover:bg-indigo-100 hover:border-indigo-300 shadow-sm"
                            onClick={() => onView(exam)}
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        )}

                        {onAdmitCard && (
                          <Button 
                            variant="outline" 
                            size="icon" 
                            className="h-8 w-8 text-violet-600 border-violet-200 bg-violet-50/50 hover:bg-violet-100 hover:border-violet-300 shadow-sm"
                            onClick={() => onAdmitCard(exam)}
                            title="Download Admit Cards"
                          >
                            <IdCard className="w-4 h-4" />
                          </Button>
                        )}

                        {onReports && (
                          <Button 
                            variant="outline" 
                            size="icon" 
                            className="h-8 w-8 text-cyan-600 border-cyan-200 bg-cyan-50/50 hover:bg-cyan-100 hover:border-cyan-300 shadow-sm"
                            onClick={() => onReports(exam)}
                            title="View Results / Generate Report Cards"
                          >
                            <BarChart2 className="w-4 h-4" />
                          </Button>
                        )}
                        
                        <div className="w-px h-6 bg-slate-200 mx-1 hidden sm:block"></div>

                        {onEdit && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => onEdit(exam)} 
                            className="h-8 w-8 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
                            title="Edit Exam"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        )}
                        
                        {onDelete && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => onDelete(exam._id || exam.id)} 
                            className="h-8 w-8 text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                            title="Delete Exam"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default ExamTable;
