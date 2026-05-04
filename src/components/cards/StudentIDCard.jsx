import React from 'react';
import { User, Phone, MapPin, GraduationCap, Calendar, Mail } from 'lucide-react';

const StudentIDCard = ({ student, qrCodeUrl, coachingLogo = "/adamjee-logo.png" }) => {
  if (!student) return null;

  const studentName = `${student.first_name || ''} ${student.last_name || ''}`.toUpperCase();
  const regNo = student.registration_no || 'N/A';
  const academicInfo = student.details?.academic_info || {};
  const className = academicInfo.class_name || 'N/A';
  const sectionName = academicInfo.section_name || 'N/A';
  const groupName = academicInfo.group_name || 'N/A';
  const branchName = student.branch?.name || 'N/A';
  const admissionDate = academicInfo.admission_date ? new Date(academicInfo.admission_date).toLocaleDateString() : 'N/A';

  return (
    <div className="flex flex-col md:flex-row gap-8 items-center justify-center p-6 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
      
      {/* Front Side */}
      <div className="relative w-[320px] h-[520px] bg-white rounded-2xl shadow-2xl border-[6px] border-black overflow-hidden flex flex-col font-sans">
        {/* Top Header */}
        <div className="pt-8 px-6 text-center">
          <h2 className="text-3xl font-black tracking-tight text-black leading-tight">
            {studentName || "STUDENT NAME"}
          </h2>
          <p className="text-lg font-bold text-slate-500 mt-1">
            ID NO. {regNo}
          </p>
        </div>

        {/* Student Photo */}
        <div className="mt-8 mx-auto w-44 h-48 bg-slate-100 border-2 border-slate-200 rounded-lg overflow-hidden shadow-inner flex items-center justify-center">
          {student.avatar_url ? (
            <img src={student.avatar_url} alt="Student" className="w-full h-full object-cover" />
          ) : (
            <User className="w-24 h-24 text-slate-300" />
          )}
        </div>

        {/* Brand Bar */}
        <div className="mt-auto bg-gradient-to-r from-[#edb42d] to-[#bd7c37] py-4 px-4 text-center border-y-2 border-black">
          <h3 className="text-xl font-black text-white tracking-tighter drop-shadow-sm">
            ADAMJEE COACHING CENTRE
          </h3>
          <p className="text-[10px] font-bold text-white/90 uppercase tracking-widest mt-0.5 drop-shadow-sm">
            The Best in Coaching
          </p>
        </div>

        {/* Footer Info */}
        <div className="p-6 bg-white flex flex-col gap-2">
          <div className="flex justify-between items-center text-[11px] font-bold text-slate-600 uppercase tracking-wider">
            <span>Branch: {branchName}</span>
          </div>
          <div className="flex justify-between items-center text-[11px] font-bold text-slate-600 uppercase tracking-wider">
            <span>Class: {className}</span>
            <span>Section: {sectionName}</span>
          </div>
          <div className="flex justify-between items-center text-[11px] font-bold text-slate-600 uppercase tracking-wider">
            <span>Group: {groupName}</span>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 flex justify-between text-[10px] font-bold text-slate-400">
            <span>JOIN: {admissionDate}</span>
            <span>EXPIRE: AUG 2026</span>
          </div>
        </div>

        {/* Logo Overlay */}
        <div className="absolute top-4 right-4 w-12 h-12 opacity-20 pointer-events-none">
            <img src={coachingLogo} alt="" className="w-full h-full object-contain" />
        </div>
      </div>

      {/* Back Side */}
      <div className="relative w-[320px] h-[520px] bg-white rounded-2xl shadow-2xl border-[6px] border-black overflow-hidden flex flex-col font-sans">
        {/* Header (Optional) */}
        <div className="pt-8 px-6 text-center opacity-10">
           <img src={coachingLogo} alt="" className="w-16 h-16 mx-auto object-contain" />
        </div>

        {/* QR Code Section */}
        <div className="flex-1 flex flex-col items-center justify-center p-8">
            <div className="w-48 h-48 p-4 bg-white border-2 border-slate-100 rounded-2xl shadow-lg flex items-center justify-center">
                {qrCodeUrl ? (
                    <img src={qrCodeUrl} alt="QR Code" className="w-full h-full object-contain" />
                ) : (
                    <div className="text-center text-slate-300">
                        <div className="w-32 h-32 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200 mx-auto flex items-center justify-center">
                            <span className="text-[10px] uppercase font-bold">QR CODE</span>
                        </div>
                    </div>
                )}
            </div>
            <p className="mt-6 text-sm font-bold text-slate-400 uppercase tracking-[0.2em]">
                Attendance ID
            </p>
        </div>

        {/* Bottom Info */}
        <div className="p-8 text-center bg-slate-50 border-t-2 border-black">
           <h2 className="text-2xl font-black tracking-tight text-black leading-tight">
            {studentName}
          </h2>
          <p className="text-base font-bold text-slate-500 mt-1">
            ID NO. {regNo}
          </p>
          
          <div className="mt-6 space-y-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            <p>Adamjee Coaching Centre - {branchName}</p>
            <p>www.adamjee.edu.pk</p>
          </div>
        </div>
      </div>

    </div>
  );
};

export default StudentIDCard;
