'use client';

import { useState, useEffect } from 'react';
import { API_ENDPOINTS } from '@/constants/api-endpoints';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import Modal from '@/components/ui/modal';
import Dropdown from '@/components/ui/dropdown';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import {
    Clock,
    Plus,
    Edit,
    Trash2,
    Calendar,
    Users,
    BookOpen,
    Coffee,
    Beaker,
    Search,
    Filter,
} from 'lucide-react';
import BranchSelect from '@/components/ui/branch-select';
import ClassSelect from '@/components/ui/class-select';
import apiClient from '@/lib/api-client';
import ButtonLoader from '@/components/ui/button-loader';
import FullPageLoader from '@/components/ui/full-page-loader';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const PERIOD_TYPES = [
    { value: 'lecture', label: 'Lecture', icon: BookOpen },
{ value: 'lab', label: 'Lab', icon: Beaker },
    { value: 'practical', label: 'Practical', icon: Users },
    { value: 'break', label: 'Break', icon: Coffee },
    { value: 'lunch', label: 'Lunch', icon: Coffee },
    { value: 'assembly', label: 'Assembly', icon: Users },
    { value: 'sports', label: 'Sports', icon: Users },
    { value: 'library', label: 'Library', icon: BookOpen },
];

export default function TimetablePage() {
    const [timetables, setTimetables] = useState([]);
    const [branches, setBranches] = useState([]);
    const [classes, setClasses] = useState([]);
    const [sections, setSections] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [academicYears, setAcademicYears] = useState([]);
    // Map of teacherId -> array of occupied periods across branch timetables
    const [teacherSchedulesMap, setTeacherSchedulesMap] = useState({});
    const [schedulesFetchedForBranch, setSchedulesFetchedForBranch] = useState(null);

    const [selectedBranch, setSelectedBranch] = useState('');
    const [selectedClass, setSelectedClass] = useState('');
    const [selectedSection, setSelectedSection] = useState('');
    const [selectedTeacher, setSelectedTeacher] = useState('');
    const [selectedAcademicYear, setSelectedAcademicYear] = useState('');

    const [fetchingTimetables, setFetchingTimetables] = useState(false);

    const [showDialog, setShowDialog] = useState(false);
    const [editingTimetable, setEditingTimetable] = useState(null);
    const [viewingTimetable, setViewingTimetable] = useState(null);
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        academicYear: '',
        branchId: '',
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

    useEffect(() => {
        fetchBranches();
        fetchTimetables();
    }, []);

    useEffect(() => {
        if (selectedBranch) {
            fetchClasses(selectedBranch);
            // fetch teachers of this branch and schedules for availability
            fetchTeachers(selectedBranch);
            fetchAcademicYears(selectedBranch);
            fetchTeacherSchedulesForBranch(selectedBranch, selectedAcademicYear);
        }
    }, [selectedBranch]);

    useEffect(() => {
        // when the selected academic year in filters changes, refresh schedules for selected branch
        if (selectedBranch && selectedAcademicYear) {
            fetchTeacherSchedulesForBranch(selectedBranch, selectedAcademicYear);
        }
    }, [selectedAcademicYear]);

    useEffect(() => {
        if (selectedClass) {
            fetchSections(selectedClass);
            fetchSubjects(selectedClass);
            // fetch branch-specific teachers
            fetchTeachers(formData.branchId || selectedBranch);
            // also ensure schedules fetched for branch & academic year
            if (formData.branchId) {
                fetchTeacherSchedulesForBranch(formData.branchId, formData.academicYear);
            } else if (selectedBranch) {
                fetchTeacherSchedulesForBranch(selectedBranch, selectedAcademicYear);
            }
        }
    }, [selectedClass]);

    useEffect(() => {
        if (formData.classId && classes.length > 0) {
            fetchSections(formData.classId);
        }
    }, [formData.classId, classes]);

    useEffect(() => {
        // Refresh teacher schedules whenever branch or academic year in form changes
        if (formData.branchId && formData.academicYear) {
            fetchTeacherSchedulesForBranch(formData.branchId, formData.academicYear);
        }
    }, [formData.branchId, formData.academicYear]);

    const fetchBranches = async () => {
        try {
            const response = await apiClient.get(API_ENDPOINTS.SUPER_ADMIN.BRANCHES.LIST);
            if (response.success) {
                setBranches(response.data.branches || response.data || []);
            }
        } catch (error) {
            console.error('Failed to fetch branches:', error);
            toast.error('Failed to load branches');
        }
    };

    const fetchAcademicYears = async (branchId) => {
        if (!branchId || typeof branchId !== 'string') return;
        try {
            const response = await apiClient.get(
                `${API_ENDPOINTS.SUPER_ADMIN.ACADEMIC_YEARS.LIST}?branchId=${encodeURIComponent(branchId)}`
            );
            if (response.success) {
                const years = response.data.academicYears || response.data || [];
                setAcademicYears(years);
                // Set current academic year as default if available
                const currentYear = years.find(y => y.isCurrent);
                if (currentYear) {
                    setSelectedAcademicYear(currentYear._id);
                } else if (years.length > 0) {
                    setSelectedAcademicYear(years[0]._id);
                }
            }
        } catch (error) {
            console.error('Failed to fetch academic years:', error);
            toast.error('Failed to load academic years');
        }
    };

    const fetchClasses = async (branchId) => {
        if (!branchId || typeof branchId !== 'string') return;
        try {
            const response = await apiClient.get(
                `${API_ENDPOINTS.SUPER_ADMIN.CLASSES.LIST}?branchId=${encodeURIComponent(branchId)}`
            );
            if (response.success) {
                setClasses(response.data);
            }
        } catch (error) {
            console.error('Failed to fetch classes:', error);
        }
    };

    const fetchSections = async (classId) => {
        if (!classId || typeof classId !== 'string') return;
        try {
            const selectedClass = classes.find(c => c._id === classId);
            if (selectedClass && selectedClass.sections) {
                setSections(selectedClass.sections);
            } else {
                setSections([]);
            }
        } catch (error) {
            console.error('Failed to fetch sections:', error);
            setSections([]);
        }
    };

    const fetchSubjects = async (classId) => {
        if (!classId || typeof classId !== 'string') return;
        try {
            const response = await apiClient.get(
                `${API_ENDPOINTS.SUPER_ADMIN.SUBJECTS.LIST}?classId=${encodeURIComponent(classId)}`
            );
            if (response.success) {
                setSubjects(response.data || []);
            }
        } catch (error) {
            console.error('Failed to fetch subjects:', error);
            toast.error('Failed to load subjects');
        }
    };

    const fetchExistingTimetable = async (branchId, classId, section, academicYear) => {
        if (!branchId || !classId || !academicYear) return null;
        try {
            const url = `${API_ENDPOINTS.SUPER_ADMIN.TIMETABLES.LIST}?branchId=${encodeURIComponent(branchId)}&classId=${encodeURIComponent(classId)}&academicYear=${encodeURIComponent(academicYear)}`;
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

    // Helper to add minutes to HH:MM string
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

    // Helper function to calculate minutes difference between two time strings
    const getMinutesDifference = (time1, time2) => {
        const [h1, m1] = time1.split(':').map(Number);
        const [h2, m2] = time2.split(':').map(Number);
        const minutes1 = h1 * 60 + m1;
        const minutes2 = h2 * 60 + m2;
        return minutes2 - minutes1;
    };

    // Helper: find section object by name
    const getSectionByName = (sectionName) => {
        if (!sections || !sectionName) return null;
        return sections.find((s) => s.name === sectionName) || null;
    };

    // Helper: normalize periods to ensure subjectId/teacherId are ids and roomNumber comes from section
    const normalizePeriods = (periods = [], sectionName = '') => {
        const section = getSectionByName(sectionName);
        return (periods || []).map((p) => ({
            ...p,
            subjectId: p.subjectId?._id || p.subjectId || '',
            teacherId: p.teacherId?._id || p.teacherId || '',
            roomNumber: p.roomNumber || (section?.roomNumber || ''),
        }));
    };

    // Helper: get academic year display name
    const getAcademicYearDisplay = (academicYear) => {
        if (!academicYear) return 'N/A';
        // If it's a populated object with yearName
        if (typeof academicYear === 'object' && academicYear.yearName) {
            return academicYear.yearName;
        }
        // If it's a string like "2024-2025"
        if (typeof academicYear === 'string' && academicYear.includes('-')) {
            return academicYear;
        }
        // If it's an ObjectId (24 char hex string), try to find in academicYears list
        if (typeof academicYear === 'string' && academicYear.length === 24) {
            const found = academicYears.find(y => y._id === academicYear);
            if (found) return found.yearName;
        }
        return 'N/A';
    };

    // Helper to check if teacher is available for a given day and time
    const isTeacherAvailable = (teacherId, day, startTime, endTime, currentPeriodIndex = -1) => {
        if (!teacherId || !day || !startTime || !endTime) return true;

        // Normalize teacherId to string for comparison
        const normalizedTeacherId = typeof teacherId === 'object' ? (teacherId._id || teacherId) : teacherId;

        // Check in current timetable periods (allow the same index being edited)
        const localConflict = formData.periods.some((p, index) => {
            if (index === currentPeriodIndex) return false; // Skip current period being edited

            // Normalize period's teacherId for comparison
            const pTeacherId = typeof p.teacherId === 'object' ? (p.teacherId._id || p.teacherId) : p.teacherId;
            if (pTeacherId !== normalizedTeacherId) return false;
            if (p.day !== day) return false;

            // Check time overlap
            const pStart = p.startTime;
            const pEnd = p.endTime;

            if (
                (startTime >= pStart && startTime < pEnd) ||
                (endTime > pStart && endTime <= pEnd) ||
                (startTime <= pStart && endTime >= pEnd)
            ) {
                return true; // Teacher has conflict in current timetable
            }
            return false;
        });

        if (localConflict) return false;

        // Check against branch-wide schedules (fetched timetables)
        const occupied = teacherSchedulesMap[normalizedTeacherId] || [];
        for (const occ of occupied) {
            // if it's part of the timetable we're editing, skip
            if (editingTimetable && occ.timetableId === editingTimetable._id) continue;
            if (occ.day !== day) continue;

            const pStart = occ.startTime;
            const pEnd = occ.endTime;
            if (
                (startTime >= pStart && startTime < pEnd) ||
                (endTime > pStart && endTime <= pEnd) ||
                (startTime <= pStart && endTime >= pEnd)
            ) {
                return false; // Occupied in another timetable
            }
        }

        return true;
    };

    // Get available teachers for a specific time slot
    const getAvailableTeachers = (day, startTime, endTime, currentPeriodIndex = -1) => {
        // If branch isn't selected, return empty list to avoid cross-branch assignments
        if (!formData.branchId) return [];

        // If some time details are missing, return all teachers of the branch
        if (!day || !startTime || !endTime) return teachers.filter(t => t.branchId?._id === formData.branchId || t.branchId === formData.branchId);

        return teachers
            .filter(t => (t.branchId?._id === formData.branchId || t.branchId === formData.branchId))
            .filter(teacher => isTeacherAvailable(teacher._id, day, startTime, endTime, currentPeriodIndex));
    };

    const fetchTeachers = async (branchId = null) => {
        try {
            let url = `${API_ENDPOINTS.SUPER_ADMIN.TEACHERS.LIST}`;
            if (branchId) {
                url += `?branchId=${encodeURIComponent(branchId)}`;
            }
            const response = await apiClient.get(url);
            if (response.success) {
                setTeachers(response.data || []);
            }
        } catch (error) {
            console.error('Failed to fetch teachers:', error);
            toast.error('Failed to load teachers');
        }
    };

    const fetchTimetables = async () => {
        try {
            setFetchingTimetables(true);
            let url = API_ENDPOINTS.SUPER_ADMIN.TIMETABLES.LIST;
            const params = [];

            if (selectedBranch) params.push(`branchId=${encodeURIComponent(selectedBranch)}`);
            if (selectedClass) params.push(`classId=${encodeURIComponent(selectedClass)}`);
            if (selectedSection) params.push(`section=${encodeURIComponent(selectedSection)}`);
            if (selectedTeacher) params.push(`teacherId=${encodeURIComponent(selectedTeacher)}`);
            if (selectedAcademicYear) params.push(`academicYear=${encodeURIComponent(selectedAcademicYear)}`);

            if (params.length > 0) {
                url += '?' + params.join('&');
            }

            console.log('[TimetablePage] Fetching from URL:', url);
            const response = await apiClient.get(url);
            console.log('[TimetablePage] Response:', response);
            if (response.success) {
                setTimetables(response.data || []);
            }
        } catch (error) {
            console.error('[TimetablePage] Fetch error:', error);
            toast.error(error.message || 'Failed to fetch timetables');
        } finally {
            setFetchingTimetables(false);
        }
    };

    // Fetch all timetables for a branch+academicYear to build a map of teacher occupied slots
    const fetchTeacherSchedulesForBranch = async (branchId, academicYear) => {
        if (!branchId || !academicYear) return;
        // Avoid refetching for same branch/year
        if (schedulesFetchedForBranch && schedulesFetchedForBranch.branchId === branchId && schedulesFetchedForBranch.academicYear === academicYear) return;
        try {
            const url = `${API_ENDPOINTS.SUPER_ADMIN.TIMETABLES.LIST}?branchId=${encodeURIComponent(branchId)}&academicYear=${encodeURIComponent(academicYear)}`;
            const response = await apiClient.get(url);
            if (response.success && Array.isArray(response.data)) {
                const map = {};
                response.data.forEach(tt => {
                    const ttId = tt._id;
                    (tt.periods || []).forEach(p => {
                        if (!p.teacherId) return;
                        const tId = typeof p.teacherId === 'object' ? (p.teacherId._id || p.teacherId) : p.teacherId;
                        if (!map[tId]) map[tId] = [];
                        map[tId].push({
                            day: p.day,
                            startTime: p.startTime,
                            endTime: p.endTime,
                            timetableId: ttId,
                            classId: tt.classId?._id || tt.classId,
                            section: tt.section,
                        });
                    });
                });
                setTeacherSchedulesMap(map);
                setSchedulesFetchedForBranch({ branchId, academicYear });
            }
        } catch (error) {
            console.error('Failed to fetch teacher schedules:', error);
        }
    };

    const handleCreateNew = async () => {
        setEditingTimetable(null);
        setFormData({
            name: '',
            academicYear: selectedAcademicYear || '',
            branchId: selectedBranch || '',
            classId: selectedClass || '',
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
        // Ensure branches/classes loaded for selection
        if (branches.length === 0) {
            await fetchBranches();
        }
        if (selectedBranch) {
            await fetchClasses(selectedBranch);
            await fetchAcademicYears(selectedBranch);
        }

        // Only try to load existing timetable if a section is already selected
        if (selectedBranch && selectedClass && formData.section) {
            const existing = await fetchExistingTimetable(selectedBranch, selectedClass, formData.section, selectedAcademicYear || formData.academicYear);
            if (existing) {
                setEditingTimetable(existing);
                setFormData({
                    name: existing.name,
                    academicYear: existing.academicYear?._id || existing.academicYear,
                    branchId: existing.branchId?._id || existing.branchId,
                    classId: existing.classId?._id || existing.classId,
                    section: existing.section || formData.section,
                    effectiveFrom: existing.effectiveFrom?.split('T')[0] || formData.effectiveFrom,
                    effectiveTo: existing.effectiveTo?.split('T')[0] || formData.effectiveTo,
                    status: existing.status,
                    periods: normalizePeriods(existing.periods, existing.section || formData.section),
                    timeSettings: {
                        periodDuration: existing.timeSettings?.periodDuration ?? formData.timeSettings.periodDuration,
                        firstPeriodDuration: existing.timeSettings?.firstPeriodDuration ?? formData.timeSettings.firstPeriodDuration,
                        breakDuration: existing.timeSettings?.breakDuration ?? formData.timeSettings.breakDuration,
                        lunchDuration: existing.timeSettings?.lunchDuration ?? formData.timeSettings.lunchDuration,
                        coachingStartTime: existing.timeSettings?.coachingStartTime ?? formData.timeSettings.coachingStartTime,
                        coachingEndTime: existing.timeSettings?.coachingEndTime ?? formData.timeSettings.coachingEndTime,
                    },
                });
            }
        }

        setShowDialog(true);
    };

    const handleEdit = async (timetable) => {
        setEditingTimetable(timetable);
        const branchId = timetable.branchId?._id || timetable.branchId;
        const classId = timetable.classId?._id || timetable.classId;
        const academicYearId = timetable.academicYear?._id || timetable.academicYear;

        // Fetch required data BEFORE setting form data and opening modal
        if (branches.length === 0) {
            await fetchBranches();
        }
        if (branchId) {
            await fetchClasses(branchId);
            // fetch branch-specific teachers and schedules
            await fetchTeachers(branchId);
            await fetchAcademicYears(branchId);
            await fetchTeacherSchedulesForBranch(branchId, academicYearId);
        }
        if (classId) {
            await fetchSections(classId);
            await fetchSubjects(classId);
        }

        // Now set form data with populated dropdowns
        setFormData({
            name: timetable.name,
            academicYear: academicYearId,
            branchId: branchId,
            classId: classId,
            section: timetable.section || '',
            effectiveFrom: timetable.effectiveFrom?.split('T')[0] || '',
            effectiveTo: timetable.effectiveTo?.split('T')[0] || '',
            status: timetable.status,
            periods: normalizePeriods(timetable.periods, timetable.section || ''),
            timeSettings: {
                periodDuration: timetable.timeSettings?.periodDuration ?? 40,
                firstPeriodDuration: timetable.timeSettings?.firstPeriodDuration ?? 50,
                breakDuration: timetable.timeSettings?.breakDuration ?? 10,
                lunchDuration: timetable.timeSettings?.lunchDuration ?? 30,
                coachingStartTime: timetable.timeSettings?.coachingStartTime ?? '08:00',
                coachingEndTime: timetable.timeSettings?.coachingEndTime ?? '14:00',
            },
        });

        setShowDialog(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            let response;
            // Normalize periods (ensure ids and room numbers) before sending
            const payload = {
                ...formData,
                periods: normalizePeriods(formData.periods, formData.section),
            };

            if (editingTimetable) {
                response = await apiClient.put(
                    API_ENDPOINTS.SUPER_ADMIN.TIMETABLES.UPDATE(editingTimetable._id),
                    payload
                );
            } else {
                response = await apiClient.post(
                    API_ENDPOINTS.SUPER_ADMIN.TIMETABLES.CREATE,
                    payload
                );
            }

            if (response.success) {
                toast.success(response.message || 'Timetable saved successfully');
                setShowDialog(false);
                fetchTimetables();
            }
        } catch (error) {
            toast.error(error.message || 'Failed to save timetable');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this timetable?')) return;

        try {
            const response = await apiClient.delete(
                API_ENDPOINTS.SUPER_ADMIN.TIMETABLES.DELETE(id)
            );

            if (response.success) {
                toast.success('Timetable deleted successfully');
                fetchTimetables();
            }
        } catch (error) {
            toast.error('Failed to delete timetable');
        }
    };

    // Helper to check if a period already exists with time overlap
    const isDuplicatePeriod = (period, currentIndex = -1) => {
        return formData.periods.some(
            (p, index) => {
                if (index === currentIndex) return false; // Skip checking against itself

                // Check for same day, section, and time overlap
                if (
                    p.day === period.day &&
                    formData.section === period.section
                ) {
                    // Check for exact same period details
                    if (
                        p.subjectId === period.subjectId &&
                        p.periodNumber === period.periodNumber &&
                        p.startTime === period.startTime &&
                        p.endTime === period.endTime
                    ) {
                        return true; // Exact duplicate
                    }

                    // Check for time overlap
                    const pStart = p.startTime;
                    const pEnd = p.endTime;
                    const periodStart = period.startTime;
                    const periodEnd = period.endTime;

                    if (
                        (periodStart >= pStart && periodStart < pEnd) ||
                        (periodEnd > pStart && periodEnd <= pEnd) ||
                        (periodStart <= pStart && periodEnd >= pEnd)
                    ) {
                        return true; // Time overlap
                    }
                }

                return false;
            }
        );
    };

    const addPeriod = () => {
        if (!formData.section) {
            toast.error('Please select a section first!');
            return;
        }

        const coachingStartTime = formData.timeSettings.coachingStartTime || '08:00';
        const coachingEndTime = formData.timeSettings.coachingEndTime || '14:00';
        const periodDuration = formData.timeSettings.periodDuration || 40;
        const firstPeriodDuration = formData.timeSettings.firstPeriodDuration || periodDuration;
        const breakDuration = formData.timeSettings.breakDuration || 10;
        const lunchDuration = formData.timeSettings.lunchDuration || 30;

        // Determine day to add period
        let day = DAYS[0];
        if (formData.periods && formData.periods.length > 0) {
            const last = formData.periods[formData.periods.length - 1];
            // decide whether to continue same day or move to next
            const lastDayPeriods = formData.periods.filter(p => p.day === last.day);
            const lastPeriod = lastDayPeriods[lastDayPeriods.length - 1];

            const nextStartIfLecture = addMinutes(lastPeriod.endTime, breakDuration);
            const nextEndIfLecture = addMinutes(nextStartIfLecture, periodDuration);

            if (getMinutesDifference(nextEndIfLecture, coachingEndTime) < 0) {
                const currentDayIndex = DAYS.indexOf(last.day);
                const nextDayIndex = currentDayIndex + 1;
                if (nextDayIndex >= DAYS.length) {
                    toast.error('All days are filled. Cannot add more periods.');
                    return;
                }
                day = DAYS[nextDayIndex];
            } else {
                day = last.day;
            }
        }

        const sameDayPeriods = formData.periods.filter(p => p.day === day);

        // If there's at least one period on this day
        if (sameDayPeriods.length > 0) {
            const lastOfDay = sameDayPeriods[sameDayPeriods.length - 1];

            const breakExists = sameDayPeriods.some(p => p.periodType === 'break');
            const lunchExists = sameDayPeriods.some(p => p.periodType === 'lunch');
            const lecturesCount = sameDayPeriods.filter(p => p.periodType === 'lecture').length;

            const nextStart = lastOfDay.endTime;
            const minutesRemainingFromNextStart = getMinutesDifference(nextStart, coachingEndTime);
            const minutesSinceStart = getMinutesDifference(coachingStartTime, nextStart);
            const dayTotalMinutes = getMinutesDifference(coachingStartTime, coachingEndTime);

            // Decide whether to add break (only once per day)
            // Rule: add break after 4 lecture periods and only if there's room for break + at least one more lecture
            if (!breakExists && lecturesCount >= 4 && minutesRemainingFromNextStart >= (breakDuration + periodDuration)) {
                const startTime = nextStart;
                const endTime = addMinutes(startTime, breakDuration);
                const periodNumber = sameDayPeriods.length + 1;

                const breakPeriod = {
                    periodNumber,
                    day,
                    startTime,
                    endTime,
                    subjectId: '',
                    teacherId: '',
                    periodType: 'break',
                    roomNumber: getSectionByName(formData.section)?.roomNumber || '',
                    section: formData.section,
                };

                if (isDuplicatePeriod(breakPeriod)) {
                    toast.error('This time slot is already occupied on this day for this section!');
                    return;
                }

                setFormData({ ...formData, periods: [...formData.periods, breakPeriod] });
                toast.success(`Added break for ${day} (${startTime} - ${endTime})`);
                return;
            }

            // Lunch is now manual only - user can add it manually using period type dropdown
            // (Automatic lunch addition removed as per user request)

            // Otherwise add a normal lecture period after last
            let startTime = nextStart;
            let endTime = addMinutes(startTime, periodDuration);

            // Check if standard period fits
            if (getMinutesDifference(endTime, coachingEndTime) < 0) {
                // Standard period doesn't fit, check if we can add a shorter period to fill remaining time
                const remainingMinutes = minutesRemainingFromNextStart;

                // If there are at least 15 minutes remaining, add a period with adjusted duration
                if (remainingMinutes >= 15) {
                    endTime = coachingEndTime; // Use all remaining time
                    const periodNumber = sameDayPeriods.length + 1;

                    const newPeriod = {
                        periodNumber,
                        day,
                        startTime,
                        endTime,
                        subjectId: '',
                        teacherId: '',
                        periodType: 'lecture',
                        roomNumber: getSectionByName(formData.section)?.roomNumber || '',
                        section: formData.section,
                    };

                    if (isDuplicatePeriod(newPeriod)) {
                        toast.error('This time slot is already occupied on this day for this section!');
                        return;
                    }

                    setFormData({ ...formData, periods: [...formData.periods, newPeriod] });
                    toast.success(`Added period ${periodNumber} for ${day} (${startTime} - ${endTime}) - ${remainingMinutes} min`);
                    return;
                }

                // Less than 15 minutes remaining, move to next day
                const currentDayIndex = DAYS.indexOf(day);
                const nextDayIndex = currentDayIndex + 1;
                if (nextDayIndex >= DAYS.length) {
                    toast.error('All days are filled. Cannot add more periods.');
                    return;
                }
                day = DAYS[nextDayIndex];
                const startTime2 = coachingStartTime;
                const endTime2 = addMinutes(startTime2, firstPeriodDuration || periodDuration);
                const periodNumber2 = formData.periods.filter(p => p.day === day).length + 1;

                const newPeriod = {
                    periodNumber: periodNumber2,
                    day,
                    startTime: startTime2,
                    endTime: endTime2,
                    subjectId: '',
                    teacherId: '',
                    periodType: 'lecture',
                    roomNumber: getSectionByName(formData.section)?.roomNumber || '',
                    section: formData.section,
                };

                if (isDuplicatePeriod(newPeriod)) {
                    toast.error('This time slot is already occupied on this day for this section!');
                    return;
                }

                setFormData({ ...formData, periods: [...formData.periods, newPeriod] });
                toast.success(`Added period ${periodNumber2} for ${day} (${startTime2} - ${endTime2})`);
                return;
            }

            const periodNumber = sameDayPeriods.length + 1;
            const newPeriod = {
                periodNumber,
                day,
                startTime,
                endTime,
                subjectId: '',
                teacherId: '',
                periodType: 'lecture',
                roomNumber: getSectionByName(formData.section)?.roomNumber || '',
                section: formData.section,
            };

            if (isDuplicatePeriod(newPeriod)) {
                toast.error('This time slot is already occupied on this day for this section!');
                return;
            }

            setFormData({ ...formData, periods: [...formData.periods, newPeriod] });
            toast.success(`Added period ${periodNumber} for ${day} (${startTime} - ${endTime})`);
            return;
        }

        // No periods for this day yet -> add first period using firstPeriodDuration
        const firstStartTime = coachingStartTime;
        const firstEndTime = addMinutes(firstStartTime, firstPeriodDuration || periodDuration);

        const newPeriod = {
            periodNumber: 1,
            day,
            startTime: firstStartTime,
            endTime: firstEndTime,
            subjectId: '',
            teacherId: '',
            periodType: 'lecture',
            roomNumber: getSectionByName(formData.section)?.roomNumber || '',
            section: formData.section,
        };

        if (isDuplicatePeriod(newPeriod)) {
            toast.error('This time slot is already occupied on this day for this section!');
            return;
        }

        setFormData({ ...formData, periods: [...formData.periods, newPeriod] });
        toast.success(`Added first period for ${day} (${firstStartTime} - ${firstEndTime})`);
    };

    const updatePeriod = (index, field, value) => {
        const updatedPeriods = [...formData.periods];
        updatedPeriods[index] = {
            ...updatedPeriods[index],
            [field]: value,
        };

        // Check for duplicates when updating time or day related fields
        if (['day', 'startTime', 'endTime', 'subjectId', 'periodNumber'].includes(field)) {
            if (isDuplicatePeriod(updatedPeriods[index], index)) {
                toast.error('This time slot is already occupied on this day for this section!');
                return;
            }
        }

        setFormData({ ...formData, periods: updatedPeriods });
    };

    const removePeriod = (index) => {
        const updatedPeriods = formData.periods.filter((_, i) => i !== index);
        setFormData({ ...formData, periods: updatedPeriods });
    };

    const viewTimetable = (timetable) => {
        // If a teacher filter is active, aggregate that teacher's periods
        // across all fetched timetables so the view shows the teacher schedule
        if (selectedTeacher) {
            const teacherId = selectedTeacher;
            const aggregated = [];
            timetables.forEach((tt) => {
                (tt.periods || []).forEach((p) => {
                    const pTeacherId = typeof p.teacherId === 'object' ? (p.teacherId._id || p.teacherId) : p.teacherId;
                    if (!pTeacherId) return;
                    if (String(pTeacherId) === String(teacherId)) {
                        aggregated.push({
                            // keep original period fields, but attach source class/section/branch for context
                            ...p,
                            className: tt.classId?.name || (tt.classId?._id ? tt.classId?._id : ''),
                            section: tt.section,
                            branchName: tt.branchId?.name || '',
                        });
                    }
                });
            });

            const teacherObj = teachers.find(t => String(t._id) === String(teacherId));
            setViewingTimetable({
                _id: `teacher-${teacherId}`,
                name: `Teacher Schedule - ${teacherObj ? `${teacherObj.firstName} ${teacherObj.lastName}` : teacherId}`,
                branchId: null,
                classId: null,
                academicYear: selectedAcademicYear || formData.academicYear,
                periods: aggregated,
            });
            return;
        }

        setViewingTimetable(timetable);
    };

    const getStatusBadge = (status) => {
        const variants = {
            draft: 'secondary',
            active: 'default',
            inactive: 'destructive',
            archived: 'outline',
        };
        return <Badge variant={variants[status]}>{status}</Badge>;
    };

    return (
        <div className="container mx-auto p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 pt-6 sm:pt-8">
                <div className="space-y-1">
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">
                        Timetable Management
                    </h1>
                    <p className="text-muted-foreground text-sm sm:text-base">
                        Manage class timetables and periods
                    </p>
                </div>
                <Button
                    onClick={handleCreateNew}
                    className="w-full sm:w-auto sm:self-center"
                    size="sm"
                >
                    <Plus className="mr-2 h-4 w-4" />
                    Create Timetable
                </Button>
            </div>

            {/* Filters */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Filter className="h-5 w-5" />
                        Filters
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        <div className="space-y-2">
                            <Label>Branch</Label>
                            <BranchSelect
                                value={selectedBranch}
                                onChange={(e) => {
                                    const branchId = e.target.value;
                                    setSelectedBranch(branchId);
                                    setSelectedClass('');
                                    setSelectedSection('');
                                    setSelectedTeacher('');
                                    if (branchId) {
                                        fetchClasses(branchId);
                                        fetchTeachers(branchId);
                                    } else {
                                        setClasses([]);
                                        setSections([]);
                                        setTeachers([]);
                                    }
                                }}
                                placeholder="All Branches"
                                className="w-full"
                                branches={branches}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Class</Label>
                            <ClassSelect
                                value={selectedClass}
                                onChange={(e) => {
                                    const classId = e.target.value;
                                    setSelectedClass(classId);
                                    setSelectedSection('');
                                    if (classId) {
                                        fetchSections(classId);
                                    } else {
                                        setSections([]);
                                    }
                                }}
                                classes={classes}
                                placeholder="All Classes"
                                className="w-full"
                                disabled={!selectedBranch}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Section</Label>
                            <Dropdown
                                value={selectedSection}
                                onChange={(e) => setSelectedSection(e.target.value)}
                                options={[
                                    { value: '', label: 'All Sections' },
                                    ...sections.map(s => ({
                                        value: s.name,
                                        label: `${s.name} ${s.roomNumber ? `(Room: ${s.roomNumber})` : ''}`
                                    }))
                                ]}
                                placeholder="All Sections"
                                disabled={!selectedClass}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Teacher</Label>
                            <Dropdown
                                value={selectedTeacher}
                                onChange={(e) => setSelectedTeacher(e.target.value)}
                                options={[
                                    { value: '', label: 'All Teachers' },
                                    ...teachers.map(t => ({
                                        value: t._id,
                                        label: `${t.firstName} ${t.lastName}`
                                    }))
                                ]}
                                placeholder="All Teachers"
                                disabled={!selectedBranch}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Academic Year</Label>
                            <Dropdown
                                value={selectedAcademicYear}
                                onChange={(e) => setSelectedAcademicYear(e.target.value)}
                                options={[
                                    { value: '', label: 'All Years' },
                                    ...academicYears.map(year => ({
                                        value: year._id,
                                        label: year.yearName
                                    }))
                                ]}
                                placeholder="Select Academic Year"
                                disabled={!selectedBranch}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>&nbsp;</Label>
                            <Button onClick={fetchTimetables} className="w-full" disabled={fetchingTimetables}>
                                {fetchingTimetables ? (
                                    <ButtonLoader size={4} />
                                ) : (
                                    <>
                                        <Search className="mr-2 h-4 w-4" />
                                        Search
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Timetables List */}
            <Card>
                <CardHeader>
                    <CardTitle>Timetables</CardTitle>
                    <CardDescription>
                        {timetables.length} timetable(s) found
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b">
                                    <th className="text-left p-3 font-semibold">Name</th>
                                    <th className="text-left p-3 font-semibold">Branch</th>
                                    <th className="text-left p-3 font-semibold">Class</th>
                                    <th className="text-left p-3 font-semibold">Section</th>
                                    <th className="text-left p-3 font-semibold">Academic Year</th>
                                    <th className="text-left p-3 font-semibold">Periods</th>
                                    <th className="text-left p-3 font-semibold">Status</th>
                                    <th className="text-left p-3 font-semibold">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {selectedTeacher ? (() => {
                                    const teacherId = selectedTeacher;
                                    const aggregated = [];
                                    timetables.forEach((tt) => {
                                        (tt.periods || []).forEach((p) => {
                                            const pTeacherId = typeof p.teacherId === 'object' ? (p.teacherId._1d || p.teacherId._id || p.teacherId) : p.teacherId;
                                            if (!pTeacherId) return;
                                            if (String(pTeacherId) === String(teacherId)) {
                                                aggregated.push({ ...p, className: tt.classId?.name, section: tt.section, branchName: tt.branchId?.name });
                                            }
                                        });
                                    });

                                    const classesSet = Array.from(new Set(aggregated.map(a => a.className).filter(Boolean)));
                                    const sectionsSet = Array.from(new Set(aggregated.map(a => a.section).filter(Boolean)));
                                    const branchesSet = Array.from(new Set(aggregated.map(a => a.branchName).filter(Boolean)));
                                    const teacherObj = teachers.find(t => String(t._id) === String(teacherId));

                                    return (
                                        <tr key={`teacher-${teacherId}`} className="border-b">
                                            <td className="p-3">{teacherObj ? `${teacherObj.firstName} ${teacherObj.lastName}` : teacherId}</td>
                                            <td className="p-3">{branchesSet.length ? branchesSet.join(', ') : 'N/A'}</td>
                                            <td className="p-3">{classesSet.length ? classesSet.join(', ') : 'N/A'}</td>
                                            <td className="p-3">{sectionsSet.length ? sectionsSet.join(', ') : 'All'}</td>
                                            <td className="p-3">{selectedAcademicYear || 'All'}</td>
                                            <td className="p-3"><Badge variant="outline">{aggregated.length} periods</Badge></td>
                                            <td className="p-3">{getStatusBadge('active')}</td>
                                            <td className="p-3">
                                                <div className="flex gap-2">
                                                    <Button variant="ghost" size="icon" onClick={() => viewTimetable({})}>
                                                        <Calendar className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })() : (
                                    timetables.map((timetable) => (
                                        <tr key={timetable._id} className="border-b">
                                            <td className="p-3">{timetable.name}</td>
                                            <td className="p-3">{timetable.branchId?.name || 'N/A'}</td>
                                            <td className="p-3">{timetable.classId?.name || 'N/A'}</td>
                                            <td className="p-3">{timetable.section || 'All'}</td>
                                            <td className="p-3">{getAcademicYearDisplay(timetable.academicYear)}</td>
                                            <td className="p-3">
                                                <Badge variant="outline">{timetable.periods?.length || 0} periods</Badge>
                                            </td>
                                            <td className="p-3">{getStatusBadge(timetable.status)}</td>
                                            <td className="p-3">
                                                <div className="flex gap-2">
                                                    <Button variant="ghost" size="icon" onClick={() => viewTimetable(timetable)}>
                                                        <Calendar className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" onClick={() => handleEdit(timetable)}>
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" onClick={() => handleDelete(timetable._id)}>
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {/* Create/Edit Modal */}
            <Modal
                open={showDialog}
                onClose={() => setShowDialog(false)}
                title={editingTimetable ? 'Edit Timetable' : 'Create Timetable'}
                size="xl"
                footer={
                    <div className="flex justify-end gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setShowDialog(false)}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading} form="timetable-form">
                            {loading ? 'Saving...' : editingTimetable ? 'Update' : 'Create'}
                        </Button>
                    </div>
                }
            >
                <form id="timetable-form" onSubmit={handleSubmit} className="space-y-6">
                    {/* Basic Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2 md:col-span-2">
                            <Label>Timetable Name *</Label>
                            <Input
                                value={formData.name}
                                onChange={(e) =>
                                    setFormData({ ...formData, name: e.target.value })
                                }
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Academic Year *</Label>
                            <Dropdown
                                value={formData.academicYear}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setFormData({ ...formData, academicYear: val });
                                    // refresh schedules for new academic year if branch selected
                                    if (formData.branchId) {
                                        fetchTeacherSchedulesForBranch(formData.branchId, val);
                                    }
                                }
                                }
                                options={academicYears.map(year => ({
                                    value: year._id,
                                    label: year.yearName
                                }))}
                                placeholder="Select Academic Year"
                                disabled={!formData.branchId}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Branch *</Label>
                            <BranchSelect
                                value={formData.branchId}
                                onChange={(e) => {
                                    const branchId = e.target.value;
                                    setFormData({ ...formData, branchId: branchId, classId: '', section: '', academicYear: '' });
                                    setClasses([]);
                                    setSections([]);
                                    setAcademicYears([]);
                                    if (branchId) {
                                        fetchClasses(branchId);
                                        // fetch teachers and schedules for this branch
                                        fetchTeachers(branchId);
                                        fetchAcademicYears(branchId);
                                    }
                                }}
                                branches={branches}
                                placeholder="Select branch"
                                className="w-full"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Class *</Label>
                            <ClassSelect
                                value={formData.classId}
                                onChange={(e) => {
                                    const classId = e.target.value;
                                    setFormData({ ...formData, classId: classId, section: '' });
                                    setSections([]);
                                    if (classId) {
                                        fetchSections(classId);
                                        fetchSubjects(classId);
                                        // Keep fetching only teachers from selected branch
                                        if (formData.branchId) {
                                            fetchTeachers(formData.branchId);
                                        }
                                    }
                                }}
                                classes={classes}
                                placeholder="Select class"
                                className="w-full"
                                disabled={!formData.branchId}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Section *</Label>
                            <Dropdown
                                value={formData.section}
                                onChange={(e) => {
                                    const sec = e.target.value;
                                    const sRoom = getSectionByName(sec)?.roomNumber || '';
                                    // update current form and ensure existing periods get the section's room if missing
                                    setFormData(prev => ({
                                        ...prev,
                                        section: sec,
                                        periods: prev.periods.map(p => ({ ...p, section: sec, roomNumber: sRoom })),
                                    }));
                                    // try to load existing timetable for selected branch/class/section
                                    (async () => {
                                        const existing = await fetchExistingTimetable(formData.branchId, formData.classId, sec, formData.academicYear);
                                        if (existing) {
                                            setEditingTimetable(existing);
                                            setFormData(prev => ({
                                                ...prev,
                                                name: existing.name,
                                                academicYear: existing.academicYear,
                                                branchId: existing.branchId?._id || existing.branchId,
                                                classId: existing.classId?._id || existing.classId,
                                                section: sec, // keep user-selected section
                                                effectiveFrom: existing.effectiveFrom?.split('T')[0] || prev.effectiveFrom,
                                                effectiveTo: existing.effectiveTo?.split('T')[0] || prev.effectiveTo,
                                                status: existing.status,
                                                periods: normalizePeriods(existing.periods, sec),
                                                timeSettings: existing.timeSettings || prev.timeSettings,
                                            }));
                                        }
                                    })();
                                }}
                                options={sections.map(s => ({
                                    value: s.name,
                                    label: `${s.name} ${s.roomNumber ? `(Room: ${s.roomNumber})` : ''}`
                                }))}
                                placeholder="Select section"
                                disabled={!formData.classId || sections.length === 0}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Status</Label>
                            <Dropdown
                                value={formData.status}
                                onChange={(e) =>
                                    setFormData({ ...formData, status: e.target.value })
                                }
                                options={[
                                    { value: 'draft', label: 'Draft' },
                                    { value: 'active', label: 'Active' },
                                    { value: 'inactive', label: 'Inactive' },
                                ]}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Effective From *</Label>
                            <Input
                                type="date"
                                value={formData.effectiveFrom}
                                onChange={(e) =>
                                    setFormData({ ...formData, effectiveFrom: e.target.value })
                                }
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Effective To</Label>
                            <Input
                                type="date"
                                value={formData.effectiveTo}
                                onChange={(e) =>
                                    setFormData({ ...formData, effectiveTo: e.target.value })
                                }
                            />
                        </div>
                    </div>

                    {/* Time Settings */}
                    <div className="space-y-2">
                        <Label className="text-lg font-semibold">Time Settings</Label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                            <div className="space-y-2">
                                <Label>Period Duration (min)</Label>
                                <Input
                                    type="number"
                                    value={formData.timeSettings.periodDuration ?? ''}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            timeSettings: {
                                                ...formData.timeSettings,
                                                periodDuration: parseInt(e.target.value),
                                            },
                                        })
                                    }
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>First Period Duration (min)</Label>
                                <Input
                                    type="number"
                                    value={formData.timeSettings.firstPeriodDuration ?? ''}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            timeSettings: {
                                                ...formData.timeSettings,
                                                firstPeriodDuration: parseInt(e.target.value),
                                            },
                                        })
                                    }
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Break Duration (min)</Label>
                                <Input
                                    type="number"
                                    value={formData.timeSettings.breakDuration ?? ''}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            timeSettings: {
                                                ...formData.timeSettings,
                                                breakDuration: parseInt(e.target.value),
                                            },
                                        })
                                    }
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Lunch Duration (min)</Label>
                                <Input
                                    type="number"
                                    value={formData.timeSettings.lunchDuration ?? ''}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            timeSettings: {
                                                ...formData.timeSettings,
                                                lunchDuration: parseInt(e.target.value),
                                            },
                                        })
                                    }
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Coaching Start Time</Label>
                                <Input
                                    type="time"
                                    value={formData.timeSettings.coachingStartTime ?? ''}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            timeSettings: {
                                                ...formData.timeSettings,
                                                coachingStartTime: e.target.value,
                                            },
                                        })
                                    }
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Coaching End Time</Label>
                                <Input
                                    type="time"
                                    value={formData.timeSettings.coachingEndTime ?? ''}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            timeSettings: {
                                                ...formData.timeSettings,
                                                coachingEndTime: e.target.value,
                                            },
                                        })
                                    }
                                />
                            </div>
                        </div>
                    </div>

                    {/* Periods */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <Label className="text-lg font-semibold">Periods</Label>
                            <Button type="button" onClick={addPeriod} size="sm">
                                <Plus className="h-4 w-4 mr-2" />
                                Add Period
                            </Button>
                        </div>

                        <div className="space-y-4 max-h-96 overflow-y-auto">
                            {formData.periods.map((period, index) => (
                                <Card key={index}>
                                    <CardContent className="pt-6">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                            <div className="space-y-2">
                                                <Label>Day</Label>
                                                <Dropdown
                                                    value={period.day}
                                                    onChange={(e) =>
                                                        updatePeriod(index, 'day', e.target.value)
                                                    }
                                                    options={DAYS.filter((day) => {
                                                        // if section not selected, allow all days
                                                        if (!formData.section) return true;
                                                        // check if another period (other than current) already uses same start/end time on this day
                                                        const conflict = formData.periods.some((p, i) => {
                                                            if (i === index) return false;
                                                            return (
                                                                p.day === day &&
                                                                p.startTime === period.startTime &&
                                                                p.endTime === period.endTime
                                                            );
                                                        });
                                                        return !conflict;
                                                    }).map((day) => ({ value: day, label: day }))}
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label>Period Number</Label>
                                                <Input
                                                    type="number"
                                                    value={period.periodNumber}
                                                    onChange={(e) =>
                                                        updatePeriod(
                                                            index,
                                                            'periodNumber',
                                                            parseInt(e.target.value)
                                                        )
                                                    }
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label>Start Time</Label>
                                                <Input
                                                    type="time"
                                                    value={period.startTime}
                                                    onChange={(e) =>
                                                        updatePeriod(index, 'startTime', e.target.value)
                                                    }
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label>End Time</Label>
                                                <Input
                                                    type="time"
                                                    value={period.endTime}
                                                    onChange={(e) =>
                                                        updatePeriod(index, 'endTime', e.target.value)
                                                    }
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label>Period Type</Label>
                                                <Dropdown
                                                    value={period.periodType}
                                                    onChange={(e) =>
                                                        updatePeriod(index, 'periodType', e.target.value)
                                                    }
                                                    options={PERIOD_TYPES.map((type) => ({
                                                        value: type.value,
                                                        label: type.label,
                                                    }))}
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label>Subject</Label>
                                                <Dropdown
                                                    value={period.subjectId}
                                                    onChange={(e) =>
                                                        updatePeriod(index, 'subjectId', e.target.value)
                                                    }
                                                    options={[
                                                        { value: '', label: 'None' },
                                                        ...subjects.map((subject) => ({
                                                            value: subject._id,
                                                            label: subject.name,
                                                        })),
                                                    ]}
                                                    placeholder="Select subject"
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label>Teacher</Label>
                                                <Dropdown
                                                    value={period.teacherId}
                                                    onChange={(e) =>
                                                        updatePeriod(index, 'teacherId', e.target.value)
                                                    }
                                                    options={[
                                                        { value: '', label: 'None' },
                                                        ...getAvailableTeachers(period.day, period.startTime, period.endTime, index).map((teacher) => ({
                                                            value: teacher._id,
                                                            label: `${teacher.firstName} ${teacher.lastName}`,
                                                        })),
                                                    ]}
                                                    placeholder="Select teacher"
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label>Room Number</Label>
                                                <Input
                                                    value={period.roomNumber}
                                                    onChange={(e) =>
                                                        updatePeriod(index, 'roomNumber', e.target.value)
                                                    }
                                                    placeholder="e.g., 101, Lab A"
                                                />
                                            </div>

                                            <div className="flex items-end">
                                                <Button
                                                    type="button"
                                                    variant="destructive"
                                                    size="icon"
                                                    onClick={() => removePeriod(index)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                </form>
            </Modal>

            {/* View Timetable Modal */}
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

            {/* Loading Overlay */}
            {fetchingTimetables && <FullPageLoader message="Loading timetables..." />}
        </div>
    );
}
