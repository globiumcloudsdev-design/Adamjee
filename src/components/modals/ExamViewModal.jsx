"use client";

import React from "react";
import Modal from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Calendar, MapPin, Printer, Info, GraduationCap, Building2, BookOpen, Trophy } from "lucide-react";
import { format } from "date-fns";

const ExamView = ({ exam }) => {
  if (!exam) return null;

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

  const campusName = exam.branch?.name || exam.branch_id?.name || "Campus-12";

  return (
    <div id="printable-exam" className="print:p-0">
      <style jsx global>{`
        @media print {
          @page { size: portrait; margin: 1.5cm; }
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
                {exam.title || "Examination Schedule"}
              </CardTitle>
              <div className="flex flex-wrap items-center gap-2 text-sm font-medium text-muted-foreground print:text-black">
                <Badge variant="secondary" className="rounded-md font-bold bg-slate-100 text-slate-700 print:bg-white print:border-slate-300 print:text-black">
                  <Building2 className="h-3 w-3 mr-1.5" />
                  {campusName}
                </Badge>
                <span className="text-slate-300 print:text-slate-400">•</span>
                <Badge variant="secondary" className="rounded-md font-bold bg-indigo-50 text-indigo-700 print:bg-white print:border-slate-300 print:text-black">
                  {exam.class?.name || exam.class_id?.name || "Class"}
                </Badge>
                <span className="text-slate-300 print:text-slate-400">•</span>
                <Badge variant="outline" className="rounded-md font-bold bg-blue-50/50 text-blue-600 border-blue-100 print:bg-white print:border-slate-300 print:text-black">
                  Section: {exam.section?.name || exam.section_id?.name || "All"}
                </Badge>
                <span className="text-slate-300 print:text-slate-400">•</span>
                <span className="flex items-center gap-1 font-bold text-slate-600 print:text-black">
                  <Info className="h-3 w-3" />
                  {exam.academic_year?.name || exam.academic_year_id?.name || "Academic Year"}
                </span>
              </div>
            </div>
            
            <div className="text-right flex flex-col items-end gap-1">
              <Badge className="bg-indigo-600 text-white font-bold uppercase tracking-widest text-[10px]">
                {exam.exam_type || "General"}
              </Badge>
              <div className="hidden print:block mt-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Date Generated</p>
                <p className="text-sm font-black text-slate-900">{new Date().toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="px-0">
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm bg-white dark:bg-slate-950 print:border-slate-400 print:rounded-none">
            <div className="overflow-x-auto">
              <Table className="w-full">
                <TableHeader>
                  <TableRow className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 print:bg-slate-100 print:border-slate-400">
                    <TableHead className="w-[180px] font-black text-slate-700 uppercase text-[11px] tracking-widest py-4 pl-6 print:pl-4">Date & Day</TableHead>
                    <TableHead className="font-black text-slate-700 uppercase text-[11px] tracking-widest py-4">Subject</TableHead>
                    <TableHead className="font-black text-slate-700 uppercase text-[11px] tracking-widest py-4 text-center">Timing</TableHead>
                    <TableHead className="font-black text-slate-700 uppercase text-[11px] tracking-widest py-4 text-center">Marks</TableHead>
                    <TableHead className="font-black text-slate-700 uppercase text-[11px] tracking-widest py-4 text-center">Room</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {exam.subjects && exam.subjects.length > 0 ? (
                    exam.subjects.map((sub, idx) => (
                      <TableRow key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors border-b border-slate-100 dark:border-slate-800 last:border-0 print:border-slate-300">
                        <TableCell className="py-4 pl-6 print:pl-4 font-bold text-slate-700 dark:text-slate-300">
                          <div className="flex flex-col">
                            <span className="text-sm">{formatDate(sub.date)}</span>
                            <span className="text-[10px] text-slate-400 uppercase tracking-tighter">
                              {sub.date ? format(new Date(sub.date), "EEEE") : ""}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs print:bg-white print:border">
                              {idx + 1}
                            </div>
                            <span className="font-black text-slate-900 dark:text-white uppercase tracking-tight">
                              {sub.subject_name || "Unknown Subject"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="py-4 text-center">
                          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-700 dark:text-slate-300 tabular-nums print:bg-white">
                            <Clock className="h-3 w-3 text-slate-400" />
                            {formatTime(sub.start_time)} - {formatTime(sub.end_time)}
                          </div>
                        </TableCell>
                        <TableCell className="py-4 text-center">
                          <div className="flex flex-col items-center">
                            <span className="text-sm font-black text-slate-900 dark:text-white">{sub.total_marks || 100}</span>
                            <span className="text-[9px] text-emerald-600 font-bold uppercase">Pass: {sub.passing_marks || 40}</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-4 text-center">
                          {sub.room ? (
                            <Badge variant="outline" className="font-bold border-slate-200 text-slate-600 print:text-black">
                              <MapPin className="h-3 w-3 mr-1" />
                              {sub.room}
                            </Badge>
                          ) : (
                            <span className="text-slate-300">--</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="py-20 text-center text-slate-400">
                        No subject schedule found for this exam.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
          
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6 no-print">
            <div className="p-4 rounded-xl border border-indigo-100 bg-indigo-50/30 flex items-start gap-4">
              <div className="h-10 w-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                <Info className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-indigo-900">Exam Instructions</h4>
                <p className="text-xs text-indigo-700 leading-relaxed">
                  Please arrive at the examination hall at least 15 minutes before the start time. 
                  Bring your original Admit Card and required stationery. Mobile phones are strictly prohibited.
                </p>
              </div>
            </div>
            
            <div className="p-4 rounded-xl border border-emerald-100 bg-emerald-50/30 flex items-start gap-4">
              <div className="h-10 w-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                <Trophy className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-emerald-900">Grading Policy</h4>
                <p className="text-xs text-emerald-700 leading-relaxed">
                  Results will be published within 10 days of the last exam. 
                  Students scoring above 80% will receive special recognition in the campus newsletter.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-12 hidden print:flex justify-between items-end border-t pt-6 border-slate-200">
            <div className="space-y-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Controller of Examinations</p>
              <div className="h-12 w-56 border-b border-slate-300" />
            </div>
            <p className="text-[9px] text-slate-400 italic font-medium">
              This is a computer-generated schedule. Adamjee Coaching Centre © {new Date().getFullYear()}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const ExamViewModal = ({ isOpen, onClose, exam }) => {
  if (!exam) return null;

  const handlePrint = () => {
    window.print();
  };

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
      open={isOpen}
      onClose={onClose}
      size="xl"
      headerClassName="no-print"
      title={
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-indigo-500" />
          <span>Exam Schedule Details</span>
        </div>
      }
      footer={
        <div className="flex justify-between items-center w-full no-print">
          <p className="text-[10px] text-muted-foreground italic font-medium hidden sm:block">
            * All exams are mandatory. Contact administration for any schedule conflicts.
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handlePrint} className="font-bold border-indigo-200 text-indigo-700 hover:bg-indigo-50">
              <Printer className="h-4 w-4 mr-2" />
              Print Schedule
            </Button>
            <Button onClick={onClose} variant="default" className="font-bold px-6">Close</Button>
          </div>
        </div>
      }
    >
      <div className="p-1 sm:p-2">
        <ExamView exam={exam} />
      </div>
    </Modal>
    </>
  );
};

export default ExamViewModal;
