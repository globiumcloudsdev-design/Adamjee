'use client';

import { useEffect, useState, useRef } from 'react';
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
import DatePicker from '@/components/ui/date-picker';
import { toast } from 'sonner';
import { Camera, Search, Save, CheckCircle, XCircle, Clock, UserSearch, Eye, DollarSign, Calendar, X, QrCode, Scan } from 'lucide-react';
import FullPageLoader from '@/components/ui/full-page-loader';
import ButtonLoader from '@/components/ui/button-loader';
import { Checkbox } from '@/components/ui/checkbox';

const STATUS_OPTIONS = [
  { value: 'present', label: 'Present' },
  { value: 'absent', label: 'Absent' },
  { value: 'late', label: 'Late' },
  { value: 'half_day', label: 'Half Day' },
  { value: 'leave', label: 'Leave' }
];

export default function SuperAdminAttendancePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [activeTab, setActiveTab] = useState('manual');
  const [isHolidayModalOpen, setIsHolidayModalOpen] = useState(false);
  const [holidayForm, setHolidayForm] = useState({
    date: new Date().toISOString().split('T')[0],
    reason: '',
    remarks: '',
    branch_id: ''
  });


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

  // Manual Bulk Attendance States
  const [manualAttendanceModalOpen, setManualAttendanceModalOpen] = useState(false);
  const [manualAttendanceDate, setManualAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [manualAttendanceStatus, setManualAttendanceStatus] = useState('PRESENT');
  const [manualAttendanceBranch, setManualAttendanceBranch] = useState('');
  const [manualAttendanceStudents, setManualAttendanceStudents] = useState([]);
  const [manualSelectedStudents, setManualSelectedStudents] = useState([]);
  const [manualFetchingStudents, setManualFetchingStudents] = useState(false);
  const [manualMarkingAttendance, setManualMarkingAttendance] = useState(false);
  const [manualHasFetched, setManualHasFetched] = useState(false);


  // Data states
  const [branches, setBranches] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [allClasses, setAllClasses] = useState([]);
  const [allSections, setAllSections] = useState([]);
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
  
  // Hand Scanner States
  const [isScannerModalOpen, setIsScannerModalOpen] = useState(false);
  const [scanInput, setScanInput] = useState('');
  const [recentScans, setRecentScans] = useState([]);
  const scannerInputRef = useRef(null);

  // Student search states
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  // Fetch branches and today's attendance on mount
  useEffect(() => {
    fetchBranches();
    fetchTodayAttendance();
    fetchAllSections();
    fetchClasses();
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
      if (attendanceType === 'event') fetchEvents();
    } else {
      setStudents([]);
      setFilteredStudents([]);
    }
  }, [selectedClass, selectedSection]);


  useEffect(() => {
    if (attendanceType === 'event' && selectedBranch) {
      fetchEvents();
    }
  }, [attendanceType, selectedBranch]);

  // Sync manual attendance branch with selected branch when modal opens
  useEffect(() => {
    if (manualAttendanceModalOpen) {
      setManualHasFetched(false);
      setManualAttendanceStudents([]);
      if (selectedBranch) {
        setManualAttendanceBranch(selectedBranch);
      }
    }
  }, [manualAttendanceModalOpen]);

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

  const fetchTodayAttendance = async () => {
    try {
      const todayDate = new Date().toISOString().split('T')[0];
      const response = await apiClient.get(API_ENDPOINTS.SUPER_ADMIN.ATTENDANCE.LIST, {
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

  const fetchAllSections = async () => {
    try {
      const response = await apiClient.get('/api/sections');
      const secData = Array.isArray(response) ? response : (response.data?.sections || response.data || []);
      setAllSections(secData);
    } catch (error) {
      console.error('Failed to fetch all sections:', error);
    }
  };


  const handleHolidaySubmit = async (e) => {

    e.preventDefault();
    if (!holidayForm.branch_id) {
      toast.error("Please select a branch");
      return;
    }
    setSaving(true);
    try {
      const response = await apiClient.post('/api/attendance/holiday', holidayForm);
      if (response.success) {
        toast.success(response.message || 'Holiday successfully marked for students');
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


  const fetchClasses = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/api/classes');
      const classesData = Array.isArray(response) ? response : (response.data?.classes || response.data || []);
      
      setAllClasses(classesData);
      
      if (selectedBranch) {
        setClasses(classesData.filter(c => c.branch_id === selectedBranch || c.branchId === selectedBranch));
      } else {
        setClasses(classesData);
      }

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
      const res = await apiClient.get(API_ENDPOINTS.SUPER_ADMIN.EVENTS.LIST, { branchId: selectedBranch });
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

      const studentArray = Array.isArray(response) ? response : (response.data?.students || response.data || response.students || []);

      const filtered = studentArray.filter((student) => {
        const studentBranchId = student.branch_id || student.branchId;
        const studentClassId = student.details?.academic_info?.class_id || student.classId;
        const studentSectionId = student.details?.academic_info?.section_id || student.section;
        
        return (
          (studentBranchId === selectedBranch) &&
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
        branch_id: selectedBranch,
        date: attendanceDate
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

  const handleHandScan = async (e) => {
    if (e) e.preventDefault();
    if (!scanInput.trim()) return;

    const currentScan = scanInput.trim();
    setScanInput(''); // Clear immediately for next scan

    try {
      const res = await apiClient.post(API_ENDPOINTS.SUPER_ADMIN.ATTENDANCE.SCAN, {
        qr: currentScan,
        date: attendanceDate,
      });

      if (res.success) {
        const student = res.data?.student || res.student;
        
        // Add to recent scans with animation flag
        setRecentScans(prev => {
          const filtered = prev.filter(s => (s.id || s._id) !== (student.id || student._id));
          return [{ 
            ...student, 
            scanTime: new Date().toLocaleTimeString(),
            isNew: true 
          }, ...filtered].slice(0, 10);
        });

        // Also update the main marked students list if it exists
        if (!markedStudents.find(s => (s.id || s._id) === (student.id || student._id))) {
          setMarkedStudents(prev => [{
            ...student,
            registrationNumber: student.registrationNumber || student.registration_no,
            rollNumber: student.rollNumber || student.roll_no,
            feeStatus: student.hasPaidFees ? 'paid' : 'unpaid'
          }, ...prev]);
        }

        toast.success(res.message || `Attendance marked for ${student.fullName}`);
        
        // Remove 'isNew' flag after animation
        setTimeout(() => {
          setRecentScans(prev => prev.map(s => (s.id || s._id) === (student.id || student._id) ? { ...s, isNew: false } : s));
        }, 1000);

      } else {
        toast.error(res.error || 'Scan failed');
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to record scan');
    } finally {
      // Ensure input is focused for next scan
      if (scannerInputRef.current) {
        scannerInputRef.current.focus();
      }
    }
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
        branchId: selectedBranch || student.branch_id || student.branchId, 
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

      await apiClient.post(API_ENDPOINTS.SUPER_ADMIN.ATTENDANCE.CREATE, payload);

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

  const fetchManualStudents = async () => {
    if (!manualAttendanceBranch) {
      toast.error('Please select a branch first');
      return;
    }
    try {
      setManualFetchingStudents(true);
      const response = await apiClient.get('/api/users/students', {
        branch_id: manualAttendanceBranch
      });
      setManualAttendanceStudents(response.data?.students || response.data || response || []);
      setManualHasFetched(true);

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
        student_ids: manualSelectedStudents,
        branch_id: manualAttendanceBranch
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
    const id = typeof sectionId === 'object' ? (sectionId.id || sectionId._id) : sectionId;
    const sec = allSections.find(s => s.id === id || s._id === id);
    return sec ? sec.name : (typeof sectionId === 'object' ? sectionId.name : sectionId);
  };

  const getClassName = (classId) => {
    if (!classId) return '—';
    const id = typeof classId === 'object' ? (classId.id || classId._id) : classId;
    const cls = allClasses.find(c => c.id === id || c._id === id);
    return cls ? cls.name : (typeof classId === 'object' ? classId.name : classId);
  };


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

      const response = await apiClient.get(API_ENDPOINTS.SUPER_ADMIN.ATTENDANCE.LIST, params);

      if (response.success && response.data) {
        setAttendanceHistory(response.data.attendance || []);
      }
    } catch (error) {
      toast.error('Failed to fetch attendance history');
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleSaveStatus = async () => {
    try {
      setUpdating(true);
      const studentId = editingRecord.student_id || editingRecord.student?.id || editingRecord.studentId;
      if (!studentId) {
        toast.error('Student ID not found for this record');
        return;
      }
      
      await apiClient.put('/api/attendance', {

        attendanceId: editingRecord.id || editingRecord._id,
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


  if (loading && !branches.length) return <FullPageLoader />;

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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Branch *</Label>
              <Dropdown
                name="branch"
                value={manualAttendanceBranch}
                onChange={(e) => setManualAttendanceBranch(e.target.value)}
                options={branches.map((b) => ({ value: b.id || b._id, label: b.name }))}
                placeholder="Select branch"
              />
            </div>

            <div className="space-y-2">
              <Label>Date</Label>
              <DatePicker
                value={manualAttendanceDate}
                onChange={(e) => setManualAttendanceDate(e.target.value)}
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
            <Button onClick={fetchManualStudents} disabled={manualFetchingStudents || !manualAttendanceBranch}>
              {manualFetchingStudents ? <ButtonLoader /> : 'Fetch Students'}
            </Button>
          </div>

          {manualAttendanceStudents.length > 0 ? (
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
                          {getClassName(student.details?.academic_info?.class_id)} - {getSectionName(student.details?.academic_info?.section_id || student.section)}
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
          ) : manualHasFetched && !manualFetchingStudents && (
            <div className="text-center py-10 border-2 border-dashed rounded-lg mt-4 bg-gray-50/50 dark:bg-gray-900/50">
              <UserSearch className="mx-auto h-12 w-12 text-gray-400 mb-3" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">No Students Found</h3>
              <p className="text-gray-500 dark:text-gray-400 max-w-xs mx-auto">
                We couldn't find any students for the selected branch. Please try a different branch or check the student list.
              </p>
            </div>
          )}
        </div>
      </Modal>

      {/* Hand Scanner Attendance Modal */}
      <Modal
        open={isScannerModalOpen}
        onClose={() => setIsScannerModalOpen(false)}
        title="Student Attendance - Hand Scanner"
        size="xl"
      >
        <div className="space-y-6">
          <div className="bg-indigo-50 dark:bg-indigo-900/20 p-6 rounded-xl border border-indigo-100 dark:border-indigo-800 shadow-sm">
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="bg-white dark:bg-gray-800 p-4 rounded-full shadow-inner border-2 border-indigo-200 dark:border-indigo-700 animate-pulse">
                <QrCode className="h-12 w-12 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div className="text-center">
                <h3 className="text-lg font-bold text-indigo-900 dark:text-indigo-100">Ready to Scan</h3>
                <p className="text-sm text-indigo-600 dark:text-indigo-400">Please scan student ID card using the hand scanner</p>
              </div>
              
              <form onSubmit={handleHandScan} className="w-full max-w-md relative">
                <Input
                  ref={scannerInputRef}
                  value={scanInput}
                  onChange={(e) => setScanInput(e.target.value)}
                  placeholder="Scanning..."
                  autoFocus
                  className="h-14 text-2xl text-center font-mono tracking-widest border-2 border-indigo-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-xl shadow-lg bg-white dark:bg-gray-800"
                  autoComplete="off"
                  onBlur={() => {
                    // Keep focus unless modal is closed
                    if (isScannerModalOpen) {
                      setTimeout(() => scannerInputRef.current?.focus(), 100);
                    }
                  }}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Badge variant="outline" className="bg-indigo-100 text-indigo-700 border-indigo-200">Focused</Badge>
                </div>
              </form>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-semibold flex items-center gap-2">
                <Clock className="h-5 w-5 text-gray-500" />
                Recent Scans
              </h4>
              <Badge variant="secondary">{recentScans.length} Students</Badge>
            </div>

            {recentScans.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {recentScans.map((student, index) => (
                  <div 
                    key={student.id || student._id} 
                    className={`flex items-center gap-4 p-4 rounded-xl border transition-all duration-500 ${
                      student.isNew 
                        ? 'bg-green-50 border-green-200 dark:bg-green-900/30 dark:border-green-800 scale-[1.02] shadow-md ring-2 ring-green-500 ring-opacity-20' 
                        : 'bg-white border-gray-100 dark:bg-gray-800 dark:border-gray-700'
                    }`}
                  >
                    <div className="relative">
                      {student.avatar_url ? (
                        <img 
                          src={student.avatar_url} 
                          alt={student.fullName} 
                          className="h-12 w-12 rounded-full object-cover border-2 border-white dark:border-gray-700 shadow-sm"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-bold">
                          {student.fullName?.charAt(0) || 'S'}
                        </div>
                      )}
                      <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-0.5 border-2 border-white dark:border-gray-800">
                        <CheckCircle className="h-3 w-3 text-white" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">
                        {student.fullName}
                      </p>
                      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1">
                        <p className="text-xs text-gray-500 dark:text-gray-400">Reg: <span className="font-medium text-gray-700 dark:text-gray-300">{student.registrationNumber || student.registration_no}</span></p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Roll: <span className="font-medium text-gray-700 dark:text-gray-300">{student.rollNumber || student.roll_no || 'N/A'}</span></p>
                      </div>
                      <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Scanned at {student.scanTime}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge className={student.already_marked ? "bg-amber-100 text-amber-700 border-amber-200" : "bg-green-100 text-green-700 border-green-200"}>
                        {student.already_marked ? "Verified" : "Marked"}
                      </Badge>
                      <span className="text-[10px] font-medium text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">{student.branchName}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-50 dark:bg-gray-900/50 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-800">
                <div className="bg-white dark:bg-gray-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                  <UserSearch className="h-8 w-8 text-gray-300" />
                </div>
                <p className="text-gray-500 dark:text-gray-400">No students scanned yet in this session</p>
              </div>
            )}
          </div>
        </div>
        <div className="mt-8 flex justify-between items-center border-t pt-6">
          <div className="text-sm text-gray-500">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              Scanner Active & Connected
            </span>
          </div>
          <Button variant="outline" onClick={() => setIsScannerModalOpen(false)}>
            Close Scanner
          </Button>
        </div>
      </Modal>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Mark Attendance</h1>
          <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">
            Mark attendance for students across all branches
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 mt-2 sm:mt-0 w-full sm:w-auto">
          <Button
            onClick={() => setIsScannerModalOpen(true)}
            className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            <Scan className="h-4 w-4 mr-2" />
            Hand Scanner
          </Button>
          <Button
            onClick={() => setShowScanner(true)}
            variant="outline"
            className="w-full sm:w-auto border-indigo-600 text-indigo-600 hover:bg-indigo-50"
          >
            <Camera className="h-4 w-4 mr-2" />
            Camera Scan
          </Button>
          <Button
            onClick={() => setManualAttendanceModalOpen(true)}
            variant="outline"
            className="w-full sm:w-auto"
          >
            <UserSearch className="h-4 w-4 mr-2" />
            Manual Attendance
          </Button>
          <Button
            onClick={() => setIsHolidayModalOpen(true)}
            variant="secondary"
            className="w-full sm:w-auto bg-amber-600 hover:bg-amber-700 text-white font-bold shadow-md flex items-center gap-2"
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="space-y-2">
              <Label>Branch *</Label>
              <Dropdown
                name="branch"
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                options={branches.map((b) => ({ value: b.id || b._id, label: b.name }))}
                placeholder="Select branch"
              />
            </div>


            <div className="space-y-2">
              <Label>Date</Label>
              <DatePicker
                value={attendanceDate}
                onChange={(e) => setAttendanceDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Class *</Label>
              <Dropdown
                name="class"
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                options={classes.length === 0 && selectedBranch ? [{ value: '', label: `${branches.find(b => b.id === selectedBranch || b._id === selectedBranch)?.name || 'Branch'} Classes Not Found` }] : classes.map((c) => ({ value: c.id || c._id, label: c.name }))}
                disabled={!selectedBranch}
                placeholder={!selectedBranch ? "Select branch first" : classes.length === 0 ? `${branches.find(b => b.id === selectedBranch || b._id === selectedBranch)?.name || 'Branch'} Classes Not Found` : "Select class"}
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
                placeholder="Select type"
              />
            </div>
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

                        <TableCell>{student.branch?.name || student.branchId?.name || '—'}</TableCell>
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
                  <div className="text-center py-8 text-gray-500 font-medium">
                    {selectedBranch ? `${branches.find(b => b.id === selectedBranch || b._id === selectedBranch)?.name || 'Branch'} Students Not Found` : "No students found"}
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
                    <DatePicker
                      value={historyFilters.fromDate}
                      onChange={(e) => setHistoryFilters(prev => ({ ...prev, fromDate: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>To Date</Label>
                    <DatePicker
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
                <Label className="text-xs font-bold text-gray-500 uppercase">Branch *</Label>
                <Dropdown
                  value={holidayForm.branch_id}
                  onChange={(e) => setHolidayForm(prev => ({ ...prev, branch_id: e.target.value }))}
                  options={branches.map(b => ({ value: b.id || b._id, label: b.name }))}
                  placeholder="Select branch"
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
