//src/app/(dashboard)/branch-admin/attendance/page.js
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
import Modal from '@/components/ui/modal';
import DatePicker from '@/components/ui/date-picker';
import LiveJsQRScanner from '@/components/LiveJsQRScanner';
import apiClient from '@/lib/api-client';
import API_ENDPOINTS from '@/constants/api-endpoints';
import { toast } from 'sonner';
import { Camera, Search, Save, CheckCircle, XCircle, Clock, UserSearch, Eye, DollarSign, Calendar, X, Scan, Upload, FileText, QrCode, Download, Users, RefreshCw } from 'lucide-react';
import ButtonLoader from '@/components/ui/button-loader';
import { Checkbox } from '@/components/ui/checkbox';
import { TableSkeleton } from '@/components/ui/skeleton';
import ConfirmDeleteModal from '@/components/modals/ConfirmDeleteModal';

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
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
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
  const [allClasses, setAllClasses] = useState([]);
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
  const [isScannerModalOpen, setIsScannerModalOpen] = useState(false);
  const [isBulkUploadModalOpen, setIsBulkUploadModalOpen] = useState(false);
  const [bulkUploadFile, setBulkUploadFile] = useState(null);
  const [bulkUploadDate, setBulkUploadDate] = useState(new Date().toISOString().split('T')[0]);
  const [bulkUploadResult, setBulkUploadResult] = useState(null);
  const [scanInput, setScanInput] = useState('');
  const [lastScannedStudent, setLastScannedStudent] = useState(null);
  const [recentScans, setRecentScans] = useState([]);
  const [scanningStatus, setScanningStatus] = useState('idle'); // idle, checking, marking, success, error
  const [studentsCache, setStudentsCache] = useState({});
  const [isProcessingAutoAbsent, setIsProcessingAutoAbsent] = useState(false);
  const [isAutoAbsentModalOpen, setIsAutoAbsentModalOpen] = useState(false);
  const [autoAbsentPreview, setAutoAbsentPreview] = useState([]);
  const [autoAbsentSelected, setAutoAbsentSelected] = useState([]);
  const [fetchingAutoAbsent, setFetchingAutoAbsent] = useState(false);
  const [deleteRecord, setDeleteRecord] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const scannerInputRef = useRef(null);

  const playBuzzer = (type = 'success') => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      if (type === 'success') {
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
        oscillator.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 0.1);
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.1);
      } else {
        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(220, audioCtx.currentTime); // A3
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.2);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.2);
      }
    } catch (e) {
      console.error('Audio buzzer failed', e);
    }
  };

  const handleOpenScanner = () => {
    setRecentScans([]);
    setLastScannedStudent(null);
    setScanInput('');
    setScanningStatus('idle');
    setIsScannerModalOpen(true);
  };

  const handleCloseScanner = () => {
    setIsScannerModalOpen(false);
    setRecentScans([]);
    setLastScannedStudent(null);
    setScanInput('');
    setScanningStatus('idle');
  };
  
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

  // Standalone History Modal states
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const todayStr = new Date().toISOString().split('T')[0];
  const [historyModalFilters, setHistoryModalFilters] = useState({
    fromDate: todayStr,
    toDate: todayStr,
    status: '',
    classId: '',
    sectionId: ''
  });
  const [historySearchQuery, setHistorySearchQuery] = useState('');
  const [historyModalRecords, setHistoryModalRecords] = useState([]);
  const [historyModalLoading, setHistoryModalLoading] = useState(false);
  const [historyModalFetched, setHistoryModalFetched] = useState(false);

  // Manual Bulk Attendance States
  const [manualAttendanceModalOpen, setManualAttendanceModalOpen] = useState(false);
  const [manualAttendanceDate, setManualAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [manualAttendanceStatus, setManualAttendanceStatus] = useState('PRESENT');
  const [manualAttendanceStudents, setManualAttendanceStudents] = useState([]);
  const [manualSelectedStudents, setManualSelectedStudents] = useState([]);
  const [manualFetchingStudents, setManualFetchingStudents] = useState(false);
  const [manualMarkingAttendance, setManualMarkingAttendance] = useState(false);
  const [manualHasFetched, setManualHasFetched] = useState(false);
  const [manualGRNo, setManualGRNo] = useState('');

  useEffect(() => {
    if (manualAttendanceModalOpen) {
      setManualHasFetched(false);
      setManualAttendanceStudents([]);
    }
  }, [manualAttendanceModalOpen]);


  // Fetch classes and today's attendance on mount
  useEffect(() => {
    if (user) {
      fetchClasses();
      fetchTodayAttendance();
      fetchAllSections();
      loadStudentsCache(); // Pre-load student cache for instant scanning
    }
  }, [user]);

  // Strict focus management for Hand Scanner
  useEffect(() => {
    let focusInterval;
    if (isScannerModalOpen) {
      // Immediate focus
      setTimeout(() => scannerInputRef.current?.focus(), 100);
      
      // Periodic check every 500ms
      focusInterval = setInterval(() => {
        if (isScannerModalOpen && document.activeElement !== scannerInputRef.current) {
          scannerInputRef.current?.focus();
        }
      }, 500);

      // Global keydown redirect
      const handleGlobalKeyDown = (e) => {
        if (isScannerModalOpen && document.activeElement !== scannerInputRef.current) {
          // If user starts typing while modal is open but focus lost, bring it back
          scannerInputRef.current?.focus();
        }
      };

      window.addEventListener('keydown', handleGlobalKeyDown);
      return () => {
        clearInterval(focusInterval);
        window.removeEventListener('keydown', handleGlobalKeyDown);
      };
    }
  }, [isScannerModalOpen]);

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

  const handleClearFilters = () => {
    setSelectedClass('');
    setSelectedSection('');
    setAttendanceDate(new Date().toISOString().split('T')[0]);
    setAttendanceType('daily');
    setStudentSearchQuery('');
    setSearchQuery('');
    toast.success('Filters cleared successfully');
  };

  const fetchClasses = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/api/classes');
      const classesData = Array.isArray(response) ? response : (response.data?.classes || response.data || []);
      
      setAllClasses(classesData);
      const branchId = user.branchId || user.branch_id;
      const filtered = classesData.filter(c => c.branch_id === branchId || c.branchId === branchId);
      setClasses(filtered);
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


  const loadStudentsCache = async () => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.BRANCH_ADMIN.STUDENTS.LIST);
      const studentArray = Array.isArray(response) ? response : (response.data?.students || response.data || []);
      
      const cache = {};
      studentArray.forEach(s => {
        const studentData = {
          id: s.id || s._id,
          _id: s.id || s._id,
          fullName: `${s.first_name} ${s.last_name}`,
          first_name: s.first_name,
          last_name: s.last_name,
          registrationNumber: s.registration_no,
          rollNumber: s.details?.academic_info?.roll_no || s.details?.student?.roll_no,
          branchName: s.branch?.name,
          avatar_url: s.avatar_url,
          feeInfo: { status: 'Syncing...' } // Placeholder until API confirms
        };
        if (s.registration_no) cache[s.registration_no] = studentData;
        cache[s.id || s._id] = studentData;
      });
      setStudentsCache(cache);
    } catch (e) {
      console.error("Student cache load failed:", e);
    }
  };

  const fetchAutoAbsentPreview = async () => {
    try {
      setFetchingAutoAbsent(true);
      const res = await apiClient.get('/api/attendance/auto-absent', {
        branch_id: user?.branch_id || user?.branchId
      });
      if (res.success) {
        setAutoAbsentPreview(res.students || []);
        setAutoAbsentSelected(res.students ? res.students.map(s => s.id) : []);
        setIsAutoAbsentModalOpen(true);
      } else {
        toast.error(res.error || "Failed to fetch auto-absent preview");
      }
    } catch (err) {
      console.error("Auto-Absent Preview Error:", err);
      toast.error("An error occurred while fetching preview");
    } finally {
      setFetchingAutoAbsent(false);
    }
  };

  const handleAutoMarkAbsent = async () => {
    if (autoAbsentSelected.length === 0) {
      toast.error("Please select at least one student to mark absent.");
      return;
    }
    try {
      setIsProcessingAutoAbsent(true);
      const res = await apiClient.post('/api/attendance/auto-absent', {
        branch_id: user?.branch_id || user?.branchId,
        student_ids: autoAbsentSelected
      });
      
      if (res.success) {
        toast.success(res.message);
        setIsAutoAbsentModalOpen(false);
        if (res.processedCount > 0) {
          fetchStudents();
          fetchTodayAttendance();
        }
      } else {
        toast.error(res.error || "Failed to process auto-absent");
      }
    } catch (err) {
      console.error("Auto-Mark Absent Error:", err);
      toast.error("An error occurred while processing auto-absent");
    } finally {
      setIsProcessingAutoAbsent(false);
    }
  };

  const handleManualGRMark = () => {
    if (!manualGRNo.trim()) return;
    
    const query = manualGRNo.trim().toLowerCase();
    
    // Search in students list
    const student = students.find(s => {
      const rollNo = (s.details?.academic_info?.roll_no || s.rollNumber || s.roll_no || '').toString().toLowerCase();
      const regNo = (s.registration_no || s.registrationNumber || '').toString().toLowerCase();
      return rollNo === query || regNo === query;
    });

    if (student) {
      const studentId = student.id || student._id;
      handleStatusChange(studentId, 'present');
      setManualGRNo('');
      toast.success(`Marked ${student.first_name || student.firstName} as Present`);
      
      // Auto-save if it's a single entry? 
      // User said "Manual Attendance enter kr skta hai", 
      // usually this means just flipping the status in the list.
    } else {
      toast.error("Student with this GR No/Reg No not found in this class");
    }
  };

  const handleStatusChange = (studentId, status) => {
    setAttendanceRecords(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  const handleBulkUpload = async (e) => {
    if (e) e.preventDefault();
    if (!bulkUploadFile || !bulkUploadDate) {
      toast.error("Please select a file and a date");
      return;
    }

    setSaving(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target.result;
        // Simple extraction: any alphanumeric string that looks like a registration number
        const regNos = text.split(/[\n,;\t]/)
          .map(s => s.trim())
          .filter(s => s.length > 3);
        
        const uniqueRegNos = [...new Set(regNos)];
        const foundStudentIds = [];
        const notFound = [];

        uniqueRegNos.forEach(regNo => {
          // Check cache for registration number
          const student = studentsCache[regNo];
          if (student) {
            foundStudentIds.push(student.id || student._id);
          } else {
            notFound.push(regNo);
          }
        });

        if (foundStudentIds.length === 0) {
          toast.error("No matching students found in the file. Please ensure Registration Numbers are correct.");
          setSaving(false);
          return;
        }

        const response = await apiClient.post('/api/attendance', {
          date: bulkUploadDate,
          student_ids: foundStudentIds,
          status: 'PRESENT'
        });

        if (response.success) {
          setIsBulkUploadModalOpen(false);
          setBulkUploadFile(null);
          fetchTodayAttendance();
          
          setBulkUploadResult({
            successCount: foundStudentIds.length,
            skipped: notFound.map(id => ({
              id,
              reason: 'ID not found in current class/branch'
            }))
          });
        } else {
          throw new Error(response.error || "Failed to process bulk upload");
        }
      } catch (err) {
        console.error("Bulk upload error:", err);
        toast.error(err.message || "An error occurred during bulk upload");
      } finally {
        setSaving(false);
      }
    };
    reader.onerror = () => {
      toast.error("Failed to read file");
      setSaving(false);
    };
    reader.readAsText(bulkUploadFile);
  };

  const handleHandScan = async (e) => {
    if (e) e.preventDefault();
    if (!scanInput.trim()) return;

    const currentScan = scanInput.trim();
    setScanInput(''); // Clear immediately for next scan

    // 1. Instant Cache Lookup for near-zero latency
    let cachedStudent = studentsCache[currentScan];
    if (!cachedStudent && currentScan.startsWith('{')) {
      try {
        const parsed = JSON.parse(currentScan);
        cachedStudent = studentsCache[parsed.id] || studentsCache[parsed.registrationNumber] || studentsCache[parsed.registration_no];
      } catch (e) {}
    }

    if (cachedStudent) {
      setLastScannedStudent({
        ...cachedStudent,
        scanTime: new Date().toLocaleTimeString(),
        isFromCache: true
      });
      setScanningStatus('idle'); // Skip global loader
    } else {
      setScanningStatus('checking');
    }

    try {
      // Step 1: Fetch/Verify Student & Fee Info (Background if cached)
      const checkRes = await apiClient.post(API_ENDPOINTS.BRANCH_ADMIN.ATTENDANCE.SCAN, {
        qr: currentScan,
        date: attendanceDate,
        mode: 'check'
      });

      if (!checkRes.success || !checkRes.data?.student) {
        throw new Error(checkRes.error || 'Student not found');
      }

      const student = checkRes.data.student;
      const alreadyMarked = checkRes.data.existingAttendance;
      
      // Update UI with latest data (including real Fee Status)
      setLastScannedStudent({
        ...student,
        scanTime: new Date().toLocaleTimeString(),
        already_marked: alreadyMarked
      });
      
      setScanningStatus('idle');

      if (alreadyMarked) {
        playBuzzer('error');
        setScanningStatus('error');
        toast.info(`Attendance already marked for ${student.fullName}`);
        setRecentScans(prev => {
          const filtered = prev.filter(s => (s.id || s._id) !== (student.id || student._id));
          return [{...student, already_marked: true, scanTime: new Date().toLocaleTimeString()}, ...filtered].slice(0, 10);
        });
        return;
      }

      // Step 2: Mark Attendance in Background
      setScanningStatus('marking');
      const markRes = await apiClient.post(API_ENDPOINTS.BRANCH_ADMIN.ATTENDANCE.SCAN, {
        qr: currentScan,
        date: attendanceDate
      });

      if (markRes.success) {
        playBuzzer('success');
        toast.success(`Attendance marked for ${student.fullName}`);
        setScanningStatus('success');
        
        const scannedStudent = {
          ...student,
          scanTime: new Date().toLocaleTimeString(),
          isNew: true
        };

        setRecentScans(prev => {
          const filtered = prev.filter(s => (s.id || s._id) !== (student.id || student._id));
          return [scannedStudent, ...filtered].slice(0, 10);
        });

        fetchTodayAttendance();
        
        setTimeout(() => {
          setRecentScans(prev => prev.map(s => (s.id || s._id) === (student.id || student._id) ? { ...s, isNew: false } : s));
          setScanningStatus('idle');
        }, 1000);

      } else {
        throw new Error(markRes.error || 'Failed to mark attendance');
      }

    } catch (error) {
      console.error("Hand scan error:", error);
      playBuzzer('error');
      toast.error(error.message || "Failed to process scan");
      setScanningStatus('error');
      // Reset to idle after 2 seconds on error
      setTimeout(() => setScanningStatus('idle'), 2000);
    } finally {
      if (scannerInputRef.current) {
        scannerInputRef.current.focus();
      }
    }
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

  const sections = allSections.filter(s => {
    const rawClassId = s.class_id || s.classId || s.class?.id || s.class?._id;
    if (!rawClassId || !selectedClass) return false;
    const classIdStr = String(typeof rawClassId === 'object' ? (rawClassId.id || rawClassId._id) : rawClassId);
    const targetIdStr = String(selectedClass);
    return classIdStr === targetIdStr;
  });

  const getHistorySelectedClass = () => classes.find(c => c.id === historyModalFilters.classId || c._id === historyModalFilters.classId);
  
  const historySections = allSections.filter(s => {
    const rawClassId = s.class_id || s.classId || s.class?.id || s.class?._id;
    if (!rawClassId || !historyModalFilters.classId) return false;
    const classIdStr = String(typeof rawClassId === 'object' ? (rawClassId.id || rawClassId._id) : rawClassId);
    const targetIdStr = String(historyModalFilters.classId);
    return classIdStr === targetIdStr;
  });

  const getFilteredHistoryRecords = () => {
    return historyModalRecords.filter(record => {
      if (!historySearchQuery) return true;
      const student = record.student;
      if (!student) return false;
      const name = `${student.first_name || ''} ${student.last_name || ''}`.toLowerCase();
      const grNo = (student?.details?.academic_info?.roll_no || student?.details?.student?.roll_no || student?.registration_no || '').toLowerCase();
      const query = historySearchQuery.toLowerCase();
      return name.includes(query) || grNo.includes(query);
    });
  };

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
      
      const response = await apiClient.get(API_ENDPOINTS.BRANCH_ADMIN.ATTENDANCE.LIST, params);
      
      if (response.success && response.data) {
        setAttendanceHistory(response.data.attendance || []);
      }
    } catch (error) {
      toast.error('Failed to fetch attendance history');
    } finally {
      setHistoryLoading(false);
    }
  };

  // Standalone History Modal fetch
  const fetchHistoryModal = async (overrideFilters) => {
    try {
      setHistoryModalLoading(true);
      setHistoryModalFetched(false);
      const filters = overrideFilters || historyModalFilters;
      const params = {};
      if (filters.fromDate) params.fromDate = filters.fromDate;
      if (filters.toDate) params.toDate = filters.toDate;
      if (filters.status) params.status = filters.status;
      if (filters.classId) params.classId = filters.classId;
      if (filters.sectionId) params.sectionId = filters.sectionId;
      
      const response = await apiClient.get('/api/attendance', params);
      
      if (response.success && response.data) {
        setHistoryModalRecords(response.data);
      } else {
        setHistoryModalRecords([]);
      }
      setHistoryModalFetched(true);
    } catch (error) {
      toast.error('Failed to fetch attendance history');
      setHistoryModalRecords([]);
      setHistoryModalFetched(true);
    } finally {
      setHistoryModalLoading(false);
    }
  };

  const exportAttendancePDF = async () => {
    const recordsToExport = getFilteredHistoryRecords();
    if (!recordsToExport.length) {
      toast.error('No records to export');
      return;
    }
    try {
      const { default: jsPDF } = await import('jspdf');
      const { default: autoTable } = await import('jspdf-autotable');

      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      const pageWidth = doc.internal.pageSize.getWidth();

      // ── HEADER BACKGROUND ──────────────────────────────────────────
      doc.setFillColor(109, 40, 217); // violet-700
      doc.rect(0, 0, pageWidth, 38, 'F');

      // Logo
      try {
        const img = new Image();
        img.src = '/logo.png';
        await new Promise((res) => { img.onload = res; img.onerror = res; });
        doc.addImage(img, 'PNG', 8, 4, 28, 28);
      } catch (_) {}

      // School title
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.text('Adamjee Coaching Center', 42, 14);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text('Campus 12 — Student Attendance Report', 42, 21);

      // Date generated
      doc.setFontSize(7.5);
      doc.setTextColor(220, 200, 255);
      doc.text(`Generated: ${new Date().toLocaleString('en-PK')}`, 42, 27);

      // ── FILTER INFO BOX ─────────────────────────────────────────────
      doc.setFillColor(245, 243, 255); // very light violet
      doc.setDrawColor(200, 185, 255);
      doc.roundedRect(8, 42, pageWidth - 16, 18, 3, 3, 'FD');

      doc.setTextColor(80, 40, 160);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);

      const fromLabel = historyModalFilters.fromDate
        ? new Date(historyModalFilters.fromDate).toLocaleDateString('en-PK', { year: 'numeric', month: 'short', day: 'numeric' })
        : 'All';
      const toLabel = historyModalFilters.toDate
        ? new Date(historyModalFilters.toDate).toLocaleDateString('en-PK', { year: 'numeric', month: 'short', day: 'numeric' })
        : 'All';
      const statusLabel = historyModalFilters.status
        ? historyModalFilters.status.charAt(0) + historyModalFilters.status.slice(1).toLowerCase()
        : 'All';

      doc.text(`Date Range:  ${fromLabel}  →  ${toLabel}`, 14, 51);
      doc.text(`Status Filter:  ${statusLabel}`, 14, 57);
      doc.setTextColor(109, 40, 217);
      doc.setFont('helvetica', 'bold');
      const totalTxt = `Total Records: ${recordsToExport.length}`;
      doc.text(totalTxt, pageWidth - 14, 51, { align: 'right' });

      // Count present/absent
      const presentCount = recordsToExport.filter(r => r.status === 'PRESENT').length;
      const absentCount = recordsToExport.filter(r => r.status === 'ABSENT').length;
      doc.setFontSize(7.5);
      doc.setTextColor(22, 163, 74);
      doc.text(`Present: ${presentCount}`, pageWidth - 14, 57, { align: 'right' });
      doc.setTextColor(220, 38, 38);

      // ── TABLE ────────────────────────────────────────────────────────
      const tableData = recordsToExport.map((record, idx) => {
        const student = record.student;
        const name = student ? `${student.first_name || ''} ${student.last_name || ''}`.trim() : '—';
        const grNo = student?.details?.academic_info?.roll_no || student?.details?.student?.roll_no || student?.registration_no || '—';
        const className = getClassName(student?.details?.academic_info?.class_id);
        const sectionName = getSectionName(student?.details?.academic_info?.section_id || student?.section);
        const classSection = `${className} - ${sectionName}`;
        const date = record.date ? new Date(record.date).toLocaleDateString('en-PK', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';
        const timeIn = record.created_at ? new Date(record.created_at).toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit', hour12: true }) : '—';
        const status = record.status ? record.status.charAt(0) + record.status.slice(1).toLowerCase() : '—';
        return [idx + 1, date, name, grNo, classSection, status, timeIn];
      });

      autoTable(doc, {
        startY: 64,
        head: [['#', 'Date', 'Student Name', 'GR No', 'Class / Section', 'Status', 'Time In']],
        body: tableData,
        styles: {
          fontSize: 7,
          cellPadding: 1.5,
          font: 'helvetica',
          textColor: [30, 30, 50],
          lineColor: [220, 215, 255],
          lineWidth: 0.2,
        },
        headStyles: {
          fillColor: [109, 40, 217],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 8,
          halign: 'center',
        },
        alternateRowStyles: { fillColor: [248, 245, 255] },
        columnStyles: {
          0: { halign: 'center' },
          1: {},
          2: {},
          3: { halign: 'center' },
          4: {},
          5: { halign: 'center' },
          6: { halign: 'center' },
        },
        didDrawCell: (data) => {
          if (data.column.index === 5 && data.section === 'body') {
            const status = data.cell.raw;
            if (status === 'Present') {
              doc.setTextColor(22, 163, 74);
            } else if (status === 'Absent') {
              doc.setTextColor(220, 38, 38);
            } else {
              doc.setTextColor(30, 30, 50);
            }
          }
        },
        margin: { left: 8, right: 8 },
        tableLineColor: [200, 185, 255],
        tableLineWidth: 0.3,
      });

      // ── FOOTER ───────────────────────────────────────────────────────
      const finalY = doc.lastAutoTable.finalY + 6;
      doc.setDrawColor(200, 185, 255);
      doc.line(8, finalY, pageWidth - 8, finalY);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(150, 130, 200);
      doc.text('Adamjee Coaching Center — Confidential Attendance Record', pageWidth / 2, finalY + 5, { align: 'center' });

      // Page numbers
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(7);
        doc.setTextColor(170, 150, 220);
        doc.text(`Page ${i} of ${pageCount}`, pageWidth - 10, doc.internal.pageSize.getHeight() - 5, { align: 'right' });
      }

      const fileName = `attendance_${historyModalFilters.fromDate || 'all'}_${statusLabel.toLowerCase()}.pdf`;
      doc.save(fileName);
      toast.success('PDF exported successfully!');
    } catch (err) {
      console.error('PDF export error:', err);
      toast.error('Failed to export PDF');
    }
  };

  const openHistoryModal = () => {
    const today = new Date().toISOString().split('T')[0];
    const todayFilters = { fromDate: today, toDate: today, status: '', classId: '', sectionId: '' };
    setHistoryModalFilters(todayFilters);
    setHistorySearchQuery('');
    setHistoryModalRecords([]);
    setHistoryModalFetched(false);
    setIsHistoryModalOpen(true);
    // Auto-fetch today's records using direct params
    fetchHistoryModal(todayFilters);
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

  const handleDeleteAttendance = async () => {
    if (!deleteRecord) return;
    try {
      setIsDeleting(true);
      await apiClient.delete(`/api/attendance/${deleteRecord.id}`);
      toast.success(`Attendance for ${deleteRecord.studentName} deleted successfully`);
      setDeleteRecord(null);
      fetchHistoryModal();
      fetchTodayAttendance();
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Failed to delete attendance');
    } finally {
      setIsDeleting(false);
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
            <Button onClick={fetchManualStudents} disabled={manualFetchingStudents}>
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
                We couldn't find any students in your branch. Please check the student management section.
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 min-h-[500px]">
          {/* Left Side: Scanner Input & Instructions */}
          <div className="space-y-6 flex flex-col justify-center border-r pr-8">
            <div className="text-center space-y-4">
              <div className="bg-indigo-50 dark:bg-indigo-900/20 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-2 shadow-inner border border-indigo-100 dark:border-indigo-800">
                <Scan className={`h-12 w-12 text-indigo-600 dark:text-indigo-400 ${scanInput ? 'animate-pulse' : ''}`} />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">Ready to Scan</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Please scan student ID card using the hand scanner</p>
              </div>
              
              <form onSubmit={handleHandScan} className="w-full relative pt-4">
                {/* Hidden but focused input for hand scanner */}
                <Input
                  ref={scannerInputRef}
                  value={scanInput}
                  onChange={(e) => setScanInput(e.target.value)}
                  placeholder="Scanning..."
                  autoFocus
                  className="fixed -top-10 left-0 opacity-0 h-1 w-1"
                  autoComplete="off"
                  onBlur={() => {
                    if (isScannerModalOpen) {
                      setTimeout(() => scannerInputRef.current?.focus(), 10);
                    }
                  }}
                />
                
                <div 
                  className={`bg-white dark:bg-gray-800 border-2 border-dashed rounded-2xl p-8 text-center shadow-inner transition-all duration-300 ${
                    scanningStatus === 'checking' || scanningStatus === 'marking' 
                      ? 'border-indigo-500 bg-indigo-50/50' 
                      : 'border-indigo-200 dark:border-indigo-800'
                  }`}
                  onClick={() => scannerInputRef.current?.focus()}
                >
                  <div className="flex flex-col items-center gap-3">
                    {scanningStatus === 'checking' || scanningStatus === 'marking' ? (
                      <div className="flex flex-col items-center gap-4">
                        <div className="h-12 w-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-lg font-mono font-bold text-indigo-600 dark:text-indigo-400 tracking-widest">PROCESSING SCAN...</span>
                      </div>
                    ) : (
                      <>
                        <div className="w-3 h-3 rounded-full bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.6)] animate-pulse"></div>
                        <span className="text-lg font-mono font-bold text-indigo-600 dark:text-indigo-400 tracking-widest">LISTENING FOR SCANS...</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-center gap-2 text-xs font-medium text-gray-400">
                  <div className={`w-2 h-2 rounded-full ${isScannerModalOpen ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                  Scanner focused & ready
                </div>
              </form>

              <div className="pt-8 text-left">
                <div className="flex items-center justify-between mb-4 border-b pb-2">
                  <h4 className="text-sm font-bold uppercase tracking-wider text-gray-500 flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Recent Scans
                  </h4>
                  <Badge variant="outline" className="rounded-full">{recentScans.length}</Badge>
                </div>

                <div className="space-y-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                  {recentScans.length > 0 ? (
                    recentScans.map((student) => (
                      <div 
                        key={student.id || student._id} 
                        className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/30 hover:bg-white dark:hover:bg-gray-800 transition-colors"
                      >
                        <div className="h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-indigo-700 dark:text-indigo-300 text-xs font-bold shrink-0">
                          {student.fullName?.charAt(0) || 'S'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold truncate">{student.fullName}</p>
                          <p className="text-[10px] text-gray-500">{student.registrationNumber || student.registration_no}</p>
                        </div>
                        <Badge className={student.already_marked ? "bg-amber-100 text-amber-700 text-[10px]" : "bg-green-100 text-green-700 text-[10px]"}>
                          {student.already_marked ? "Already" : "Marked"}
                        </Badge>
                      </div>
                    ))
                  ) : (
                    <p className="text-center py-8 text-xs text-gray-400 italic">No scans yet in this session</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Side: Student Details & Fee Status */}
          <div className="space-y-6">
            {scanningStatus === 'checking' || scanningStatus === 'marking' ? (
              <div className="h-full flex flex-col items-center justify-center space-y-4 bg-gray-50/50 dark:bg-gray-900/20 rounded-3xl border-2 border-dashed border-indigo-200 p-8">
                <div className="h-16 w-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                <div className="text-center">
                  <h4 className="text-xl font-bold text-indigo-600">Fetching Student Info</h4>
                  <p className="text-sm text-gray-400 mt-2">Please wait while we retrieve the records...</p>
                </div>
              </div>
            ) : lastScannedStudent ? (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                {/* Student Header Info */}
                <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4">
                    {lastScannedStudent.already_marked ? (
                      <Badge className="bg-amber-100 text-amber-700 border-amber-200 px-3 py-1 text-sm font-bold shadow-sm">
                        ALREADY MARKED
                      </Badge>
                    ) : (
                      <Badge className="bg-green-100 text-green-700 border-green-200 px-3 py-1 text-sm font-bold shadow-sm">
                        PRESENT MARKED
                      </Badge>
                    )}
                  </div>

                  <div className="flex flex-col items-center sm:items-start sm:flex-row gap-6">
                    <div className="relative shrink-0">
                      {lastScannedStudent.avatar_url ? (
                        <img 
                          src={lastScannedStudent.avatar_url} 
                          alt={lastScannedStudent.fullName} 
                          className="h-28 w-28 rounded-2xl object-cover border-4 border-indigo-50 dark:border-indigo-900/30 shadow-lg"
                        />
                      ) : (
                        <div className="h-28 w-28 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-4xl font-black shadow-lg">
                          {lastScannedStudent.fullName?.charAt(0) || 'S'}
                        </div>
                      )}
                      <div className="absolute -bottom-2 -right-2 bg-green-500 rounded-full p-1.5 border-4 border-white dark:border-gray-800 shadow-md">
                        <CheckCircle className="h-5 w-5 text-white" />
                      </div>
                    </div>
                    
                    <div className="flex-1 text-center sm:text-left min-w-0 pt-2">
                      <h3 className="text-2xl font-black text-gray-900 dark:text-white truncate tracking-tight uppercase">
                        {lastScannedStudent.fullName}
                      </h3>
                      <div className="flex flex-wrap justify-center sm:justify-start gap-x-4 gap-y-1 mt-2">
                        <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                          <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 font-mono text-xs">REG: {lastScannedStudent.registrationNumber || lastScannedStudent.registration_no}</Badge>
                        </div>
                        <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                          <Badge variant="secondary" className="bg-purple-50 text-purple-700 font-mono text-xs">GR NO: {lastScannedStudent.rollNumber || 'N/A'}</Badge>
                        </div>
                      </div>
                      <div className="mt-4 flex flex-wrap justify-center sm:justify-start gap-3">
                         <span className="text-xs font-bold px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700">{lastScannedStudent.branchName}</span>
                         <span className="text-xs font-bold px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700">CLASS {lastScannedStudent.classId || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Fee Status Card */}
                <div className="bg-gradient-to-br from-gray-50 to-white dark:from-gray-900/50 dark:to-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 shadow-sm overflow-hidden relative">
                  <div className="absolute -right-8 -bottom-8 text-gray-100 dark:text-gray-800">
                    <DollarSign className="w-32 h-32 rotate-12" />
                  </div>
                  
                  <div className="flex items-center justify-between mb-6 relative z-10">
                    <h4 className="text-lg font-bold flex items-center gap-2">
                      <DollarSign className="h-5 w-5 text-indigo-500" />
                      Fee Status Breakdown
                    </h4>
                    {lastScannedStudent.feeInfo?.status === 'PAID' ? (
                      <Badge className="bg-green-500 hover:bg-green-600 text-white px-4 py-1.5 rounded-full font-black tracking-widest text-xs">FULL PAID</Badge>
                    ) : lastScannedStudent.feeInfo?.status === 'PARTIAL' ? (
                      <Badge className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-1.5 rounded-full font-black tracking-widest text-xs">PARTIAL PAID</Badge>
                    ) : (
                      <Badge className="bg-red-500 hover:bg-red-600 text-white px-4 py-1.5 rounded-full font-black tracking-widest text-xs">UNPAID</Badge>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4 relative z-10">
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                      <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1">Total Amount</p>
                      <p className="text-xl font-black text-gray-900 dark:text-white">Rs. {lastScannedStudent.feeInfo?.amount_due || 0}</p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                      <p className="text-[10px] text-green-500 uppercase font-black tracking-widest mb-1">Paid Amount</p>
                      <p className="text-xl font-black text-green-600 dark:text-green-400">Rs. {lastScannedStudent.feeInfo?.paid_amount || 0}</p>
                    </div>
                    <div className="col-span-2 bg-indigo-600 p-5 rounded-2xl shadow-lg border border-indigo-400">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-[10px] text-indigo-100 uppercase font-black tracking-widest mb-1">Outstanding Balance</p>
                          <p className="text-3xl font-black text-white">Rs. {lastScannedStudent.feeInfo?.outstanding || 0}</p>
                        </div>
                        <div className="h-12 w-12 bg-white/20 rounded-full flex items-center justify-center">
                          <Clock className="h-6 w-6 text-white" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center gap-2 text-[10px] text-gray-400 font-bold px-1 relative z-10 uppercase tracking-widest">
                    <Search className="h-3 w-3" />
                    Voucher #: {lastScannedStudent.feeInfo?.voucher_no}
                  </div>
                </div>
                
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-2xl border border-blue-100 dark:border-blue-800 flex items-start gap-3">
                  <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
                  <p className="text-xs text-blue-700 dark:text-blue-300 font-medium">
                    SMS/Notification has been sent to the student automatically. Latest scan time: <span className="font-bold">{lastScannedStudent.scanTime}</span>
                  </p>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-6 bg-gray-50/50 dark:bg-gray-900/20 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-800 p-8">
                <div className="bg-white dark:bg-gray-800 w-24 h-24 rounded-full flex items-center justify-center shadow-md">
                  <UserSearch className="h-12 w-12 text-gray-200" />
                </div>
                <div>
                  <h4 className="text-xl font-bold text-gray-400">No Student Scanned</h4>
                  <p className="text-sm text-gray-400 max-w-[250px] mx-auto mt-2">Scan a student ID card to view their details and fee status here.</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 pt-6 border-t flex justify-end">
          <Button variant="outline" size="lg" className="rounded-xl px-8" onClick={handleCloseScanner}>
            Close Scanner Session
          </Button>
        </div>
      </Modal>

      {/* Bulk Upload Modal */}
      <Modal
        open={isBulkUploadModalOpen}
        onClose={() => setIsBulkUploadModalOpen(false)}
        title="Bulk Attendance Upload"
        size="lg"
      >
        <form onSubmit={handleBulkUpload} className="space-y-6">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
            <p className="font-bold mb-1">Instructions:</p>
            <ul className="list-disc ml-4 space-y-1">
              <li>Upload a <b>.txt</b> or <b>.csv</b> file.</li>
              <li>The file should contain <b>GR Numbers, Roll Numbers, Registration Numbers, or System IDs</b> (one per line or separated by commas).</li>
              <li>Example: 1001, REG-2024-0001, 5f8d0d55...</li>
            </ul>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Attendance Date</Label>
              <DatePicker
                value={bulkUploadDate}
                onChange={(e) => setBulkUploadDate(e.target.value)}
                disableFuture={true}
              />
            </div>

            <div className="space-y-2">
              <Label>Select File</Label>
              <div className="relative">
                <input
                  type="file"
                  accept=".txt,.csv"
                  onChange={(e) => setBulkUploadFile(e.target.files[0])}
                  className="hidden"
                  id="bulk-file-upload-branch"
                />
                <label
                  htmlFor="bulk-file-upload-branch"
                  className="flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-xl hover:border-indigo-500 hover:bg-indigo-50 transition-all cursor-pointer group"
                >
                  <FileText className="h-5 w-5 text-gray-400 group-hover:text-indigo-500" />
                  <span className="text-sm font-medium text-gray-600 group-hover:text-indigo-600">
                    {bulkUploadFile ? bulkUploadFile.name : 'Choose Text/CSV File'}
                  </span>
                </label>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => setIsBulkUploadModalOpen(false)} type="button">
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="bg-emerald-600 hover:bg-emerald-700 text-white min-w-[120px]"
              disabled={saving || !bulkUploadFile}
            >
              {saving ? <ButtonLoader /> : 'Upload & Mark'}
            </Button>
          </div>
        </form>
      </Modal>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-5 border-slate-100 dark:border-slate-800">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
            <UserSearch className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
            Student Attendance
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage daily student attendance, QR scanning, manual registry, and holidays.
          </p>
        </div>
      </div>

      {/* ============ GRID LAYOUT ============ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: Controls & Filters (col-span-4) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Quick Operations Card */}
          <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850">
            <CardHeader className="bg-slate-50/50 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-805 py-4">
              <CardTitle className="text-md font-bold flex items-center gap-2 text-slate-800 dark:text-slate-200">
                <CheckCircle className="h-4 w-4 text-emerald-500" />
                Operations Control
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-2 gap-2">
                <Button 
                  onClick={handleOpenScanner}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm flex flex-col items-center justify-center h-20 rounded-2xl p-2 gap-1"
                >
                  <Scan className="h-5 w-5" />
                  <span className="text-xs font-bold">Scanner</span>
                </Button>
                
                <Button 
                  onClick={() => setIsManualModalOpen(true)} 
                  variant="outline"
                  className="border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 flex flex-col items-center justify-center h-20 rounded-2xl p-2 gap-1 text-slate-700 dark:text-slate-200"
                >
                  <UserSearch className="h-5 w-5 text-indigo-500" />
                  <span className="text-xs font-bold">Manual GR</span>
                </Button>

                <Button 
                  onClick={() => setManualAttendanceModalOpen(true)} 
                  variant="outline"
                  className="border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 flex flex-col items-center justify-center h-20 rounded-2xl p-2 gap-1 text-slate-700 dark:text-slate-200"
                >
                  <Users className="h-5 w-5 text-violet-500" />
                  <span className="text-xs font-bold">Bulk Manual</span>
                </Button>

                <Button
                  onClick={() => setIsBulkUploadModalOpen(true)}
                  variant="outline"
                  className="border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 flex flex-col items-center justify-center h-20 rounded-2xl p-2 gap-1 text-slate-700 dark:text-slate-200"
                >
                  <Upload className="h-5 w-5 text-emerald-500" />
                  <span className="text-xs font-bold">Bulk Upload</span>
                </Button>

                <Button
                  onClick={fetchAutoAbsentPreview}
                  disabled={fetchingAutoAbsent || isProcessingAutoAbsent}
                  variant="outline"
                  className="border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 flex flex-col items-center justify-center h-20 rounded-2xl p-2 gap-1 text-slate-700 dark:text-slate-200"
                >
                  {fetchingAutoAbsent || isProcessingAutoAbsent ? (
                    <ButtonLoader color="rose" />
                  ) : (
                    <XCircle className="h-5 w-5 text-rose-500" />
                  )}
                  <span className="text-xs font-bold">Auto Absent</span>
                </Button>

                <Button 
                  onClick={() => setIsHolidayModalOpen(true)} 
                  variant="outline"
                  className="border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 flex flex-col items-center justify-center h-20 rounded-2xl p-2 gap-1 text-slate-700 dark:text-slate-200"
                >
                  <Calendar className="h-5 w-5 text-amber-500" />
                  <span className="text-xs font-bold">Mark Holiday</span>
                </Button>

                <Button
                  onClick={openHistoryModal}
                  className="col-span-2 bg-violet-600 hover:bg-violet-700 text-white flex items-center justify-center h-10 rounded-xl gap-2 font-bold text-sm shadow-sm"
                >
                  <Calendar className="h-4 w-4" />
                  View Attendance History
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Unified Filters Card */}
          <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850">
            <CardHeader className="bg-slate-50/50 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-805 py-4 flex flex-row items-center justify-between">
              <CardTitle className="text-md font-bold flex items-center gap-2 text-slate-800 dark:text-slate-200">
                <Search className="h-4 w-4 text-indigo-500" />
                Filters
              </CardTitle>
              <button
                type="button"
                onClick={handleClearFilters}
                className="text-xs text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 font-bold transition-colors cursor-pointer flex items-center gap-1 hover:underline"
              >
                <X className="h-3 w-3" />
                Clear Filters
              </button>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="space-y-1 relative z-30">
                <Label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Date</Label>
                <DatePicker
                  value={attendanceDate}
                  onChange={(e) => setAttendanceDate(e.target.value)}
                />
              </div>
              
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Class *</Label>
                <Dropdown
                  name="class"
                  value={selectedClass}
                  onChange={(e) => {
                    setSelectedClass(e.target.value);
                    setSelectedSection('');
                  }}
                  options={classes.length === 0 ? [{ value: '', label: 'This Branch Classes Not Found' }] : classes.map((c) => ({ value: c.id || c._id, label: c.name }))}
                  placeholder={classes.length === 0 ? "This Branch Classes Not Found" : "Select class"}
                  openUpward={true}
                />
              </div>
              
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Section *</Label>
                <Dropdown
                  name="section"
                  value={selectedSection}
                  onChange={(e) => setSelectedSection(e.target.value)}
                  options={sections.length === 0 && selectedClass ? [{ value: '', label: 'Sections Not Found' }] : sections.map((s) => {
                    const clsName = classes.find(c => c.id === selectedClass || c._id === selectedClass)?.name || '';
                    const cleanLabel = s.name.replace(new RegExp(clsName, 'gi'), '').replace(/^[\s\-\/\|]+|[\s\-\/\|]+$/g, '').trim() || s.name;
                    return { value: s.id || s._id || s.name, label: cleanLabel };
                  })}
                  disabled={!selectedClass}
                  placeholder={!selectedClass ? "Select class first" : sections.length === 0 ? "Sections Not Found" : "Select section"}
                  openUpward={true}
                />
              </div>

            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN: Search, Marked List & Class Sheets (col-span-8) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Quick Student Search */}
          <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850">
            <CardHeader className="bg-slate-50/50 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-805 py-3 px-5">
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-800 dark:text-slate-200">
                <UserSearch className="w-4 h-4 text-indigo-500" />
                Quick Search & Mark Attendance
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by name, registration #, GR #, email, or phone..."
                  value={studentSearchQuery}
                  onChange={(e) => setStudentSearchQuery(e.target.value)}
                  className="pl-10 h-10 text-sm rounded-xl"
                />
                {searching && (
                  <div className="absolute right-3 top-2">
                    <ButtonLoader />
                  </div>
                )}
              </div>
              
              {searchResults.length > 0 && (
                <div className="border rounded-2xl overflow-hidden max-h-64 overflow-y-auto shadow-sm">
                  <Table className="text-xs">
                    <TableHeader className="bg-slate-50 dark:bg-slate-800/50">
                      <TableRow>
                        <TableHead className="py-2">Student</TableHead>
                        <TableHead className="py-2">GR #</TableHead>
                        <TableHead className="py-2">Class/Section</TableHead>
                        <TableHead className="py-2">Fee Status</TableHead>
                        <TableHead className="py-2 text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {searchResults.map((student) => (
                        <TableRow key={student.id || student._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                          <TableCell className="py-2">
                            <div>
                              <div className="font-bold text-slate-800 dark:text-slate-200">{(student.first_name || student.firstName) ? `${student.first_name || student.firstName} ${student.last_name || student.lastName || ''}` : student.fullName}</div>
                              <div className="text-[10px] text-gray-500">{student.email}</div>
                            </div>
                          </TableCell>
                          <TableCell className="py-2 font-mono">{student.roll_no || student.rollNumber || student.details?.academic_info?.roll_no || '—'}</TableCell>
                          <TableCell className="py-2" title={`${getClassName(student.classId || student.details?.academic_info?.class_id || student.class)} / ${getSectionName(student.section || student.details?.academic_info?.section_id)}`}>
                            {getClassName(student.classId || student.details?.academic_info?.class_id || student.class)} / {getSectionName(student.section || student.details?.academic_info?.section_id)}
                          </TableCell>
                          <TableCell className="py-2">
                            <Badge className={`px-2 py-0.5 text-[10px] font-bold ${student.hasPaidFees ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'}`}>
                              {student.feeStatus || 'unpaid'}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-2 text-right">
                            <div className="flex justify-end gap-1.5">
                              <Button
                                size="sm"
                                className="h-7 px-2.5 text-xs bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg gap-1 font-bold"
                                onClick={() => markStudentAttendance(student, 'present')}
                                disabled={saving}
                              >
                                <CheckCircle className="w-3.5 h-3.5" />
                                Present
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 w-7 p-0 rounded-lg flex items-center justify-center"
                                onClick={() => viewStudentAttendance(student.id || student._id)}
                              >
                                <Eye className="w-3.5 h-3.5 text-slate-500" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Marked Students Today */}
          {markedStudents.length > 0 && (
            <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850">
              <CardHeader className="bg-slate-50/50 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-805 py-3 px-5">
                <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-800 dark:text-slate-200">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  Marked Students Today ({markedStudents.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="border rounded-2xl overflow-hidden max-h-60 overflow-y-auto shadow-sm">
                  <Table className="text-xs">
                    <TableHeader className="bg-slate-50 dark:bg-slate-800/50">
                      <TableRow>
                        <TableHead className="py-2">Student</TableHead>
                        <TableHead className="py-2">GR #</TableHead>
                        <TableHead className="py-2">Class/Section</TableHead>
                        <TableHead className="py-2">Fee Status</TableHead>
                        <TableHead className="py-2">Status</TableHead>
                        <TableHead className="py-2 text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {markedStudents.map((student) => (
                        <TableRow key={student.id || student._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                          <TableCell className="py-2">
                            <div>
                              <div className="font-bold text-slate-800 dark:text-slate-200">{student.fullName}</div>
                              <div className="text-[10px] text-gray-500">{student.email}</div>
                            </div>
                          </TableCell>
                          <TableCell className="py-2 font-mono">{student.rollNumber || '—'}</TableCell>
                          <TableCell className="py-2" title={`${getClassName(student.classId || student.details?.academic_info?.class_id || student.class)} / ${getSectionName(student.section || student.details?.academic_info?.section_id)}`}>
                            {getClassName(student.classId || student.details?.academic_info?.class_id || student.class)} / {getSectionName(student.section || student.details?.academic_info?.section_id)}
                          </TableCell>
                          <TableCell className="py-2">
                            <Badge className={`px-2 py-0.5 text-[10px] font-bold ${student.hasPaidFees ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'}`}>
                              {student.feeStatus || 'unpaid'}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-2">
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                              <CheckCircle className="w-3.5 h-3.5" />
                              Present
                            </span>
                          </TableCell>
                          <TableCell className="py-2 text-right">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 w-7 p-0 rounded-lg flex items-center justify-center ml-auto"
                              onClick={() => viewStudentAttendance(student.id || student._id)}
                            >
                              <Eye className="w-3.5 h-3.5 text-slate-500" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Class Attendance Sheet */}
          {selectedClass && selectedSection && (
            <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850">
              <CardHeader className="bg-slate-50/50 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-805 py-3 px-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="space-y-0.5">
                  <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-800 dark:text-slate-200">
                    <Users className="w-4 h-4 text-indigo-500" />
                    Attendance Sheet
                  </CardTitle>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500">
                    Class: {getClassName(selectedClass)} | Section: {getSectionName(selectedSection)}
                  </p>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                  <div className="space-y-4">
                    {/* Inner controls */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <div className="relative w-full sm:w-64">
                        <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-gray-500" />
                        <Input
                          placeholder="Search class students..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-8 h-8 text-xs rounded-xl"
                        />
                      </div>
                      <Button 
                        onClick={handleSubmit} 
                        disabled={saving}
                        className="w-full sm:w-auto h-8 px-4 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl gap-1.5 shadow-sm"
                      >
                        {saving ? <ButtonLoader /> : <Save className="h-3.5 w-3.5" />}
                        Save Attendance Sheet
                      </Button>
                    </div>

                    {loading ? (
                      <div className="border rounded-2xl p-4 bg-white dark:bg-slate-900 shadow-sm">
                        <TableSkeleton rows={5} />
                      </div>
                    ) : filteredStudents.length === 0 ? (
                      <div className="text-center py-8 text-xs text-gray-500 font-medium">
                        This Branch Students Not Found
                      </div>
                    ) : (
                      <div className="border rounded-2xl overflow-hidden max-h-[500px] overflow-y-auto shadow-sm">
                        <Table className="text-xs">
                          <TableHeader className="bg-slate-50 dark:bg-slate-800/50 sticky top-0 z-10">
                            <TableRow>
                              <TableHead className="py-2.5">GR No.</TableHead>
                              <TableHead className="py-2.5">Student Name</TableHead>
                              <TableHead className="py-2.5 text-center">Status Selection</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredStudents.map(student => {
                              const studentId = student.id || student._id;
                              const currentStatus = attendanceRecords[studentId];
                              
                              return (
                                <TableRow key={studentId} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                                  <TableCell className="py-2 font-mono font-bold text-slate-600 dark:text-slate-400">
                                    {student.details?.academic_info?.roll_no || student.rollNumber || student.roll_no || 'N/A'}
                                  </TableCell>
                                  <TableCell className="py-2 font-bold text-slate-800 dark:text-slate-200">
                                    {student.first_name || student.firstName || ''} {student.last_name || student.lastName || ''}
                                  </TableCell>
                                  <TableCell className="py-1 text-center">
                                    <div className="inline-flex rounded-xl border border-slate-200 dark:border-slate-800 p-0.5 bg-slate-50 dark:bg-slate-800 shadow-inner">
                                      <button
                                        type="button"
                                        onClick={() => handleStatusChange(studentId, 'present')}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                          currentStatus === 'present'
                                            ? 'bg-emerald-500 text-white shadow-sm'
                                            : 'text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-350'
                                        }`}
                                      >
                                        <CheckCircle className="h-3.5 w-3.5" />
                                        Present
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleStatusChange(studentId, 'absent')}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                          currentStatus === 'absent'
                                            ? 'bg-rose-500 text-white shadow-sm'
                                            : 'text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-350'
                                        }`}
                                      >
                                        <XCircle className="h-3.5 w-3.5" />
                                        Absent
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleStatusChange(studentId, 'late')}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                          currentStatus === 'late'
                                            ? 'bg-amber-500 text-white shadow-sm'
                                            : 'text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-350'
                                        }`}
                                      >
                                        <Clock className="h-3.5 w-3.5" />
                                        Late
                                      </button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* ============ HISTORY MODAL ============ */}
      {isHistoryModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[200] p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-[1.5rem] shadow-2xl w-full max-w-7xl max-h-[90vh] flex flex-col border border-slate-100 dark:border-slate-800 overflow-hidden">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-violet-600 to-indigo-600 shrink-0">
              <div className="flex items-center gap-2">
                <div className="p-1 bg-white/20 rounded-md">
                  <Calendar className="h-4 w-4 text-white" />
                </div>
                <h2 className="text-base font-black text-white tracking-tight">Attendance History</h2>
              </div>
              <button
                onClick={() => setIsHistoryModalOpen(false)}
                className="p-1 hover:bg-white/20 rounded-full transition-colors"
              >
                <X className="h-4 w-4 text-white" />
              </button>
            </div>

            {/* Filters Row */}
            <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 shrink-0 space-y-1">
              {/* Row 1: Search & Date Filters */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-2 items-end">
                {/* Search Input */}
                <div className="space-y-0.5 md:col-span-4">
                  <Label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">Search</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search by name or GR No..."
                      value={historySearchQuery}
                      onChange={(e) => setHistorySearchQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all font-medium text-slate-700 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500"
                    />
                  </div>
                </div>

                {/* From Date */}
                <div className="space-y-0.5 md:col-span-4">
                  <Label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">From</Label>
                  <DatePicker
                    value={historyModalFilters.fromDate}
                    onChange={(e) => {
                      const newFilters = { ...historyModalFilters, fromDate: e.target.value };
                      setHistoryModalFilters(newFilters);
                      fetchHistoryModal(newFilters);
                    }}
                  />
                </div>

                {/* To Date */}
                <div className="space-y-0.5 md:col-span-4">
                  <Label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">To</Label>
                  <DatePicker
                    value={historyModalFilters.toDate}
                    onChange={(e) => {
                      const newFilters = { ...historyModalFilters, toDate: e.target.value };
                      setHistoryModalFilters(newFilters);
                      fetchHistoryModal(newFilters);
                    }}
                  />
                </div>
              </div>

              {/* Row 2: Class, Section, Status, Actions */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-2 items-end">
                {/* Class */}
                <div className="space-y-0.5 md:col-span-3">
                  <Label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">Class</Label>
                  <Dropdown
                    name="historyClass"
                    value={historyModalFilters.classId}
                    onChange={(e) => {
                      const newFilters = { ...historyModalFilters, classId: e.target.value, sectionId: '' };
                      setHistoryModalFilters(newFilters);
                      fetchHistoryModal(newFilters);
                    }}
                    options={[
                      { value: '', label: 'All Classes' },
                      ...classes.map((c) => ({ value: c.id || c._id, label: c.name }))
                    ]}
                    placeholder="All Classes"
                    openUpward={true}
                  />
                </div>

                {/* Section */}
                <div className="space-y-0.5 md:col-span-3">
                  <Label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">Section</Label>
                  <Dropdown
                    name="historySection"
                    value={historyModalFilters.sectionId}
                    onChange={(e) => {
                      const newFilters = { ...historyModalFilters, sectionId: e.target.value };
                      setHistoryModalFilters(newFilters);
                      fetchHistoryModal(newFilters);
                    }}
                    options={[
                      { value: '', label: 'All Sections' },
                      ...historySections.map((s) => {
                        const clsName = classes.find(c => c.id === historyModalFilters.classId || c._id === historyModalFilters.classId)?.name || '';
                        const cleanLabel = s.name.replace(new RegExp(clsName, 'gi'), '').replace(/^[\s\-\/\|]+|[\s\-\/\|]+$/g, '').trim() || s.name;
                        return { value: s.id || s._id || s.name, label: cleanLabel };
                      })
                    ]}
                    disabled={!historyModalFilters.classId}
                    placeholder={!historyModalFilters.classId ? "Select class first" : "All Sections"}
                    openUpward={true}
                  />
                </div>

                {/* Status Pills */}
                <div className="space-y-0.5 md:col-span-4">
                  <Label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">Status</Label>
                  <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 w-fit">
                    {[
                      { value: '', label: 'All', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>, activeClass: 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-100 shadow-sm border border-slate-200 dark:border-slate-600' },
                      { value: 'PRESENT', label: 'Present', icon: <CheckCircle className="h-4 w-4" />, activeClass: 'bg-emerald-500 text-white shadow-sm shadow-emerald-200' },
                      { value: 'ABSENT', label: 'Absent', icon: <XCircle className="h-4 w-4" />, activeClass: 'bg-red-500 text-white shadow-sm shadow-red-200' },
                    ].map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => {
                          const newFilters = { ...historyModalFilters, status: opt.value };
                          setHistoryModalFilters(newFilters);
                          fetchHistoryModal(newFilters);
                        }}
                        className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold transition-all ${
                          historyModalFilters.status === opt.value
                            ? opt.activeClass
                            : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-350'
                        }`}
                      >
                        {opt.icon}
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 md:col-span-2 justify-end w-full">
                  <Button
                    onClick={() => {
                      const today = new Date().toISOString().split('T')[0];
                      const todayFilters = { fromDate: today, toDate: today, status: '', classId: '', sectionId: '' };
                      setHistoryModalFilters(todayFilters);
                      setHistorySearchQuery('');
                      fetchHistoryModal(todayFilters);
                    }}
                    variant="outline"
                    className="border-2 border-slate-200 dark:border-slate-700 font-bold rounded-lg gap-1.5 p-1 hover:bg-slate-50 dark:hover:bg-slate-800 h-8 w-8 justify-center shrink-0"
                    title="Reset Filters"
                  >
                    <RefreshCw className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                  </Button>
                  
                  <Button
                    onClick={() => fetchHistoryModal()}
                    disabled={historyModalLoading}
                    className="bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-lg gap-1.5 flex-1 h-8 text-[11px] justify-center shadow-lg shadow-violet-200 dark:shadow-none"
                  >
                    {historyModalLoading ? <ButtonLoader color="white" /> : <Search className="h-4 w-4" />}
                    Search
                  </Button>
                </div>
              </div>
            </div>

            {/* Records Table */}
            <div className="flex-1 overflow-y-auto">
              {historyModalLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <div className="h-12 w-12 border-4 border-violet-600 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-sm text-slate-500 font-medium">Loading attendance records...</p>
                </div>
              ) : historyModalFetched && historyModalRecords.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                  <div className="p-5 bg-slate-100 dark:bg-slate-800 rounded-full">
                    <Calendar className="h-10 w-10 text-slate-300" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-500">No Records Found</h3>
                  <p className="text-sm text-slate-400">No attendance records found for the selected filters.</p>
                </div>
              ) : historyModalFetched && getFilteredHistoryRecords().length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                  <div className="p-5 bg-slate-100 dark:bg-slate-800 rounded-full">
                    <Search className="h-10 w-10 text-slate-300" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-500">No Match Found</h3>
                  <p className="text-sm text-slate-400">Try adjusting your search query or filters.</p>
                </div>
              ) : !historyModalFetched ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
                  <Calendar className="h-10 w-10" />
                  <p className="text-sm font-medium">Select dates and click &quot;Fetch Records&quot;</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-700">
                        <th className="text-left px-3 py-1.5 text-[10px] font-black text-slate-500 uppercase tracking-wider">#</th>
                        <th className="text-left px-3 py-1.5 text-[10px] font-black text-slate-500 uppercase tracking-wider">Date</th>
                        <th className="text-left px-3 py-1.5 text-[10px] font-black text-slate-500 uppercase tracking-wider">Student Name</th>
                        <th className="text-left px-3 py-1.5 text-[10px] font-black text-slate-500 uppercase tracking-wider">GR No</th>
                        <th className="text-left px-3 py-1.5 text-[10px] font-black text-slate-500 uppercase tracking-wider">Class / Section</th>
                        <th className="text-left px-3 py-1.5 text-[10px] font-black text-slate-500 uppercase tracking-wider">Status</th>
                        <th className="text-left px-3 py-1.5 text-[10px] font-black text-slate-500 uppercase tracking-wider">Time In</th>
                        <th className="text-right px-3 py-1.5 text-[10px] font-black text-slate-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getFilteredHistoryRecords().map((record, idx) => {
                        const student = record.student;
                        const studentName = student
                          ? `${student.first_name || ''} ${student.last_name || ''}`.trim()
                          : '—';
                        const grNo = student?.details?.academic_info?.roll_no || student?.details?.student?.roll_no || student?.registration_no || '—';
                        const timeIn = record.created_at
                          ? new Date(record.created_at).toLocaleTimeString('en-PK', {
                              hour: '2-digit',
                              minute: '2-digit',
                              hour12: true
                            })
                          : '—';
                        const dateStr = record.date
                          ? new Date(record.date).toLocaleDateString('en-PK', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })
                          : '—';

                        const statusColors = {
                          PRESENT: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
                          ABSENT: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
                          LATE: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
                          LEAVE: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
                          HOLIDAY: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
                          HALF_DAY: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
                          EXCUSED: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
                        };
                        const statusLabel = record.status
                          ? record.status.charAt(0) + record.status.slice(1).toLowerCase().replace('_', ' ')
                          : '—';

                        return (
                          <tr
                            key={record.id || idx}
                            className="border-b border-slate-50 dark:border-slate-800 hover:bg-violet-50/30 dark:hover:bg-violet-900/10 transition-colors"
                          >
                            <td className="px-3 py-1.5 text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                            <td className="px-3 py-1.5">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3 text-slate-400 shrink-0" />
                                <span className="font-medium text-slate-700 dark:text-slate-200 text-[11px]">{dateStr}</span>
                              </div>
                            </td>
                            <td className="px-3 py-1.5">
                              <div className="flex items-center gap-1.5">
                                <div className="h-6 w-6 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-violet-600 dark:text-violet-400 text-[10px] font-bold shrink-0">
                                  {studentName.charAt(0) || 'S'}
                                </div>
                                <span className="font-semibold text-slate-800 dark:text-slate-100 text-[11px]">{studentName}</span>
                              </div>
                            </td>
                            <td className="px-3 py-1.5">
                              <span className="font-mono text-[10px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-400">{grNo}</span>
                            </td>
                            <td className="px-3 py-1.5" title={`${getClassName(student?.details?.academic_info?.class_id)} - ${getSectionName(student?.details?.academic_info?.section_id || student?.section)}`}>
                              <span className="text-slate-600 dark:text-slate-400 font-medium text-[11px]">
                                {getClassName(student?.details?.academic_info?.class_id)} - {getSectionName(student?.details?.academic_info?.section_id || student?.section)}
                              </span>
                            </td>
                            <td className="px-3 py-1.5">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${statusColors[record.status] || 'bg-gray-100 text-gray-600'}`}>
                                {statusLabel}
                              </span>
                            </td>
                            <td className="px-3 py-1.5">
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3 text-slate-400 shrink-0" />
                                <span className="text-slate-600 dark:text-slate-400 font-medium text-[11px]">{timeIn}</span>
                              </div>
                            </td>
                            <td className="px-3 py-1.5 text-right">
                              <button
                                onClick={() => setDeleteRecord({
                                  id: record._id || record.id,
                                  studentName,
                                  date: dateStr
                                })}
                                className="p-1 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-md transition-colors"
                                title="Delete Record"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-8 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 shrink-0 flex items-center justify-between">
              <span className="text-sm text-slate-500 font-medium">
                {historyModalFetched
                  ? `${getFilteredHistoryRecords().length} record${getFilteredHistoryRecords().length !== 1 ? 's' : ''} found`
                  : 'Select filters to view records'}
              </span>
              <div className="flex items-center gap-3">
                {getFilteredHistoryRecords().length > 0 && (
                  <Button
                    onClick={exportAttendancePDF}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl gap-2 shadow-md shadow-emerald-200 dark:shadow-none transition-all active:scale-95"
                  >
                    <Download className="h-4 w-4" />
                    Export PDF
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={() => setIsHistoryModalOpen(false)}
                  className="font-bold rounded-xl"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
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
              <div className="space-y-1 relative z-50">
                <Label className="text-xs font-bold text-gray-500 uppercase">Date</Label>
                <DatePicker
                  value={holidayForm.date}
                  onChange={(e) => setHolidayForm(prev => ({ ...prev, date: e.target.value }))}
                  disableFuture={false}
                  required
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold text-gray-500 uppercase">Holiday Reason *</Label>
                <Input
                  type="text"
                  required
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

      {/* Manual GR Attendance Modal */}
      {isManualModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[100] p-4 animate-in fade-in zoom-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100 dark:border-slate-800">
            <div className="p-8">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                    <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl">
                      <UserSearch className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    Manual Attendance
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Enter student GR No to mark present</p>
                </div>
                <button 
                  onClick={() => {
                    setIsManualModalOpen(false);
                    setScanInput('');
                    setLastScannedStudent(null);
                  }}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                >
                  <X className="h-6 w-6 text-slate-400" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="relative group">
                  <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
                    <QrCode className="h-6 w-6 text-indigo-500 group-focus-within:text-indigo-600 transition-colors" />
                  </div>
                  <Input
                    autoFocus
                    placeholder="Type GR No / Registration No..."
                    value={scanInput}
                    onChange={(e) => setScanInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleHandScan()}
                    className="pl-14 h-16 text-xl font-bold bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-100 dark:border-slate-800 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                  />
                  {scanningStatus === 'checking' && (
                    <div className="absolute right-5 top-5">
                      <ButtonLoader color="indigo" />
                    </div>
                  )}
                </div>

                {/* Last Scanned Result */}
                <div className="min-h-[160px] flex items-center justify-center border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-3xl p-6 bg-slate-50/30 dark:bg-slate-800/10">
                  {lastScannedStudent ? (
                    <div className="w-full animate-in slide-in-from-bottom-2 duration-300">
                      <div className="flex items-center gap-4">
                        <div className="h-16 w-16 bg-indigo-100 dark:bg-indigo-900/50 rounded-2xl flex items-center justify-center text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                          {lastScannedStudent.fullName?.charAt(0)}
                        </div>
                        <div className="flex-1">
                          <h4 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">
                            {lastScannedStudent.fullName}
                          </h4>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="bg-white dark:bg-slate-800 font-mono">
                              {lastScannedStudent.registrationNumber}
                            </Badge>
                            <Badge className={lastScannedStudent.feeInfo?.status === 'unpaid' ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'}>
                              {lastScannedStudent.feeInfo?.status || 'Paid'}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-full mb-1">
                            <CheckCircle className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                          </div>
                          <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Present</span>
                        </div>
                      </div>
                      
                      <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between text-sm">
                        <span className="text-slate-500">Marked at {lastScannedStudent.scanTime}</span>
                        <span className="text-indigo-600 font-bold">Successfully Logged</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center">
                      <div className="p-4 bg-white dark:bg-slate-800 rounded-full shadow-sm inline-block mb-3">
                        <UserSearch className="h-8 w-8 text-slate-300" />
                      </div>
                      <p className="text-slate-400 font-medium">Ready to mark attendance</p>
                    </div>
                  )}
                </div>

                <Button 
                  onClick={handleHandScan}
                  disabled={!scanInput || scanningStatus === 'checking'}
                  className="w-full py-7 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-lg shadow-xl shadow-indigo-200 dark:shadow-none transition-all active:scale-[0.98]"
                >
                  {scanningStatus === 'checking' ? <ButtonLoader color="white" /> : "Mark Attendance"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Auto Absent Modal */}
      <Modal
        open={isAutoAbsentModalOpen}
        onClose={() => setIsAutoAbsentModalOpen(false)}
        title="Process Auto Absent"
        size="lg"
      >
        <div className="space-y-4">
          <div className="bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200 p-3 rounded-lg text-sm border border-amber-200 dark:border-amber-800 flex items-start gap-2">
            <XCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <p>Review the students below who have scheduled classes today but haven't been marked present. Selected students will be marked Absent.</p>
          </div>

          <div className="flex justify-between items-center px-1">
            <span className="font-bold text-sm">{autoAbsentPreview.length} Eligible Students</span>
            <div className="flex items-center gap-2">
              <Checkbox 
                id="select-all-absent" 
                checked={autoAbsentPreview.length > 0 && autoAbsentSelected.length === autoAbsentPreview.length}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setAutoAbsentSelected(autoAbsentPreview.map(s => s.id));
                  } else {
                    setAutoAbsentSelected([]);
                  }
                }}
              />
              <Label htmlFor="select-all-absent" className="cursor-pointer text-sm font-medium">Select All</Label>
            </div>
          </div>

          <div className="border rounded-xl max-h-80 overflow-y-auto shadow-sm">
            {autoAbsentPreview.length === 0 ? (
              <div className="p-8 text-center text-gray-500 text-sm">
                No students need to be marked absent.
              </div>
            ) : (
              <div className="space-y-4 p-4">
                {(() => {
                  const grouped = {};
                  autoAbsentPreview.forEach(student => {
                    const classId = student.class_id;
                    const sectionId = student.section_id;
                    if (!grouped[classId]) {
                      grouped[classId] = {
                        name: getClassName(classId),
                        sections: {}
                      };
                    }
                    if (!grouped[classId].sections[sectionId]) {
                      grouped[classId].sections[sectionId] = {
                        name: getSectionName(sectionId),
                        students: []
                      };
                    }
                    grouped[classId].sections[sectionId].students.push(student);
                  });
                  
                  return Object.entries(grouped).map(([classId, classData]) => (
                    <div key={classId} className="border rounded-xl overflow-hidden shadow-sm">
                      <div className="bg-slate-100 dark:bg-slate-800 px-4 py-2 font-bold text-sm text-indigo-700 dark:text-indigo-400">
                        Class: {classData.name}
                      </div>
                      <div className="divide-y divide-slate-100 dark:divide-slate-800">
                        {Object.entries(classData.sections).map(([sectionId, sectionData]) => {
                          const sectionStudentIds = sectionData.students.map(s => s.id);
                          const isAllSelected = sectionStudentIds.length > 0 && sectionStudentIds.every(id => autoAbsentSelected.includes(id));

                          return (
                            <div key={sectionId} className="p-3 bg-white dark:bg-slate-900">
                              <div className="flex items-start gap-3">
                                <Checkbox
                                  id={`sec-${sectionId}`}
                                  checked={isAllSelected}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      setAutoAbsentSelected(prev => [...new Set([...prev, ...sectionStudentIds])]);
                                    } else {
                                      setAutoAbsentSelected(prev => prev.filter(id => !sectionStudentIds.includes(id)));
                                    }
                                  }}
                                  className="mt-1"
                                />
                                <div className="flex-1">
                                  <Label htmlFor={`sec-${sectionId}`} className="font-semibold text-sm cursor-pointer block">
                                    Section {sectionData.name} <span className="text-gray-500 font-normal">({sectionData.students.length} students)</span>
                                  </Label>
                                  <div className="text-xs text-slate-500 mt-1">
                                    {sectionData.students.map(s => `${s.first_name} ${s.last_name}`).join(', ')}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ));
                })()}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setIsAutoAbsentModalOpen(false)}>Cancel</Button>
            <Button
              onClick={handleAutoMarkAbsent}
              disabled={isProcessingAutoAbsent || autoAbsentSelected.length === 0}
              className="bg-rose-600 hover:bg-rose-700 text-white"
            >
              {isProcessingAutoAbsent ? <ButtonLoader /> : `Mark Absent (${autoAbsentSelected.length})`}
            </Button>
          </div>
        </div>
      </Modal>

      {!!deleteRecord && (
        <ConfirmDeleteModal
          title="Delete Attendance Record"
          message={
            <span>
              Are you sure you want to delete the attendance record for <strong className="text-gray-900 dark:text-white">{deleteRecord.studentName}</strong> on <strong className="text-gray-900 dark:text-white">{deleteRecord.date}</strong>? This action cannot be undone.
            </span>
          }
          onConfirm={handleDeleteAttendance}
          onCancel={() => setDeleteRecord(null)}
          isLoading={isDeleting}
        />
      )}
      {/* Bulk Upload Result Modal */}
      {bulkUploadResult && (
        <Modal
          open={!!bulkUploadResult}
          onClose={() => setBulkUploadResult(null)}
          title="Bulk Upload Summary"
          size="md"
        >
          <div className="space-y-4 p-4">
            <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg border border-emerald-100">
              <span className="font-semibold text-emerald-800">Successfully Marked:</span>
              <span className="text-xl font-bold text-emerald-600">{bulkUploadResult.successCount}</span>
            </div>
            
            {bulkUploadResult.skipped.length > 0 && (
              <div className="mt-4">
                <div className="flex items-center justify-between p-3 bg-amber-50 rounded-t-lg border-x border-t border-amber-100">
                  <span className="font-semibold text-amber-800">Skipped Records:</span>
                  <span className="text-lg font-bold text-amber-600">{bulkUploadResult.skipped.length}</span>
                </div>
                <div className="border border-amber-100 rounded-b-lg max-h-[300px] overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-amber-100/50 sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left text-amber-900 font-semibold">ID Provided</th>
                        <th className="px-3 py-2 text-left text-amber-900 font-semibold">Reason for Skip</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-amber-100">
                      {bulkUploadResult.skipped.map((skip, idx) => (
                        <tr key={idx} className="bg-white">
                          <td className="px-3 py-2 font-mono text-xs text-slate-600">{skip.id}</td>
                          <td className="px-3 py-2 text-amber-700">{skip.reason}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            
            <div className="pt-4 flex justify-end">
              <Button onClick={() => setBulkUploadResult(null)}>Close</Button>
            </div>
          </div>
        </Modal>
      )}

    </div>
  );
}