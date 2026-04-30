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
  Users,
  IdCard,
  BarChart2
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
  onStatusToggle,
  userRole = 'branch-admin',
  loading = false
}) => {
  
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed': return 'bg-emerald-100 text-emerald-700';
      case 'ongoing':
      case 'active': return 'bg-blue-100 text-blue-700 animate-pulse';
      case 'scheduled': return 'bg-amber-100 text-amber-700';
      default: return 'bg-slate-100 text-slate-600';
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
      <div className="py-20 text-center text-slate-400 animate-pulse">
        <div className="flex flex-col items-center gap-2">
          <div className="h-10 w-10 bg-slate-100 rounded-full mb-2" />
          <div className="h-4 w-48 bg-slate-100 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader className="bg-slate-50/50">
          <TableRow>
            <TableHead className="font-bold text-slate-700">Exam Details</TableHead>
            {userRole === 'super-admin' && <TableHead className="font-bold text-slate-700">Branch</TableHead>}
            <TableHead className="font-bold text-slate-700">Class & Section</TableHead>
            <TableHead className="font-bold text-slate-700">Subjects</TableHead>
            <TableHead className="font-bold text-slate-700">Schedule</TableHead>
            <TableHead className="font-bold text-slate-700">Status</TableHead>
            <TableHead className="text-right font-bold text-slate-700">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {exams.length === 0 ? (
            <TableRow>
              <TableCell colSpan={userRole === 'super-admin' ? 7 : 6} className="text-center py-12 text-slate-400 italic">
                <div className="flex flex-col items-center gap-2">
                  <BookOpen className="w-8 h-8 opacity-20" />
                  <span>No examinations found</span>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            exams.map((exam) => {
              const subjects = exam.subjects || [];
              const subjectNames = subjects.map(s => s.subject_name || s.subjectId?.name || s.subject?.name || "Subject").join(", ");

              return (
                <TableRow key={exam._id || exam.id} className="hover:bg-slate-50/50 transition-colors group">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 shadow-sm border border-indigo-100">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 leading-tight">{exam.title}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                          {exam.examType || exam.exam_type || "Examination"}
                        </p>
                      </div>
                    </div>
                  </TableCell>

                  {userRole === 'super-admin' && (
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-sm font-medium text-slate-600">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        {exam.branchId?.name || exam.branch?.name || 'All Branches'}
                      </div>
                    </TableCell>
                  )}

                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <Badge variant="secondary" className="w-fit font-bold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-none">
                        {exam.classId?.name || exam.class?.name || "Class"}
                      </Badge>
                      {(exam.section || exam.sectionId) && (
                        <span className="text-[11px] font-bold text-slate-500 ml-1">
                          Section: {exam.sectionId?.name || exam.section?.name || exam.section || "All"}
                        </span>
                      )}
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="flex -space-x-2 overflow-hidden">
                        {subjects.slice(0, 3).map((sub, i) => (
                          <div key={i} className="inline-block h-6 w-6 rounded-full ring-2 ring-white bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-600" title={sub.subject_name || sub.subjectId?.name}>
                            {(sub.subject_name || sub.subjectId?.name || "?")[0]}
                          </div>
                        ))}
                        {subjects.length > 3 && (
                          <div className="inline-block h-6 w-6 rounded-full ring-2 ring-white bg-slate-800 flex items-center justify-center text-[8px] font-bold text-white">
                            +{subjects.length - 3}
                          </div>
                        )}
                      </div>
                      <span className="text-xs font-bold text-slate-500" title={subjectNames}>
                        {subjects.length} subjects
                      </span>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center gap-2 text-slate-600">
                      <Calendar className="w-4 h-4 text-indigo-500" />
                      <span className="text-sm font-bold tabular-nums">{formatDateRange(subjects)}</span>
                    </div>
                  </TableCell>

                  <TableCell>
                    <Badge className={`font-bold uppercase text-[9px] tracking-widest px-2.5 py-0.5 rounded-full border-none ${getStatusColor(exam.status)}`}>
                      {exam.status || "Scheduled"}
                    </Badge>
                  </TableCell>

                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1.5">
                      {onView && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-8 w-8 p-0 text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                          onClick={() => onView(exam)}
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      )}

                      {onAdmitCard && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-8 w-8 p-0 text-violet-600 border-violet-200 hover:bg-violet-50"
                          onClick={() => onAdmitCard(exam)}
                          title="Download Admit Cards"
                        >
                          <IdCard className="w-4 h-4" />
                        </Button>
                      )}

                      {onReports && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-8 w-8 p-0 text-cyan-600 border-cyan-200 hover:bg-cyan-50"
                          onClick={() => onReports(exam)}
                          title="View Results / Generate Report Cards"
                        >
                          <BarChart2 className="w-4 h-4" />
                        </Button>
                      )}
                      
                      {onResults && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-8 px-3 text-emerald-600 border-emerald-200 hover:bg-emerald-50 font-bold text-xs"
                          onClick={() => onResults(exam)}
                        >
                          <ClipboardCheck className="w-3.5 h-3.5 mr-1.5" /> Marks
                        </Button>
                      )}

                      {onEdit && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => onEdit(exam)} 
                          className="h-8 w-8 p-0 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      )}
                      
                      {onDelete && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => onDelete(exam._id || exam.id)} 
                          className="h-8 w-8 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50"
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
  );
};

export default ExamTable;
