'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  MapPin,
  Monitor,
  Globe,
  Edit,
  Download,
  CheckCircle,
  XCircle,
  AlertCircle,
  TrendingUp,
  Activity,
  Clock4,
  Timer,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Dropdown from '@/components/ui/dropdown';
import Modal from '@/components/ui/modal';
import apiClient from '@/lib/api-client';
import { API_ENDPOINTS } from '@/constants/api-endpoints';
import FullPageLoader from '@/components/ui/full-page-loader';
import ButtonLoader from '@/components/ui/button-loader';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { toast } from 'sonner';

const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function SuperAdminEmployeeAttendanceDetailPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const userId = params.id;

  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  // Data
  const [employeeData, setEmployeeData] = useState(null);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [stats, setStats] = useState(null);
  const [chartData, setChartData] = useState({
    monthly: [],
    status: [],
    trend: [],
  });

  // Filters
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());

  // Modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);

  // Form data
  const [formData, setFormData] = useState({
    date: '',
    status: 'present',
    leaveType: '',
    leaveReason: '',
    remarks: '',
    checkInTime: '',
    checkOutTime: '',
  });

  useEffect(() => {
    if (!user || !userId) return;

    // Reset data when userId changes to prevent showing stale data
    setEmployeeData(null);
    setAttendanceRecords([]);
    setStats(null);
    setLoading(true);

    fetchData();
  }, [user, userId, selectedMonth, selectedYear]);

  const fetchData = async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      
      // Fetch employee data
      const empResponse = await apiClient.get(API_ENDPOINTS.SUPER_ADMIN.EMPLOYEES.GET.replace(':id', userId));
      if (empResponse.success && empResponse.data) {
        setEmployeeData(empResponse.data);
      } else {
        setEmployeeData(null);
      }

      // Fetch attendance records
      const attResponse = await apiClient.get(API_ENDPOINTS.SUPER_ADMIN.EMPLOYEE_ATTENDANCE.LIST, {
        userId,
        month: selectedMonth,
        year: selectedYear,
        limit: 100,
      });

      if (attResponse.success) {
        setAttendanceRecords(attResponse.data);
        generateChartData(attResponse.data);
      }

      // Fetch stats
      const statsResponse = await apiClient.get(API_ENDPOINTS.SUPER_ADMIN.EMPLOYEE_ATTENDANCE.SUMMARY, {
        userId,
        month: selectedMonth,
        year: selectedYear,
      });

      if (statsResponse.success) {
        setStats(statsResponse.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load employee data');
    } finally {
      setLoading(false);
    }
  };

  const generateChartData = (records) => {
    // Status distribution for pie chart
    const statusCount = {
      present: 0,
      absent: 0,
      late: 0,
      'half-day': 0,
      leave: 0,
    };

    records.forEach(record => {
      statusCount[record.status] = (statusCount[record.status] || 0) + 1;
    });

    const statusData = Object.keys(statusCount).map(key => ({
      name: key.charAt(0).toUpperCase() + key.slice(1).replace('-', ' '),
      value: statusCount[key],
    }));

    // Monthly trend
    const monthlyData = [];
    const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
    
    for (let day = 1; day <= Math.min(daysInMonth, 31); day++) {
      const dayRecords = records.filter(r => {
        const recordDate = new Date(r.date);
        return recordDate.getDate() === day;
      });

      monthlyData.push({
        day: day,
        present: dayRecords.filter(r => r.status === 'present').length,
        absent: dayRecords.filter(r => r.status === 'absent').length,
        late: dayRecords.filter(r => r.status === 'late').length,
        leave: dayRecords.filter(r => r.status === 'leave').length,
      });
    }

    setChartData({
      monthly: monthlyData,
      status: statusData,
      trend: records.slice(0, 30).reverse().map((record, index) => ({
        date: new Date(record.date).getDate(),
        hours: record.workingHours || 0,
      })),
    });
  };

  const handleEditAttendance = async () => {
    if (!selectedRecord) return;

    try {
      setProcessing(true);
      
      const updateData = {
        status: formData.status,
        remarks: formData.remarks,
      };

      if (formData.status === 'leave') {
        updateData.leaveType = formData.leaveType;
        updateData.leaveReason = formData.leaveReason;
      }

      if (formData.checkInTime) {
        updateData.checkInTime = formData.checkInTime;
      }

      if (formData.checkOutTime) {
        updateData.checkOutTime = formData.checkOutTime;
      }

      const response = await apiClient.put(
        `${API_ENDPOINTS.SUPER_ADMIN.EMPLOYEE_ATTENDANCE.UPDATE}/${selectedRecord._id}`,
        updateData
      );

      if (response.success) {
        toast.success('Attendance updated successfully');
        setShowEditModal(false);
        fetchData();
        resetForm();
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
      date: '',
      status: 'present',
      leaveType: '',
      leaveReason: '',
      remarks: '',
      checkInTime: '',
      checkOutTime: '',
    });
    setSelectedRecord(null);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      present: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      absent: { color: 'bg-red-100 text-red-800', icon: XCircle },
      late: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      'half-day': { color: 'bg-blue-100 text-blue-800', icon: Clock4 },
      leave: { color: 'bg-purple-100 text-purple-800', icon: Calendar },
      excused: { color: 'bg-gray-100 text-gray-800', icon: AlertCircle },
    };

    const config = statusConfig[status] || statusConfig.present;
    const Icon = config.icon;

    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}
      </Badge>
    );
  };

  const COLORS = ['#10b981', '#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6'];

  if (loading) {
    return <FullPageLoader message="Loading employee details..." />;
  }

  if (!employeeData) {
    return (
      <div className="p-6">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Employee Not Found</h2>
          <Button onClick={() => router.back()}>Go Back</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => router.back()}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Employee Attendance Details
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {employeeData.firstName} {employeeData.lastName} - Comprehensive attendance report
              </p>
            </div>
          </div>
          <Button onClick={() => window.print()}>
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>

        {/* Employee Info Card */}
        <Card className="p-6">
          <div className="flex items-start gap-6">
            <div className="h-20 w-20 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-2xl font-bold text-blue-600 dark:text-blue-300">
              {employeeData.firstName?.charAt(0)}{employeeData.lastName?.charAt(0)}
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold mb-2">
                {employeeData.firstName} {employeeData.lastName}
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Email</p>
                  <p className="font-medium">{employeeData.email}</p>
                </div>
                <div>
                  <p className="text-gray-500">Phone</p>
                  <p className="font-medium">{employeeData.phone || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-gray-500">Role</p>
                  <p className="font-medium capitalize">{employeeData.role?.replace('_', ' ')}</p>
                </div>
                <div>
                  <p className="text-gray-500">Status</p>
                  <Badge className={employeeData.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                    {employeeData.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Filters */}
        <Card className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <Dropdown
              value={selectedMonth.toString()}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              options={monthNames.map((name, index) => ({
                value: (index + 1).toString(),
                label: name,
              }))}
              className="w-40"
            />
            <Dropdown
              value={selectedYear.toString()}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              options={[2024, 2025, 2026].map((year) => ({
                value: year.toString(),
                label: year.toString(),
              }))}
              className="w-32"
            />
          </div>
        </Card>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
              <p className="text-2xl font-bold">{stats.presentCount || 0}</p>
              <p className="text-sm text-gray-600">Present Days</p>
            </Card>
            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <XCircle className="h-8 w-8 text-red-500" />
              </div>
              <p className="text-2xl font-bold">{stats.absentCount || 0}</p>
              <p className="text-sm text-gray-600">Absent Days</p>
            </Card>
            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <Clock className="h-8 w-8 text-yellow-500" />
              </div>
              <p className="text-2xl font-bold">{stats.lateCount || 0}</p>
              <p className="text-sm text-gray-600">Late Days</p>
            </Card>
            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <Calendar className="h-8 w-8 text-purple-500" />
              </div>
              <p className="text-2xl font-bold">{stats.leaveCount || 0}</p>
              <p className="text-sm text-gray-600">Leave Days</p>
            </Card>
            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <TrendingUp className="h-8 w-8 text-blue-500" />
              </div>
              <p className="text-2xl font-bold">{stats.attendanceRate || 0}%</p>
              <p className="text-sm text-gray-600">Attendance Rate</p>
            </Card>
          </div>
        )}

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Status Distribution */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Status Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={chartData.status}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${entry.value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {chartData.status.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Card>

          {/* Working Hours Trend */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Working Hours Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData.trend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" label={{ value: 'Day', position: 'insideBottom', offset: -5 }} />
                <YAxis label={{ value: 'Hours', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="hours" stroke="#3b82f6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          {/* Monthly Attendance */}
          <Card className="p-6 lg:col-span-2">
            <h3 className="text-lg font-semibold mb-4">Daily Attendance Overview</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData.monthly}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" label={{ value: 'Day of Month', position: 'insideBottom', offset: -5 }} />
                <YAxis label={{ value: 'Count', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="present" fill="#10b981" name="Present" />
                <Bar dataKey="late" fill="#f59e0b" name="Late" />
                <Bar dataKey="leave" fill="#8b5cf6" name="Leave" />
                <Bar dataKey="absent" fill="#ef4444" name="Absent" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* Attendance Records Table */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Attendance Records</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3">Date</th>
                  <th className="text-left p-3">Status</th>
                  <th className="text-left p-3">Check In</th>
                  <th className="text-left p-3">Check Out</th>
                  <th className="text-left p-3">Working Hours</th>
                  <th className="text-left p-3">Remarks</th>
                  <th className="text-right p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {attendanceRecords.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center p-8 text-gray-500">
                      No attendance records found for this period
                    </td>
                  </tr>
                ) : (
                  attendanceRecords.map((record) => (
                    <tr key={record._id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="p-3">
                        {new Date(record.date).toLocaleDateString('en-US', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="p-3">{getStatusBadge(record.status)}</td>
                      <td className="p-3">
                        {record.checkIn?.time ? (
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-gray-400" />
                            {new Date(record.checkIn.time).toLocaleTimeString('en-US', {
                              hour: 'numeric',
                              minute: '2-digit',
                              hour12: true,
                            })}
                          </div>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="p-3">
                        {record.checkOut?.time ? (
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-gray-400" />
                            {new Date(record.checkOut.time).toLocaleTimeString('en-US', {
                              hour: 'numeric',
                              minute: '2-digit',
                              hour12: true,
                            })}
                          </div>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="p-3">
                        {record.workingHours ? `${record.workingHours.toFixed(2)} hrs` : '-'}
                      </td>
                      <td className="p-3">
                        {record.remarks || '-'}
                      </td>
                      <td className="p-3 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEditModal(record)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Edit Modal */}
      <Modal
        open={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          resetForm();
        }}
        title="Edit Attendance"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Date</label>
            <input
              type="text"
              value={new Date(formData.date).toLocaleDateString()}
              disabled
              className="w-full px-4 py-2 border rounded-lg bg-gray-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Status *</label>
            <Dropdown
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              options={[
                { value: 'present', label: 'Present' },
                { value: 'absent', label: 'Absent' },
                { value: 'late', label: 'Late' },
                { value: 'half-day', label: 'Half Day' },
                { value: 'leave', label: 'Leave' },
              ]}
            />
          </div>

          {formData.status === 'leave' && (
            <>
              <div>
                <label className="block text-sm font-medium mb-2">Leave Type</label>
                <Dropdown
                  value={formData.leaveType}
                  onChange={(e) => setFormData({ ...formData, leaveType: e.target.value })}
                  options={[
                    { value: 'sick', label: 'Sick Leave' },
                    { value: 'casual', label: 'Casual Leave' },
                    { value: 'annual', label: 'Annual Leave' },
                    { value: 'unpaid', label: 'Unpaid Leave' },
                  ]}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Leave Reason</label>
                <textarea
                  value={formData.leaveReason}
                  onChange={(e) => setFormData({ ...formData, leaveReason: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                  rows="3"
                />
              </div>
            </>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Check-In Time</label>
              <input
                type="time"
                value={formData.checkInTime}
                onChange={(e) => setFormData({ ...formData, checkInTime: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Check-Out Time</label>
              <input
                type="time"
                value={formData.checkOutTime}
                onChange={(e) => setFormData({ ...formData, checkOutTime: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Remarks</label>
            <textarea
              value={formData.remarks}
              onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg"
              rows="3"
              placeholder="Additional notes..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowEditModal(false);
                resetForm();
              }}
              disabled={processing}
            >
              Cancel
            </Button>
            <Button onClick={handleEditAttendance} disabled={processing}>
              {processing ? <ButtonLoader /> : 'Update Attendance'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
