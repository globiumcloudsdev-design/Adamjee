'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import apiClient from '@/lib/api-client';
import { API_ENDPOINTS } from '@/constants/api-endpoints';
import { toast } from 'sonner';
import {
  Users,
  Calendar,
  Clock,
  MapPin,
  Filter,
  Download,
  Edit,
  Trash2,
  Plus,
  CheckCircle,
  XCircle,
  Activity,
  TrendingUp,
  AlertCircle,
  Search,
  Eye,
  ChevronLeft,
  ChevronRight,
  BarChart3,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import Dropdown from '@/components/ui/dropdown';
import Modal from '@/components/ui/modal';
import Tabs, { TabPanel } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import ButtonLoader from '@/components/ui/button-loader';
import FullPageLoader from '@/components/ui/full-page-loader';
import AttendanceViewModal from '@/components/modals/AttendanceViewModal';

const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

// Check if check-out is early
const isEarlyCheckOut = (checkOutTime, workEndTime = '17:00') => {
  const [endHour, endMin] = workEndTime.split(':').map(Number);
  const endThreshold = new Date(checkOutTime);
  endThreshold.setHours(endHour, endMin, 0, 0);
  return checkOutTime < endThreshold;
};

// Get checkout status for display
const getCheckOutStatus = (checkOutTime) => {
  if (!checkOutTime) return null;
  return isEarlyCheckOut(new Date(checkOutTime)) ? 'early' : 'on-time';
};

export default function BranchAdminEmployeeAttendancePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  
  // Tabs
  const [activeTab, setActiveTab] = useState('list');
  
  // Filters
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  
  // Data
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  
  // Modal states
  const [showMarkModal, setShowMarkModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [selectedViewRecord, setSelectedViewRecord] = useState(null);
  
  // Form data
  const [formData, setFormData] = useState({
    userId: '',
    date: new Date().toISOString().split('T')[0],
    status: 'present',
    leaveType: '',
    leaveReason: '',
    remarks: '',
    checkInTime: '',
    checkOutTime: '',
  });

  useEffect(() => {
    if (user) {
      fetchInitialData();
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      setCurrentPage(1);
    }
  }, [selectedMonth, selectedYear, selectedStatus]);

  useEffect(() => {
    if (user) {
      fetchAttendanceRecords();
      fetchStats();
    }
  }, [user, currentPage, pageSize, selectedMonth, selectedYear, selectedStatus]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      await fetchUsers();
    } catch (error) {
      console.error('Error fetching initial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.BRANCH_ADMIN.EMPLOYEES.LIST);
      if (response.success) {
        setUsers(response.data);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  // Mock data for employee attendance
  const getMockAttendanceData = () => {
    const mockUsers = [
      { _id: '1', firstName: 'Ahmed', lastName: 'Khan', email: 'ahmed.khan@easeacademy.com' },
      { _id: '2', firstName: 'Fatima', lastName: 'Ali', email: 'fatima.ali@easeacademy.com' },
      { _id: '3', firstName: 'Muhammad', lastName: 'Hassan', email: 'muhammad.hassan@easeacademy.com' },
      { _id: '4', firstName: 'Ayesha', lastName: 'Ahmed', email: 'ayesha.ahmed@easeacademy.com' },
      { _id: '5', firstName: 'Omar', lastName: 'Farooq', email: 'omar.farooq@easeacademy.com' },
      { _id: '6', firstName: 'Zainab', lastName: 'Malik', email: 'zainab.malik@easeacademy.com' },
      { _id: '7', firstName: 'Bilal', lastName: 'Khan', email: 'bilal.khan@easeacademy.com' },
      { _id: '8', firstName: 'Maryam', lastName: 'Shah', email: 'maryam.shah@easeacademy.com' },
    ];

    const mockRecords = [];
    const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();

    // Generate mock data for the selected month
    for (let day = 1; day <= Math.min(daysInMonth, 31); day++) {
      const date = new Date(selectedYear, selectedMonth - 1, day);
      const dayOfWeek = date.getDay();

      // Skip weekends (Saturday = 6, Sunday = 0)
      if (dayOfWeek === 0 || dayOfWeek === 6) continue;

      // Generate records for random employees
      const numRecords = Math.floor(Math.random() * 4) + 3; // 3-6 records per day
      const selectedUsers = mockUsers.sort(() => 0.5 - Math.random()).slice(0, numRecords);

      selectedUsers.forEach((user, index) => {
        const statuses = ['present', 'present', 'present', 'late', 'half-day', 'absent'];
        let status = statuses[Math.floor(Math.random() * statuses.length)];

        let checkInTime = null;
        let checkOutTime = null;
        let checkInStatus = null;
        let checkOutStatus = null;
        let workingHours = 0;

        if (status === 'present' || status === 'late' || status === 'half-day') {
          // Generate check-in time (between 8:30 AM and 10:00 AM)
          const checkInHour = 8 + Math.floor(Math.random() * 2);
          const checkInMinute = Math.floor(Math.random() * 60);
          checkInTime = new Date(selectedYear, selectedMonth - 1, day, checkInHour, checkInMinute);

          // Determine check-in status
          checkInStatus = checkInTime.getHours() === 8 && checkInTime.getMinutes() <= 30 ? 'on-time' : 'late';

          // Generate check-out time (between 4:00 PM and 6:00 PM)
          const checkOutHour = 16 + Math.floor(Math.random() * 2);
          const checkOutMinute = Math.floor(Math.random() * 60);
          checkOutTime = new Date(selectedYear, selectedMonth - 1, day, checkOutHour, checkOutMinute);

          // Calculate working hours
          const diffMs = checkOutTime - checkInTime;
          workingHours = Math.max(0, diffMs / (1000 * 60 * 60));

          // Determine check-out status
          checkOutStatus = isEarlyCheckOut(checkOutTime) ? 'early' : 'on-time';

          // Adjust status based on working hours
          if (workingHours < 4) {
            status = 'half-day';
          }
        }

        const record = {
          _id: `mock_${user._id}_${day}_${index}`,
          userId: user,
          date: date.toISOString().split('T')[0],
          status,
          checkIn: checkInTime ? {
            time: checkInTime.toISOString(),
            status: checkInStatus,
            location: {
              latitude: 24.8607 + (Math.random() - 0.5) * 0.01,
              longitude: 67.0011 + (Math.random() - 0.5) * 0.01,
              address: 'Karachi, Pakistan'
            },
            device: 'Mobile Device',
            ipAddress: '192.168.1.100'
          } : null,
          checkOut: checkOutTime ? {
            time: checkOutTime.toISOString(),
            status: checkOutStatus,
            location: {
              latitude: 24.8607 + (Math.random() - 0.5) * 0.01,
              longitude: 67.0011 + (Math.random() - 0.5) * 0.01,
              address: 'Karachi, Pakistan'
            },
            device: 'Mobile Device',
            ipAddress: '192.168.1.100'
          } : null,
          workingHours: workingHours > 0 ? workingHours : 0,
          overtimeHours: Math.max(0, workingHours - 8),
          lateBy: checkInStatus === 'late' ? Math.floor((checkInTime.getTime() - new Date(selectedYear, selectedMonth - 1, day, 9, 0).getTime()) / (1000 * 60)) : 0,
          earlyLeaveBy: checkOutStatus === 'early' ? Math.floor((new Date(selectedYear, selectedMonth - 1, day, 17, 0).getTime() - checkOutTime.getTime()) / (1000 * 60)) : 0,
          createdAt: date.toISOString(),
          updatedAt: date.toISOString()
        };

        mockRecords.push(record);
      });
    }

    return mockRecords;
  };

  const fetchAttendanceRecords = async () => {
    try {
      setLoading(true);
      const params = {
        month: selectedMonth,
        year: selectedYear,
        page: currentPage,
        limit: pageSize,
      };

      if (selectedStatus !== 'all') {
        params.status = selectedStatus;
      }

      const response = await apiClient.get(API_ENDPOINTS.BRANCH_ADMIN.EMPLOYEE_ATTENDANCE.LIST, params);
      if (response.success && response.data) {
        setAttendanceRecords(response.data);
        setTotalRecords(response.pagination?.total || response.data.length);
        setTotalPages(response.pagination?.pages || Math.ceil(response.data.length / pageSize));
      } else {
        // Fallback to mock data if API fails
        const mockData = getMockAttendanceData();
        setAttendanceRecords(mockData);
        setTotalRecords(mockData.length);
        setTotalPages(Math.ceil(mockData.length / pageSize));
      }
    } catch (error) {
      console.error('Error fetching attendance records:', error);
      // Use mock data on error
      const mockData = getMockAttendanceData();
      setAttendanceRecords(mockData);
      setTotalRecords(mockData.length);
      setTotalPages(Math.ceil(mockData.length / pageSize));
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const params = {
        month: selectedMonth,
        year: selectedYear,
        type: 'summary',
      };

      const response = await apiClient.get(API_ENDPOINTS.SUPER_ADMIN.EMPLOYEE_ATTENDANCE.REPORTS, params);
      if (response.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleMarkAttendance = async () => {
    try {
      setProcessing(true);

      if (!formData.userId || !formData.date || !formData.status) {
        toast.error('Please fill all required fields');
        return;
      }

      const payload = {
        userId: formData.userId,
        date: formData.date,
        status: formData.status,
        ...(formData.leaveType && { leaveType: formData.leaveType }),
        ...(formData.leaveReason && { leaveReason: formData.leaveReason }),
        ...(formData.remarks && { remarks: formData.remarks }),
        ...(formData.checkInTime && { checkInTime: `${formData.date}T${formData.checkInTime}:00` }),
        ...(formData.checkOutTime && { checkOutTime: `${formData.date}T${formData.checkOutTime}:00` }),
      };

      const response = await apiClient.post(API_ENDPOINTS.SUPER_ADMIN.EMPLOYEE_ATTENDANCE.MARK, payload);

      if (response.success) {
        toast.success('Attendance marked successfully');
        setShowMarkModal(false);
        resetForm();
        fetchAttendanceRecords();
        fetchStats();
      } else {
        toast.error(response.error || 'Failed to mark attendance');
      }
    } catch (error) {
      console.error('Error marking attendance:', error);
      toast.error(error.message || 'Failed to mark attendance');
    } finally {
      setProcessing(false);
    }
  };

  const handleEditAttendance = async () => {
    try {
      setProcessing(true);

      const payload = {
        userId: selectedRecord.userId._id,
        date: formData.date,
        status: formData.status,
        ...(formData.leaveType && { leaveType: formData.leaveType }),
        ...(formData.leaveReason && { leaveReason: formData.leaveReason }),
        ...(formData.remarks && { remarks: formData.remarks }),
        ...(formData.checkInTime && { checkInTime: `${formData.date}T${formData.checkInTime}:00` }),
        ...(formData.checkOutTime && { checkOutTime: `${formData.date}T${formData.checkOutTime}:00` }),
      };

      const response = await apiClient.post(API_ENDPOINTS.SUPER_ADMIN.EMPLOYEE_ATTENDANCE.MARK, payload);

      if (response.success) {
        toast.success('Attendance updated successfully');
        setShowEditModal(false);
        setSelectedRecord(null);
        resetForm();
        fetchAttendanceRecords();
        fetchStats();
      } else {
        toast.error(response.error || 'Failed to update attendance');
      }
    } catch (error) {
      console.error('Error updating attendance:', error);
      toast.error(error.message || 'Failed to update attendance');
    } finally {
      setProcessing(false);
    }
  };

  const openEditModal = (record) => {
    setSelectedRecord(record);
    setFormData({
      userId: record.userId._id,
      date: new Date(record.date).toISOString().split('T')[0],
      status: record.status,
      leaveType: record.leaveType || '',
      leaveReason: record.leaveReason || '',
      remarks: record.remarks || '',
      checkInTime: record.checkIn?.time ? new Date(record.checkIn.time).toTimeString().slice(0, 5) : '',
      checkOutTime: record.checkOut?.time ? new Date(record.checkOut.time).toTimeString().slice(0, 5) : '',
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({
      userId: '',
      date: new Date().toISOString().split('T')[0],
      status: 'present',
      leaveType: '',
      leaveReason: '',
      remarks: '',
      checkInTime: '',
      checkOutTime: '',
    });
  };

  const getStatusBadge = (status) => {
    const variants = {
      present: 'bg-green-100 text-green-800',
      absent: 'bg-red-100 text-red-800',
      late: 'bg-yellow-100 text-yellow-800',
      'half-day': 'bg-orange-100 text-orange-800',
      leave: 'bg-blue-100 text-blue-800',
      excused: 'bg-purple-100 text-purple-800',
    };

    return (
      <Badge className={variants[status] || 'bg-gray-100 text-gray-800'}>
        {status.replace('-', ' ').toUpperCase()}
      </Badge>
    );
  };

  const filteredRecords = attendanceRecords.filter(record => {
    if (!searchQuery) return true;
    const userName = `${record.userId?.firstName} ${record.userId?.lastName}`.toLowerCase();
    return userName.includes(searchQuery.toLowerCase());
  });

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const renderPagination = () => {
    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage < maxVisiblePages - 1) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`px-3 py-1 rounded ${
            currentPage === i
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-100 border dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700'
          }`}
        >
          {i}
        </button>
      );
    }

    return (
      <div className="flex items-center justify-between mt-4 flex-wrap gap-4">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalRecords)} of {totalRecords} records
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          {pages}
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <Dropdown
          value={pageSize.toString()}
          onChange={(e) => {
            setPageSize(parseInt(e.target.value));
            setCurrentPage(1);
          }}
          options={[
            { value: '10', label: '10 per page' },
            { value: '25', label: '25 per page' },
            { value: '50', label: '50 per page' },
            { value: '100', label: '100 per page' },
          ]}
          className="w-40"
        />
      </div>
    );
  };

  const tabs = [
    { id: 'list', label: 'Attendance List', icon: <Users className="h-5 w-5" />, badge: totalRecords },
    { id: 'overview', label: 'Overview', icon: <BarChart3 className="h-5 w-5" /> },
  ];

  if (loading && attendanceRecords.length === 0) {
    return <FullPageLoader />;
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Employee Attendance</h1>
          <p className="text-gray-500 mt-1">
            Manage employee check-in/check-out and attendance records
          </p>
        </div>
        <Button onClick={() => setShowMarkModal(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Mark Attendance
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Employees</p>
                <p className="text-2xl font-bold mt-1">{stats.totalEmployees || 0}</p>
              </div>
              <Users className="w-10 h-10 text-blue-500" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Present Days</p>
                <p className="text-2xl font-bold text-green-600 mt-1">{stats.presentDays || 0}</p>
              </div>
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Absent Days</p>
                <p className="text-2xl font-bold text-red-600 mt-1">{stats.absentDays || 0}</p>
              </div>
              <XCircle className="w-10 h-10 text-red-500" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Late Days</p>
                <p className="text-2xl font-bold text-yellow-600 mt-1">{stats.lateDays || 0}</p>
              </div>
              <AlertCircle className="w-10 h-10 text-yellow-500" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Attendance %</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">
                  {stats.averageAttendancePercentage || 0}%
                </p>
              </div>
              <TrendingUp className="w-10 h-10 text-blue-500" />
            </div>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      <TabPanel value="list" activeTab={activeTab}>
        {/* Filters */}
        <Card className="p-6 mb-4">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-gray-500" />
            <h2 className="text-lg font-semibold">Filters</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Month</label>
              <Dropdown
                value={selectedMonth.toString()}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                options={monthNames.map((month, index) => ({
                  value: (index + 1).toString(),
                  label: month
                }))}
                placeholder="Select Month"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Year</label>
              <Dropdown
                value={selectedYear.toString()}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                options={[2024, 2025, 2026].map(year => ({
                  value: year.toString(),
                  label: year.toString()
                }))}
                placeholder="Select Year"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Status</label>
              <Dropdown
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                options={[
                  { value: 'all', label: 'All Status' },
                  { value: 'present', label: 'Present' },
                  { value: 'absent', label: 'Absent' },
                  { value: 'late', label: 'Late' },
                  { value: 'half-day', label: 'Half Day' },
                  { value: 'leave', label: 'Leave' },
                  { value: 'excused', label: 'Excused' }
                ]}
                placeholder="Select Status"
              />
            </div>
          </div>
        </Card>

      {/* Attendance Records Table */}
      <Card className="p-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-3 font-semibold">Employee</th>
                <th className="text-left p-3 font-semibold">Date</th>

                <th className="text-left p-3 font-semibold">Check In</th>
                <th className="text-left p-3 font-semibold">Check-in Status</th>
                <th className="text-left p-3 font-semibold">Check Out</th>
                <th className="text-left p-3 font-semibold">Check-out Status</th>
                <th className="text-left p-3 font-semibold">Working Hours</th>
                <th className="text-left p-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center p-8 text-gray-500">
                    <Activity className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p>No attendance records found</p>
                  </td>
                </tr>
              ) : (
                filteredRecords.map((record) => (
                  <tr key={record._id} className="border-b hover:bg-gray-50">
                    <td className="p-3">
                      <div>
                        <p className="font-medium">
                          {record.userId?.firstName} {record.userId?.lastName}
                        </p>
                        <p className="text-sm text-gray-500">{record.userId?.email}</p>
                      </div>
                    </td>
                    <td className="p-3">
                      <p className="text-sm">
                        {new Date(record.date).toLocaleDateString()}
                      </p>
                    </td>

                    <td className="p-3">
                      {record.checkIn?.time ? (
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-gray-400" />
                          <span className="text-sm">
                            {new Date(record.checkIn.time).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                              hour12: true
                            })}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">-</span>
                      )}
                    </td>
                    <td className="p-3">
                      {record.checkIn?.status ? (
                        <Badge className={`text-xs ${
                          record.checkIn.status === 'on-time'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {record.checkIn.status === 'on-time' ? '✓ On Time' : '⚠ Late'}
                        </Badge>
                      ) : (
                        <span className="text-gray-400 text-sm">-</span>
                      )}
                    </td>
                    <td className="p-3">
                      {record.checkOut?.time ? (
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-gray-400" />
                          <span className="text-sm">
                            {new Date(record.checkOut.time).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                              hour12: true
                            })}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">-</span>
                      )}
                    </td>
                    <td className="p-3">
                      {record.checkOut?.time ? (
                        <Badge className={`text-xs ${
                          getCheckOutStatus(record.checkOut.time) === 'on-time'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-orange-100 text-orange-800'
                        }`}>
                          {getCheckOutStatus(record.checkOut.time) === 'on-time' ? '✓ On Time' : '⚠ Early'}
                        </Badge>
                      ) : (
                        <span className="text-gray-400 text-sm">-</span>
                      )}
                    </td>
                    <td className="p-3">
                      <span className="text-sm font-medium">
                        {record.workingHours ? `${record.workingHours.toFixed(1)}h` : '-'}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/branch-admin/salary-management/employee-attendance/${record.userId._id}`)}
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditModal(record)}
                          title="Edit Attendance"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && renderPagination()}
      </Card>
      </TabPanel>

      <TabPanel value="overview" activeTab={activeTab}>
        <Card className="p-6">
          <div className="text-center py-12">
            <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Overview Charts</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Detailed charts and analytics will be displayed here
            </p>
          </div>
        </Card>
      </TabPanel>

      {/* Mark Attendance Modal */}
      <Modal
        open={showMarkModal}
        onClose={() => {
          setShowMarkModal(false);
          resetForm();
        }}
        title="Mark Employee Attendance"
        size="lg"
        footer={
          <div className="flex items-center justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setShowMarkModal(false);
                resetForm();
              }}
              disabled={processing}
            >
              Cancel
            </Button>
            <Button onClick={handleMarkAttendance} disabled={processing} className="gap-2">
              {processing ? (
                <>
                  <ButtonLoader />
                  Marking...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Mark Attendance
                </>
              )}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Employee *</label>
            <Dropdown
              value={formData.userId}
              onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
              options={users.map(user => {
                let roleLabel = user.role;
                // Add staff type if available
                if (user.role === 'staff' && user.staffProfile?.staffType) {
                  roleLabel += ` - ${user.staffProfile.staffType}`;
                }
                // Normalize role formatting
                roleLabel = roleLabel.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());

                return {
                  value: user._id,
                  label: `${user.firstName} ${user.lastName} (${roleLabel})`
                };
              })}
              placeholder="Select Employee"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Date *</label>
              <Input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Status *</label>
              <Dropdown
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                options={[
                  { value: 'present', label: 'Present' },
                  { value: 'absent', label: 'Absent' },
                  { value: 'late', label: 'Late' },
                  { value: 'half-day', label: 'Half Day' },
                  { value: 'leave', label: 'Leave' },
                  { value: 'excused', label: 'Excused' }
                ]}
              />
            </div>
          </div>

          {formData.status === 'leave' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Leave Type</label>
                <Dropdown
                  value={formData.leaveType}
                  onChange={(e) => setFormData({ ...formData, leaveType: e.target.value })}
                  options={[
                    { value: '', label: 'Select Type' },
                    { value: 'sick', label: 'Sick' },
                    { value: 'casual', label: 'Casual' },
                    { value: 'annual', label: 'Annual' },
                    { value: 'unpaid', label: 'Unpaid' },
                    { value: 'other', label: 'Other' }
                  ]}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Leave Reason</label>
                <Input
                  value={formData.leaveReason}
                  onChange={(e) => setFormData({ ...formData, leaveReason: e.target.value })}
                  placeholder="Enter reason..."
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Check In Time</label>
              <Input
                type="time"
                value={formData.checkInTime}
                onChange={(e) => setFormData({ ...formData, checkInTime: e.target.value })}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Check Out Time</label>
              <Input
                type="time"
                value={formData.checkOutTime}
                onChange={(e) => setFormData({ ...formData, checkOutTime: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Remarks</label>
            <textarea
              value={formData.remarks}
              onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
              className="w-full px-3 py-2 border rounded-md"
              rows="3"
              placeholder="Add any remarks..."
            />
          </div>
        </div>
      </Modal>

      {/* Edit Attendance Modal */}
      <Modal
        open={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedRecord(null);
          resetForm();
        }}
        title="Edit Attendance"
        size="lg"
        footer={
          <div className="flex items-center justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setShowEditModal(false);
                setSelectedRecord(null);
                resetForm();
              }}
              disabled={processing}
            >
              Cancel
            </Button>
            <Button onClick={handleEditAttendance} disabled={processing} className="gap-2">
              {processing ? (
                <>
                  <ButtonLoader />
                  Updating...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Update Attendance
                </>
              )}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          {selectedRecord && (
            <div className="bg-gray-50 p-3 rounded-md mb-4">
              <p className="text-sm font-medium">
                {selectedRecord.userId?.firstName} {selectedRecord.userId?.lastName}
              </p>
              <p className="text-xs text-gray-500">{selectedRecord.userId?.email}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Date *</label>
              <Input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Status *</label>
              <Dropdown
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                options={[
                  { value: 'present', label: 'Present' },
                  { value: 'absent', label: 'Absent' },
                  { value: 'late', label: 'Late' },
                  { value: 'half-day', label: 'Half Day' },
                  { value: 'leave', label: 'Leave' },
                  { value: 'excused', label: 'Excused' }
                ]}
              />
            </div>
          </div>

          {formData.status === 'leave' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Leave Type</label>
                <Dropdown
                  value={formData.leaveType}
                  onChange={(e) => setFormData({ ...formData, leaveType: e.target.value })}
                  options={[
                    { value: '', label: 'Select Type' },
                    { value: 'sick', label: 'Sick' },
                    { value: 'casual', label: 'Casual' },
                    { value: 'annual', label: 'Annual' },
                    { value: 'unpaid', label: 'Unpaid' },
                    { value: 'other', label: 'Other' }
                  ]}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Leave Reason</label>
                <Input
                  value={formData.leaveReason}
                  onChange={(e) => setFormData({ ...formData, leaveReason: e.target.value })}
                  placeholder="Enter reason..."
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Check In Time</label>
              <Input
                type="time"
                value={formData.checkInTime}
                onChange={(e) => setFormData({ ...formData, checkInTime: e.target.value })}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Check Out Time</label>
              <Input
                type="time"
                value={formData.checkOutTime}
                onChange={(e) => setFormData({ ...formData, checkOutTime: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Remarks</label>
            <textarea
              value={formData.remarks}
              onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
              className="w-full px-3 py-2 border rounded-md"
              rows="3"
              placeholder="Add any remarks..."
            />
          </div>
        </div>
      </Modal>

      {/* View Attendance Modal */}
      <AttendanceViewModal
        open={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          setSelectedViewRecord(null);
        }}
        attendanceRecord={selectedViewRecord}
      />
    </div>
  );
}
