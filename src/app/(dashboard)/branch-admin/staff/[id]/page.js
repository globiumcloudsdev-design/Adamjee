'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import {
  ArrowLeft,
  Calendar,
  Download,
  FileText,
  IdCard,
  Printer,
  User,
  Mail,
  Phone,
  Clock,
  DollarSign,
  Award,
  CheckCircle,
  XCircle,
  AlertCircle,
  Briefcase,
  Building
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Dropdown from '@/components/ui/dropdown';
import Modal from '@/components/ui/modal';
import Tabs, { TabPanel } from '@/components/ui/tabs';
import apiClient from '@/lib/api-client';
import { API_ENDPOINTS } from '@/constants/api-endpoints';
import FullPageLoader from '@/components/ui/full-page-loader';
import ButtonLoader from '@/components/ui/button-loader';
import { toast } from 'sonner';

const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const STAFF_LETTERS = [
  { id: 'appointment', label: 'Appointment Letter', category: 'joining' },
  { id: 'duty-allocation', label: 'Duty Allocation Letter', category: 'joining' },
  { id: 'salary-slip', label: 'Salary Slip', category: 'salary' },
  { id: 'leave-approval', label: 'Leave Approval Letter', category: 'leave' },
  { id: 'warning', label: 'Warning Letter', category: 'discipline' },
  { id: 'increment', label: 'Increment Letter', category: 'salary' },
  { id: 'experience', label: 'Experience Certificate', category: 'exit' },
  { id: 'relieving', label: 'Relieving Letter', category: 'exit' },
  { id: 'termination', label: 'Termination Letter', category: 'exit' },
];

