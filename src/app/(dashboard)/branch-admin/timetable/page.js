'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import apiClient from '@/lib/api-client';
import { API_ENDPOINTS } from '@/constants/api-endpoints';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import Dropdown from '@/components/ui/dropdown';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Search, Calendar, Edit, Trash2, Plus } from 'lucide-react';
import Modal from '@/components/ui/modal';
import FullPageLoader from '@/components/ui/full-page-loader';
import { Input } from '@/components/ui/input';
import ClassSelect from '@/components/ui/class-select';
import { toast } from 'sonner';
import ButtonLoader from '@/components/ui/button-loader';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const PERIOD_TYPES = [
  { value: 'lecture', label: 'Lecture' },
  { value: 'lab', label: 'Lab' },
  { value: 'practical', label: 'Practical' },
  { value: 'break', label: 'Break' },
  { value: 'lunch', label: 'Lunch' },
  { value: 'assembly', label: 'Assembly' },
  { value: 'sports', label: 'Sports' },
  { value: 'library', label: 'Library' },
];

export default function BranchTimetablePage() {
  const { user } = useAuth();
  const branchId = user?.branchId || '';

  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [timetables, setTimetables] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState('');
  const [selectedAcademicYear, setSelectedAcademicYear] = useState('2024-2025');
  const [loading, setLoading] = useState(false);
  const [viewingTimetable, setViewingTimetable] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [showDialog, setShowDialog] = useState(false);
  const [editingTimetable, setEditingTimetable] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    academicYear: '2024-2025',
    branchId: branchId,
    classId: '',
    section: '',
    effectiveFrom: '',
    effectiveTo: '',
    status: 'draft',
    periods: [],
    timeSettings: {
      periodDuration: 40,
      firstPeriodDuration: 50,
      breakDuration: 10,
      lunchDuration: 30,
      coachingStartTime: '08:00',
      coachingEndTime: '14:00',
    },
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!branchId) return;
    fetchClasses();
    fetchTeachers();
    fetchTeacherSchedulesForBranch(branchId, selectedAcademicYear);
    // initial fetch
    fetchTimetables();
  }, [branchId]);

  useEffect(() => {
    if (selectedClass) {
      fetchSections(selectedClass);
      fetchSubjects(selectedClass);
    }
  }, [selectedClass]);

  const fetchClasses = async () => {
    try {
      const res = await apiClient.get(API_ENDPOINTS.BRANCH_ADMIN.CLASSES.LIST, { branchId });
      if (res.success) setClasses(res.data.classes || []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchSections = async (classId) => {
    try {
      const cls = classes.find(c => c._id === classId);
      if (cls && cls.sections) setSections(cls.sections);
      else setSections([]);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchSubjects = async (classId) => {
    if (!classId || typeof classId !== 'string') {
      setSubjects([]);
      return;
    }
    try {
      const response = await apiClient.get(
        `${API_ENDPOINTS.BRANCH_ADMIN.SUBJECTS.LIST}?classId=${encodeURIComponent(classId)}`
      );
      if (response.success) {
        // API returns data.subjects, not just data
        setSubjects(response.data?.subjects || response.data || []);
      } else {
        setSubjects([]);
      }
    } catch (error) {
      console.error('Failed to fetch subjects:', error);
      toast.error('Failed to load subjects');
      setSubjects([]);
    }
  };

  const fetchExistingTimetable = async (branchIdParam, classId, section, academicYear) => {
    if (!branchIdParam || !classId || !academicYear) return null;
    try {
      const url = `${API_ENDPOINTS.BRANCH_ADMIN.TIMETABLES.LIST}?branchId=${encodeURIComponent(branchIdParam)}&classId=${encodeURIComponent(classId)}&academicYear=${encodeURIComponent(academicYear)}`;
      const response = await apiClient.get(url);
      if (response.success && Array.isArray(response.data) && response.data.length > 0) {
        // Only return if exact section match found
        const bySection = response.data.find(t => (t.section || '') === (section || ''));
        return bySection || null;
      }
      return null;
    } catch (error) {
      console.error('Failed to fetch existing timetable:', error);
      return null;
    }
  };

  const handleSectionChange = (e) => {
    const sec = e.target.value;
    setSelectedSection(sec);
    
    const sRoom = getSectionByName(sec)?.roomNumber || '';
    setFormData(prev => ({
      ...prev,
      section: sec,
      periods: prev.periods.map(p => ({ ...p, section: sec, roomNumber: sRoom }))
    }));

    // Try to load existing timetable for selected class/section
    (async () => {
      const existing = await fetchExistingTimetable(branchId, formData.classId, sec, formData.academicYear);
      if (existing) {
        // Found existing timetable for this exact section
        setEditingTimetable(existing);
        setFormData(prev => ({
          ...prev,
          name: existing.name,
          academicYear: existing.academicYear,
          branchId: branchId,
          classId: existing.classId?._id || existing.classId,
          section: sec,
          effectiveFrom: existing.effectiveFrom?.split('T')[0] || prev.effectiveFrom,
          effectiveTo: existing.effectiveTo?.split('T')[0] || prev.effectiveTo,
          status: existing.status,
          periods: normalizePeriods(existing.periods, sec),
          timeSettings: existing.timeSettings || prev.timeSettings,
        }));
      } else {
        // No timetable found for this section - clear periods
        setEditingTimetable(null);
        setFormData(prev => ({
          ...prev,
          section: sec,
          periods: [],
          timeSettings: {
            periodDuration: 40,
            firstPeriodDuration: 50,
            breakDuration: 10,
            lunchDuration: 30,
            coachingStartTime: '08:00',
            coachingEndTime: '14:00',
          },
        }));
      }
    })();
  };

  const fetchTeachers = async () => {
    try {
      const res = await apiClient.get(`${API_ENDPOINTS.BRANCH_ADMIN.TEACHERS.LIST}?limit=1000`);
      if (res.success) {
        setTeachers(res.data?.teachers || res.data || []);
        console.log('Teachers fetched:', res || 0);
      }
    } catch (e) {
      console.error('Failed to fetch teachers:', e);
      toast.error('Failed to load teachers');
    }
  };

  // Helper: add minutes to HH:MM
  const addMinutes = (timeStr, minutes) => {
    if (!timeStr) return timeStr;
    const [hh, mm] = timeStr.split(':').map(Number);
    const date = new Date();
    date.setHours(hh, mm || 0, 0, 0);
    date.setMinutes(date.getMinutes() + minutes);
    const nh = String(date.getHours()).padStart(2, '0');
    const nm = String(date.getMinutes()).padStart(2, '0');
    return `${nh}:${nm}`;
  };

  const getMinutesDifference = (time1, time2) => {
    const [h1, m1] = time1.split(':').map(Number);
    const [h2, m2] = time2.split(':').map(Number);
    const minutes1 = h1 * 60 + m1;
    const minutes2 = h2 * 60 + m2;
    return minutes2 - minutes1;
  };

  const getSectionByName = (sectionName) => {
    if (!sections || !sectionName) return null;
    return sections.find((s) => s.name === sectionName) || null;
  };

  const normalizePeriods = (periods = [], sectionName = '') => {
    const section = getSectionByName(sectionName);
    return (periods || []).map((p) => ({
      ...p,
      subjectId: p.subjectId?._id || p.subjectId || '',
      teacherId: p.teacherId?._id || p.teacherId || '',
      roomNumber: p.roomNumber || (section?.roomNumber || ''),
      section: p.section || sectionName || ''
    }));
  };

  const isDuplicatePeriod = (period, currentIndex = -1) => {
    return formData.periods.some((p, index) => {
      if (index === currentIndex) return false;
      if (p.day === period.day && formData.section === period.section) {
        if (
          p.subjectId === period.subjectId &&
          p.periodNumber === period.periodNumber &&
          p.startTime === period.startTime &&
          p.endTime === period.endTime
        ) {
          return true;
        }

        const pStart = p.startTime;
        const pEnd = p.endTime;
        const periodStart = period.startTime;
        const periodEnd = period.endTime;

        if (
          (periodStart >= pStart && periodStart < pEnd) ||
          (periodEnd > pStart && periodEnd <= pEnd) ||
          (periodStart <= pStart && periodEnd >= pEnd)
        ) {
          return true;
        }
      }
      return false;
    });
  };

  const addPeriod = () => {
    if (!formData.section) { toast.error('Please select a section first!'); return; }

    const coachingStartTime = formData.timeSettings.coachingStartTime || '08:00';
    const coachingEndTime = formData.timeSettings.coachingEndTime || '14:00';
    const periodDuration = formData.timeSettings.periodDuration || 40;
    const firstPeriodDuration = formData.timeSettings.firstPeriodDuration || periodDuration;
    const breakDuration = formData.timeSettings.breakDuration || 10;

    let day = DAYS[0];
    if (formData.periods && formData.periods.length > 0) {
      const last = formData.periods[formData.periods.length - 1];
      const lastDayPeriods = formData.periods.filter(p => p.day === last.day);
      const lastPeriod = lastDayPeriods[lastDayPeriods.length - 1];
      const nextStartIfLecture = addMinutes(lastPeriod.endTime, breakDuration);
      const nextEndIfLecture = addMinutes(nextStartIfLecture, periodDuration);
      if (getMinutesDifference(nextEndIfLecture, coachingEndTime) < 0) {
        const currentDayIndex = DAYS.indexOf(last.day);
        const nextDayIndex = currentDayIndex + 1;
        if (nextDayIndex >= DAYS.length) { toast.error('All days are filled. Cannot add more periods.'); return; }
        day = DAYS[nextDayIndex];
      } else {
        day = last.day;
      }
    }

    const sameDayPeriods = formData.periods.filter(p => p.day === day);
    if (sameDayPeriods.length > 0) {
      const lastOfDay = sameDayPeriods[sameDayPeriods.length - 1];
      const breakExists = sameDayPeriods.some(p => p.periodType === 'break');
      const lecturesCount = sameDayPeriods.filter(p => p.periodType === 'lecture').length;
      const nextStart = lastOfDay.endTime;
      const minutesRemainingFromNextStart = getMinutesDifference(nextStart, coachingEndTime);

      if (!breakExists && lecturesCount >= 4 && minutesRemainingFromNextStart >= (breakDuration + periodDuration)) {
        const startTime = nextStart;
        const endTime = addMinutes(startTime, breakDuration);
        const periodNumber = sameDayPeriods.length + 1;
        const breakPeriod = { periodNumber, day, startTime, endTime, subjectId: '', teacherId: '', periodType: 'break', roomNumber: getSectionByName(formData.section)?.roomNumber || '', section: formData.section };
        if (isDuplicatePeriod(breakPeriod)) { toast.error('This time slot is already occupied on this day for this section!'); return; }
        setFormData({ ...formData, periods: [...formData.periods, breakPeriod] });
        toast.success(`Added break for ${day} (${startTime} - ${endTime})`);
        return;
      }

      let startTime = lastOfDay.endTime;
      let endTime = addMinutes(startTime, periodDuration);
      if (getMinutesDifference(endTime, coachingEndTime) < 0) {
        const remainingMinutes = minutesRemainingFromNextStart;
        if (remainingMinutes >= 15) {
          endTime = coachingEndTime;
          const periodNumber = sameDayPeriods.length + 1;
          const newPeriod = { periodNumber, day, startTime, endTime, subjectId: '', teacherId: '', periodType: 'lecture', roomNumber: getSectionByName(formData.section)?.roomNumber || '', section: formData.section };
          if (isDuplicatePeriod(newPeriod)) { toast.error('This time slot is already occupied on this day for this section!'); return; }
          setFormData({ ...formData, periods: [...formData.periods, newPeriod] });
          toast.success(`Added period ${periodNumber} for ${day} (${startTime} - ${endTime}) - ${remainingMinutes} min`);
          return;
        }

        const currentDayIndex = DAYS.indexOf(day);
        const nextDayIndex = currentDayIndex + 1;
        if (nextDayIndex >= DAYS.length) { toast.error('All days are filled. Cannot add more periods.'); return; }
        day = DAYS[nextDayIndex];
        const startTime2 = coachingStartTime;
        const endTime2 = addMinutes(startTime2, firstPeriodDuration || periodDuration);
        const periodNumber2 = formData.periods.filter(p => p.day === day).length + 1;
        const newPeriod = { periodNumber: periodNumber2, day, startTime: startTime2, endTime: endTime2, subjectId: '', teacherId: '', periodType: 'lecture', roomNumber: getSectionByName(formData.section)?.roomNumber || '', section: formData.section };
        if (isDuplicatePeriod(newPeriod)) { toast.error('This time slot is already occupied on this day for this section!'); return; }
        setFormData({ ...formData, periods: [...formData.periods, newPeriod] });
        toast.success(`Added period ${periodNumber2} for ${day} (${startTime2} - ${endTime2})`);
        return;
      }

      const periodNumber = sameDayPeriods.length + 1;
      const newPeriod = { periodNumber, day, startTime, endTime, subjectId: '', teacherId: '', periodType: 'lecture', roomNumber: getSectionByName(formData.section)?.roomNumber || '', section: formData.section };
      if (isDuplicatePeriod(newPeriod)) { toast.error('This time slot is already occupied on this day for this section!'); return; }
      setFormData({ ...formData, periods: [...formData.periods, newPeriod] });
      toast.success(`Added period ${periodNumber} for ${day} (${startTime} - ${endTime})`);
      return;
    }

    const firstStartTime = coachingStartTime;
    const firstEndTime = addMinutes(firstStartTime, firstPeriodDuration || periodDuration);
    const newPeriod = { periodNumber: 1, day, startTime: firstStartTime, endTime: firstEndTime, subjectId: '', teacherId: '', periodType: 'lecture', roomNumber: getSectionByName(formData.section)?.roomNumber || '', section: formData.section };
    if (isDuplicatePeriod(newPeriod)) { toast.error('This time slot is already occupied on this day for this section!'); return; }
    setFormData({ ...formData, periods: [...formData.periods, newPeriod] });
    toast.success(`Added first period for ${day} (${firstStartTime} - ${firstEndTime})`);
  };

  const updatePeriod = (index, field, value) => {
    const updatedPeriods = [...formData.periods];
    updatedPeriods[index] = { ...updatedPeriods[index], [field]: value };
    if (['day', 'startTime', 'endTime', 'subjectId', 'periodNumber'].includes(field)) {
      if (isDuplicatePeriod(updatedPeriods[index], index)) { toast.error('This time slot is already occupied on this day for this section!'); return; }
    }
    setFormData({ ...formData, periods: updatedPeriods });
  };

  const removePeriod = (index) => {
    const updated = formData.periods.filter((_, i) => i !== index);
    setFormData({ ...formData, periods: updated });
  };

  const isTeacherAvailable = (teacherId, day, startTime, endTime, currentPeriodIndex = -1) => {
    if (!teacherId || !day || !startTime || !endTime) return true;
    const normalizedTeacherId = typeof teacherId === 'object' ? (teacherId._id || teacherId) : teacherId;
    const localConflict = formData.periods.some((p, index) => {
      if (index === currentPeriodIndex) return false;
      const pTeacherId = typeof p.teacherId === 'object' ? (p.teacherId._id || p.teacherId) : p.teacherId;
      if (pTeacherId !== normalizedTeacherId) return false;
      if (p.day !== day) return false;
      const pStart = p.startTime; const pEnd = p.endTime;
      if ((startTime >= pStart && startTime < pEnd) || (endTime > pStart && endTime <= pEnd) || (startTime <= pStart && endTime >= pEnd)) return true;
      return false;
    });
    if (localConflict) return false;

    // branch-wide schedules: fetchTeacherSchedulesForBranch builds teacherSchedulesMap
    const occupied = (window.__teacherSchedulesMap__ && window.__teacherSchedulesMap__[normalizedTeacherId]) || [];
    for (const occ of occupied) {
      if (occ.day !== day) continue;
      const pStart = occ.startTime; const pEnd = occ.endTime;
      if ((startTime >= pStart && startTime < pEnd) || (endTime > pStart && endTime <= pEnd) || (startTime <= pStart && endTime >= pEnd)) return false;
    }
    return true;
  };

  const getAvailableTeachers = (day, startTime, endTime, currentPeriodIndex = -1, currentTeacherId = null) => {
    console.log('getAvailableTeachers called - teachers length:', teachers.length);
    
    if (!day || !startTime || !endTime) {
      console.log('Missing day/time, returning all teachers');
      return teachers;
    }
    
    const availableTeachers = teachers.filter(teacher => {
      // Always include the currently assigned teacher for this period
      if (currentTeacherId && teacher._id === currentTeacherId) {
        return true;
      }
      return isTeacherAvailable(teacher._id, day, startTime, endTime, currentPeriodIndex);
    });
    
    console.log('Available teachers count:', availableTeachers.length);
    return availableTeachers;
  };

  const fetchTeacherSchedulesForBranch = async (branchIdParam, academicYear) => {
    if (!branchIdParam || !academicYear) return;
    try {
      const url = `${API_ENDPOINTS.BRANCH_ADMIN.TIMETABLES.LIST}?branchId=${encodeURIComponent(branchIdParam)}&academicYear=${encodeURIComponent(academicYear)}`;
      const res = await apiClient.get(url);
      if (res?.success && Array.isArray(res.data)) {
        const map = {};
        res.data.forEach(tt => { const ttId = tt._id; (tt.periods||[]).forEach(p => { if (!p.teacherId) return; const tId = typeof p.teacherId === 'object' ? (p.teacherId._id || p.teacherId) : p.teacherId; if (!map[tId]) map[tId]=[]; map[tId].push({ day: p.day, startTime: p.startTime, endTime: p.endTime, timetableId: ttId }); }); });
        // store globally for availability helper (simple approach)
        window.__teacherSchedulesMap__ = map;
      }
    } catch (err) { console.error('Failed to fetch teacher schedules for branch', err); }
  };

  const fetchTimetables = async () => {
    try {
      setLoading(true);
      const params = {};
      if (selectedClass) params.classId = selectedClass;
      if (selectedSection) params.section = selectedSection;
      if (selectedTeacher) params.teacherId = selectedTeacher;
      if (selectedAcademicYear) params.academicYear = selectedAcademicYear;

      const res = await apiClient.get(API_ENDPOINTS.BRANCH_ADMIN.TIMETABLES.LIST, params);
      if (res.success) setTimetables(res.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = async () => {
    setEditingTimetable(null);
    setFormData(prev => ({ ...prev, name: '', academicYear: selectedAcademicYear || '2024-2025', classId: '', section: '', periods: [] }));
    setShowDialog(true);
  };

  const handleEdit = async (timetable) => {
    setEditingTimetable(timetable);
    const classId = timetable.classId?._id || timetable.classId;
    if (classId) await fetchSections(classId);
    setFormData({
      name: timetable.name,
      academicYear: timetable.academicYear,
      branchId: branchId,
      classId: classId || '',
      section: timetable.section || '',
      effectiveFrom: timetable.effectiveFrom?.split('T')[0] || '',
      effectiveTo: timetable.effectiveTo?.split('T')[0] || '',
      status: timetable.status || 'draft',
      periods: (timetable.periods || []).map(p => ({
        ...p,
        subjectId: p.subjectId?._id || p.subjectId || '',
        teacherId: p.teacherId?._id || p.teacherId || '',
      })),
      timeSettings: timetable.timeSettings || {
        periodDuration: 40,
        firstPeriodDuration: 50,
        breakDuration: 10,
        lunchDuration: 30,
        coachingStartTime: '08:00',
        coachingEndTime: '14:00',
      },
    });
    setShowDialog(true);
  };

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setSubmitting(true);
    try {
      const payload = { ...formData, branchId };
      let res;
      if (editingTimetable && editingTimetable._id) {
        res = await apiClient.put(API_ENDPOINTS.BRANCH_ADMIN.TIMETABLES.UPDATE(editingTimetable._id), payload);
      } else {
        res = await apiClient.post(API_ENDPOINTS.BRANCH_ADMIN.TIMETABLES.CREATE, payload);
      }

      if (res?.success) {
        toast.success(res.message || 'Timetable saved');
        setShowDialog(false);
        fetchTimetables();
      } else {
        toast.error(res?.message || 'Failed to save timetable');
      }
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to save timetable');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this timetable?')) return;
    try {
      const res = await apiClient.delete(`${API_ENDPOINTS.BRANCH_ADMIN.TIMETABLES.DELETE(id)}?id=${encodeURIComponent(id)}`);
      if (res?.success) {
        toast.success(res.message || 'Deleted');
        fetchTimetables();
      } else {
        toast.error(res?.message || 'Failed to delete');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete timetable');
    }
  };

  const viewTimetable = (tt) => {
    // If teacher selected, aggregate teacher periods across fetched timetables
    if (selectedTeacher) {
      const aggregated = [];
      timetables.forEach(t => {
        (t.periods || []).forEach(p => {
          const pTid = typeof p.teacherId === 'object' ? (p.teacherId._id || p.teacherId) : p.teacherId;
          if (String(pTid) === String(selectedTeacher)) {
            aggregated.push({ ...p, className: t.classId?.name, section: t.section });
          }
        });
      });
      const teacherObj = teachers.find(t => String(t._id) === String(selectedTeacher));
      setViewingTimetable({
        name: `Teacher Schedule - ${teacherObj ? `${teacherObj.firstName} ${teacherObj.lastName}` : selectedTeacher}`,
        periods: aggregated,
      });
      return;
    }

    setViewingTimetable(tt);
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-2xl font-bold">Branch Timetables</h1>
          <p className="text-sm text-muted-foreground">Branch: {user?.branchName || 'N/A'}</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleCreateNew} disabled={loading}>
            <Plus className="mr-2 h-4 w-4" />
            Create Timetable
          </Button>
          <Button onClick={fetchTimetables} disabled={loading}>
            <Search className="mr-2 h-4 w-4" />
            Search
          </Button>
        </div>
      </div>

      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Filter timetable by class, section, teacher, or year</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label>Class</Label>
              <Dropdown value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} options={[{ value: '', label: 'All' }, ...classes.map(c => ({ value: c._id, label: c.name }))]} />
            </div>
            <div>
              <Label>Section</Label>
              <Dropdown value={selectedSection} onChange={(e) => setSelectedSection(e.target.value)} options={[{ value: '', label: 'All' }, ...sections.map(s => ({ value: s.name, label: s.name }))]} />
            </div>
            <div>
              <Label>Teacher</Label>
              <Dropdown value={selectedTeacher} onChange={(e) => setSelectedTeacher(e.target.value)} options={[{ value: '', label: 'All' }, ...teachers.map(t => ({ value: t._id, label: `${t.firstName} ${t.lastName}` }))]} />
            </div>
            <div>
              <Label>Academic Year</Label>
              <Dropdown value={selectedAcademicYear} onChange={(e) => setSelectedAcademicYear(e.target.value)} options={[{ value: '2024-2025', label: '2024-2025' }, { value: '2023-2024', label: '2023-2024' }]} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Timetables</CardTitle>
          <CardDescription>{timetables.length} timetable(s) found</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="p-6"><FullPageLoader message="Loading timetables..." /></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="p-3 text-left">Name</th>
                    <th className="p-3 text-left">Class</th>
                    <th className="p-3 text-left">Section</th>
                    <th className="p-3 text-left">Academic Year</th>
                    <th className="p-3 text-left">Periods</th>
                    <th className="p-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedTeacher ? (() => {
                    // aggregated row
                    const aggregated = [];
                    timetables.forEach(t => (t.periods||[]).forEach(p => {
                      const pTid = typeof p.teacherId === 'object' ? (p.teacherId._id || p.teacherId) : p.teacherId;
                      if (String(pTid) === String(selectedTeacher)) aggregated.push({ ...p, className: t.classId?.name, section: t.section });
                    }));
                    const teacherObj = teachers.find(t => String(t._id) === String(selectedTeacher));
                    return (
                      <tr key={`teacher-${selectedTeacher}`} className="border-b">
                        <td className="p-3">{teacherObj ? `${teacherObj.firstName} ${teacherObj.lastName}` : selectedTeacher}</td>
                        <td className="p-3">{Array.from(new Set(aggregated.map(a => a.className))).join(', ') || 'N/A'}</td>
                        <td className="p-3">{Array.from(new Set(aggregated.map(a => a.section))).join(', ') || 'All'}</td>
                        <td className="p-3">{selectedAcademicYear}</td>
                        <td className="p-3"><Badge variant="outline">{aggregated.length}</Badge></td>
                        <td className="p-3"><Button variant="ghost" onClick={() => viewTimetable({})}><Calendar className="h-4 w-4" /></Button></td>
                      </tr>
                    );
                  })() : (
                    timetables.map(tt => (
                      <tr key={tt._id} className="border-b">
                        <td className="p-3">{tt.name}</td>
                        <td className="p-3">{tt.classId?.name}</td>
                        <td className="p-3">{tt.section || 'All'}</td>
                        <td className="p-3">{tt.academicYear}</td>
                        <td className="p-3"><Badge variant="outline">{tt.periods?.length || 0}</Badge></td>
                        <td className="p-3">
                          <div className="flex gap-2">
                            <Button variant="ghost" onClick={() => viewTimetable(tt)}><Calendar className="h-4 w-4" /></Button>
                            <Button variant="ghost" onClick={() => handleEdit(tt)}><Edit className="h-4 w-4" /></Button>
                            <Button variant="ghost" onClick={() => handleDelete(tt._id)}><Trash2 className="h-4 w-4" /></Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create / Edit Modal */}
      <Modal
        open={showDialog}
        onClose={() => setShowDialog(false)}
        title={editingTimetable ? 'Edit Timetable' : 'Create Timetable'}
        size="xl"
        footer={
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button type="submit" form="timetable-form" disabled={submitting}>{submitting ? 'Saving...' : editingTimetable ? 'Update' : 'Create'}</Button>
          </div>
        }
      >
        <form id="timetable-form" onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 md:col-span-2">
              <Label>Timetable Name *</Label>
              <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
            </div>

            <div className="space-y-2">
              <Label>Academic Year *</Label>
              <Dropdown value={formData.academicYear} onChange={(e) => { const val = e.target.value; setFormData({ ...formData, academicYear: val }); if (branchId) fetchTeacherSchedulesForBranch(branchId, val); }} options={[{ value: '2023-2024', label: '2023-2024' }, { value: '2024-2025', label: '2024-2025' }, { value: '2025-2026', label: '2025-2026' }]} />
            </div>

            <div className="space-y-2">
              <Label>Class *</Label>
              <ClassSelect value={formData.classId} onChange={(e) => { const classId = e.target.value; setFormData({ ...formData, classId, section: '' }); if (classId) { fetchSections(classId); fetchSubjects(classId); } }} classes={classes} placeholder="Select class" className="w-full" disabled={!branchId} />
            </div>

            <div className="space-y-2">
              <Label>Section *</Label>
              <Dropdown value={formData.section} onChange={handleSectionChange} options={sections.map(s => ({ value: s.name, label: `${s.name} ${s.roomNumber ? `(Room: ${s.roomNumber})` : ''}` }))} placeholder="Select section" disabled={!formData.classId || sections.length === 0} />
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Dropdown value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} options={[{ value: 'draft', label: 'Draft' }, { value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }]} />
            </div>

            <div className="space-y-2">
              <Label>Effective From *</Label>
              <Input type="date" value={formData.effectiveFrom} onChange={(e) => setFormData({ ...formData, effectiveFrom: e.target.value })} required />
            </div>

            <div className="space-y-2">
              <Label>Effective To</Label>
              <Input type="date" value={formData.effectiveTo} onChange={(e) => setFormData({ ...formData, effectiveTo: e.target.value })} />
            </div>
          </div>

          {/* Time Settings */}
          <div className="space-y-2">
            <Label className="text-lg font-semibold">Time Settings</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="space-y-2">
                <Label>Period Duration (min)</Label>
                <Input type="number" value={formData.timeSettings.periodDuration ?? ''} onChange={(e) => setFormData({ ...formData, timeSettings: { ...formData.timeSettings, periodDuration: parseInt(e.target.value) } })} />
              </div>
              <div className="space-y-2">
                <Label>First Period Duration (min)</Label>
                <Input type="number" value={formData.timeSettings.firstPeriodDuration ?? ''} onChange={(e) => setFormData({ ...formData, timeSettings: { ...formData.timeSettings, firstPeriodDuration: parseInt(e.target.value) } })} />
              </div>
              <div className="space-y-2">
                <Label>Break Duration (min)</Label>
                <Input type="number" value={formData.timeSettings.breakDuration ?? ''} onChange={(e) => setFormData({ ...formData, timeSettings: { ...formData.timeSettings, breakDuration: parseInt(e.target.value) } })} />
              </div>
              <div className="space-y-2">
                <Label>Lunch Duration (min)</Label>
                <Input type="number" value={formData.timeSettings.lunchDuration ?? ''} onChange={(e) => setFormData({ ...formData, timeSettings: { ...formData.timeSettings, lunchDuration: parseInt(e.target.value) } })} />
              </div>
              <div className="space-y-2">
                <Label>Coaching Start Time</Label>
                <Input type="time" value={formData.timeSettings.coachingStartTime ?? ''} onChange={(e) => setFormData({ ...formData, timeSettings: { ...formData.timeSettings, coachingStartTime: e.target.value } })} />
              </div>
              <div className="space-y-2">
                <Label>Coaching End Time</Label>
                <Input type="time" value={formData.timeSettings.coachingEndTime ?? ''} onChange={(e) => setFormData({ ...formData, timeSettings: { ...formData.timeSettings, coachingEndTime: e.target.value } })} />
              </div>
            </div>
          </div>

          {/* Periods */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label className="text-lg font-semibold">Periods</Label>
              <Button type="button" onClick={addPeriod} size="sm"><Plus className="h-4 w-4 mr-2" />Add Period</Button>
            </div>

            <div className="space-y-4 max-h-96 overflow-y-auto">
              {formData.periods.map((period, index) => (
                <Card key={index}><CardContent className="pt-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label>Day</Label>
                      <Dropdown value={period.day} onChange={(e) => updatePeriod(index, 'day', e.target.value)} options={DAYS.filter((day) => {
                        if (!formData.section) return true;
                        const conflict = formData.periods.some((p, i) => { if (i === index) return false; return (p.day === day && p.startTime === period.startTime && p.endTime === period.endTime); });
                        return !conflict;
                      }).map(day => ({ value: day, label: day }))} />
                    </div>

                    <div className="space-y-2"><Label>Period Number</Label><Input type="number" value={period.periodNumber} onChange={(e) => updatePeriod(index, 'periodNumber', parseInt(e.target.value))} /></div>
                    <div className="space-y-2"><Label>Start Time</Label><Input type="time" value={period.startTime} onChange={(e) => updatePeriod(index, 'startTime', e.target.value)} /></div>
                    <div className="space-y-2"><Label>End Time</Label><Input type="time" value={period.endTime} onChange={(e) => updatePeriod(index, 'endTime', e.target.value)} /></div>

                    <div className="space-y-2">
                      <Label>Period Type</Label>
                      <Dropdown value={period.periodType} onChange={(e) => updatePeriod(index, 'periodType', e.target.value)} options={PERIOD_TYPES.map(t => ({ value: t.value, label: t.label }))} />
                    </div>

                    <div className="space-y-2">
                      <Label>Subject</Label>
                      <Dropdown value={period.subjectId} onChange={(e) => updatePeriod(index, 'subjectId', e.target.value)} options={[{ value: '', label: 'None' }, ...subjects.map(s => ({ value: s._id, label: s.name }))]} placeholder="Select subject" />
                    </div>

                    <div className="space-y-2">
                      <Label>Teacher</Label>
                      <Dropdown value={period.teacherId} onChange={(e) => updatePeriod(index, 'teacherId', e.target.value)} options={[{ value: '', label: 'None' }, ...getAvailableTeachers(period.day, period.startTime, period.endTime, index, period.teacherId).map(t => ({ value: t._id, label: `${t.firstName} ${t.lastName}` }))]} placeholder="Select teacher" />
                    </div>

                    <div className="space-y-2"><Label>Room Number</Label><Input value={period.roomNumber} onChange={(e) => updatePeriod(index, 'roomNumber', e.target.value)} placeholder="e.g., 101, Lab A" /></div>

                    <div className="flex items-end"><Button type="button" variant="destructive" size="icon" onClick={() => removePeriod(index)}><Trash2 className="h-4 w-4" /></Button></div>
                  </div>
                </CardContent></Card>
              ))}
            </div>
          </div>
        </form>
      </Modal>

      {viewingTimetable && (
        <Modal
          open={!!viewingTimetable}
          onClose={() => setViewingTimetable(null)}
          title={viewingTimetable.name}
          size="xl"
          footer={
            <div className="flex justify-end">
              <Button onClick={() => setViewingTimetable(null)}>
                Close
              </Button>
            </div>
          }
        >
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {viewingTimetable.branchId?.name} - {viewingTimetable.classId?.name}
              {viewingTimetable.section && ` (Section ${viewingTimetable.section})`}
            </p>

            {/* Timetable Grid */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border">
                <thead>
                  <tr>
                    <th className="border p-2 bg-muted">Period</th>
                    {DAYS.map((day) => (
                      <th key={day} className="border p-2 bg-muted">
                        {day}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Array.from(
                    new Set(viewingTimetable.periods.map((p) => p.periodNumber))
                  )
                    .sort((a, b) => a - b)
                    .map((periodNum) => (
                      <tr key={periodNum}>
                        <td className="border p-2 font-semibold text-center">
                          {periodNum}
                        </td>
                        {DAYS.map((day) => {
                          const period = viewingTimetable.periods.find(
                            (p) => p.day === day && p.periodNumber === periodNum
                          );
                          return (
                            <td
                              key={day}
                              className="border p-2 text-sm"
                            >
                              {period ? (
                                <div className="space-y-1">
                                  <div className="font-medium">
                                    {period.subjectId?.name || period.periodType}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {period.teacherId?.firstName}{' '}
                                    {period.teacherId?.lastName}
                                  </div>
                                  {period.className && (
                                    <div className="text-xs text-muted-foreground">
                                      {period.className}{period.section ? ` - ${period.section}` : ''}
                                    </div>
                                  )}
                                  <div className="text-xs">
                                    {period.startTime} - {period.endTime}
                                  </div>
                                  {period.roomNumber && (
                                    <div className="text-xs text-muted-foreground">
                                      Room: {period.roomNumber}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="text-center text-muted-foreground">
                                  -
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
