'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Dropdown from '@/components/ui/dropdown';
import Tabs, { TabPanel } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import LiveJsQRScanner from '@/components/LiveJsQRScanner';
import Modal from '@/components/ui/modal';
import apiClient from '@/lib/api-client';
import API_ENDPOINTS from '@/constants/api-endpoints';
import { toast } from 'sonner';
import { Camera, Search, Save, CheckCircle, XCircle, Clock, UserSearch, Eye, DollarSign, Calendar } from 'lucide-react';
import FullPageLoader from '@/components/ui/full-page-loader';
import ButtonLoader from '@/components/ui/button-loader';

const STATUS_OPTIONS = [
  { value: 'present', label: 'Present' },
  { value: 'absent', label: 'Absent' },
  { value: 'late', label: 'Late' },
  { value: 'half_day', label: 'Half Day' },
  { value: 'excused', label: 'Excused' },
  { value: 'leave', label: 'Leave' }
];

export default function SuperAdminAttendancePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [activeTab, setActiveTab] = useState('manual');

  // History states
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyFilters, setHistoryFilters] = useState({
    fromDate: '',
    toDate: '',
    branchId: '',
    classId: '',
    attendanceType: ''
  });
  const [editingRecord, setEditingRecord] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editStatus, setEditStatus] = useState('');
  const [editRemarks, setEditRemarks] = useState('');
  const [updating, setUpdating] = useState(false);

  // Data states
  const [branches, setBranches] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);

  // Form states
  const [selectedBranch, setSelectedBranch] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [attendanceType, setAttendanceType] = useState('daily');
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState('');
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchQuery, setSearchQuery] = useState('');

  // Attendance states
  const [attendanceRecords, setAttendanceRecords] = useState({});
  const [scannedStudents, setScannedStudents] = useState([]);
  const [markedStudents, setMarkedStudents] = useState([]);

  // Student search states
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  // Fetch branches and today's attendance on mount
  useEffect(() => {
    fetchBranches();
    fetchTodayAttendance();
  }, []);

  // Fetch classes when branch changes
  useEffect(() => {
    if (selectedBranch) {
      fetchClasses();
      // Reset dependent selects
      setSelectedClass('');
      setSelectedSection('');
      setSelectedSubject('');
      setStudents([]);
      setFilteredStudents([]);
    }
  }, [selectedBranch]);

  // Fetch students when class/section changes
  useEffect(() => {
    if (selectedBranch && selectedClass && selectedSection) {
      fetchStudents();
      fetchSubjects();
      if (attendanceType === 'event') fetchEvents();
    } else {
      setStudents([]);
      setFilteredStudents([]);
      setSubjects([]);
    }
  }, [selectedClass, selectedSection]);

  useEffect(() => {
    if (attendanceType === 'event' && selectedBranch) {
      fetchEvents();
    }
  }, [attendanceType, selectedBranch]);

  // Clear selectedEvent when attendanceType is not event
  useEffect(() => {
    if (attendanceType !== 'event') setSelectedEvent('');
  }, [attendanceType]);

  // Re-fetch existing attendance when attendanceType/subject/event/date change
  useEffect(() => {
    if (students.length > 0) {
      fetchExistingAttendance(students);
    }
  }, [attendanceType, selectedSubject, selectedEvent, attendanceDate]);

  // Filter students when search changes
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredStudents(students);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredStudents(
        students.filter(student =>
          student.firstName.toLowerCase().includes(query) ||
          student.lastName.toLowerCase().includes(query) ||
          student.registrationNumber.toLowerCase().includes(query) ||
          student.rollNumber?.toLowerCase().includes(query)
        )
      );
    }
  }, [searchQuery, students]);

  // Debounced student search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (studentSearchQuery) {
        searchStudents(studentSearchQuery);
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [studentSearchQuery]);

  const fetchTodayAttendance = async () => {
    try {
      const todayDate = new Date().toISOString().split('T')[0];
      console.log('Fetching attendance for date:', todayDate);
      const response = await apiClient.get(API_ENDPOINTS.SUPER_ADMIN.ATTENDANCE.LIST, {
        date: todayDate,
        limit: 1000
      });

      console.log('Raw API response:', response);
      console.log('Response success:', response.success);
      console.log('Response data:', response.data);

      if (response.success && response.data) {
        console.log('Today attendance API response:', response.data);
        const attendanceRecords = response.data.attendance || [];
        console.log('Attendance records found:', attendanceRecords.length);
        const markedStudentsList = [];

        // Extract unique students from today's attendance
        attendanceRecords.forEach(record => {
          console.log('Processing attendance record:', record);
          if (record.records && Array.isArray(record.records)) {
            record.records.forEach(studentRecord => {
              console.log('Processing student record:', studentRecord);
              if (studentRecord.studentId && typeof studentRecord.studentId === 'object' && studentRecord.studentId._id) {
                const student = studentRecord.studentId;
                console.log('Found student:', student.fullName);
                // Check if student already in list
                if (!markedStudentsList.find(s => s._id === student._id)) {
                  markedStudentsList.push({
                    ...student,
                    registrationNumber: student.studentProfile?.registrationNumber || student.registrationNumber,
                    rollNumber: student.studentProfile?.rollNumber || student.rollNumber,
                    section: student.studentProfile?.section || student.section,
                    feeStatus: student.hasPaidFees ? 'paid' : 'unpaid',
                    hasPaidFees: student.hasPaidFees || false
                  });
                }
              }
            });
          }
        });

        console.log('Final marked students list:', markedStudentsList);
        setMarkedStudents(markedStudentsList);
      }
    } catch (error) {
      console.error('Failed to fetch today attendance:', error);
      // Don't show error toast, just log it
    }
  };

  const fetchBranches = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(API_ENDPOINTS.SUPER_ADMIN.BRANCHES.LIST);
      setBranches(response.data.branches || []);
    } catch (error) {
      toast.error('Failed to fetch branches');
    } finally {
      setLoading(false);
    }
  };

  const fetchClasses = async () => {
    try {
      setLoading(true);
      const params = {};
      if (selectedBranch) params.branchId = selectedBranch;
      params.limit = 200;
      const response = await apiClient.get(API_ENDPOINTS.SUPER_ADMIN.CLASSES.LIST, { params });
      setClasses(response.data.classes || response.data || []);
    } catch (error) {
      toast.error('Failed to fetch classes');
    } finally {
      setLoading(false);
    }
  };

  const fetchSubjects = async () => {
    if (!selectedClass) return;
    try {
      const response = await apiClient.get(API_ENDPOINTS.SUBJECT.LIST);
      const classSubjects = response.data.subjects.filter(s => s.classId === selectedClass);
      setSubjects(classSubjects || []);
    } catch (error) {
      toast.error('Failed to fetch subjects');
    }
  };

  const fetchEvents = async () => {
    try {
      const res = await apiClient.get(API_ENDPOINTS.SUPER_ADMIN.EVENTS.LIST, { params: { branchId: selectedBranch } });
      setEvents(res.data.events || res.data || []);
    } catch (err) {
      console.error('Failed to fetch events', err);
      toast.error('Failed to fetch events');
    }
  };

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(API_ENDPOINTS.SUPER_ADMIN.STUDENTS.LIST);

      const filtered = response.data.students.filter((student) => {
        const studentBranchId = student.branchId || student.branchId?._id;
        const studentClassId = student.classId || student.studentProfile?.classId || student.studentProfile?.classId?._id;
        return (
          (studentBranchId === selectedBranch || studentBranchId === selectedBranch?._id) &&
          (studentClassId === selectedClass || studentClassId?._id === selectedClass) &&
          (student.section === selectedSection)
        );
      });

      setStudents(filtered);
      setFilteredStudents(filtered);

      // Initialize attendance records
      await fetchExistingAttendance(filtered);
    } catch (error) {
      toast.error('Failed to fetch students');
    } finally {
      setLoading(false);
    }
  };

  const fetchExistingAttendance = async (studentList) => {
    try {
      const params = {
        branchId: selectedBranch,
        classId: selectedClass,
        date: attendanceDate,
      };

      if (attendanceType === 'subject') params.subjectId = selectedSubject || undefined;
      if (attendanceType === 'event') params.eventId = selectedEvent || undefined;
      params.attendanceType = attendanceType || (selectedSubject ? 'subject' : 'daily');

      const response = await apiClient.get(API_ENDPOINTS.SUPER_ADMIN.ATTENDANCE.LIST, params);

      if (response.data.attendance) {
        const records = {};
        response.data.attendance.records?.forEach(record => {
          records[record.studentId] = record.status;
        });
        setAttendanceRecords(records);
      } else {
        // Initialize all students as present by default
        const records = {};
        studentList.forEach(student => {
          records[student._id] = 'present';
        });
        setAttendanceRecords(records);
      }
    } catch (error) {
      // If no attendance exists, initialize all as present
      const records = {};
      studentList.forEach(student => {
        records[student._id] = 'present';
      });
      setAttendanceRecords(records);
    }
  };

  const handleStatusChange = (studentId, status) => {
    setAttendanceRecords(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  const handleQRScan = async (qrData) => {
    // Always send the QR payload to backend scan endpoint; backend will handle matching
    try {
      const res = await apiClient.post(API_ENDPOINTS.SUPER_ADMIN.ATTENDANCE.SCAN, {
        qr: qrData,
        date: attendanceDate,
        subjectId: attendanceType === 'subject' ? selectedSubject : null,
        eventId: attendanceType === 'event' ? selectedEvent : null,
        attendanceType: attendanceType || 'daily'
      });

      if (res?.data?.success) {
        toast.success(res.data.message || 'Attendance recorded');
        const student = res.data.data?.student;
        if (student && student._id) {
          // update local UI if student is currently loaded
          if (students.find(s => s._id === student._id) && student.branchId === selectedBranch && (student.studentProfile?.classId === selectedClass || student.studentProfile?.classId?._id === selectedClass)) {
            setAttendanceRecords(prev => ({ ...prev, [student._id]: 'present' }));
            if (!scannedStudents.find(s => s._id === student._id)) {
              setScannedStudents(prev => [...prev, students.find(s => s._id === student._id)]);
            }
          }
          // Add to marked students table with proper structure
          if (!markedStudents.find(s => s._id === student._id)) {
            setMarkedStudents(prev => [...prev, {
              ...student,
              registrationNumber: student.studentProfile?.registrationNumber || student.registrationNumber,
              rollNumber: student.studentProfile?.rollNumber || student.rollNumber,
              section: student.studentProfile?.section || student.section,
              feeStatus: student.hasPaidFees ? 'paid' : 'unpaid'
            }]);
          }
        }
      } else {
        toast.error(res?.data?.message || 'Scan failed');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to record scan');
    }
  };

  const searchStudents = async (query) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      setSearching(true);
      const response = await apiClient.get(API_ENDPOINTS.SUPER_ADMIN.STUDENTS.SEARCH, {
        q: query,
        branchId: selectedBranch || undefined
      });

      if (response.success && response.data) {
        setSearchResults(Array.isArray(response.data) ? response.data : []);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Error searching students:', error);
      setSearchResults([]);
      toast.error('Failed to search students');
    } finally {
      setSearching(false);
    }
  };

  const markStudentAttendance = async (student, status = 'present') => {
    try {
      // Create attendance record for this student
      const payload = {
        branchId: selectedBranch || student.branchId, // Use selected branch or student's branch
        classId: student.classId?._id || student.classId, // Use student's classId from search results
        section: student.section, // Use student's section from search results
        subjectId: attendanceType === 'subject' ? selectedSubject : null,
        eventId: attendanceType === 'event' ? selectedEvent : null,
        date: attendanceDate,
        attendanceType: attendanceType || 'daily',
        records: [{
          studentId: student._id,
          status: status
        }]
      };

      await apiClient.post(API_ENDPOINTS.SUPER_ADMIN.ATTENDANCE.CREATE, payload);

      // Update local state
      setAttendanceRecords(prev => ({
        ...prev,
        [student._id]: status
      }));

      // Add to marked students if not already there with proper structure
      if (!markedStudents.find(s => s._id === student._id)) {
        setMarkedStudents(prev => [...prev, {
          ...student,
          registrationNumber: student.studentProfile?.registrationNumber || student.registrationNumber,
          rollNumber: student.studentProfile?.rollNumber || student.rollNumber,
          section: student.studentProfile?.section || student.section,
          feeStatus: student.hasPaidFees ? 'paid' : 'unpaid'
        }]);
      }

      toast.success(`Marked ${student.fullName} as ${status}`);
      setStudentSearchQuery('');
      setSearchResults([]);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to mark attendance');
    }
  };

  const viewStudentAttendance = (studentId) => {
    router.push(`/super-admin/students/${studentId}/attendance?return=/super-admin/attendance`);
  };

  const handleSubmit = async () => {
    if (!selectedBranch || !selectedClass || !selectedSection) {
      toast.error('Please select branch, class and section');
      return;
    }

    try {
      setSaving(true);

      const records = Object.entries(attendanceRecords).map(([studentId, status]) => ({
        studentId,
        status
      }));

      const payload = {
        branchId: selectedBranch,
        classId: selectedClass,
        section: selectedSection,
        subjectId: selectedSubject || null,
        date: attendanceDate,
        attendanceType: attendanceType || (selectedSubject ? 'subject' : 'daily'),
        eventId: attendanceType === 'event' ? selectedEvent : null,
        records
      };

      await apiClient.post(API_ENDPOINTS.SUPER_ADMIN.ATTENDANCE.CREATE, payload);
      toast.success('Attendance saved successfully!');

    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save attendance');
    } finally {
      setSaving(false);
    }
  };

  const getSelectedClass = () => classes.find(c => c._id === selectedClass);
  const sections = getSelectedClass()?.sections || [];

  const getStatusIcon = (status) => {
    switch (status) {
      case 'present':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'absent':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'late':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return null;
    }
  };

  // History functions
  const fetchAttendanceHistory = async () => {
    try {
      setHistoryLoading(true);
      const params = {};

      if (historyFilters.fromDate) params.fromDate = historyFilters.fromDate;
      if (historyFilters.toDate) params.toDate = historyFilters.toDate;
      if (historyFilters.branchId) params.branchId = historyFilters.branchId;
      if (historyFilters.classId) params.classId = historyFilters.classId;
      if (historyFilters.attendanceType) params.attendanceType = historyFilters.attendanceType;

      const response = await apiClient.get(API_ENDPOINTS.SUPER_ADMIN.ATTENDANCE.LIST, { params });

      if (response.success && response.data) {
        setAttendanceHistory(response.data.attendance || []);
      }
    } catch (error) {
      toast.error('Failed to fetch attendance history');
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleEditStatus = (record) => {
    setEditingRecord(record);
    setEditStatus(record.status);
    setEditRemarks(record.remarks || '');
    setEditModalOpen(true);
  };

  const getStatusBadge = (status) => {
    const variants = {
      present: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      absent: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      late: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      half_day: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      excused: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      leave: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
    };

    return (
      <Badge className={variants[status]}>
        {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
      </Badge>
    );
  };

  if (loading && !branches.length) return <FullPageLoader />;

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Mark Attendance</h1>
          <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">
            Mark attendance for students across all branches
          </p>
        </div>
        <Button
          onClick={() => setShowScanner(true)}
          className="mt-2 sm:mt-0 w-full sm:w-auto"
        >
          <Camera className="h-4 w-4 mr-2" />
          Scan QR
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Attendance Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="space-y-2">
              <Label>Branch *</Label>
              <Dropdown
                name="branch"
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                options={branches.map((b) => ({ value: b._id, label: b.name }))}
                placeholder="Select branch"
              />
            </div>

            <div className="space-y-2">
              <Label>Date</Label>
              <Input
                type="date"
                value={attendanceDate}
                onChange={(e) => setAttendanceDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div className="space-y-2">
              <Label>Class *</Label>
              <Dropdown
                name="class"
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                options={classes.map((c) => ({ value: c._id, label: c.name }))}
                disabled={!selectedBranch}
                placeholder="Select class"
              />
            </div>

            <div className="space-y-2">
              <Label>Section *</Label>
              <Dropdown
                name="section"
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)}
                options={sections.map((s) => ({ value: s.name, label: s.name }))}
                disabled={!selectedClass}
                placeholder="Select section"
              />
            </div>

            <div className="space-y-2">
              <Label>Subject (Optional)</Label>
              <Dropdown
                name="subject"
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                options={[{ value: '', label: 'All subjects' }, ...subjects.map((s) => ({ value: s._id, label: s.name }))]}
                disabled={!selectedClass}
                placeholder="All subjects"
              />
            </div>

            <div className="space-y-2">
              <Label>Attendance Type</Label>
              <Dropdown
                name="attendanceType"
                value={attendanceType}
                onChange={(e) => setAttendanceType(e.target.value)}
                options={[
                  { value: 'daily', label: 'Daily' },
                  { value: 'subject', label: 'Subject' },
                  { value: 'event', label: 'Event' },
                ]}
                placeholder="Select type"
              />
            </div>

            {attendanceType === 'event' && (
              <div className="space-y-2">
                <Label>Event *</Label>
                <Dropdown
                  name="event"
                  value={selectedEvent}
                  onChange={(e) => setSelectedEvent(e.target.value)}
                  options={events.map(ev => ({ value: ev._id || ev.id, label: `${ev.title} — ${new Date(ev.startDate).toLocaleDateString()}` }))}
                  placeholder={events.length ? 'Select event' : 'No events found'}
                  disabled={events.length === 0}
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Student Search for Manual Marking */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserSearch className="w-5 h-5" />
            Quick Student Search & Mark Attendance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by name, registration #, roll #, email, or phone..."
                value={studentSearchQuery}
                onChange={(e) => setStudentSearchQuery(e.target.value)}
                className="pl-10"
              />
              {searching && (
                <div className="absolute right-3 top-3">
                  <ButtonLoader />
                </div>
              )}
            </div>

            {searchResults.length > 0 && (
              <div className="border rounded-lg max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Registration #</TableHead>
                      <TableHead>Roll #</TableHead>
                      <TableHead>Section</TableHead>
                      <TableHead>Branch</TableHead>
                      <TableHead>Fee Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {searchResults.map((student) => (
                      <TableRow key={student._id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{student.fullName}</div>
                            <div className="text-xs text-gray-500">{student.email}</div>
                          </div>
                        </TableCell>
                        <TableCell>{student.registrationNumber || '—'}</TableCell>
                        <TableCell>{student.rollNumber || '—'}</TableCell>
                        <TableCell>{student.section || '—'}</TableCell>
                        <TableCell>{student.branchId?.name || '—'}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <DollarSign className="w-4 h-4" />
                            <Badge className={student.hasPaidFees ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                              {student.feeStatus || 'unpaid'}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => markStudentAttendance(student, 'present')}
                              disabled={saving}
                            >
                              {saving ? <ButtonLoader /> : <CheckCircle className="w-4 h-4 mr-1" />}
                              Present
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => viewStudentAttendance(student._id)}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              View History
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {searching && searchResults.length === 0 && (
              <div className="text-center py-8">
                <ButtonLoader />
                <p className="text-sm text-gray-500 mt-2">Searching students...</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Marked Students Today */}
      {markedStudents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Marked Students Today ({markedStudents.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Registration #</TableHead>
                  <TableHead>Roll #</TableHead>
                  <TableHead>Section</TableHead>
                  <TableHead>Fee Status</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {markedStudents.map((student) => (
                  <TableRow key={student._id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{student.fullName}</div>
                        <div className="text-xs text-gray-500">{student.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>{student.registrationNumber || '—'}</TableCell>
                    <TableCell>{student.rollNumber || '—'}</TableCell>
                    <TableCell>{student.section || '—'}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-4 h-4" />
                        <Badge className={student.hasPaidFees ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                          {student.feeStatus || 'unpaid'}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <Badge className="bg-green-100 text-green-800">Present</Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => viewStudentAttendance(student._id)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View History
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {selectedBranch && selectedClass && selectedSection && (
        <>
          <Tabs
            tabs={[
              { id: 'manual', label: 'Manual Attendance' },
              { id: 'qr', label: 'QR Code Scan' },
              { id: 'history', label: 'Attendance History' }
            ]}
            activeTab={activeTab}
            onChange={setActiveTab}
            className="w-full"
          />

          <TabPanel value="manual" activeTab={activeTab}>
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Students List</CardTitle>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                      <Input
                        placeholder="Search students..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-8 w-64"
                      />
                    </div>
                    <Button onClick={handleSubmit} disabled={saving}>
                      {saving ? <ButtonLoader /> : <Save className="h-4 w-4 mr-2" />}
                      Save Attendance
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">Loading students...</div>
                ) : filteredStudents.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No students found
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Roll No.</TableHead>
                        <TableHead>Reg. No.</TableHead>
                        <TableHead>Student Name</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredStudents.map(student => (
                        <TableRow key={student._id}>
                          <TableCell>{student.rollNumber || 'N/A'}</TableCell>
                          <TableCell>{student.registrationNumber}</TableCell>
                          <TableCell className="font-medium">
                            {student.firstName} {student.lastName}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                variant={attendanceRecords[student._id] === 'present' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => handleStatusChange(student._id, 'present')}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Present
                              </Button>
                              <Button
                                variant={attendanceRecords[student._id] === 'absent' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => handleStatusChange(student._id, 'absent')}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Absent
                              </Button>
                              <Button
                                variant={attendanceRecords[student._id] === 'late' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => handleStatusChange(student._id, 'late')}
                              >
                                <Clock className="h-4 w-4 mr-1" />
                                Late
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabPanel>

          <TabPanel value="qr" activeTab={activeTab}>
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>QR Code Scanner</CardTitle>
                  <div className="flex items-center gap-2">
                    <Button onClick={() => setShowScanner(true)}>
                      <Camera className="h-4 w-4 mr-2" />
                      Open Scanner
                    </Button>
                    <Button onClick={handleSubmit} disabled={saving}>
                      {saving ? <ButtonLoader /> : <Save className="h-4 w-4 mr-2" />}
                      Save Attendance
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      Click "Open Scanner" to scan multiple student QR codes. The camera will stay open until you close it.
                      Scanned students will be automatically marked as present.
                    </p>
                  </div>

                  {scannedStudents.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-2">
                        Scanned Students ({scannedStudents.length})
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                        {scannedStudents.map(student => (
                          <div
                            key={student._id}
                            className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg"
                          >
                            <div>
                              <p className="font-medium">
                                {student.firstName} {student.lastName}
                              </p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {student.registrationNumber}
                              </p>
                            </div>
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Roll No.</TableHead>
                          <TableHead>Reg. No.</TableHead>
                          <TableHead>Student Name</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredStudents.map(student => (
                          <TableRow key={student._id}>
                            <TableCell>{student.rollNumber || 'N/A'}</TableCell>
                            <TableCell>{student.registrationNumber}</TableCell>
                            <TableCell className="font-medium">
                              {student.firstName} {student.lastName}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {getStatusIcon(attendanceRecords[student._id])}
                                {getStatusBadge(attendanceRecords[student._id])}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabPanel>

          <TabPanel value="history" activeTab={activeTab}>
            <Card>
              <CardHeader>
                <CardTitle>Attendance History</CardTitle>
                <div className="flex gap-4 mt-4">
                  <div className="space-y-2">
                    <Label>From Date</Label>
                    <Input
                      type="date"
                      value={historyFilters.fromDate}
                      onChange={(e) => setHistoryFilters(prev => ({ ...prev, fromDate: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>To Date</Label>
                    <Input
                      type="date"
                      value={historyFilters.toDate}
                      onChange={(e) => setHistoryFilters(prev => ({ ...prev, toDate: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Branch</Label>
                    <Dropdown
                      value={historyFilters.branchId}
                      onChange={(e) => setHistoryFilters(prev => ({ ...prev, branchId: e.target.value }))}
                      options={[{ value: '', label: 'All branches' }, ...branches.map((b) => ({ value: b._id, label: b.name }))]}
                      placeholder="All branches"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Class</Label>
                    <Dropdown
                      value={historyFilters.classId}
                      onChange={(e) => setHistoryFilters(prev => ({ ...prev, classId: e.target.value }))}
                      options={[{ value: '', label: 'All classes' }, ...classes.map((c) => ({ value: c._id, label: c.name }))]}
                      placeholder="All classes"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Dropdown
                      value={historyFilters.attendanceType}
                      onChange={(e) => setHistoryFilters(prev => ({ ...prev, attendanceType: e.target.value }))}
                      options={[
                        { value: '', label: 'All types' },
                        { value: 'daily', label: 'Daily' },
                        { value: 'subject', label: 'Subject' },
                        { value: 'event', label: 'Event' }
                      ]}
                      placeholder="All types"
                    />
                  </div>
                  <div className="flex items-end">
                    <Button onClick={fetchAttendanceHistory} disabled={historyLoading}>
                      {historyLoading ? <ButtonLoader /> : <Search className="h-4 w-4 mr-2" />}
                      Search
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {historyLoading ? (
                  <div className="text-center py-8">Loading attendance history...</div>
                ) : attendanceHistory.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No attendance records found. Use the filters above to search.
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Branch</TableHead>
                        <TableHead>Class</TableHead>
                        <TableHead>Subject/Event</TableHead>
                        <TableHead>Student</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Marked By</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {attendanceHistory.flatMap(attendance =>
                        attendance.records.map(record => (
                          <TableRow key={`${attendance._id}-${record._id}`}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-gray-500" />
                                {new Date(attendance.date).toLocaleDateString('en-PK', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric'
                                })}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="capitalize">
                                {attendance.attendanceType}
                              </Badge>
                            </TableCell>
                            <TableCell>{attendance.branchId?.name || '—'}</TableCell>
                            <TableCell>{attendance.classId?.name || '—'}</TableCell>
                            <TableCell>
                              {attendance.attendanceType === 'subject' && attendance.subjectId?.name}
                              {attendance.attendanceType === 'event' && attendance.eventId?.title}
                              {attendance.attendanceType === 'daily' && '—'}
                            </TableCell>
                            <TableCell>
                              <div>
                                <div className="font-medium">{record.studentId?.fullName || '—'}</div>
                                <div className="text-xs text-gray-500">{record.studentId?.registrationNumber}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {getStatusIcon(record.status)}
                                {getStatusBadge(record.status)}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                <div>{attendance.markedBy?.fullName || '—'}</div>
                                <div className="text-xs text-gray-500">
                                  {attendance.markedBy?.email}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditStatus(record)}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabPanel>
        </>
      )}

      {/* Edit Attendance Modal */}
      <Modal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Edit Attendance Record"
      >
        <div className="space-y-4">
          {editingRecord ? (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Student</Label>
                  <div className="p-2 bg-gray-50 rounded border">
                    <div className="font-medium">{editingRecord.studentId?.fullName}</div>
                    <div className="text-sm text-gray-500">{editingRecord.studentId?.registrationNumber}</div>
                  </div>
                </div>
                <div>
                  <Label>Date</Label>
                  <div className="p-2 bg-gray-50 rounded border">
                    {new Date(editingRecord.attendanceId?.date).toLocaleDateString('en-PK', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </div>
                </div>
              </div>

              <div>
                <Label>Status</Label>
                <Dropdown
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  options={STATUS_OPTIONS}
                  placeholder="Select status"
                />
              </div>

              <div>
                <Label>Remarks</Label>
                <textarea
                  value={editRemarks}
                  onChange={(e) => setEditRemarks(e.target.value)}
                  placeholder="Add remarks (optional)"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setEditModalOpen(false)}
                  disabled={updating}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveStatus}
                  disabled={updating}
                >
                  {updating ? <ButtonLoader /> : <Save className="w-4 h-4 mr-2" />}
                  Save Changes
                </Button>
              </div>
            </>
          ) : (
            <div className="text-center py-4">Loading...</div>
          )}
        </div>
      </Modal>

      {showScanner && (
        <Modal open={true} onClose={() => setShowScanner(false)} title="Scan QR Code" size="xl">
          <div className="p-4">
            <LiveJsQRScanner
              onDetected={(data) => handleQRScan(data)}
              continuous={true}
              autoStart={true}
              className="w-full"
            />
          </div>
        </Modal>
      )}
    </div>
  );
}
