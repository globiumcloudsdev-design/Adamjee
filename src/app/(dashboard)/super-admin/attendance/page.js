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
import { Camera, Search, Save, CheckCircle, XCircle, Clock, UserSearch, Eye, DollarSign, Calendar, X, QrCode, Scan, Upload, FileText } from 'lucide-react';
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
  const [recentScans, setRecentScans] = useState([]);
  const [isScannerModalOpen, setIsScannerModalOpen] = useState(false);
  const [isBulkUploadModalOpen, setIsBulkUploadModalOpen] = useState(false);
  const [bulkUploadFile, setBulkUploadFile] = useState(null);
  const [bulkUploadDate, setBulkUploadDate] = useState(new Date().toISOString().split('T')[0]);
  const [scanInput, setScanInput] = useState('');
  const [lastScannedStudent, setLastScannedStudent] = useState(null);
  const [scanningStatus, setScanningStatus] = useState('idle'); // idle, checking, marking, success, error
  const [studentsCache, setStudentsCache] = useState({});
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

  // Fetch branches and today's attendance on mount
  useEffect(() => {
    fetchBranches();
    fetchTodayAttendance();
    fetchAllSections();
    fetchClasses();
  }, []);

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


  // Fetch classes when branch changes
  useEffect(() => {
    if (selectedBranch) {
      fetchClasses();
      loadStudentsCache(); // Pre-load students for this branch into cache
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

  const loadStudentsCache = async () => {
    if (!selectedBranch) return;
    try {
      const response = await apiClient.get(API_ENDPOINTS.SUPER_ADMIN.STUDENTS.LIST, {
        branch_id: selectedBranch
      });
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
        // Support common formats like REG-2024-0001 or just 20240001
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

        const response = await apiClient.post(API_ENDPOINTS.ATTENDANCE.CREATE, {
          date: bulkUploadDate,
          student_ids: foundStudentIds,
          status: 'PRESENT',
          branch_id: selectedBranch
        });

        if (response.success) {
          toast.success(`Successfully marked attendance for ${foundStudentIds.length} students.`);
          if (notFound.length > 0) {
            toast.warning(`${notFound.length} entries in file were not recognized.`);
          }
          setIsBulkUploadModalOpen(false);
          setBulkUploadFile(null);
          fetchTodayAttendance();
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

    // 1. Instant Cache Lookup for 0ms Perceived Latency
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
      setScanningStatus('idle'); // No global loader needed for cache hits
    } else {
      setScanningStatus('checking');
    }

    try {
      // Step 1: Fetch/Verify Student & Fee Info (Background if cached)
      const checkRes = await apiClient.post(API_ENDPOINTS.SUPER_ADMIN.ATTENDANCE.SCAN, {
        qr: currentScan,
        date: attendanceDate,
        attendanceType,
        subjectId: selectedSubject,
        eventId: selectedEvent,
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
      const markRes = await apiClient.post(API_ENDPOINTS.SUPER_ADMIN.ATTENDANCE.SCAN, {
        qr: currentScan,
        date: attendanceDate,
        attendanceType,
        subjectId: selectedSubject,
        eventId: selectedEvent
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
      // Reset to idle after 2 seconds on error so user can scan again
      setTimeout(() => setScanningStatus('idle'), 2000);
    } finally {
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
              <li>The file should contain <b>Registration Numbers</b> (one per line or separated by commas).</li>
              <li>Example: REG-2024-0001, REG-2024-0002</li>
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
                  id="bulk-file-upload"
                />
                <label
                  htmlFor="bulk-file-upload"
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
                          <Badge variant="secondary" className="bg-purple-50 text-purple-700 font-mono text-xs">ROLL: {lastScannedStudent.rollNumber || 'N/A'}</Badge>
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

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-gray-900 dark:text-white uppercase">Mark Attendance</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage global student attendance and campus records
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <Button 
            onClick={handleOpenScanner}
            className="flex-1 md:flex-none bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200 dark:shadow-none transition-all active:scale-95 py-6 px-6 rounded-2xl"
          >
            <Scan className="h-5 w-5 mr-2" />
            <span className="font-bold">Hand Scanner</span>
          </Button>
          <Button
            onClick={() => setIsBulkUploadModalOpen(true)}
            variant="outline"
            className="flex-1 md:flex-none border-2 border-emerald-600 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all active:scale-95 py-6 px-6 rounded-2xl"
          >
            <Upload className="h-5 w-5 mr-2" />
            <span className="font-bold">Bulk Upload</span>
          </Button>
          <Button 
            onClick={() => setManualAttendanceModalOpen(true)} 
            variant="outline"
            className="flex-1 md:flex-none border-2 transition-all active:scale-95 py-6 px-6 rounded-2xl"
          >
            <UserSearch className="h-5 w-5 mr-2" />
            <span className="font-bold">Manual</span>
          </Button>
          <Button 
            onClick={() => setIsHolidayModalOpen(true)} 
            variant="secondary"
            className="flex-1 md:flex-none bg-amber-600 hover:bg-amber-700 text-white shadow-lg shadow-amber-200 dark:shadow-none transition-all active:scale-95 py-6 px-5 rounded-2xl"
            title="Mark Holiday"
          >
            <Calendar className="h-5 w-5" />
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
                        <TableHead>GR No.</TableHead>
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
                          <TableHead>GR No.</TableHead>
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