export default function StaffDetailPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const [unwrappedParams, setUnwrappedParams] = useState(null);
  const staffId = unwrappedParams?.id;

  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // Data
  const [staffData, setStaffData] = useState(null);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [payrollData, setPayrollData] = useState(null);
  const [stats, setStats] = useState(null);

  // Filters
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [availableMonths, setAvailableMonths] = useState([]);

  // Modal states
  const [showLetterModal, setShowLetterModal] = useState(false);
  const [selectedLetterType, setSelectedLetterType] = useState('');
  const [showIdCard, setShowIdCard] = useState(false);

  useEffect(() => {
    const unwrap = async () => {
      if (params) {
        const p = await params;
        setUnwrappedParams(p);
      }
    };
    unwrap();
  }, [params]);

  useEffect(() => {
    if (!user || !staffId) return;
    fetchStaffData();
  }, [user, staffId]);

  useEffect(() => {
    if (staffData && selectedMonth && selectedYear) {
      fetchMonthlyData();
    }
  }, [staffData, selectedMonth, selectedYear]);

  const fetchStaffData = async () => {
    try {
      setLoading(true);
      // Use Branch Admin Endpoint
      const response = await apiClient.get(API_ENDPOINTS.BRANCH_ADMIN.EMPLOYEES.GET.replace(':id', staffId));
      
      if (response.success && response.data) {
        setStaffData(response.data);
        calculateAvailableMonths(response.data);
      } else {
        toast.error('Staff member not found');
        router.back();
      }
    } catch (error) {
      console.error('Error fetching staff:', error);
      toast.error('Failed to load staff data');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const calculateAvailableMonths = (staff) => {
    const joiningDate = new Date(staff.staffProfile?.joiningDate || staff.createdAt);
    const currentDate = new Date();
    const months = [];
    let date = new Date(joiningDate.getFullYear(), joiningDate.getMonth(), 1);
    const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    while (date <= endDate) {
      months.push({
        month: date.getMonth() + 1,
        year: date.getFullYear(),
        label: `${monthNames[date.getMonth()]} ${date.getFullYear()}`,
      });
      date.setMonth(date.getMonth() + 1);
    }
    setAvailableMonths(months.reverse());
  };

  const fetchMonthlyData = async () => {
    try {
      const attResponse = await apiClient.get(API_ENDPOINTS.BRANCH_ADMIN.EMPLOYEE_ATTENDANCE.LIST, {
        userId: staffId,
        month: selectedMonth,
        year: selectedYear,
        limit: 100,
      });
      if (attResponse.success) setAttendanceRecords(attResponse.data);

      const statsResponse = await apiClient.get(API_ENDPOINTS.BRANCH_ADMIN.EMPLOYEE_ATTENDANCE.SUMMARY, {
        userId: staffId,
        month: selectedMonth,
        year: selectedYear,
      });
      if (statsResponse.success) setStats(statsResponse.data);

      const payrollResponse = await apiClient.get(API_ENDPOINTS.BRANCH_ADMIN.PAYROLL.LIST, {
        userId: staffId,
        month: selectedMonth,
        year: selectedYear,
      });
      if (payrollResponse.success && payrollResponse.data?.length > 0) {
        setPayrollData(payrollResponse.data[0]);
      } else {
        setPayrollData(null);
      }
    } catch (error) {
      console.error('Error fetching monthly data:', error);
    }
  };

  const handleGeneratePayroll = async () => {
    try {
      setProcessing(true);
      const response = await apiClient.post(API_ENDPOINTS.BRANCH_ADMIN.PAYROLL.PROCESS, {
        userId: staffId,
        month: selectedMonth,
        year: selectedYear,
      });
      if (response.success) {
        toast.success('Payroll generated successfully');
        fetchMonthlyData();
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to generate payroll');
    } finally {
      setProcessing(false);
    }
  };

  const handlePrint = (type = 'report') => {
    document.body.classList.add(`print-mode-${type}`);
    window.print();
    setTimeout(() => { document.body.classList.remove(`print-mode-${type}`); }, 500);
  };

  const getLetterContent = (type) => {
    if (!staffData) return null;
    const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const name = `${staffData.firstName} ${staffData.lastName}`;
    const designation = staffData.staffProfile?.position || 'Staff Member';
    const department = staffData.staffProfile?.departmentId?.name || 'General';
    const branch = staffData.branchId?.name || 'Coaching Management';
    let subject = '';
    let body = '';

    switch (type) {
        case 'salary-slip':
             subject = `Salary Slip - ${monthNames[selectedMonth-1]} ${selectedYear}`;
             body = `
                <p>Salary slip for <strong>${name}</strong> (${designation}).</p>
                <div style="margin: 20px 0; padding: 10px; border: 1px solid #eee;">
                    <p><strong>Basic Salary:</strong> Rs. ${payrollData?.basicSalary?.toLocaleString() || 0}</p>
                    <p><strong>Net Paid:</strong> Rs. ${payrollData?.netSalary?.toLocaleString() || 0}</p>
                    <p><strong>Status:</strong> ${payrollData?.paymentStatus || 'Pending'}</p>
                </div>
             `;
             break;
        default:
             subject = STAFF_LETTERS.find(l => l.id === type)?.label || 'Official Document';
             body = `
                <p>Dear ${name},</p>
                <p>This document serves as an official <strong>${subject}</strong> from ${branch}.</p>
                <p>This document verifies your status and details as recorded in our system.</p>
             `;
    }

    return (
        <div className="p-8 max-w-2xl mx-auto bg-white" id="letter-content">
            <div className="text-center border-b pb-4 mb-6">
                <h1 className="text-2xl font-bold uppercase">{branch}</h1>
                <p className="text-sm text-gray-500">Excellence in Education</p>
                <p className="text-xs text-gray-400 mt-1">{date}</p>
            </div>
            <div className="mb-8">
                <p className="font-bold">To: {name}</p>
                <p className="text-sm">{designation}, {department}</p>
            </div>
            <div className="mb-8 font-bold text-center underline">Subject: {subject}</div>
            <div className="prose max-w-none text-justify leading-relaxed mb-12" dangerouslySetInnerHTML={{ __html: body }} />
            <div className="mt-16 pt-8 border-t flex justify-between items-end">
                <div className="text-center">
                    <p className="font-bold text-gray-900">{name}</p>
                    <p className="text-xs text-gray-500">Employee Signature</p>
                </div>
                <div className="text-center">
                    <p className="font-bold text-gray-900">Principal / Admin</p>
                    <p className="text-xs text-gray-500">Authorized Signature</p>
                </div>
            </div>
        </div>
    );
  };

  const getStatusBadge = (status) => {
    const config = {
      present: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      absent: { color: 'bg-red-100 text-red-800', icon: XCircle },
      late: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      leave: { color: 'bg-purple-100 text-purple-800', icon: Calendar },
    };
    const style = config[status] || config.present;
    const Icon = style.icon;
    return (
      <Badge className={`${style.color} flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {status}
      </Badge>
    );
  };

  if (loading) return <FullPageLoader message="Loading details..." />;
  if (!staffData) return null;

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <User className="h-5 w-5" /> },
    { id: 'attendance', label: 'Attendance', icon: <CheckCircle className="h-5 w-5" />, badge: attendanceRecords.length },
    { id: 'payroll', label: 'Payroll', icon: <DollarSign className="h-5 w-5" /> },
    { id: 'letters', label: 'Documents', icon: <FileText className="h-5 w-5" /> },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 print:bg-white print:p-0">
      <style jsx global>{`
        @media print {
          @page { size: A4; margin: 10mm; }
          body { -webkit-print-color-adjust: exact; }
          .no-print { display: none !important; }
          
          body.print-mode-letter .print-hide-on-letter { display: none !important; }
          body.print-mode-idcard .print-hide-on-idcard { display: none !important; }
          
          body.print-mode-letter #letter-modal-content {
             display: block !important;
             position: absolute; top: 0; left: 0; width: 100%;
          }
          body.print-mode-idcard #id-card-container {
             position: absolute; top: 30%; left: 50%;
             transform: translate(-50%, -50%);
             display: flex !important;
          }
        }
      `}</style>

      <div className="p-6 space-y-6 print:p-0 print-hide-on-letter print-hide-on-idcard">
        {/* Header */}
        <div className="flex items-center justify-between no-print">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" onClick={() => router.back()}><ArrowLeft className="h-4 w-4" /></Button>
                <div><h1 className="text-2xl font-bold">Staff Details</h1></div>
            </div>
            <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowIdCard(true)}><IdCard className="h-4 w-4 mr-2" />ID Card</Button>
                <Button onClick={() => handlePrint('report')}><Printer className="h-4 w-4 mr-2" />Print Report</Button>
            </div>
        </div>

        {/* Info Card */}
        <Card className="p-6 print:shadow-none print:border-2">
            <div className="flex items-start gap-6">
                <div className="h-24 w-24 rounded-full bg-purple-100 flex items-center justify-center text-3xl font-bold text-purple-600">
                    {staffData.firstName?.charAt(0)}{staffData.lastName?.charAt(0)}
                </div>
                <div className="flex-1">
                    <h2 className="text-2xl font-bold">{staffData.firstName} {staffData.lastName}</h2>
                    <Badge variant="secondary" className="mb-4">Staff Member</Badge>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm bg-gray-50 p-3 rounded-lg print:bg-transparent">
                        <div>
                            <p className="text-gray-500">ID</p>
                            <p className="font-medium">{staffData.staffProfile?.employeeId || 'N/A'}</p>
                        </div>
                        <div>
                            <p className="text-gray-500">Dept</p>
                            <p className="font-medium">{staffData.staffProfile?.departmentId?.name || '-'}</p>
                        </div>
                        <div>
                            <p className="text-gray-500">Position</p>
                            <p className="font-medium">{staffData.staffProfile?.position || '-'}</p>
                        </div>
                         <div>
                            <p className="text-gray-500">Joining</p>
                            <p className="font-medium">{staffData.staffProfile?.joiningDate ? new Date(staffData.staffProfile.joiningDate).toLocaleDateString() : '-'}</p>
                        </div>
                    </div>
                </div>
            </div>
        </Card>

        {/* Filters and Tabs identical to super admin but using branch-admin endpoints */}
        <div className="no-print">
             <Card className="p-4 mb-6">
                <div className="flex items-center gap-4">
                    <label className="text-sm font-medium">Month:</label>
                    <Dropdown
                        value={`${selectedMonth}-${selectedYear}`}
                        onChange={(e) => {
                            const [m, y] = e.target.value.split('-');
                            setSelectedMonth(parseInt(m));
                            setSelectedYear(parseInt(y));
                        }}
                        options={availableMonths.map(m => ({ value: `${m.month}-${m.year}`, label: m.label }))}
                        className="w-48"
                    />
                </div>
            </Card>

            <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
            
            <TabPanel value="overview" activeTab={activeTab}>
                <Card className="p-6">
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <h4 className="font-bold mb-3 flex gap-2"><Briefcase className="h-4 w-4"/> Job Details</h4>
                            <div className="space-y-2 text-sm bg-gray-50 p-4 rounded">
                                <div className="flex justify-between"><span className="text-gray-500">Position</span><span>{staffData.staffProfile?.position}</span></div>
                                <div className="flex justify-between"><span className="text-gray-500">Shift</span><span className="capitalize">{staffData.staffProfile?.shift}</span></div>
                                <div className="flex justify-between"><span className="text-gray-500">Employment</span><span className="capitalize">{staffData.staffProfile?.employmentType}</span></div>
                            </div>
                        </div>
                    </div>
                </Card>
            </TabPanel>
            
            <TabPanel value="attendance" activeTab={activeTab}>
                 <Card className="p-6">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50"><tr><th className="p-3 text-left">Date</th><th className="p-3 text-left">Status</th><th className="p-3 text-left">Hours</th></tr></thead>
                        <tbody>
                             {attendanceRecords.map(r => (
                                <tr key={r._id} className="border-b">
                                    <td className="p-3">{new Date(r.date).toLocaleDateString()}</td>
                                    <td className="p-3">{getStatusBadge(r.status)}</td>
                                    <td className="p-3">{r.workingHours?.toFixed(1) || '-'}</td>
                                </tr>
                             ))}
                        </tbody>
                    </table>
                 </Card>
            </TabPanel>

             <TabPanel value="payroll" activeTab={activeTab}>
                 <Card className="p-6">
                    <div className="flex justify-between mb-4"><h3 className="font-bold">Payroll</h3> {!payrollData && <Button size="sm" onClick={handleGeneratePayroll} disabled={processing}>Generate</Button>}</div>
                    {payrollData ? (
                        <div className="bg-gray-50 p-4 rounded border">
                            <p>Net Salary: <strong>{payrollData.netSalary?.toLocaleString()}</strong></p>
                            <Badge>{payrollData.paymentStatus}</Badge>
                        </div>
                    ) : <p className="text-center text-gray-500">No payroll.</p>}
                 </Card>
            </TabPanel>

            <TabPanel value="letters" activeTab={activeTab}>
                 <Card className="p-6">
                     <div className="flex gap-4">
                         <div className="flex-1">
                             <select className="w-full border rounded p-2" onChange={(e) => setSelectedLetterType(e.target.value)}>
                                 <option value="">Select Document...</option>
                                 {STAFF_LETTERS.map(l => <option key={l.id} value={l.id}>{l.label}</option>)}
                             </select>
                         </div>
                         <Button disabled={!selectedLetterType} onClick={() => setShowLetterModal(true)}>Generate</Button>
                     </div>
                 </Card>
            </TabPanel>
        </div>

         {/* Print Report Visible Section */}
        <div className="hidden print:block space-y-4">
            <h3 className="font-bold border-b pb-2">Monthly Record</h3>
            <table className="w-full text-sm border">
                <thead className="bg-gray-100">
                    <tr>
                        <th className="border p-2">Date</th>
                        <th className="border p-2">Status</th>
                        <th className="border p-2">Hours</th>
                    </tr>
                </thead>
                <tbody>
                    {attendanceRecords.slice(0, 20).map(r => (
                        <tr key={r._id}>
                            <td className="border p-2">{new Date(r.date).toLocaleDateString()}</td>
                            <td className="border p-2 text-center">{r.status}</td>
                            <td className="border p-2 text-center">{r.workingHours?.toFixed(1) || '-'}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      </div>

       <Modal open={showLetterModal} onClose={() => setShowLetterModal(false)} title="Document Preview" maxWidth="3xl">
          <div className="space-y-4">
              <div id="letter-modal-content" className="border p-8 bg-white shadow-sm">
                  {getLetterContent(selectedLetterType)}
              </div>
              <div className="flex justify-end gap-2 no-print">
                  <Button variant="outline" onClick={() => setShowLetterModal(false)}>Close</Button>
                  <Button onClick={() => handlePrint('letter')}><Printer className="h-4 w-4 mr-2"/> Print</Button>
              </div>
          </div>
      </Modal>

      <Modal open={showIdCard} onClose={() => setShowIdCard(false)} title="ID Card">
           <div className="flex flex-col items-center gap-4">
               <div id="id-card-container" className="w-[85.6mm] h-[54mm] bg-white border border-gray-300 rounded-lg shadow-lg relative overflow-hidden flex">
                    <div className="w-5 bg-purple-600 h-full flex flex-col items-center justify-center text-white py-2">
                        <span className="writing-vertical transform rotate-180 text-[10px] tracking-widest font-bold">STAFF</span>
                    </div>
                    <div className="flex-1 p-3 flex flex-col">
                        <div className="flex justify-between items-start mb-2">
                             <div className="flex items-center gap-2">
                                <div className="h-6 w-6 rounded bg-purple-100 flex items-center justify-center"><Building className="h-3 w-3 text-purple-600"/></div>
                                <div><h3 className="text-xs font-bold leading-none">Adamjee Coaching</h3></div>
                            </div>
                        </div>
                         <div className="flex gap-3 mt-1">
                             <div className="h-20 w-16 bg-gray-100 rounded border border-gray-200 flex items-center justify-center">
                                 <span className="text-lg text-gray-400 font-bold">{staffData.firstName?.charAt(0)}</span>
                             </div>
                             <div className="flex-1 space-y-0.5">
                                 <h2 className="text-sm font-bold text-purple-900">{staffData.firstName} {staffData.lastName}</h2>
                                 <p className="text-[10px] text-gray-500">{staffData.staffProfile?.position || 'Staff'}</p>
                                 <p className="text-[9px] font-mono mt-1">ID: {staffData.staffProfile?.employeeId}</p>
                             </div>
                        </div>
                    </div>
               </div>
               <div className="flex justify-end w-full gap-2 no-print">
                   <Button variant="outline" onClick={() => setShowIdCard(false)}>Close</Button>
                   <Button onClick={() => handlePrint('idcard')}><Printer className="h-4 w-4 mr-2"/> Print</Button>
               </div>
           </div>
      </Modal>
    </div>
  );
}
