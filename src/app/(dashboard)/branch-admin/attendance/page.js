//src/app/(dashboard)/branch-admin/attendance/page.js
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
import Modal from '@/components/ui/modal';
import LiveJsQRScanner from '@/components/LiveJsQRScanner';
import apiClient from '@/lib/api-client';
import API_ENDPOINTS from '@/constants/api-endpoints';
import { toast } from 'sonner';
import { Camera, Search, Save, CheckCircle, XCircle, Clock, UserSearch, Eye, DollarSign, Calendar, X } from 'lucide-react';
import ButtonLoader from '@/components/ui/button-loader';
import { Checkbox } from '@/components/ui/checkbox';

const STATUS_OPTIONS = [
  { value: 'present', label: 'Present' },
  { value: 'absent', label: 'Absent' },
  { value: 'late', label: 'Late' },
  { value: 'half_day', label: 'Half Day' },
  { value: 'excused', label: 'Excused' },
  { value: 'leave', label: 'Leave' }
];

export default function BranchAdminAttendancePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('manual');
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [isHolidayModalOpen, setIsHolidayModalOpen] = useState(false);
  const [holidayForm, setHolidayForm] = useState({
    date: new Date().toISOString().split('T')[0],
    reason: '',
    remarks: '',
    branch_id: ''
  });

  
  // Data states
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [students, setStudents] = useState([]);
  const [allSections, setAllSections] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);

  
  // Form states
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
  
  // History states
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyFilters, setHistoryFilters] = useState({
    fromDate: '',
    toDate: '',
    classId: '',
    attendanceType: ''
  });
  const [editingRecord, setEditingRecord] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editStatus, setEditStatus] = useState('');
  const [editRemarks, setEditRemarks] = useState('');
  const [updating, setUpdating] = useState(false);

  // Manual Bulk Attendance States
  const [manualAttendanceModalOpen, setManualAttendanceModalOpen] = useState(false);
  const [manualAttendanceDate, setManualAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [manualAttendanceStatus, setManualAttendanceStatus] = useState('PRESENT');
  const [manualAttendanceStudents, setManualAttendanceStudents] = useState([]);
  const [manualSelectedStudents, setManualSelectedStudents] = useState([]);
  const [manualFetchingStudents, setManualFetchingStudents] = useState(false);
  const [manualMarkingAttendance, setManualMarkingAttendance] = useState(false);


  // Fetch classes and today's attendance on mount
  useEffect(() => {
    if (user) {
      fetchClasses();

      fetchTodayAttendance();
      fetchAllSections();

    }
  }, [user]);

  // Fetch students when class/section changes
  useEffect(() => {
    if (selectedClass && selectedSection) {
      fetchStudents();
    } else {
      setStudents([]);
      setFilteredStudents([]);
    }
  }, [selectedClass, selectedSection]);


  // Filter students when search changes
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredStudents(students);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredStudents(
        students.filter(student => {
          const fName = (student.first_name || student.firstName || '').toLowerCase();
          const lName = (student.last_name || student.lastName || '').toLowerCase();
          const regNo = (student.registration_no || student.registrationNumber || '').toLowerCase();
          const email = (student.email || '').toLowerCase();
          const phone = (student.phone || '').toLowerCase();
          const rollNo = (student.roll_no || student.rollNumber || student.details?.academic_info?.roll_no || '').toLowerCase();

          return fName.includes(query) ||
                 lName.includes(query) ||
                 regNo.includes(query) ||
                 email.includes(query) ||
                 phone.includes(query) ||
                 rollNo.includes(query);
        })
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

  // When attendanceType is 'event', load branch events
  useEffect(() => {
    if (attendanceType === 'event') {
      fetchEvents();
    }
  }, [attendanceType]);

  const fetchClasses = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(API_ENDPOINTS.BRANCH_ADMIN.CLASSES.LIST);
      const classesData = Array.isArray(response) ? response : (response.data?.classes || response.data || []);
      
      if (user?.branch_id && classesData.some(c => c.branch_id || c.branchId)) {
        const branchClasses = classesData.filter(c => c.branch_id === user.branch_id || c.branchId === user.branch_id);
        setClasses(branchClasses.length > 0 ? branchClasses : classesData);
      } else {
        setClasses(classesData);
      }
    } catch (error) {
      toast.error('Failed to fetch classes');
    } finally {
      setLoading(false);
    }
  };




  const handleHolidaySubmit = async (e) => {

    e.preventDefault();
    setSaving(true);
    try {
      // Force user's own branch_id for security
      const payload = {
        ...holidayForm,
        branch_id: user.branch_id
      };
      
      const response = await apiClient.post('/api/attendance/holiday', payload);
      if (response.success) {
        toast.success(response.message || 'Holiday marked for students successfully');
        setIsHolidayModalOpen(false);
        setHolidayForm({
          date: new Date().toISOString().split('T')[0],
          reason: '',
          remarks: '',
          branch_id: ''
        });
        
        if (typeof fetchStudents === 'function') {
          fetchStudents();
        } else {
          router.refresh();
        }
      }
    } catch (error) {
      toast.error(error.message || 'Failed to mark holiday');
    } finally {
      setSaving(false);
    }
  };

  const fetchAllSections = async () => {
    try {
      const response = await apiClient.get('/api/sections');
      const secData = Array.isArray(response) ? response : (response.data?.sections || response.data || []);
      setAllSections(secData);
    } catch (error) {
      console.error('Failed to fetch all sections:', error);
    }
  };



  const fetchSubjects = async () => {
    if (!selectedClass) return;
    try {
      const response = await apiClient.get(API_ENDPOINTS.SUBJECT.LIST);
      const classSubjects = response.data.subjects?.filter(s => s.classId === selectedClass) || [];
      setSubjects(classSubjects);
    } catch (error) {
      toast.error('Failed to fetch subjects');
    }
  };

  const fetchEvents = async () => {
    try {
      const res = await apiClient.get(API_ENDPOINTS.BRANCH_ADMIN.EVENTS.LIST);
      setEvents(res.data.events || res.data || []);
    } catch (err) {
      console.error('Failed to fetch events', err);
      toast.error('Failed to fetch events');
    }
  };

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(API_ENDPOINTS.BRANCH_ADMIN.STUDENTS.LIST);
      const studentArray = Array.isArray(response) ? response : (response.data?.students || response.data || response.students || []);

      const finalBranchId = user.branch_id || user.branchId;

      const filtered = studentArray.filter((student) => {
        const studentBranchId = student.branch_id || student.branchId;
        const studentClassId = student.details?.academic_info?.class_id || student.classId;
        const studentSectionId = student.details?.academic_info?.section_id || student.section;
        
        return (
          (studentBranchId === finalBranchId) &&
          (studentClassId === selectedClass) &&
          (studentSectionId === selectedSection || !selectedSection)
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
      const response = await apiClient.get('/api/attendance', {

        params: {
          date: attendanceDate
        }
      });
      const attendanceData = Array.isArray(response) ? response : (response.data || []);
      const records = {};
      
      attendanceData.forEach(record => {
        const sId = record.student_id || record.studentId;
        if (sId) {
          records[sId] = record.status?.toLowerCase() || 'present';
        }
      });

      const finalRecords = {};
      studentList.forEach(student => {
        const id = student.id || student._id;
        finalRecords[id] = records[id] || 'present';
      });
      
      setAttendanceRecords(finalRecords);
    } catch (error) {
      const records = {};
      studentList.forEach(student => {
        const id = student.id || student._id;
        records[id] = 'present';
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

  // ✅ FIXED: Perfect QR Scan Handler
  const handleQRScan = async (qrData) => {
    console.log('QR Data received:', qrData);
    
    // Create proper payload for backend
    const payload = {
      qr: qrData,
      date: attendanceDate,
      subjectId: attendanceType === 'subject' ? selectedSubject : null,
      eventId: attendanceType === 'event' ? selectedEvent : null,
      attendanceType: attendanceType || 'daily',
    };
    
    console.log('Sending to backend:', payload);
    
    try {
      const res = await apiClient.post(
        API_ENDPOINTS.BRANCH_ADMIN.ATTENDANCE.SCAN, 
        payload
      );

      console.log('Backend response:', res.data);
      
      if (res?.data?.success) {
        toast.success(res.data.message || 'Attendance recorded successfully!');
        
        const student = res.data.data?.student;
        if (student && student._id) {
          // Update attendance records
          setAttendanceRecords(prev => ({ 
            ...prev, 
            [student._id]: 'present' 
          }));
          
          // Add to scanned students list
          if (!scannedStudents.find(s => s._id === student._id)) {
            setScannedStudents(prev => [...prev, student]);
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
        toast.error(res?.data?.message || 'Failed to record attendance');
      }
    } catch (err) {
      console.error('API Error:', err.response?.data || err.message);
      const errorMsg = err.response?.data?.message || 'Failed to record attendance';
      toast.error(errorMsg);
    }
  };

  const handleSubmit = async () => {
    if (!selectedClass || !selectedSection) {
      toast.error('Please select class and section');
      return;
    }
    if (attendanceType === 'event' && !selectedEvent) {
      toast.error('Please select an event');
      return;
    }
    
    try {
      setSaving(true);
      
      const records = Object.entries(attendanceRecords).map(([studentId, status]) => ({
        studentId,
        status
      }));
      
      const payload = {
        branchId: user.branchId?._id,
        classId: selectedClass,
        section: selectedSection,
        subjectId: attendanceType === 'subject' ? selectedSubject : null,
        eventId: attendanceType === 'event' ? selectedEvent : null,
        date: attendanceDate,
        attendanceType: attendanceType || 'daily',
        records
      };
      
      await apiClient.post(API_ENDPOINTS.BRANCH_ADMIN.ATTENDANCE.CREATE, payload);
      toast.success('Attendance saved successfully!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save attendance');
    } finally {
      setSaving(false);
    }
  };
  
  const fetchTodayAttendance = async () => {
    try {
      const todayDate = new Date().toISOString().split('T')[0];
      const response = await apiClient.get(API_ENDPOINTS.BRANCH_ADMIN.ATTENDANCE.LIST, {
        date: todayDate,
        limit: 1000
      });
      
      if (response.success && response.data) {
        const attendanceRecords = response.data.attendance || [];
        const markedStudentsList = [];
        
        // Extract unique students from today's attendance
        attendanceRecords.forEach(record => {
          if (record.records && Array.isArray(record.records)) {
            record.records.forEach(studentRecord => {
              if (studentRecord.studentId && typeof studentRecord.studentId === 'object' && studentRecord.studentId._id) {
                const student = studentRecord.studentId;
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
        
        setMarkedStudents(markedStudentsList);
      }
    } catch (error) {
      console.error('Failed to fetch today attendance:', error);
      // Don't show error toast, just log it
    }
  };
  
  const searchStudents = async (query) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      return;
    }
    
    try {
      setSearching(true);
      const response = await apiClient.get(API_ENDPOINTS.BRANCH_ADMIN.STUDENTS.SEARCH, {
        q: query
      });
      
      const searchData = Array.isArray(response) ? response : (response.data?.students || response.data || []);
      setSearchResults(searchData);

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
        branchId: user.branchId || user.branch_id || student.branch_id || student.branchId, 
        classId: student.details?.academic_info?.class_id || student.classId, 
        section: student.details?.academic_info?.section_id || student.section, 
        subjectId: attendanceType === 'subject' ? selectedSubject : null,
        eventId: attendanceType === 'event' ? selectedEvent : null,
        date: attendanceDate,
        attendanceType: attendanceType || 'daily',
        records: [{
          studentId: student.id || student._id,
          status: status
        }]
      };

      await apiClient.post(API_ENDPOINTS.BRANCH_ADMIN.ATTENDANCE.CREATE, payload);

      // Update local state
      setAttendanceRecords(prev => ({
        ...prev,
        [student.id || student._id]: status
      }));

      // Add to marked students if not already there with proper structure
      const studentIdKey = student.id || student._id;
      if (!markedStudents.find(s => (s.id || s._id) === studentIdKey)) {
        setMarkedStudents(prev => [...prev, {
          ...student,
          registrationNumber: student.registration_no || student.registrationNumber,
          rollNumber: student.details?.academic_info?.roll_no || student.rollNumber,
          section: student.details?.academic_info?.section_id || student.section,
          feeStatus: student.hasPaidFees ? 'paid' : 'unpaid'
        }]);
      }

      toast.success(`Attendance marked as ${status.toLowerCase()} for ${student.first_name || student.firstName} ${student.last_name || student.lastName || ''}`);
      setStudentSearchQuery('');
      setSearchResults([]);

    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to mark attendance');
    }
  };
  
  const viewStudentAttendance = (studentId) => {
    router.push(`/branch-admin/students/${studentId}/attendance?return=/branch-admin/attendance`);
  };

  const fetchManualStudents = async () => {
    try {
      setManualFetchingStudents(true);
      const response = await apiClient.get('/api/users/students');
      setManualAttendanceStudents(response.data?.students || response.data || response || []);

    } catch (error) {
      toast.error(error.message || 'Failed to fetch students');
    } finally {
      setManualFetchingStudents(false);
    }
  };

  const handleManualAttendanceSubmit = async () => {
    try {
      setManualMarkingAttendance(true);
      const payload = {
        date: manualAttendanceDate,
        status: manualAttendanceStatus,
        student_ids: manualSelectedStudents
      };
      await apiClient.post('/api/attendance', payload);
      toast.success(`Attendance marked successfully!`);
      setManualAttendanceModalOpen(false);
      setManualSelectedStudents([]);
      if (selectedClass && selectedSection) {
        fetchStudents();
      }
    } catch (error) {
      toast.error(error.message || 'Failed to mark attendance');
    } finally {
      setManualMarkingAttendance(false);
    }
  };

  const getSelectedClass = () => classes.find(c => c.id === selectedClass || c._id === selectedClass);


  const sections = getSelectedClass()?.sections || [];

  const getSectionName = (sectionId) => {
    if (!sectionId) return '—';
    const sec = allSections.find(s => s.id === sectionId || s._id === sectionId);
    return sec ? sec.name : sectionId;
  };


  const getStatusIcon = (status) => {
    switch (status) {
      case 'present':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'absent':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'late':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'leave':
        return <Calendar className="h-4 w-4 text-orange-500" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status) => {
    if (!status) return <Badge variant="outline">—</Badge>;
    const lowerStatus = status.toLowerCase();

    const variants = {
      present: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      absent: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      late: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      half_day: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      excused: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      leave: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      holiday: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    };
    
    return (
      <Badge className={variants[lowerStatus] || 'bg-gray-100 text-gray-800'}>
        {lowerStatus.charAt(0).toUpperCase() + lowerStatus.slice(1).replace('_', ' ')}
      </Badge>
    );
  };


  // History functions
  const fetchAttendanceHistory = async () => {
    try {
      setHistoryLoading(true);
      const params = {};
      
      if (historyFilters.fromDate) params.fromDate = historyFilters.fromDate;
      if (historyFilters.toDate) params.toDate = historyFilters.toDate;
      if (historyFilters.classId) params.classId = historyFilters.classId;
      if (historyFilters.attendanceType) params.attendanceType = historyFilters.attendanceType;
      
      const response = await apiClient.get(API_ENDPOINTS.BRANCH_ADMIN.ATTENDANCE.LIST, { params });
      
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
  
  const handleSaveStatus = async () => {
    try {
      setUpdating(true);
      
      // Find the attendance record that contains this student
      const attendanceRecord = attendanceHistory.find(att => 
        att.records.some(r => r._id === editingRecord._id)
      );
      
      if (!attendanceRecord) {
        toast.error('Attendance record not found');
        return;
      }
      
      await apiClient.put(API_ENDPOINTS.BRANCH_ADMIN.STUDENTS.GET.replace(':id', editingRecord.studentId._id) + '/attendance', {
        attendanceId: attendanceRecord._id,
        status: editStatus,
        remarks: editRemarks
      });
      
      toast.success('Attendance status updated successfully');
      setEditModalOpen(false);
      fetchAttendanceHistory();
    } catch (error) {
      toast.error(error.message || 'Failed to update attendance');
    } finally {
      setUpdating(false);
    }
  };
  
  return (
    <div className="p-6 space-y-6">
      {/* Manual Attendance Modal */}
      <Modal
        open={manualAttendanceModalOpen}
        onClose={() => setManualAttendanceModalOpen(false)}
        title="Manual Student Attendance (Bulk)"
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Date</Label>
              <Input
                type="date"
                value={manualAttendanceDate}
                onChange={(e) => setManualAttendanceDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Dropdown
                name="status"
                value={manualAttendanceStatus}
                onChange={(e) => setManualAttendanceStatus(e.target.value)}
                options={[
                  { value: 'PRESENT', label: 'Present' },
                  { value: 'ABSENT', label: 'Absent' },
                  { value: 'LATE', label: 'Late' },
                  { value: 'LEAVE', label: 'Leave' },
                  { value: 'HOLIDAY', label: 'Holiday' }
                ]}
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button onClick={fetchManualStudents} disabled={manualFetchingStudents}>
              {manualFetchingStudents ? <ButtonLoader /> : 'Fetch Students'}
            </Button>
          </div>

          {manualAttendanceStudents.length > 0 && (
            <div className="space-y-4 mt-4">
              <div className="flex justify-between items-center">
                <Label className="font-semibold text-md">Select Students ({manualAttendanceStudents.length})</Label>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="select-all"
                    checked={manualSelectedStudents.length === manualAttendanceStudents.length && manualAttendanceStudents.length > 0}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setManualSelectedStudents(manualAttendanceStudents.map(s => s.id));
                      } else {
                        setManualSelectedStudents([]);
                      }
                    }}
                  />
                  <Label htmlFor="select-all" className="cursor-pointer text-sm font-medium">Select All</Label>
                </div>
              </div>

              <div className="border rounded-lg max-h-80 overflow-y-auto shadow-sm">
                <Table>
                  <TableHeader className="bg-gray-50 dark:bg-gray-900">
                    <TableRow>
                      <TableHead className="w-12"></TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Reg #</TableHead>
                      <TableHead>Class / Section</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {manualAttendanceStudents.map((student) => (
                      <TableRow key={student.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50">
                        <TableCell>
                          <Checkbox
                            checked={manualSelectedStudents.includes(student.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setManualSelectedStudents([...manualSelectedStudents, student.id]);
                              } else {
                                setManualSelectedStudents(manualSelectedStudents.filter(id => id !== student.id));
                              }
                            }}
                          />
                        </TableCell>
                        <TableCell className="font-medium">{student.first_name} {student.last_name}</TableCell>
                        <TableCell>{student.registration_no}</TableCell>
                        <TableCell>
                          {student.details?.academic_info?.class_id || 'N/A'} - {student.details?.academic_info?.section_id || student.section || 'N/A'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setManualAttendanceModalOpen(false)}>Cancel</Button>
                <Button
                  onClick={handleManualAttendanceSubmit}
                  disabled={manualMarkingAttendance || manualSelectedStudents.length === 0}
                >
                  {manualMarkingAttendance ? <ButtonLoader /> : `Mark Attendance (${manualSelectedStudents.length})`}
                </Button>
              </div>
            </div>
          )}
        </div>
      </Modal>

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Mark Attendance</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Mark attendance for your branch students
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setShowScanner(true)}>
            <Camera className="h-4 w-4 mr-2" />
            Scan QR
          </Button>
          <Button onClick={() => setManualAttendanceModalOpen(true)} variant="outline">
            <UserSearch className="h-4 w-4 mr-2" />
            Manual Attendance
          </Button>
          <Button 
            onClick={() => setIsHolidayModalOpen(true)} 
            variant="secondary"
            className="bg-amber-600 hover:bg-amber-700 text-white font-bold shadow-md"
          >
            <Calendar className="h-4 w-4 mr-2" />
            Mark Holiday
          </Button>
        </div>

      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Attendance Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                options={classes.length === 0 ? [{ value: '', label: 'This Branch Classes Not Found' }] : classes.map((c) => ({ value: c.id || c._id, label: c.name }))}
                placeholder={classes.length === 0 ? "This Branch Classes Not Found" : "Select class"}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Section *</Label>
              <Dropdown
                name="section"
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)}
                options={sections.length === 0 && selectedClass ? [{ value: '', label: `${classes.find(c => c.id === selectedClass || c._id === selectedClass)?.name || 'Class'} Sections Not Found` }] : sections.map((s) => ({ value: s.id || s._id || s.name, label: s.name }))}
                disabled={!selectedClass}
                placeholder={!selectedClass ? "Select class first" : sections.length === 0 ? `${classes.find(c => c.id === selectedClass || c._id === selectedClass)?.name || 'Class'} Sections Not Found` : "Select section"}
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
                  // { value: 'subject', label: 'Subject' },
                  // { value: 'event', label: 'Event' },
                ]}
              />
            </div>

            {/* {attendanceType === 'event' && (
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
            )} */}
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
                      <TableHead>Fee Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {searchResults.map((student) => (
                      <TableRow key={student.id || student._id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{(student.first_name || student.firstName) ? `${student.first_name || student.firstName} ${student.last_name || student.lastName || ''}` : student.fullName}</div>
                            <div className="text-xs text-gray-500">{student.email}</div>
                          </div>
                        </TableCell>
                        <TableCell>{student.registration_no || student.registrationNumber || '—'}</TableCell>
                        <TableCell>{student.roll_no || student.rollNumber || student.details?.academic_info?.roll_no || '—'}</TableCell>
                        <TableCell>{getSectionName(student.section || student.details?.academic_info?.section_id)}</TableCell>

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
                              onClick={() => viewStudentAttendance(student.id || student._id)}
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
                  <TableRow key={student.id || student._id}>

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
                        onClick={() => viewStudentAttendance(student.id || student._id)}
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
      
      {selectedClass && selectedSection && (
        <>
          <Tabs
            tabs={[
              { id: 'manual', label: 'Manual Attendance' }, 
              { id: 'qr', label: 'QR Code Scan' },
              { id: 'history', label: 'History' }
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
                  <div className="text-center py-8 text-gray-500 font-medium">
                    This Branch Students Not Found
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
                      {filteredStudents.map(student => {
                        const studentId = student.id || student._id;
                        return (
                          <TableRow key={studentId}>
                            <TableCell>{student.details?.academic_info?.roll_no || student.rollNumber || student.roll_no || 'N/A'}</TableCell>
                            <TableCell>{student.registration_no || student.registrationNumber || 'N/A'}</TableCell>
                            <TableCell className="font-medium">
                              {student.first_name || student.firstName || ''} {student.last_name || student.lastName || ''}
                            </TableCell>

                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant={attendanceRecords[studentId] === 'present' ? 'default' : 'outline'}
                                  size="sm"
                                  onClick={() => handleStatusChange(studentId, 'present')}
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Present
                                </Button>
                                <Button
                                  variant={attendanceRecords[studentId] === 'absent' ? 'default' : 'outline'}
                                  size="sm"
                                  onClick={() => handleStatusChange(studentId, 'absent')}
                                >
                                  <XCircle className="h-4 w-4 mr-1" />
                                  Absent
                                </Button>
                                <Button
                                  variant={attendanceRecords[studentId] === 'late' ? 'default' : 'outline'}
                                  size="sm"
                                  onClick={() => handleStatusChange(studentId, 'late')}
                                >
                                  <Clock className="h-4 w-4 mr-1" />
                                  Late
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}

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
                      Click "Open Scanner" to scan student QR codes. Scanned students will be automatically marked as present.
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

      {showScanner && (
        <Modal open={true} onClose={() => setShowScanner(false)} title="Scan QR Code" size="xl">
          <div className="p-4">
            <LiveJsQRScanner
              onDetected={(data) => {
                // LiveJsQRScanner returns parsed object or { raw: text }
                handleQRScan(data);
              }}
              continuous={true}
              autoStart={true}
              className="w-full"
            />
          </div>
        </Modal>
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

      {/* Student Holiday Modal */}
      {isHolidayModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6 border border-gray-100 dark:border-gray-700">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Mark Student Holiday</h3>
              <button 
                onClick={() => setIsHolidayModalOpen(false)}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
              >
                <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>
            
            <form onSubmit={handleHolidaySubmit} className="space-y-4">
              <div className="space-y-1">
                <Label className="text-xs font-bold text-gray-500 uppercase">Date</Label>
                <Input
                  type="date"
                  required
                  value={holidayForm.date}
                  onChange={(e) => setHolidayForm(prev => ({ ...prev, date: e.target.value }))}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium text-gray-800 dark:text-white"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold text-gray-500 uppercase">Holiday Reason</Label>
                <Input
                  type="text"
                  placeholder="e.g. Summer Break, Public Holiday"
                  value={holidayForm.reason}
                  onChange={(e) => setHolidayForm(prev => ({ ...prev, reason: e.target.value }))}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium text-gray-800 dark:text-white"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold text-gray-500 uppercase">Additional Remarks</Label>
                <textarea
                  placeholder="Remarks..."
                  value={holidayForm.remarks}
                  onChange={(e) => setHolidayForm(prev => ({ ...prev, remarks: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none h-20 text-gray-800 dark:text-white bg-white dark:bg-gray-700"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsHolidayModalOpen(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-bold flex items-center justify-center gap-2 shadow-md"
                >
                  {saving && <ButtonLoader />}
                  Mark Holiday
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>

  );
}