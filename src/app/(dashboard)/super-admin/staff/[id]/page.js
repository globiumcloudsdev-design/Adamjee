
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
  MapPin,
  Clock,
  DollarSign,
  Award,
  CheckCircle,
  XCircle,
  AlertCircle,
  Briefcase,
  Building,
  ChevronDown,
  Users,
  BookOpen,
  CreditCard,
  FileSignature,
  Shield,
  Star,
  TrendingUp,
  BarChart3,
  FileCheck,
  QrCode,
  Scan,
  Home,
  GraduationCap,
  Banknote,
  ShieldCheck,
  Smartphone,
  Globe,
  Hash,
  Tag,
  Eye,
  Share2,
  Copy,
  Settings
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Tabs, { TabPanel } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Label } from '@/components/ui/label';
import Dropdown from '@/components/ui/dropdown';
import Modal from '@/components/ui/modal';
import { QRCodeCanvas } from 'qrcode.react';
import apiClient from '@/lib/api-client';
import { API_ENDPOINTS } from '@/constants/api-endpoints';
import FullPageLoader from '@/components/ui/full-page-loader';
import ButtonLoader from '@/components/ui/button-loader';
import { toast } from 'sonner';
import { format } from 'date-fns';

const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const STAFF_LETTERS = [
  { id: 'appointment', label: 'Appointment Letter', icon: FileSignature, color: 'bg-blue-500' },
  { id: 'duty-allocation', label: 'Duty Allocation', icon: Briefcase, color: 'bg-green-500' },
  { id: 'salary-slip', label: 'Salary Slip', icon: CreditCard, color: 'bg-amber-500' },
  { id: 'leave-approval', label: 'Leave Approval', icon: Calendar, color: 'bg-purple-500' },
  { id: 'warning', label: 'Warning Letter', icon: AlertCircle, color: 'bg-red-500' },
  { id: 'increment', label: 'Increment Letter', icon: TrendingUp, color: 'bg-emerald-500' },
  { id: 'experience', label: 'Experience Certificate', icon: Award, color: 'bg-indigo-500' },
  { id: 'relieving', label: 'Relieving Letter', icon: FileCheck, color: 'bg-orange-500' },
  { id: 'termination', label: 'Termination Letter', icon: XCircle, color: 'bg-rose-500' },
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
  const [showPrintOptions, setShowPrintOptions] = useState(false);
  const [idCardView, setIdCardView] = useState('front'); // 'front' or 'back'

  const idCardRef = useRef(null);

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
      const response = await apiClient.get(API_ENDPOINTS.SUPER_ADMIN.STAFF.GET.replace(':id', staffId));
      
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
      // Fetch attendance
      const attResponse = await apiClient.get(API_ENDPOINTS.SUPER_ADMIN.EMPLOYEE_ATTENDANCE.LIST, {
        userId: staffId,
        month: selectedMonth,
        year: selectedYear,
        limit: 100,
      });

      if (attResponse.success) {
        setAttendanceRecords(attResponse.data);
      }

      // Fetch attendance stats
      const statsResponse = await apiClient.get(API_ENDPOINTS.SUPER_ADMIN.EMPLOYEE_ATTENDANCE.SUMMARY, {
        userId: staffId,
        month: selectedMonth,
        year: selectedYear,
      });

      if (statsResponse.success) {
        setStats(statsResponse.data);
      }

      // Fetch payroll
      const payrollResponse = await apiClient.get(API_ENDPOINTS.SUPER_ADMIN.PAYROLL.LIST, {
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
      const response = await apiClient.post(API_ENDPOINTS.SUPER_ADMIN.PAYROLL.PROCESS, {
        userId: staffId,
        month: selectedMonth,
        year: selectedYear,
      });

      if (response.success) {
        toast.success('Payroll generated successfully');
        fetchMonthlyData();
      }
    } catch (error) {
      console.error('Error generating payroll:', error);
      toast.error(error.message || 'Failed to generate payroll');
    } finally {
      setProcessing(false);
    }
  };

  const downloadQRCode = () => {
    const canvas = document.getElementById('id-card-qr')?.querySelector('canvas');
    if (canvas) {
      const url = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `${staffData?.firstName}-${staffData?.lastName}-qr.png`;
      link.href = url;
      link.click();
    }
  };

  const handlePrint = (type = 'report') => {
    const printContent = document.getElementById('print-content');
    
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    
    if (type === 'idcard') {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>ID Card - ${staffData?.firstName} ${staffData?.lastName}</title>
            <style>
              @page {
                size: 85.6mm 54mm;
                margin: 0;
              }
              body {
                margin: 0;
                padding: 0;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              .id-card-container {
                width: 85.6mm;
                height: 54mm;
                position: relative;
                overflow: hidden;
                font-family: Arial, sans-serif;
              }
              .id-card {
                width: 85.6mm;
                height: 54mm;
                position: relative;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                border-radius: 8px;
                overflow: hidden;
              }
              .id-card-front {
                width: 100%;
                height: 100%;
                padding: 3mm;
                box-sizing: border-box;
                position: relative;
                color: white;
              }
              .id-header {
                display: flex;
                align-items: center;
                margin-bottom: 2mm;
              }
              .id-logo {
                width: 12mm;
                height: 12mm;
                background: white;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                margin-right: 3mm;
                font-weight: bold;
                color: #667eea;
                font-size: 5mm;
              }
              .id-title {
                flex: 1;
              }
              .id-title h1 {
                margin: 0;
                font-size: 5mm;
                font-weight: bold;
              }
              .id-title p {
                margin: 0;
                font-size: 2.5mm;
                opacity: 0.9;
              }
              .id-content {
                display: flex;
                height: calc(100% - 20mm);
              }
              .id-left {
                flex: 2;
                padding-right: 3mm;
              }
              .id-right {
                flex: 1;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                border-left: 1px solid rgba(255,255,255,0.2);
                padding-left: 3mm;
              }
              .id-photo {
                width: 25mm;
                height: 30mm;
                background: rgba(255,255,255,0.1);
                border-radius: 4mm;
                margin-bottom: 3mm;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 12mm;
                color: white;
              }
              .employee-name {
                font-size: 5.5mm;
                font-weight: bold;
                margin: 0 0 2mm 0;
                line-height: 1.2;
              }
              .employee-role {
                background: rgba(255,255,255,0.2);
                padding: 1mm 3mm;
                border-radius: 2mm;
                font-size: 3mm;
                display: inline-block;
                margin-bottom: 3mm;
              }
              .id-details {
                font-size: 3mm;
                line-height: 1.6;
              }
              .detail-row {
                display: flex;
                margin-bottom: 1mm;
              }
              .detail-label {
                width: 20mm;
                opacity: 0.8;
              }
              .detail-value {
                font-weight: bold;
                flex: 1;
              }
              .qr-code {
                width: 18mm;
                height: 18mm;
                background: white;
                padding: 1mm;
                border-radius: 2mm;
                margin-bottom: 2mm;
              }
              .employee-id {
                font-size: 3.5mm;
                font-weight: bold;
                text-align: center;
                background: rgba(255,255,255,0.1);
                padding: 1mm;
                border-radius: 1mm;
                letter-spacing: 1px;
              }
              .id-footer {
                position: absolute;
                bottom: 3mm;
                left: 3mm;
                right: 3mm;
                font-size: 2mm;
                opacity: 0.7;
                text-align: center;
                padding-top: 2mm;
                border-top: 1px solid rgba(255,255,255,0.2);
              }
              .barcode {
                font-family: 'Libre Barcode 128', cursive;
                font-size: 8mm;
                letter-spacing: 2px;
              }
            </style>
          </head>
          <body>
            ${printContent.innerHTML}
          </body>
        </html>
      `);
    } else if (type === 'report') {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>${staffData?.firstName} ${staffData?.lastName} - Monthly Report</title>
            <style>
              @page { 
                size: A4; 
                margin: 15mm;
                @bottom-center {
                  content: "Page " counter(page) " of " counter(pages);
                  font-size: 10pt;
                  color: #666;
                }
              }
              body { 
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                color: #333;
                line-height: 1.6;
              }
              .print-header {
                text-align: center;
                margin-bottom: 20px;
                padding-bottom: 15px;
                border-bottom: 3px solid #3b82f6;
              }
              .print-header h1 {
                color: #1e40af;
                margin: 0 0 5px 0;
                font-size: 24pt;
              }
              .print-header .subtitle {
                color: #6b7280;
                font-size: 11pt;
                margin: 0;
              }
              .print-meta {
                display: flex;
                justify-content: space-between;
                margin: 20px 0;
                font-size: 10pt;
                color: #6b7280;
              }
              .employee-photo {
                text-align: center;
                margin: 20px 0;
              }
              .photo-placeholder {
                width: 120px;
                height: 160px;
                background: #f3f4f6;
                border: 2px solid #d1d5db;
                border-radius: 8px;
                margin: 0 auto 10px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 48px;
                color: #9ca3af;
              }
              .section {
                margin: 25px 0;
                page-break-inside: avoid;
              }
              .section h2 {
                color: #1e40af;
                font-size: 16pt;
                border-bottom: 2px solid #e5e7eb;
                padding-bottom: 8px;
                margin-bottom: 15px;
              }
              .grid-2-col {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 15px;
                margin: 15px 0;
              }
              .info-item {
                margin-bottom: 10px;
              }
              .info-label {
                font-weight: 600;
                color: #4b5563;
                margin-bottom: 3px;
                font-size: 10pt;
              }
              .info-value {
                color: #1f2937;
                font-size: 11pt;
              }
              .table {
                width: 100%;
                border-collapse: collapse;
                margin: 15px 0;
                font-size: 10pt;
              }
              .table th {
                background-color: #f3f4f6;
                padding: 10px;
                text-align: left;
                border: 1px solid #d1d5db;
                font-weight: 600;
                color: #374151;
              }
              .table td {
                padding: 10px;
                border: 1px solid #e5e7eb;
                vertical-align: middle;
              }
              .status-badge {
                display: inline-block;
                padding: 4px 12px;
                border-radius: 20px;
                font-size: 9pt;
                font-weight: 500;
              }
              .status-present { background: #dcfce7; color: #166534; }
              .status-absent { background: #fee2e2; color: #991b1b; }
              .status-leave { background: #f3e8ff; color: #7c3aed; }
              .summary-cards {
                display: grid;
                grid-template-columns: repeat(4, 1fr);
                gap: 15px;
                margin: 20px 0;
              }
              .summary-card {
                border: 1px solid #e5e7eb;
                border-radius: 8px;
                padding: 15px;
                text-align: center;
              }
              .summary-value {
                font-size: 20pt;
                font-weight: bold;
                margin: 10px 0;
              }
              .summary-label {
                color: #6b7280;
                font-size: 10pt;
              }
              .signature-area {
                margin-top: 60px;
                display: flex;
                justify-content: space-between;
                page-break-inside: avoid;
              }
              .signature-box {
                text-align: center;
                width: 200px;
              }
              .signature-line {
                border-top: 1px solid #000;
                width: 100%;
                margin: 40px 0 10px;
              }
              .footer-note {
                text-align: center;
                font-size: 9pt;
                color: #9ca3af;
                margin-top: 30px;
                border-top: 1px solid #e5e7eb;
                padding-top: 15px;
              }
              .print-date {
                text-align: right;
                font-size: 9pt;
                color: #6b7280;
                margin-top: 30px;
              }
              .page-break {
                page-break-before: always;
              }
              .watermark {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%) rotate(-45deg);
                opacity: 0.05;
                font-size: 80pt;
                color: #ccc;
                pointer-events: none;
                z-index: -1;
              }
            </style>
          </head>
          <body>
            <div class="watermark">CONFIDENTIAL</div>
            ${printContent.innerHTML}
            <div class="print-date">
              Printed on: ${format(new Date(), 'MMMM dd, yyyy hh:mm a')}
            </div>
          </body>
        </html>
      `);
    }
    
    printWindow.document.close();
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 500);
  };

  const generateLetterContent = (type) => {
    if (!staffData) return null;
    
    const name = `${staffData.firstName} ${staffData.lastName}`;
    const designation = staffData.staffProfile?.position || 'Staff Member';
    const department = staffData.staffProfile?.departmentId?.name || 'General';
    const branch = staffData.branchId?.name || 'Adamjee Coaching';
    const employeeId = staffData.staffProfile?.employeeId || 'N/A';
    const today = format(new Date(), 'MMMM dd, yyyy');
    
    let subject = '';
    let content = '';

    switch (type) {
      case 'appointment':
        subject = 'APPOINTMENT LETTER';
        content = `
          <p>Dear ${name},</p>
          <p>We are pleased to appoint you as <strong>${designation}</strong> in the ${department} Department at ${branch}, effective from ${format(new Date(staffData.staffProfile?.joiningDate || new Date()), 'MMMM dd, yyyy')}.</p>
          <p>Your Employee ID is: <strong>${employeeId}</strong></p>
          <p>This appointment is subject to the rules and regulations of the institution. Your initial probation period will be three months, after which your performance will be reviewed for confirmation.</p>
          <p>We welcome you to our team and look forward to a productive association.</p>
        `;
        break;
        
      case 'salary-slip':
        subject = `SALARY SLIP - ${monthNames[selectedMonth - 1]} ${selectedYear}`;
        content = `
          <div class="grid-2-col">
            <div>
              <div class="info-item">
                <div class="info-label">Employee Name</div>
                <div class="info-value">${name}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Employee ID</div>
                <div class="info-value">${employeeId}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Designation</div>
                <div class="info-value">${designation}</div>
              </div>
            </div>
            <div>
              <div class="info-item">
                <div class="info-label">Department</div>
                <div class="info-value">${department}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Month</div>
                <div class="info-value">${monthNames[selectedMonth - 1]} ${selectedYear}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Payment Date</div>
                <div class="info-value">${today}</div>
              </div>
            </div>
          </div>
          
          <div class="section">
            <h2>Earnings</h2>
            <table class="table">
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Amount (PKR)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Basic Salary</td>
                  <td>${payrollData?.basicSalary?.toLocaleString() || '0'}</td>
                </tr>
                <tr>
                  <td>House Rent Allowance</td>
                  <td>${(payrollData?.allowances?.houseRent || 0).toLocaleString()}</td>
                </tr>
                <tr>
                  <td>Medical Allowance</td>
                  <td>${(payrollData?.allowances?.medical || 0).toLocaleString()}</td>
                </tr>
                <tr>
                  <td><strong>Total Earnings</strong></td>
                  <td><strong>${(payrollData?.grossSalary || 0).toLocaleString()}</strong></td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <div class="section">
            <h2>Deductions</h2>
            <table class="table">
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Amount (PKR)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Tax Deduction</td>
                  <td>${(payrollData?.deductions?.tax || 0).toLocaleString()}</td>
                </tr>
                <tr>
                  <td>Provident Fund</td>
                  <td>${(payrollData?.deductions?.providentFund || 0).toLocaleString()}</td>
                </tr>
                <tr>
                  <td><strong>Total Deductions</strong></td>
                  <td><strong>${(payrollData?.totalDeductions || 0).toLocaleString()}</strong></td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <div class="section" style="background: #f0f9ff; padding: 20px; border-radius: 8px; border: 2px solid #1e40af;">
            <h2 style="color: #1e40af; margin-top: 0;">Net Payable Amount</h2>
            <div style="font-size: 24pt; font-weight: bold; color: #1e40af; text-align: center; margin: 20px 0;">
              PKR ${(payrollData?.netSalary || 0).toLocaleString()}
            </div>
            <div style="text-align: center; font-size: 12pt;">
              Payment Status: <strong>${payrollData?.paymentStatus?.toUpperCase() || 'PENDING'}</strong>
            </div>
          </div>
        `;
        break;
        
      default:
        subject = STAFF_LETTERS.find(l => l.id === type)?.label?.toUpperCase() || 'OFFICIAL DOCUMENT';
        content = `
          <p>Dear ${name},</p>
          <p>This document serves as an official ${subject} issued by ${branch}.</p>
          <div class="section">
            <h2>Employee Details</h2>
            <div class="grid-2-col">
              <div class="info-item">
                <div class="info-label">Full Name</div>
                <div class="info-value">${name}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Employee ID</div>
                <div class="info-value">${employeeId}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Designation</div>
                <div class="info-value">${designation}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Department</div>
                <div class="info-value">${department}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Date of Issue</div>
                <div class="info-value">${today}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Branch</div>
                <div class="info-value">${branch}</div>
              </div>
            </div>
          </div>
          <p>This document is digitally generated and authenticated by the ${branch} Management System.</p>
        `;
    }
    
    return { subject, content };
  };

  const getStatusBadge = (status) => {
    const config = {
      present: { color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle },
      absent: { color: 'bg-red-100 text-red-800 border-red-200', icon: XCircle },
      late: { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: Clock },
      'half-day': { color: 'bg-blue-100 text-blue-800 border-blue-200', icon: Clock },
      leave: { color: 'bg-purple-100 text-purple-800 border-purple-200', icon: Calendar },
    };

    const style = config[status] || config.present;
    const Icon = style.icon;

    return (
      <Badge variant="outline" className={`${style.color} gap-1.5`}>
        <Icon className="h-3.5 w-3.5" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getAttendancePercentage = () => {
    if (!stats || !attendanceRecords.length) return 0;
    const totalDays = attendanceRecords.length;
    const presentDays = attendanceRecords.filter(r => r.status === 'present').length;
    return Math.round((presentDays / totalDays) * 100);
  };

  const renderIDCard = () => {
    return (
      <div className="id-card-container" id="id-card-qr">
        {/* Front Side */}
        {idCardView === 'front' && (
          <div className="id-card-front bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 text-white p-4 rounded-xl">
            <div className="id-header flex items-center mb-4">
              <div className="id-logo h-12 w-12 rounded-full bg-white flex items-center justify-center mr-3">
                <span className="text-blue-600 font-bold text-lg">EA</span>
              </div>
              <div className="flex-1">
                <h1 className="text-lg font-bold">ADAMJEE COACHING</h1>
                <p className="text-xs opacity-90">Staff Identity Card</p>
              </div>
            </div>
            
            <div className="flex h-48">
              <div className="flex-1 pr-4">
                <h2 className="text-2xl font-bold mb-2 leading-tight">
                  {staffData?.firstName} {staffData?.lastName}
                </h2>
                <div className="bg-white/20 px-3 py-1 rounded-full text-sm inline-block mb-4">
                  {staffData?.staffProfile?.position || 'Staff Member'}
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex">
                    <span className="w-24 opacity-80">Employee ID:</span>
                    <span className="font-bold flex-1">{staffData?.staffProfile?.employeeId}</span>
                  </div>
                  <div className="flex">
                    <span className="w-24 opacity-80">Department:</span>
                    <span className="font-bold flex-1">{staffData?.staffProfile?.departmentId?.name}</span>
                  </div>
                  <div className="flex">
                    <span className="w-24 opacity-80">Valid Until:</span>
                    <span className="font-bold flex-1">Dec 2025</span>
                  </div>
                  <div className="flex">
                    <span className="w-24 opacity-80">Issue Date:</span>
                    <span className="font-bold flex-1">
                      {staffData?.staffProfile?.joiningDate 
                        ? format(new Date(staffData.staffProfile.joiningDate), 'MMM yyyy')
                        : 'N/A'
                      }
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="w-1/3 flex flex-col items-center justify-center border-l border-white/20 pl-4">
                <div className="h-32 w-24 bg-white/10 rounded-lg flex items-center justify-center mb-3">
                  <div className="text-4xl text-white">
                    {staffData?.firstName?.charAt(0)}
                  </div>
                </div>
                
                <div className="bg-white p-2 rounded-lg mb-2">
                  <QRCodeCanvas 
                    value={JSON.stringify({
                      id: staffData?._id,
                      employeeId: staffData?.staffProfile?.employeeId,
                      name: `${staffData?.firstName} ${staffData?.lastName}`,
                      branch: staffData?.branchId?.name,
                    })}
                    size={80}
                    level="H"
                  />
                </div>
                
                <div className="text-xs text-center font-mono bg-white/10 px-2 py-1 rounded">
                  {staffData?.staffProfile?.employeeId}
                </div>
              </div>
            </div>
            
            <div className="mt-4 pt-3 border-t border-white/20 text-xs text-center opacity-80">
              If found, please contact administration immediately.
            </div>
          </div>
        )}
        
        {/* Back Side */}
        {idCardView === 'back' && (
          <div className="id-card-back bg-gradient-to-br from-gray-900 to-gray-700 text-white p-4 rounded-xl">
            <div className="text-center mb-4">
              <div className="h-8 w-full bg-gradient-to-r from-yellow-400 to-yellow-600 mb-4"></div>
              <h3 className="text-lg font-bold mb-2">OFFICIAL STAFF ID CARD</h3>
              <p className="text-xs opacity-80">Adamjee Coaching Management System</p>
            </div>
            
            <div className="space-y-3 text-sm">
              <div className="bg-white/10 p-3 rounded-lg">
                <div className="flex justify-between mb-2">
                  <span className="opacity-80">Emergency Contact:</span>
                  <span className="font-bold">{staffData?.staffProfile?.emergencyContact?.phone || 'N/A'}</span>
                </div>
                <div className="text-xs opacity-80">
                  {staffData?.staffProfile?.emergencyContact?.name || 'Not specified'}
                </div>
              </div>
              
              <div className="bg-white/10 p-3 rounded-lg">
                <div className="flex justify-between mb-2">
                  <span className="opacity-80">Blood Group:</span>
                  <span className="font-bold">{staffData?.bloodGroup || 'N/A'}</span>
                </div>
                <div className="text-xs opacity-80">Medical Information</div>
              </div>
              
              <div className="mt-4">
                <div className="barcode font-barcode text-4xl text-center tracking-widest">
                  {staffData?.staffProfile?.employeeId?.replace(/[^0-9]/g, '') || '1234567890'}
                </div>
                <div className="text-xs text-center mt-2 opacity-80">SCAN FOR VERIFICATION</div>
              </div>
            </div>
            
            <div className="mt-4 pt-3 border-t border-white/20 text-xs">
              <div className="flex justify-between">
                <div>
                  <div>ID: {Math.random().toString(36).substr(2, 8).toUpperCase()}</div>
                  <div>Issued By: Adamjee Coaching HR</div>
                </div>
                <div className="text-right">
                  <div>Non-Transferable</div>
                  <div>Property of Adamjee Coaching</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return <FullPageLoader message="Loading staff details..." />;
  }

  if (!staffData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Staff Member Not Found</h2>
            <p className="text-gray-500 mb-4">The requested staff member does not exist or you don't have permission to view.</p>
            <Button onClick={() => router.back()}>Go Back</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Calculate stats for display
  const presentCount = attendanceRecords.filter(r => r.status === 'present').length;
  const absentCount = attendanceRecords.filter(r => r.status === 'absent').length;
  const leaveCount = attendanceRecords.filter(r => r.status === 'leave').length;
  const attendancePercentage = getAttendancePercentage();

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="container mx-auto p-4 md:p-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => router.back()}
              className="rounded-full hover:bg-gray-100"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                Staff Profile
              </h1>
              <p className="text-gray-500">
                Complete details and management for {staffData.firstName} {staffData.lastName}
              </p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowIdCard(true)}
              className="gap-2 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200"
            >
              <IdCard className="h-4 w-4" />
              ID Card
            </Button>
            <Button 
              onClick={() => setShowPrintOptions(true)}
              className="gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
            >
              <Printer className="h-4 w-4" />
              Print Options
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Profile Card */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                {/* Profile Header */}
                <div className="flex flex-col items-center text-center mb-6">
                  <Avatar className="h-32 w-32 border-4 border-white shadow-lg mb-4">
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-3xl text-white">
                      {staffData.firstName?.charAt(0)}{staffData.lastName?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div>
                    <h2 className="text-2xl font-bold">
                      {staffData.firstName} {staffData.lastName}
                    </h2>
                    <Badge className="mt-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0">
                      {staffData.role.charAt(0).toUpperCase() + staffData.role.slice(1)}
                    </Badge>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                  <div className="bg-blue-50 rounded-lg p-3 text-center">
                    <div className="text-xs text-blue-600 mb-1">Staff Since</div>
                    <div className="font-bold text-blue-900">
                      {staffData.staffProfile?.joiningDate 
                        ? format(new Date(staffData.staffProfile.joiningDate), 'MMM yyyy')
                        : 'N/A'
                      }
                    </div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3 text-center">
                    <div className="text-xs text-green-600 mb-1">Attendance</div>
                    <div className="font-bold text-green-900">{attendancePercentage}%</div>
                  </div>
                </div>

                {/* Employee Info */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <IdCard className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500 truncate">Employee ID</p>
                      <p className="font-semibold truncate">{staffData.staffProfile?.employeeId || 'N/A'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                      <Briefcase className="h-5 w-5 text-gray-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500 truncate">Designation</p>
                      <p className="font-semibold truncate">{staffData.staffProfile?.position || 'Staff'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                      <Building className="h-5 w-5 text-gray-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500 truncate">Department</p>
                      <p className="font-semibold truncate">{staffData.staffProfile?.departmentId?.name || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* Contact Info */}
                <Separator className="my-6" />
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Contact Information
                </h3>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <span className="truncate">{staffData.email}</span>
                  </div>
                  
                  {staffData.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      <span className="truncate">{staffData.phone}</span>
                    </div>
                  )}
                  
                  {staffData.address?.city && (
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      <span className="truncate">{staffData.address.city}, {staffData.address.country}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="border border-gray-200 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="justify-start gap-2 hover:bg-blue-50"
                    onClick={() => {
                      setSelectedLetterType('salary-slip');
                      setShowLetterModal(true);
                    }}
                  >
                    <CreditCard className="h-4 w-4" />
                    Salary Slip
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="justify-start gap-2 hover:bg-green-50"
                    onClick={() => router.push(`/staff/${staffId}/attendance`)}
                  >
                    <CheckCircle className="h-4 w-4" />
                    Attendance
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="justify-start gap-2 hover:bg-purple-50"
                    onClick={() => {
                      setSelectedLetterType('appointment');
                      setShowLetterModal(true);
                    }}
                  >
                    <FileSignature className="h-4 w-4" />
                    Letters
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="justify-start gap-2 hover:bg-amber-50"
                    onClick={() => handlePrint('report')}
                  >
                    <Printer className="h-4 w-4" />
                    Print Report
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Present Days</p>
                      <p className="text-2xl font-bold text-gray-900">{presentCount}</p>
                    </div>
                    <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    </div>
                  </div>
                  <Progress value={presentCount * 4} className="h-1.5 mt-3 bg-gray-100" />
                </CardContent>
              </Card>
              
              <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Absent Days</p>
                      <p className="text-2xl font-bold text-gray-900">{absentCount}</p>
                    </div>
                    <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                      <XCircle className="h-5 w-5 text-red-600" />
                    </div>
                  </div>
                  <Progress value={absentCount * 4} className="h-1.5 mt-3 bg-gray-100" />
                </CardContent>
              </Card>
              
              <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Leaves</p>
                      <p className="text-2xl font-bold text-gray-900">{leaveCount}</p>
                    </div>
                    <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                      <Calendar className="h-5 w-5 text-purple-600" />
                    </div>
                  </div>
                  <Progress value={leaveCount * 4} className="h-1.5 mt-3 bg-gray-100" />
                </CardContent>
              </Card>
              
              <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Attendance</p>
                      <p className="text-2xl font-bold text-gray-900">{attendancePercentage}%</p>
                    </div>
                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <BarChart3 className="h-5 w-5 text-blue-600" />
                    </div>
                  </div>
                  <Progress value={attendancePercentage} className="h-1.5 mt-3 bg-gray-100" />
                </CardContent>
              </Card>
            </div>

            {/* Month Selector */}
            <Card className="border border-gray-200 shadow-sm">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex-1">
                    <Label className="mb-2 block text-sm font-medium">Select Month & Year</Label>
                    <div className="flex gap-2">
                      <Dropdown
                        value={`${selectedMonth}-${selectedYear}`}
                        onChange={(e) => {
                          const [month, year] = e.target.value.split('-');
                          setSelectedMonth(parseInt(month));
                          setSelectedYear(parseInt(year));
                        }}
                        options={availableMonths.map((month) => ({
                          value: `${month.month}-${month.year}`,
                          label: month.label
                        }))}
                        placeholder="Select month"
                        className="flex-1"
                      />
                      <Button 
                        variant="outline" 
                        size="icon"
                        onClick={() => handlePrint('report')}
                        className="flex-shrink-0"
                      >
                        <Printer className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
                    Showing data for <span className="font-semibold text-gray-900">{monthNames[selectedMonth - 1]} {selectedYear}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tabs */}
            <Tabs 
              tabs={[
                { id: 'overview', label: 'Overview', icon: <User className="h-4 w-4" /> },
                { id: 'attendance', label: 'Attendance', icon: <CheckCircle className="h-4 w-4" />, badge: attendanceRecords.length },
                { id: 'payroll', label: 'Payroll', icon: <DollarSign className="h-4 w-4" /> },
                { id: 'documents', label: 'Documents', icon: <FileText className="h-4 w-4" /> },
              ]}
              activeTab={activeTab} 
              onChange={setActiveTab}
            />

            {/* Tab Panels */}
            <TabPanel value="overview" activeTab={activeTab}>
              <Card className="border border-gray-200 shadow-sm">
                <CardHeader>
                  <CardTitle>Employment Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="font-semibold flex items-center gap-2">
                        <Briefcase className="h-4 w-4" />
                        Job Information
                      </h3>
                      <div className="space-y-3">
                        {[
                          { label: 'Designation', value: staffData.staffProfile?.position || 'N/A' },
                          { label: 'Department', value: staffData.staffProfile?.departmentId?.name || 'N/A' },
                          { label: 'Shift', value: (staffData.staffProfile?.shift || 'Morning').toUpperCase() },
                          { label: 'Employment Type', value: (staffData.staffProfile?.employmentType || 'Permanent').toUpperCase() },
                          { label: 'Joining Date', value: staffData.staffProfile?.joiningDate 
                            ? format(new Date(staffData.staffProfile.joiningDate), 'MMMM dd, yyyy')
                            : 'N/A'
                          },
                        ].map((item, index) => (
                          <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                            <span className="text-gray-600 text-sm">{item.label}</span>
                            <span className="font-medium text-gray-900">{item.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <h3 className="font-semibold flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        Personal Details
                      </h3>
                      <div className="space-y-3">
                        {[
                          { label: 'CNIC', value: staffData.cnic || 'N/A' },
                          { label: 'Phone', value: staffData.phone || 'N/A' },
                          { label: 'Emergency Contact', value: staffData.staffProfile?.emergencyContact?.phone 
                            ? `${staffData.staffProfile.emergencyContact.name} (${staffData.staffProfile.emergencyContact.phone})`
                            : 'N/A'
                          },
                          { label: 'Blood Group', value: staffData.bloodGroup || 'N/A' },
                          { label: 'Nationality', value: staffData.nationality || 'Pakistani' },
                        ].map((item, index) => (
                          <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                            <span className="text-gray-600 text-sm">{item.label}</span>
                            <span className="font-medium text-gray-900 text-right">{item.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabPanel>

            <TabPanel value="attendance" activeTab={activeTab}>
              <Card className="border border-gray-200 shadow-sm">
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <CardTitle>Attendance Records</CardTitle>
                      <CardDescription>
                        {attendanceRecords.length} records for {monthNames[selectedMonth - 1]} {selectedYear}
                      </CardDescription>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handlePrint('report')}
                      className="gap-2"
                    >
                      <Printer className="h-4 w-4" />
                      Print Report
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {attendanceRecords.length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg">
                      <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p className="text-gray-500 mb-2">No attendance records found for this month</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-lg border border-gray-200">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                            <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Day</th>
                            <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check In</th>
                            <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check Out</th>
                            <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hours</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {attendanceRecords.map((record) => (
                            <tr key={record._id} className="hover:bg-gray-50">
                              <td className="p-3 text-sm">
                                {format(new Date(record.date), 'MMM dd, yyyy')}
                              </td>
                              <td className="p-3 text-sm">
                                {format(new Date(record.date), 'EEE')}
                              </td>
                              <td className="p-3">
                                {getStatusBadge(record.status)}
                              </td>
                              <td className="p-3 text-sm font-mono">
                                {record.checkIn?.time 
                                  ? format(new Date(record.checkIn.time), 'hh:mm a')
                                  : '--:--'
                                }
                              </td>
                              <td className="p-3 text-sm font-mono">
                                {record.checkOut?.time 
                                  ? format(new Date(record.checkOut.time), 'hh:mm a')
                                  : '--:--'
                                }
                              </td>
                              <td className="p-3 text-sm font-mono font-medium">
                                {record.workingHours ? `${record.workingHours.toFixed(1)}h` : '-'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabPanel>

            <TabPanel value="payroll" activeTab={activeTab}>
              <Card className="border border-gray-200 shadow-sm">
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <CardTitle>Payroll Details</CardTitle>
                      <CardDescription>
                        Salary information for {monthNames[selectedMonth - 1]} {selectedYear}
                      </CardDescription>
                    </div>
                    {!payrollData ? (
                      <Button 
                        onClick={handleGeneratePayroll} 
                        disabled={processing}
                        className="gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                      >
                        {processing ? (
                          <>
                            <ButtonLoader />
                            Processing...
                          </>
                        ) : (
                          <>
                            <DollarSign className="h-4 w-4" />
                            Generate Payroll
                          </>
                        )}
                      </Button>
                    ) : (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setSelectedLetterType('salary-slip');
                          setShowLetterModal(true);
                        }}
                        className="gap-2"
                      >
                        <Printer className="h-4 w-4" />
                        Print Salary Slip
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {payrollData ? (
                    <div className="space-y-6">
                      {/* Summary Cards */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card className="border border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100">
                          <CardContent className="p-4">
                            <p className="text-sm font-medium text-blue-700 mb-1">Basic Salary</p>
                            <p className="text-2xl font-bold text-blue-900">
                              Rs. {payrollData.basicSalary?.toLocaleString()}
                            </p>
                            <div className="text-xs text-blue-600 mt-2">Monthly Fixed</div>
                          </CardContent>
                        </Card>
                        
                        <Card className="border border-red-200 bg-gradient-to-br from-red-50 to-red-100">
                          <CardContent className="p-4">
                            <p className="text-sm font-medium text-red-700 mb-1">Deductions</p>
                            <p className="text-2xl font-bold text-red-900">
                              Rs. {payrollData.totalDeductions?.toLocaleString()}
                            </p>
                            <div className="text-xs text-red-600 mt-2">Tax + Provident Fund</div>
                          </CardContent>
                        </Card>
                        
                        <Card className="border border-green-200 bg-gradient-to-br from-green-50 to-green-100">
                          <CardContent className="p-4">
                            <p className="text-sm font-medium text-green-700 mb-1">Net Payable</p>
                            <p className="text-2xl font-bold text-green-900">
                              Rs. {payrollData.netSalary?.toLocaleString()}
                            </p>
                            <div className="text-xs text-green-600 mt-2">After all deductions</div>
                          </CardContent>
                        </Card>
                      </div>

                      {/* Detailed Breakdown */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card className="border border-gray-200">
                          <CardHeader className="pb-3">
                            <CardTitle className="text-lg">Earnings</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-4">
                              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                <span className="font-medium">Basic Salary</span>
                                <span className="font-bold text-green-700">Rs. {payrollData.basicSalary?.toLocaleString()}</span>
                              </div>
                              <div className="space-y-2">
                                <div className="flex justify-between">
                                  <span className="text-gray-600">House Rent Allowance</span>
                                  <span>Rs. {(payrollData.allowances?.houseRent || 0).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Medical Allowance</span>
                                  <span>Rs. {(payrollData.allowances?.medical || 0).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Transport Allowance</span>
                                  <span>Rs. {(payrollData.allowances?.transport || 0).toLocaleString()}</span>
                                </div>
                              </div>
                              <Separator />
                              <div className="flex justify-between items-center p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                                <span className="font-bold">Total Earnings</span>
                                <span className="font-bold text-xl text-green-800">Rs. {(payrollData.grossSalary || 0).toLocaleString()}</span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        <Card className="border border-gray-200">
                          <CardHeader className="pb-3">
                            <CardTitle className="text-lg">Deductions</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Tax Deduction</span>
                                  <span className="text-red-600">Rs. {(payrollData.deductions?.tax || 0).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Provident Fund</span>
                                  <span className="text-red-600">Rs. {(payrollData.deductions?.providentFund || 0).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Insurance</span>
                                  <span className="text-red-600">Rs. {(payrollData.deductions?.insurance || 0).toLocaleString()}</span>
                                </div>
                              </div>
                              <Separator />
                              <div className="flex justify-between items-center p-3 bg-gradient-to-r from-red-50 to-rose-50 rounded-lg border border-red-200">
                                <span className="font-bold">Total Deductions</span>
                                <span className="font-bold text-xl text-red-800">Rs. {(payrollData.totalDeductions || 0).toLocaleString()}</span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      {/* Payment Status */}
                      <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
                        <CardContent className="p-6">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                              <p className="text-sm text-green-700 font-medium">Payment Status</p>
                              <Badge className={`mt-2 text-sm px-4 py-1.5 font-medium ${
                                payrollData.paymentStatus === 'paid' 
                                  ? 'bg-green-100 text-green-800 border-green-300 shadow-sm'
                                  : payrollData.paymentStatus === 'pending'
                                  ? 'bg-yellow-100 text-yellow-800 border-yellow-300 shadow-sm'
                                  : 'bg-red-100 text-red-800 border-red-300 shadow-sm'
                              }`}>
                                {payrollData.paymentStatus?.toUpperCase()}
                              </Badge>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-gray-600">Payment Date</p>
                              <p className="font-bold text-lg">
                                {payrollData.paymentDate 
                                  ? format(new Date(payrollData.paymentDate), 'MMM dd, yyyy')
                                  : 'Not Paid Yet'
                                }
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-gray-600">Bank Account</p>
                              <p className="font-medium">
                                {staffData.staffProfile?.bankAccount?.accountNumber 
                                  ? `****${staffData.staffProfile.bankAccount.accountNumber.slice(-4)}`
                                  : 'Not Set'
                                }
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  ) : (
                    <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg">
                      <DollarSign className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p className="text-gray-500 mb-2">No payroll record found for {monthNames[selectedMonth - 1]} {selectedYear}</p>
                      <p className="text-sm text-gray-400 mb-4">Generate payroll to view salary details</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabPanel>

            <TabPanel value="documents" activeTab={activeTab}>
              <Card className="border border-gray-200 shadow-sm">
                <CardHeader>
                  <CardTitle>Official Documents</CardTitle>
                  <CardDescription>
                    Generate and print official letters and certificates
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {STAFF_LETTERS.map((letter) => {
                      const Icon = letter.icon;
                      return (
                        <Card 
                          key={letter.id}
                          className="cursor-pointer hover:shadow-lg transition-all duration-200 border border-gray-200 hover:border-blue-300 hover:-translate-y-1"
                          onClick={() => {
                            setSelectedLetterType(letter.id);
                            setShowLetterModal(true);
                          }}
                        >
                          <CardContent className="p-5 flex flex-col items-center text-center">
                            <div className={`h-14 w-14 rounded-2xl ${letter.color} flex items-center justify-center mb-4 shadow-md`}>
                              <Icon className="h-7 w-7 text-white" />
                            </div>
                            <h3 className="font-semibold mb-2 text-gray-900">{letter.label}</h3>
                            <p className="text-xs text-gray-500">Click to generate and print</p>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabPanel>
          </div>
        </div>
      </div>

      {/* Print Options Modal */}
      <Modal
        open={showPrintOptions}
        onClose={() => setShowPrintOptions(false)}
        title="Print Options"
        size="lg"
      >
        <div className="space-y-6">
          <p className="text-gray-600">Select what you want to print:</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button 
              variant="outline" 
              className="h-auto py-5 flex-col gap-3 hover:bg-blue-50 hover:border-blue-300"
              onClick={() => {
                setShowPrintOptions(false);
                handlePrint('report');
              }}
            >
              <FileText className="h-8 w-8 text-blue-600" />
              <div>
                <div className="font-semibold">Monthly Report</div>
                <div className="text-xs text-gray-500 mt-1">Complete report</div>
              </div>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-auto py-5 flex-col gap-3 hover:bg-purple-50 hover:border-purple-300"
              onClick={() => {
                setShowPrintOptions(false);
                setShowIdCard(true);
                setIdCardView('front');
              }}
            >
              <IdCard className="h-8 w-8 text-purple-600" />
              <div>
                <div className="font-semibold">ID Card</div>
                <div className="text-xs text-gray-500 mt-1">85.6mm × 54mm</div>
              </div>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-auto py-5 flex-col gap-3 hover:bg-green-50 hover:border-green-300"
              onClick={() => {
                setShowPrintOptions(false);
                if (payrollData) {
                  setSelectedLetterType('salary-slip');
                  setShowLetterModal(true);
                } else {
                  toast.error('Please generate payroll first');
                }
              }}
            >
              <CreditCard className="h-8 w-8 text-green-600" />
              <div>
                <div className="font-semibold">Salary Slip</div>
                <div className="text-xs text-gray-500 mt-1">A4 Format</div>
              </div>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-auto py-5 flex-col gap-3 hover:bg-amber-50 hover:border-amber-300"
              onClick={() => {
                setShowPrintOptions(false);
                setSelectedLetterType('appointment');
                setShowLetterModal(true);
              }}
            >
              <FileSignature className="h-8 w-8 text-amber-600" />
              <div>
                <div className="font-semibold">Documents</div>
                <div className="text-xs text-gray-500 mt-1">All letters</div>
              </div>
            </Button>
          </div>
        </div>
      </Modal>

      {/* ID Card Modal */}
      <Modal
        open={showIdCard}
        onClose={() => setShowIdCard(false)}
        title="Employee ID Card"
        maxWidth="lg"
      >
        <div className="space-y-6">
          {/* ID Card Preview */}
          <div className="flex flex-col items-center">
            {/* Card Flip Controls */}
            <div className="flex gap-2 mb-4">
              <Button 
                variant={idCardView === 'front' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setIdCardView('front')}
                className="gap-2"
              >
                <Eye className="h-4 w-4" />
                Front Side
              </Button>
              <Button 
                variant={idCardView === 'back' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setIdCardView('back')}
                className="gap-2"
              >
                <Eye className="h-4 w-4" />
                Back Side
              </Button>
            </div>
            
            {/* ID Card Container */}
            <div className="relative">
              {/* Card Size Indicator */}
              <div className="absolute -top-6 left-0 right-0 text-center">
                <div className="inline-flex items-center gap-2 bg-gray-800 text-white text-xs px-3 py-1 rounded-full">
                  <Scan className="h-3 w-3" />
                  Standard ID Card Size: 85.6mm × 54mm (Credit Card Size)
                </div>
              </div>
              
              {/* ID Card */}
              <div className="scale-100" id="print-content">
                {renderIDCard()}
              </div>
            </div>
            
            {/* QR Code Download */}
            <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
              <QrCode className="h-4 w-4" />
              <span>QR contains employee verification data</span>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t">
            <Button 
              variant="outline" 
              onClick={() => setShowIdCard(false)}
              className="flex-1"
            >
              Close
            </Button>
            <Button 
              onClick={downloadQRCode}
              variant="outline"
              className="flex-1 gap-2"
            >
              <Download className="h-4 w-4" />
              Download QR
            </Button>
            <Button 
              onClick={() => {
                setShowIdCard(false);
                setTimeout(() => handlePrint('idcard'), 300);
              }}
              className="flex-1 gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
            >
              <Printer className="h-4 w-4" />
              Print ID Card
            </Button>
          </div>
        </div>
      </Modal>

      {/* Letter Generation Modal */}
      <Modal
        open={showLetterModal}
        onClose={() => setShowLetterModal(false)}
        title="Document Preview"
        maxWidth="4xl"
      >
        <div className="space-y-6">
          <div className="border rounded-lg p-4 bg-gray-50 max-h-[60vh] overflow-y-auto">
            <div id="print-content">
              <div className="bg-white p-8 print:p-0">
                {/* Letter Header */}
                <div className="text-center border-b-2 border-blue-600 pb-6 mb-8 print:pb-4 print:mb-6">
                  <div className="flex items-center justify-center gap-4 mb-4 print:mb-2">
                    <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center print:h-12 print:w-12">
                      <span className="text-white font-bold text-2xl print:text-xl">EA</span>
                    </div>
                    <div>
                      <h1 className="text-3xl font-bold text-blue-900 print:text-2xl">ADAMJEE COACHING</h1>
                      <p className="text-gray-600 mt-2 print:text-sm">Excellence in Education & Administration</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap justify-center gap-4 mt-4 text-sm text-gray-500 print:text-xs print:gap-2">
                    <p className="flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      +92 300 1234567
                    </p>
                    <p className="flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      info@easeacademy.edu.pk
                    </p>
                    <p className="flex items-center gap-1">
                      <Globe className="h-3 w-3" />
                      www.easeacademy.edu.pk
                    </p>
                  </div>
                </div>
                
                {/* Letter Subject */}
                <div className="text-center mb-8 print:mb-6">
                  <h2 className="text-2xl font-bold uppercase tracking-wider text-gray-800 border-b pb-4 print:text-xl">
                    {(() => {
                      const letter = generateLetterContent(selectedLetterType);
                      return letter.subject;
                    })()}
                  </h2>
                  <p className="text-gray-500 mt-4 print:mt-2">Date: {format(new Date(), 'MMMM dd, yyyy')}</p>
                </div>
                
                {/* Recipient Info */}
                <div className="mb-8 p-6 bg-gray-50 rounded-xl border border-gray-200 print:p-4">
                  <div className="flex items-start gap-3">
                    <User className="h-5 w-5 text-gray-400 mt-1 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="font-bold text-gray-700 mb-2">TO:</p>
                      <p className="text-lg font-semibold text-gray-900 print:text-base">
                        {staffData.firstName} {staffData.lastName}
                      </p>
                      <p className="text-gray-600">{staffData.staffProfile?.position || 'Staff Member'}</p>
                      <p className="text-gray-600">Employee ID: {staffData.staffProfile?.employeeId || 'N/A'}</p>
                      <p className="text-gray-600">{staffData.branchId?.name || 'Adamjee Coaching'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Ref: {Math.random().toString(36).substr(2, 9).toUpperCase()}</p>
                    </div>
                  </div>
                </div>
                
                {/* Letter Content */}
                <div className="prose prose-lg max-w-none mb-12 print:prose-base print:mb-8">
                  {(() => {
                    const letter = generateLetterContent(selectedLetterType);
                    return <div dangerouslySetInnerHTML={{ __html: letter.content }} />;
                  })()}
                </div>
                
                {/* Signatures */}
                <div className="mt-16 pt-8 border-t flex flex-col sm:flex-row justify-between gap-8 print:mt-12 print:pt-6">
                  <div className="text-center flex-1">
                    <div className="h-1 w-48 bg-gray-400 mx-auto mb-2"></div>
                    <p className="font-bold text-gray-900 mt-4">{staffData.firstName} {staffData.lastName}</p>
                    <p className="text-sm text-gray-500">Employee Signature</p>
                    <div className="mt-2 text-xs text-gray-400">Date: ________________</div>
                  </div>
                  <div className="text-center flex-1">
                    <div className="h-1 w-48 bg-gray-400 mx-auto mb-2"></div>
                    <p className="font-bold text-gray-900 mt-4">Principal / Administrator</p>
                    <p className="text-sm text-gray-500">Authorized Signature & Stamp</p>
                    <div className="mt-2 text-xs text-gray-400">Date: ________________</div>
                  </div>
                </div>
                
                {/* Footer */}
                <div className="mt-12 text-center text-xs text-gray-400 print:mt-8">
                  <p>This is a computer-generated document. No physical signature required.</p>
                  <p className="mt-1">Document ID: {Math.random().toString(36).substr(2, 9).toUpperCase()}</p>
                  <p className="mt-1">Generated on: {format(new Date(), 'yyyy-MM-dd hh:mm:ss a')}</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t">
            <Button 
              variant="outline" 
              onClick={() => setShowLetterModal(false)}
              className="flex-1"
            >
              Close Preview
            </Button>
            <Button 
              onClick={() => handlePrint('letter')}
              className="flex-1 gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
            >
              <Printer className="h-4 w-4" />
              Print Document
            </Button>
            <Button variant="outline" className="flex-1 gap-2">
              <Download className="h-4 w-4" />
              Download PDF
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}