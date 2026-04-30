'use client';

import React from 'react';
import Modal from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, MapPin, Printer, Info, GraduationCap, Building2, BookOpen, Trophy, User } from 'lucide-react';
import { format } from 'date-fns';

export default function ExamDetailsModal({ exam, onClose }) {
  if (!exam) return null;

  const handlePrint = () => {
    window.print();
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "TBA";
    try {
      return format(new Date(dateStr), "PPP");
    } catch (e) {
      return dateStr;
    }
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return "";
    const [h, m] = timeStr.split(":").map(Number);
    const ampm = h >= 12 ? "PM" : "AM";
    const hours = h % 12 || 12;
    return `${String(hours).padStart(2, "0")}:${String(m).padStart(2, "0")} ${ampm}`;
  };

  const campusName = exam.branchId?.name || exam.branch?.name || (typeof exam.branchId === 'string' ? exam.branchId : "Campus-12");

  return (
    <>
      <style>{`
        @media print {
          .no-print {
            display: none !important;
          }
        }
      `}</style>
      <Modal
      open={true}
      onClose={onClose}
      size="xl"
      headerClassName="no-print"
      title={
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-indigo-500" />
          <span>Exam Schedule Overview</span>
        </div>
      }
      footer={
        <div className="flex justify-between items-center w-full no-print">
          <p className="text-[10px] text-muted-foreground italic font-medium hidden sm:block">
            * Schedules are subject to change by administration.
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handlePrint} className="font-bold border-indigo-200 text-indigo-700 hover:bg-indigo-50">
              <Printer className="h-4 w-4 mr-2" />
              Print PDF
            </Button>
            <Button onClick={onClose} variant="default" className="font-bold px-6">Close</Button>
          </div>
        </div>
      }
    >
      <div id="printable-timetable" className="print:p-0 p-1 sm:p-2">
        <style jsx global>{`
          @media print {
            @page { size: portrait; margin: 1cm; }
            .no-print { display: none !important; }
            body { background: white !important; }
            .print-shadow-none { box-shadow: none !important; }
            .print-border { border: 1px solid #e2e8f0 !important; }
            .print-bg-white { background-color: white !important; }
            .print-text-black { color: black !important; }
          }
        `}</style>

        <Card className="border-none shadow-none print:shadow-none print:bg-white">
          <CardHeader className="px-0 pt-0 pb-6 border-b mb-6 print:pb-4 print:mb-4 print:border-slate-300">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 print:text-indigo-700">
                  <GraduationCap className="h-6 w-6" />
                  <span className="text-sm font-black uppercase tracking-[0.2em]">Adamjee Coaching Centre</span>
                </div>
                <CardTitle className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight print:text-2xl print:text-black">
                  {exam.title || "Exam Schedule"}
                </CardTitle>
                <div className="flex flex-wrap items-center gap-2 text-sm font-medium text-muted-foreground print:text-black">
                  <Badge variant="secondary" className="rounded-md font-bold bg-slate-100 text-slate-700 print:bg-white print:border-slate-300 print:text-black">
                    <Building2 className="h-3 w-3 mr-1.5" />
                    {campusName}
                  </Badge>
                  <span className="text-slate-300 print:text-slate-400">•</span>
                  <Badge variant="secondary" className="rounded-md font-bold bg-indigo-50 text-indigo-700 print:bg-white print:border-slate-300 print:text-black">
                    {exam.class?.name || exam.classId?.name || (typeof exam.class === 'string' ? exam.class : "Class")}
                  </Badge>
                  <span className="text-slate-300 print:text-slate-400">•</span>
                  <Badge variant="outline" className="rounded-md font-bold bg-blue-50/50 text-blue-600 border-blue-100 print:bg-white print:border-slate-300 print:text-black">
                    Section: {exam.section?.name || exam.sectionId?.name || (typeof exam.section === 'string' ? exam.section : "All")}
                  </Badge>
                  <span className="text-slate-300 print:text-slate-400">•</span>
                  <span className="flex items-center gap-1 font-bold text-slate-600 print:text-black">
                    <Info className="h-3 w-3" />
                    {exam.academicYear?.name || exam.academic_year?.name || exam.academicYearId?.name || (typeof exam.academicYear === 'string' ? exam.academicYear : "Academic Year")}
                  </span>
                </div>
              </div>
              
              <div className="hidden print:block text-right">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Date Generated</p>
                <p className="text-sm font-black text-slate-900">{new Date().toLocaleDateString()}</p>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="px-0">
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm bg-white dark:bg-slate-950 print:border-slate-400 print:rounded-none">
              <div className="overflow-x-auto">
                <Table className="w-full">
                  <TableHeader>
                    <TableRow className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 print:bg-slate-100 print:border-slate-400">
                      <TableHead className="w-[180px] font-black text-slate-500 uppercase text-[10px] tracking-widest py-4 pl-6 print:pl-4 border-r border-slate-200 dark:border-slate-800 print:border-slate-400">
                        Date & Day
                      </TableHead>
                      <TableHead className="font-black text-slate-500 uppercase text-[10px] tracking-widest py-4 pl-4 border-r border-slate-200 dark:border-slate-800 print:border-slate-400">
                        Subject
                      </TableHead>
                      <TableHead className="font-black text-slate-500 uppercase text-[10px] tracking-widest py-4 text-center border-r border-slate-200 dark:border-slate-800 print:border-slate-400">
                        Timing
                      </TableHead>
                      <TableHead className="font-black text-slate-500 uppercase text-[10px] tracking-widest py-4 text-center border-r border-slate-200 dark:border-slate-800 print:border-slate-400">
                        Marks
                      </TableHead>
                      <TableHead className="font-black text-slate-500 uppercase text-[10px] tracking-widest py-4 text-center">
                        Room
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {exam.subjects && exam.subjects.length > 0 ? (
                      exam.subjects.map((sub, idx) => (
                        <TableRow key={idx} className="hover:bg-transparent group border-b border-slate-100 dark:border-slate-800 last:border-0 print:border-slate-300">
                          <TableCell className="py-4 pl-6 print:pl-4 border-r border-slate-100 dark:border-slate-800 print:border-slate-300">
                            <div className="flex flex-col">
                              <span className="text-[12px] font-black text-slate-900 dark:text-slate-100 uppercase tracking-tight print:text-black">
                                {formatDate(sub.date)}
                              </span>
                              <span className="text-[9px] text-slate-400 uppercase font-black tracking-widest print:text-slate-500">
                                {sub.date ? format(new Date(sub.date), "EEEE") : ""}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="py-4 pl-4 border-r border-slate-100 dark:border-slate-800 print:border-slate-300">
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-full bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-900/30 flex items-center justify-center shadow-sm print:shadow-none print:border-slate-400 print:h-7 print:w-7">
                                <span className="text-xs font-black text-indigo-700 dark:text-indigo-400 print:text-black">{idx + 1}</span>
                              </div>
                              <span className="text-[12px] font-black text-slate-900 dark:text-white uppercase tracking-tight print:text-black">
                                {sub.subjectId?.name || sub.subject?.name || sub.subject_name || (typeof sub.subjectId === 'string' ? sub.subjectId : "Subject")}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="py-4 text-center border-r border-slate-100 dark:border-slate-800 print:border-slate-300">
                            <div className="flex flex-col items-center gap-1">
                              <div className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400 font-semibold print:text-black">
                                <Clock className="h-3 w-3 text-slate-400" />
                                <span className="tabular-nums font-bold">
                                  {formatTime(sub.startTime || sub.start_time)} - {formatTime(sub.endTime || sub.end_time)}
                                </span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="py-4 text-center border-r border-slate-100 dark:border-slate-800 print:border-slate-300">
                            <div className="flex flex-col items-center">
                              <span className="text-[12px] font-black text-slate-900 dark:text-white print:text-black">{sub.totalMarks || sub.total_marks || 100}</span>
                              <span className="text-[9px] text-emerald-600 font-bold uppercase tracking-tighter">Pass: {sub.passingMarks || sub.passing_marks || 40}</span>
                            </div>
                          </TableCell>
                          <TableCell className="py-4 text-center">
                            {sub.room ? (
                              <div className="flex items-center justify-center gap-1.5 text-[10px] text-indigo-600 dark:text-indigo-400 font-black uppercase tracking-tighter print:text-black">
                                <MapPin className="h-3 w-3" />
                                <span>{sub.room}</span>
                              </div>
                            ) : (
                              <div className="h-1.5 w-1.5 rounded-full bg-slate-100 dark:bg-slate-800 mx-auto" />
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="py-20 text-center text-slate-400 italic">
                          No subjects configured for this exam.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
            
            <div className="mt-8 hidden print:flex justify-between items-end border-t pt-4 border-slate-200">
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Authorized Signature</p>
                <div className="h-10 w-48 border-b border-slate-300" />
              </div>
              <p className="text-[9px] text-slate-400 italic font-medium">
                This is a computer-generated schedule. Adamjee Coaching Centre © {new Date().getFullYear()}
              </p>
            </div>

            <div className="mt-8 no-print grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-indigo-100 bg-indigo-50/30 flex items-start gap-3">
                <Info className="h-5 w-5 text-indigo-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-indigo-900">Important Note</h4>
                  <p className="text-xs text-indigo-700 leading-relaxed">
                    Students must arrive 15 minutes before the exam starts. Late entry may not be permitted.
                  </p>
                </div>
              </div>
              <div className="p-4 rounded-xl border border-emerald-100 bg-emerald-50/30 flex items-start gap-3">
                <Trophy className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-emerald-900">Grading Policy</h4>
                  <p className="text-xs text-emerald-700 leading-relaxed">
                    Results will be announced as per the academic calendar. Please check the portal for updates.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Modal>
    </>
  );
}
