'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar, Clock, MapPin, User, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { API_ENDPOINTS } from '@/constants/api-endpoints';
import { useApi } from '@/hooks/useApi';
import { toast } from 'sonner';

export default function BranchAdminTeacherAttendancePage() {
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedTeacher, setSelectedTeacher] = useState('');
  const [teachers, setTeachers] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    present: 0,
    late: 0,
    earlyCheckout: 0,
    lateEarlyCheckout: 0,
    absent: 0
  });

  const { apiCall } = useApi();

  useEffect(() => {
    fetchTeachers();
    fetchAttendance();
  }, []);

  useEffect(() => {
    fetchAttendance();
  }, [selectedDate, selectedTeacher]);

  const fetchTeachers = async () => {
    try {
      const response = await apiCall(API_ENDPOINTS.BRANCH_ADMIN.TEACHERS.LIST);
      if (response.success) {
        setTeachers(response.data.teachers || []);
      }
    } catch (error) {
      console.error('Error fetching teachers:', error);
    }
  };

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('date', selectedDate);
      if (selectedTeacher) {
        params.append('teacherId', selectedTeacher);
      }

      const response = await apiCall(`${API_ENDPOINTS.BRANCH_ADMIN.TEACHER_ATTENDANCE.LIST}?${params}`);

      if (response.success) {
        const data = response.data.attendance || [];
        setAttendanceData(data);

        // Calculate stats
        const total = data.length;
        const present = data.filter(a => a.status === 'present').length;
        const late = data.filter(a => a.status === 'late').length;
        const earlyCheckout = data.filter(a => a.status === 'early_checkout').length;
        const lateEarlyCheckout = data.filter(a => a.status === 'late_early_checkout').length;
        const absent = data.filter(a => a.status === 'absent').length;

        setStats({ total, present, late, earlyCheckout, lateEarlyCheckout, absent });
      } else {
        setAttendanceData([]);
        setStats({ total: 0, present: 0, late: 0, earlyCheckout: 0, lateEarlyCheckout: 0, absent: 0 });
      }
    } catch (error) {
      console.error('Error fetching attendance:', error);
      toast.error('Failed to fetch teacher attendance');
      setAttendanceData([]);
      setStats({ total: 0, present: 0, late: 0, earlyCheckout: 0, lateEarlyCheckout: 0, absent: 0 });
    } finally {
      setLoading(false);
    }
  };

  const getCheckOutStatusBadge = (checkOutTime) => {
    if (!checkOutTime) return <Badge className="bg-gray-100 text-gray-800">Not Checked Out</Badge>;

    const workEndTime = '17:00'; // 5:00 PM
    const [endHour, endMin] = workEndTime.split(':').map(Number);
    const checkOutDate = new Date(checkOutTime);
    const endThreshold = new Date(checkOutTime);
    endThreshold.setHours(endHour, endMin, 0, 0);

    if (checkOutDate < endThreshold) {
      return <Badge className="bg-orange-100 text-orange-800">Early Checkout</Badge>;
    } else if (checkOutDate > endThreshold) {
      return <Badge className="bg-blue-100 text-blue-800">Late Checkout</Badge>;
    } else {
      return <Badge className="bg-green-100 text-green-800">On Time Checkout</Badge>;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'present':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'late':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'early_checkout':
        return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      case 'absent':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return null;
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleTimeString('en-PK', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (checkIn, checkOut) => {
    if (!checkIn || !checkOut) return '—';

    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diffMs = end - start;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    return `${diffHours}h ${diffMinutes}m`;
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Teacher Attendance</h1>
        <p className="text-muted-foreground">Monitor and manage teacher attendance records</p>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="teacher">Teacher (Optional)</Label>
              <select
                id="teacher"
                value={selectedTeacher}
                onChange={(e) => setSelectedTeacher(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Teachers</option>
                {teachers.map(teacher => (
                  <option key={teacher._id} value={teacher._id}>
                    {teacher.firstName} {teacher.lastName}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <Button onClick={fetchAttendance} disabled={loading}>
                {loading ? 'Loading...' : 'Refresh'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <User className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Present</p>
                <p className="text-2xl font-bold text-green-600">{stats.present}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Late</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.late}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Early Checkout</p>
                <p className="text-2xl font-bold text-orange-600">{stats.earlyCheckout}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <XCircle className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Absent</p>
                <p className="text-2xl font-bold text-red-600">{stats.absent}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Attendance Table */}
      <Card>
        <CardHeader>
          <CardTitle>Attendance Records</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading attendance records...</div>
          ) : attendanceData.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No attendance records found for the selected date
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Teacher</TableHead>
                  <TableHead>Check-in Time</TableHead>
                  <TableHead>Check-out Time</TableHead>
                  <TableHead>Check-out Status</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Distance (m)</TableHead>
                  <TableHead>Location</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attendanceData.map((record) => (
                  <TableRow key={record._id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {record.teacherId?.firstName} {record.teacherId?.lastName}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {record.teacherId?.email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>{formatTime(record.checkInTime)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>{formatTime(record.checkOutTime)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getCheckOutStatusBadge(record.checkOutTime)}
                    </TableCell>
                    <TableCell>
                      {formatDuration(record.checkInTime, record.checkOutTime)}
                    </TableCell>
                    <TableCell>
                      {record.distance ? `${Math.round(record.distance)}m` : '—'}
                    </TableCell>
                    <TableCell>
                      {record.latitude && record.longitude ? (
                        <div className="flex items-center space-x-1">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {record.latitude.toFixed(4)}, {record.longitude.toFixed(4)}
                          </span>
                        </div>
                      ) : (
                        '—'
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}