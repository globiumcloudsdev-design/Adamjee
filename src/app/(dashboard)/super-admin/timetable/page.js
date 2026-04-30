"use client";

import { useState, useEffect } from "react";
import { API_ENDPOINTS } from "@/constants/api-endpoints";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Modal from "@/components/ui/modal";
import Dropdown from "@/components/ui/dropdown";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import {
  Clock,
  Plus,
  Edit,
  Trash2,
  Calendar,
  Users,
  User,
  BookOpen,
  Coffee,
  Beaker,
  Search,
  Filter,
  Building2,
} from "lucide-react";
import BranchSelect from "@/components/ui/branch-select";
import ClassSelect from "@/components/ui/class-select";
import apiClient from "@/lib/api-client";
import ButtonLoader from "@/components/ui/button-loader";
import FullPageLoader from "@/components/ui/full-page-loader";
import SimpleTimetableViewModal from "@/components/timetable/SimpleTimetableViewModal";
import TimePicker from "@/components/ui/time-picker";

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const PERIOD_TYPES = [
  { value: "lecture", label: "Lecture", icon: BookOpen },
  { value: "lab", label: "Lab", icon: Beaker },
  { value: "practical", label: "Practical", icon: Users },
  { value: "break", label: "Break", icon: Coffee },
  { value: "lunch", label: "Lunch", icon: Coffee },
  { value: "assembly", label: "Assembly", icon: Users },
  { value: "sports", label: "Sports", icon: Users },
  { value: "library", label: "Library", icon: BookOpen },
];

export default function TimetablePage() {
  const [timetables, setTimetables] = useState([]);
  const [branches, setBranches] = useState([]);
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);

  const [teachers, setTeachers] = useState([]);
  const [allTeachers, setAllTeachers] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  // Map of teacherId -> array of occupied periods across branch timetables
  const [teacherSchedulesMap, setTeacherSchedulesMap] = useState({});
  const [schedulesFetchedForBranch, setSchedulesFetchedForBranch] =
    useState(null);

  const [selectedBranch, setSelectedBranch] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [selectedTeacher, setSelectedTeacher] = useState("");
  const [selectedAcademicYear, setSelectedAcademicYear] = useState("");
  const [viewMode, setViewMode] = useState("grouped"); // 'list' or 'grouped'

  const [fetchingTimetables, setFetchingTimetables] = useState(false);

  const [showDialog, setShowDialog] = useState(false);
  const [editingTimetable, setEditingTimetable] = useState(null);
  const [viewingTimetable, setViewingTimetable] = useState(null);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    academicYear: "",
    branchId: "",
    classId: "",
    section: "",
    effectiveFrom: "",
    effectiveTo: "",
    status: "draft",
    periods: [],
    timeSettings: {
      periodDuration: 40,
      firstPeriodDuration: 50,
      breakDuration: 10,
      lunchDuration: 30,
      coachingStartTime: "16:00",
      coachingEndTime: "21:00",
    },
  });

  useEffect(() => {
    fetchBranches();
    fetchAllTeachers();
  }, []);

  useEffect(() => {
    fetchTimetables();
  }, [
    selectedBranch,
    selectedClass,
    selectedSection,
    selectedAcademicYear,
    selectedTeacher,
  ]);

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
      // fetch teachers of this branch and schedules for availability
      fetchTeachers(formData.branchId || selectedBranch);
      // also ensure schedules fetched for branch & academic year
      if (formData.branchId) {
        fetchTeacherSchedulesForBranch(
          formData.branchId,
          formData.academicYear,
        );
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
      const response = await apiClient.get(
        API_ENDPOINTS.SUPER_ADMIN.BRANCHES.LIST,
      );
      if (response.success) {
        setBranches(response.data.branches || response.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch branches:", error);
      toast.error("Failed to load branches");
    }
  };

  const fetchAllTeachers = async () => {
    try {
      const url = `${API_ENDPOINTS.SUPER_ADMIN.TEACHERS.LIST}`;
      const response = await apiClient.get(url);
      if (response.success) {
        setAllTeachers(response.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch all teachers:", error);
    }
  };

  const fetchAcademicYears = async (branchId) => {
    if (!branchId || typeof branchId !== "string") return;
    try {
      const response = await apiClient.get(
        `${API_ENDPOINTS.SUPER_ADMIN.ACADEMIC_YEARS.LIST}?branchId=${encodeURIComponent(branchId)}`,
      );
      if (response.success) {
        const years = response.data.academicYears || response.data || [];
        setAcademicYears(years);
        // Set current academic year as default if available
        const currentYear = years.find((y) => y.isCurrent);
        if (currentYear) {
          setSelectedAcademicYear(currentYear.id);
        } else if (years.length > 0) {
          setSelectedAcademicYear(years[0].id);
        }
      }
    } catch (error) {
      console.error("Failed to fetch academic years:", error);
      toast.error("Failed to load academic years");
    }
  };

  const fetchClasses = async (branchId) => {
    if (!branchId || typeof branchId !== "string") return;
    try {
      const response = await apiClient.get(
        `${API_ENDPOINTS.SUPER_ADMIN.CLASSES.LIST}?branchId=${encodeURIComponent(branchId)}`,
      );
      if (response.success) {
        setClasses(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch classes:", error);
    }
  };

  const fetchSections = async (classId) => {
    if (!classId || typeof classId !== "string") return;
    try {
      const selectedClass = classes.find((c) => c.id === classId);
      if (selectedClass && selectedClass.sections) {
        setSections(selectedClass.sections);
      } else {
        setSections([]);
      }
    } catch (error) {
      console.error("Failed to fetch sections:", error);
      setSections([]);
    }
  };

  const fetchExistingTimetable = async (
    branchId,
    classId,
    section,
    academicYear,
  ) => {
    if (!branchId || !classId || !academicYear) return null;
    try {
      const url = `${API_ENDPOINTS.SUPER_ADMIN.TIMETABLES.LIST}?branchId=${encodeURIComponent(branchId)}&classId=${encodeURIComponent(classId)}&academicYear=${encodeURIComponent(academicYear)}`;
      const response = await apiClient.get(url);
      if (
        response.success &&
        Array.isArray(response.data) &&
        response.data.length > 0
      ) {
        // Only return if exact section match found
        const bySection = response.data.find(
          (t) => (t.section || "") === (section || ""),
        );
        return bySection || null;
      }
      return null;
    } catch (error) {
      console.error("Failed to fetch existing timetable:", error);
      return null;
    }
  };

  // Helper to add minutes to HH:MM string
  const addMinutes = (timeStr, minutes) => {
    if (!timeStr) return timeStr;
    const [hh, mm] = timeStr.split(":").map(Number);
    const date = new Date();
    date.setHours(hh, mm || 0, 0, 0);
    date.setMinutes(date.getMinutes() + minutes);
    const nh = String(date.getHours()).padStart(2, "0");
    const nm = String(date.getMinutes()).padStart(2, "0");
    return `${nh}:${nm}`;
  };

  // Helper function to calculate minutes difference between two time strings
  const getMinutesDifference = (time1, time2) => {
    const [h1, m1] = time1.split(":").map(Number);
    const [h2, m2] = time2.split(":").map(Number);
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
  const normalizePeriods = (periods = [], sectionName = "") => {
    const section = getSectionByName(sectionName);
    return (periods || []).map((p) => ({
      ...p,
      subjectId: p.subjectId?.id || p.subjectId || "",
      teacherId: p.teacherId?.id || p.teacherId || "",
      roomNumber: p.roomNumber || section?.roomNumber || "",
    }));
  };

  // Helper: get academic year display name
  const getAcademicYearDisplay = (academicYear) => {
    if (!academicYear) return "N/A";

    // If it's a populated object
    if (typeof academicYear === "object") {
      return academicYear.name || academicYear.yearName || "N/A";
    }

    // If it's a string ID, try to find in academicYears list
    if (typeof academicYear === "string") {
      const found = academicYears.find((y) => y.id === academicYear);
      if (found) return found.name || found.yearName;
      // If not found but looks like a year string (e.g. "2024-2025")
      if (academicYear.includes("-")) return academicYear;
    }

    return "N/A";
  };

  // Helper to check if teacher is available for a given day and time
  const isTeacherAvailable = (
    teacherId,
    day,
    startTime,
    endTime,
    currentPeriodIndex = -1,
  ) => {
    if (!teacherId || !day || !startTime || !endTime) return true;

    // Normalize teacherId to string for comparison
    const normalizedTeacherId =
      typeof teacherId === "object" ? teacherId.id || teacherId : teacherId;

    // Check in current timetable periods (allow the same index being edited)
    const localConflict = formData.periods.some((p, index) => {
      if (index === currentPeriodIndex) return false; // Skip current period being edited

      // Normalize period's teacherId for comparison
      const pTeacherId =
        typeof p.teacherId === "object"
          ? p.teacherId.id || p.teacherId
          : p.teacherId;
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
      if (editingTimetable && occ.timetableId === editingTimetable.id) continue;
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
  const getAvailableTeachers = (
    day,
    startTime,
    endTime,
    currentPeriodIndex = -1,
  ) => {
    // If branch isn't selected, return empty list to avoid cross-branch assignments
    if (!formData.branchId) return [];

    // If some time details are missing, return all teachers of the branch
    if (!day || !startTime || !endTime)
      return teachers.filter(
        (t) => (t.branchId?.id || t.branchId) === formData.branchId,
      );

    return teachers
      .filter((t) => (t.branchId?.id || t.branchId) === formData.branchId)
      .filter((teacher) =>
        isTeacherAvailable(
          teacher.id,
          day,
          startTime,
          endTime,
          currentPeriodIndex,
        ),
      );
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
      console.error("Failed to fetch teachers:", error);
      toast.error("Failed to load teachers");
    }
  };

  const groupedTimetables = timetables.reduce((acc, tt) => {
    const bId = tt.branch_id?.id || tt.branch_id || tt.branch?.id || "other";
    const bName = tt.branch?.name || tt.branch_id?.name || "Other Branches";
    if (!acc[bId]) {
      acc[bId] = { name: bName, timetables: [] };
    }
    acc[bId].timetables.push(tt);
    return acc;
  }, {});

  const fetchTimetables = async () => {
    console.log("[SuperAdmin] fetchTimetables triggered", {
      selectedBranch,
      selectedClass,
      selectedAcademicYear,
    });
    try {
      setFetchingTimetables(true);
      let url = API_ENDPOINTS.SUPER_ADMIN.TIMETABLES.LIST;
      const queryParams = {};

      if (selectedBranch) queryParams.branch_id = selectedBranch;
      if (selectedClass) queryParams.class_id = selectedClass;
      if (selectedSection) queryParams.section_id = selectedSection;
      if (selectedTeacher) queryParams.teacher_id = selectedTeacher;
      if (selectedAcademicYear)
        queryParams.academic_year_id = selectedAcademicYear;

      const response = await apiClient.get(url, queryParams);
      console.log("[SuperAdmin] Timetables response:", response);

      if (response.success) {
        const data = response.timetable || response.data || [];
        setTimetables(data);
        console.log("[SuperAdmin] Timetables set:", data.length);
      }
    } catch (error) {
      console.error("[TimetablePage] Fetch error:", error);
      toast.error(error.message || "Failed to fetch timetables");
    } finally {
      setFetchingTimetables(false);
    }
  };

  // Fetch all timetables for a branch+academicYear to build a map of teacher occupied slots
  const fetchTeacherSchedulesForBranch = async (branchId, academicYear) => {
    console.log("[SuperAdmin] fetchTeacherSchedulesForBranch", {
      branchId,
      academicYear,
    });
    if (!branchId || !academicYear) return;
    try {
      const url = API_ENDPOINTS.SUPER_ADMIN.TIMETABLES.LIST;
      const response = await apiClient.get(url, {
        branch_id: branchId,
        academic_year_id: academicYear,
      });

      console.log("[SuperAdmin] Schedules response:", response);

      if (response.success) {
        const data = response.timetable || response.data || [];
        const map = {};
        data.forEach((tt) => {
          const ttId = tt.id;
          (tt.periods || []).forEach((p) => {
            if (!p.teacherId) return;
            const tId =
              typeof p.teacherId === "object"
                ? p.teacherId.id || p.teacherId
                : p.teacherId;
            if (!map[tId]) map[tId] = [];
            map[tId].push({
              day: p.day,
              startTime: p.startTime,
              endTime: p.endTime,
              timetableId: ttId,
              className: tt.class?.name || "N/A",
              sectionName: tt.section?.name || "N/A",
            });
          });
        });
        setTeacherSchedulesMap(map);
        setSchedulesFetchedForBranch({ branchId, academicYear });
        console.log("[SuperAdmin] Teacher schedules map updated");
      }
    } catch (error) {
      console.error("Failed to fetch teacher schedules:", error);
    }
  };

  const handleCreateNew = async () => {
    setEditingTimetable(null);
    setFormData({
      name: "",
      academicYear: selectedAcademicYear || "",
      branchId: selectedBranch || "",
      classId: selectedClass || "",
      section: "",
      effectiveFrom: "",
      effectiveTo: "",
      status: "draft",
      periods: [],
      timeSettings: {
        periodDuration: 40,
        firstPeriodDuration: 50,
        breakDuration: 10,
        lunchDuration: 30,
        coachingStartTime: "08:00",
        coachingEndTime: "14:00",
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
      const existing = await fetchExistingTimetable(
        selectedBranch,
        selectedClass,
        formData.section,
        selectedAcademicYear || formData.academicYear,
      );
      if (existing) {
        setEditingTimetable(existing);
        setFormData({
          name: existing.name,
          academicYear: academicYearId,
          branchId: branchId,
          classId: classId,
          section: existing.section || formData.section,
          effectiveFrom:
            existing.effectiveFrom?.split("T")[0] || formData.effectiveFrom,
          effectiveTo:
            existing.effectiveTo?.split("T")[0] || formData.effectiveTo,
          status: existing.status,
          periods: normalizePeriods(
            existing.periods,
            existing.section || formData.section,
          ),
          timeSettings: {
            periodDuration:
              existing.timeSettings?.periodDuration ??
              formData.timeSettings.periodDuration,
            firstPeriodDuration:
              existing.timeSettings?.firstPeriodDuration ??
              formData.timeSettings.firstPeriodDuration,
            breakDuration:
              existing.timeSettings?.breakDuration ??
              formData.timeSettings.breakDuration,
            lunchDuration:
              existing.timeSettings?.lunchDuration ??
              formData.timeSettings.lunchDuration,
            coachingStartTime:
              existing.timeSettings?.coachingStartTime ??
              formData.timeSettings.coachingStartTime,
            coachingEndTime:
              existing.timeSettings?.coachingEndTime ??
              formData.timeSettings.coachingEndTime,
          },
        });
      }
    }

    setShowDialog(true);
  };

  const handleEdit = async (timetable) => {
    setEditingTimetable(timetable);
    const branchId = timetable.branchId?.id || timetable.branchId;
    const classId = timetable.classId?.id || timetable.classId;
    const academicYearId = timetable.academicYear?.id || timetable.academicYear;

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
    }

    // Now set form data with populated dropdowns
    setFormData({
      name: timetable.name,
      academicYear: academicYearId,
      branchId: branchId,
      classId: classId,
      section: timetable.section || "",
      effectiveFrom: timetable.effectiveFrom?.split("T")[0] || "",
      effectiveTo: timetable.effectiveTo?.split("T")[0] || "",
      status: timetable.status,
      periods: normalizePeriods(timetable.periods, timetable.section || ""),
      timeSettings: {
        periodDuration: timetable.timeSettings?.periodDuration ?? 40,
        firstPeriodDuration: timetable.timeSettings?.firstPeriodDuration ?? 50,
        breakDuration: timetable.timeSettings?.breakDuration ?? 10,
        lunchDuration: timetable.timeSettings?.lunchDuration ?? 30,
        coachingStartTime: timetable.timeSettings?.coachingStartTime ?? "08:00",
        coachingEndTime: timetable.timeSettings?.coachingEndTime ?? "14:00",
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
          API_ENDPOINTS.SUPER_ADMIN.TIMETABLES.UPDATE(editingTimetable.id),
          payload,
        );
      } else {
        response = await apiClient.post(
          API_ENDPOINTS.SUPER_ADMIN.TIMETABLES.CREATE,
          payload,
        );
      }

      if (response.success) {
        toast.success(response.message || "Timetable saved successfully");
        setShowDialog(false);
        fetchTimetables();
      }
    } catch (error) {
      toast.error(error.message || "Failed to save timetable");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this timetable?")) return;

    try {
      const response = await apiClient.delete(
        API_ENDPOINTS.SUPER_ADMIN.TIMETABLES.DELETE(id),
      );

      if (response.success) {
        toast.success("Timetable deleted successfully");
        fetchTimetables();
      }
    } catch (error) {
      toast.error("Failed to delete timetable");
    }
  };

  // Helper to check if a period already exists with time overlap
  const isDuplicatePeriod = (period, currentIndex = -1) => {
    return formData.periods.some((p, index) => {
      if (index === currentIndex) return false; // Skip checking against itself

      // Check for same day, section, and time overlap
      if (p.day === period.day && formData.section === period.section) {
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
    });
  };

  const addPeriod = () => {
    if (!formData.section) {
      toast.error("Please select a section first!");
      return;
    }

    const coachingStartTime =
      formData.timeSettings.coachingStartTime || "08:00";
    const coachingEndTime = formData.timeSettings.coachingEndTime || "14:00";
    const periodDuration = formData.timeSettings.periodDuration || 40;
    const firstPeriodDuration =
      formData.timeSettings.firstPeriodDuration || periodDuration;
    const breakDuration = formData.timeSettings.breakDuration || 10;
    const lunchDuration = formData.timeSettings.lunchDuration || 30;

    // Determine day to add period
    let day = DAYS[0];
    if (formData.periods && formData.periods.length > 0) {
      const last = formData.periods[formData.periods.length - 1];
      // decide whether to continue same day or move to next
      const lastDayPeriods = formData.periods.filter((p) => p.day === last.day);
      const lastPeriod = lastDayPeriods[lastDayPeriods.length - 1];

      const nextStartIfLecture = addMinutes(lastPeriod.endTime, breakDuration);
      const nextEndIfLecture = addMinutes(nextStartIfLecture, periodDuration);

      if (getMinutesDifference(nextEndIfLecture, coachingEndTime) < 0) {
        const currentDayIndex = DAYS.indexOf(last.day);
        const nextDayIndex = currentDayIndex + 1;
        if (nextDayIndex >= DAYS.length) {
          toast.error("All days are filled. Cannot add more periods.");
          return;
        }
        day = DAYS[nextDayIndex];
      } else {
        day = last.day;
      }
    }

    const sameDayPeriods = formData.periods.filter((p) => p.day === day);

    // If there's at least one period on this day
    if (sameDayPeriods.length > 0) {
      const lastOfDay = sameDayPeriods[sameDayPeriods.length - 1];

      const breakExists = sameDayPeriods.some((p) => p.periodType === "break");
      const lunchExists = sameDayPeriods.some((p) => p.periodType === "lunch");
      const lecturesCount = sameDayPeriods.filter(
        (p) => p.periodType === "lecture",
      ).length;

      const nextStart = lastOfDay.endTime;
      const minutesRemainingFromNextStart = getMinutesDifference(
        nextStart,
        coachingEndTime,
      );
      const minutesSinceStart = getMinutesDifference(
        coachingStartTime,
        nextStart,
      );
      const dayTotalMinutes = getMinutesDifference(
        coachingStartTime,
        coachingEndTime,
      );

      // Decide whether to add break (only once per day)
      // Rule: add break after 4 lecture periods and only if there's room for break + at least one more lecture
      if (
        !breakExists &&
        lecturesCount >= 4 &&
        minutesRemainingFromNextStart >= breakDuration + periodDuration
      ) {
        const startTime = nextStart;
        const endTime = addMinutes(startTime, breakDuration);
        const periodNumber = sameDayPeriods.length + 1;

        const breakPeriod = {
          periodNumber,
          day,
          startTime,
          endTime,
          subjectId: "",
          teacherId: "",
          periodType: "break",
          roomNumber: getSectionByName(formData.section)?.roomNumber || "",
          section: formData.section,
        };

        if (isDuplicatePeriod(breakPeriod)) {
          toast.error(
            "This time slot is already occupied on this day for this section!",
          );
          return;
        }

        setFormData({
          ...formData,
          periods: [...formData.periods, breakPeriod],
        });
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
            subjectId: "",
            teacherId: "",
            periodType: "lecture",
            roomNumber: getSectionByName(formData.section)?.roomNumber || "",
            section: formData.section,
          };

          if (isDuplicatePeriod(newPeriod)) {
            toast.error(
              "This time slot is already occupied on this day for this section!",
            );
            return;
          }

          setFormData({
            ...formData,
            periods: [...formData.periods, newPeriod],
          });
          toast.success(
            `Added period ${periodNumber} for ${day} (${startTime} - ${endTime}) - ${remainingMinutes} min`,
          );
          return;
        }

        // Less than 15 minutes remaining, move to next day
        const currentDayIndex = DAYS.indexOf(day);
        const nextDayIndex = currentDayIndex + 1;
        if (nextDayIndex >= DAYS.length) {
          toast.error("All days are filled. Cannot add more periods.");
          return;
        }
        day = DAYS[nextDayIndex];
        const startTime2 = coachingStartTime;
        const endTime2 = addMinutes(
          startTime2,
          firstPeriodDuration || periodDuration,
        );
        const periodNumber2 =
          formData.periods.filter((p) => p.day === day).length + 1;

        const newPeriod = {
          periodNumber: periodNumber2,
          day,
          startTime: startTime2,
          endTime: endTime2,
          subjectId: "",
          teacherId: "",
          periodType: "lecture",
          roomNumber: getSectionByName(formData.section)?.roomNumber || "",
          section: formData.section,
        };

        if (isDuplicatePeriod(newPeriod)) {
          toast.error(
            "This time slot is already occupied on this day for this section!",
          );
          return;
        }

        setFormData({ ...formData, periods: [...formData.periods, newPeriod] });
        toast.success(
          `Added period ${periodNumber2} for ${day} (${startTime2} - ${endTime2})`,
        );
        return;
      }

      const periodNumber = sameDayPeriods.length + 1;
      const newPeriod = {
        periodNumber,
        day,
        startTime,
        endTime,
        subjectId: "",
        teacherId: "",
        periodType: "lecture",
        roomNumber: getSectionByName(formData.section)?.roomNumber || "",
        section: formData.section,
      };

      if (isDuplicatePeriod(newPeriod)) {
        toast.error(
          "This time slot is already occupied on this day for this section!",
        );
        return;
      }

      setFormData({ ...formData, periods: [...formData.periods, newPeriod] });
      toast.success(
        `Added period ${periodNumber} for ${day} (${startTime} - ${endTime})`,
      );
      return;
    }

    // No periods for this day yet -> add first period using firstPeriodDuration
    const firstStartTime = coachingStartTime;
    const firstEndTime = addMinutes(
      firstStartTime,
      firstPeriodDuration || periodDuration,
    );

    const newPeriod = {
      periodNumber: 1,
      day,
      startTime: firstStartTime,
      endTime: firstEndTime,
      subjectId: "",
      teacherId: "",
      periodType: "lecture",
      roomNumber: getSectionByName(formData.section)?.roomNumber || "",
      section: formData.section,
    };

    if (isDuplicatePeriod(newPeriod)) {
      toast.error(
        "This time slot is already occupied on this day for this section!",
      );
      return;
    }

    setFormData({ ...formData, periods: [...formData.periods, newPeriod] });
    toast.success(
      `Added first period for ${day} (${firstStartTime} - ${firstEndTime})`,
    );
  };

  const updatePeriod = (index, field, value) => {
    const updatedPeriods = [...formData.periods];
    const period = { ...updatedPeriods[index], [field]: value };
    updatedPeriods[index] = period;

    // Check for duplicates/conflicts when updating time, day, or teacher
    if (["day", "startTime", "endTime", "teacherId"].includes(field)) {
      if (isDuplicatePeriod(period, index)) {
        toast.error("This time slot is already occupied on this day for this section!");
        return;
      }

      if (period.teacherId) {
        const conflict = isTeacherAvailable(
          period.teacherId,
          period.day,
          period.startTime,
          period.endTime,
          index
        );
        // Since isTeacherAvailable in Super Admin returns boolean (true for available),
        // I need to check for false.
        if (conflict === false) {
          toast.error("Teacher Conflict: This teacher is already assigned to another period at this time.");
          return;
        }
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
          const pTeacherId =
            typeof p.teacherId === "object"
              ? p.teacherId.id || p.teacherId
              : p.teacherId;
          if (!pTeacherId) return;
          if (String(pTeacherId) === String(teacherId)) {
            aggregated.push({
              // keep original period fields, but attach source class/section/branch for context
              ...p,
              className:
                tt.classId?.name || (tt.classId?.id ? tt.classId?.id : ""),
              section: tt.section,
              branchName: tt.branchId?.name || "",
            });
          }
        });
      });

      const teacherObj = teachers.find(
        (t) => String(t.id) === String(teacherId),
      );
      setViewingTimetable({
        id: `teacher-${teacherId}`,
        name: `Teacher Schedule - ${teacherObj ? `${teacherObj.first_name} ${teacherObj.last_name}` : teacherId}`,
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
      draft: "secondary",
      active: "default",
      inactive: "destructive",
      archived: "outline",
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
      </div>

      {/* Filters */}
      <Card className="border-none shadow-sm bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border border-slate-200 dark:border-slate-800">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg font-bold">
              <Filter className="h-5 w-5 text-indigo-500" />
              Advanced Filters
            </CardTitle>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => {
                setSelectedBranch("");
                setSelectedClass("");
                setSelectedSection("");
                setSelectedTeacher("");
                setSelectedAcademicYear("");
                setClasses([]);
                setSections([]);
                setTeachers([]);
                fetchTimetables();
              }}
              className="text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors"
            >
              Reset All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                <Building2 className="h-3 w-3" />
                Branch
              </Label>
              <BranchSelect
                value={selectedBranch}
                onChange={(e) => {
                  const branchId = e.target.value;
                  setSelectedBranch(branchId);
                  setSelectedClass("");
                  setSelectedSection("");
                  setSelectedTeacher("");
                  if (branchId) {
                    fetchClasses(branchId);
                    fetchTeachers(branchId);
                    fetchAcademicYears(branchId);
                  }
                }}
                branches={branches}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                <BookOpen className="h-3 w-3" />
                Class
              </Label>
              <ClassSelect
                value={selectedClass}
                onChange={(e) => {
                  const classId = e.target.value;
                  setSelectedClass(classId);
                  setSelectedSection("");
                  if (classId) {
                    fetchSections(classId);
                  } else {
                    setSections([]);
                  }
                }}
                classes={classes}
                placeholder="All Classes"
                className="w-full bg-white dark:bg-slate-950 font-medium"
                disabled={!selectedBranch}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                <Users className="h-3 w-3" />
                Section
              </Label>
              <Dropdown
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)}
                options={[
                  { value: "", label: "All Sections" },
                  ...sections.map((s) => ({
                    value: s.name,
                    label: `${s.name} ${s.roomNumber ? `(Room: ${s.roomNumber})` : ""}`,
                  })),
                ]}
                placeholder="All Sections"
                disabled={!selectedClass}
                className="bg-white dark:bg-slate-950 font-medium"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                <User className="h-3 w-3" />
                Teacher
              </Label>
              <Dropdown
                value={selectedTeacher}
                onChange={(e) => setSelectedTeacher(e.target.value)}
                options={[
                  { value: "", label: "All Teachers" },
                  ...teachers.map((t) => ({
                    value: t.id,
                    label: `${t.first_name} ${t.last_name}`,
                  })),
                ]}
                placeholder="All Teachers"
                disabled={!selectedBranch}
                className="bg-white dark:bg-slate-950 font-medium"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                <Calendar className="h-3 w-3" />
                Academic Year
              </Label>
              <Dropdown
                value={selectedAcademicYear}
                onChange={(e) => setSelectedAcademicYear(e.target.value)}
                options={[
                  { value: "", label: "All Years" },
                  ...academicYears.map((year) => ({
                    value: year.id,
                    label: year.name,
                  })),
                ]}
                placeholder="Select Academic Year"
                disabled={!selectedBranch}
                className="bg-white dark:bg-slate-950 font-medium"
              />
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 flex justify-end">
            <Button
              onClick={() => fetchTimetables()}
              className="px-8 font-bold shadow-lg shadow-indigo-500/20 bg-indigo-600 hover:bg-indigo-700 transition-all"
              disabled={fetchingTimetables}
            >
              {fetchingTimetables ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Searching...</span>
                </div>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Apply Filters
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Timetables List */}
      <Card className="border-none shadow-xl bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm overflow-hidden">
        <CardHeader className="border-b border-gray-100 dark:border-gray-800 pb-6">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 bg-clip-text text-transparent">
                Timetables Management
              </CardTitle>
              <CardDescription className="mt-1">
                {timetables.length} active schedules across all branches
              </CardDescription>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
              <Calendar className="h-6 w-6" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            {viewMode === "grouped" ? (
              <div className="space-y-8 p-6">
                {Object.entries(groupedTimetables).map(
                  ([branchId, branchData]) => (
                    <div key={branchId} className="space-y-4">
                      <div className="flex items-center gap-4 border-b border-gray-100 dark:border-gray-800 pb-2">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-200 dark:shadow-none">
                          <Search className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-gray-900 dark:text-white uppercase tracking-tight">
                            {branchData.name}
                          </h3>
                          <p className="text-xs text-gray-500 font-medium">
                            {branchData.timetables.length} schedules found for
                            this campus
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {branchData.timetables.map((tt) => (
                          <div
                            key={tt.id}
                            className="group relative bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl p-5 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                          >
                            <div className="flex justify-between items-start mb-4">
                              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400 group-hover:scale-110 transition-transform">
                                <BookOpen className="h-5 w-5" />
                              </div>
                              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => setViewingTimetable(tt)}
                                  className="h-8 w-8 text-blue-600 hover:bg-blue-50"
                                >
                                  <Calendar className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>

                            <div className="space-y-1">
                              <h4 className="font-bold text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors">
                                {tt.class?.name || tt.classId?.name || "N/A"}
                              </h4>
                              <p className="text-xs text-gray-500 font-medium">
                                Section:{" "}
                                {tt.section?.name || tt.section || "All"}
                              </p>
                            </div>

                            <div className="mt-4 pt-4 border-t border-gray-50 dark:border-gray-700 flex items-center justify-between">
                              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                {getAcademicYearDisplay(
                                  tt.academicYear ||
                                    tt.academicYearId ||
                                    tt.academic_year_id,
                                )}
                              </span>
                              <div className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase">
                                {tt.periods?.length || 0} Periods
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ),
                )}
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700">
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Timetable Name
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Campus
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Class
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Section
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500 text-center">
                      Year
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500 text-center">
                      Periods
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {timetables.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-16 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <Calendar className="h-10 w-10 text-gray-300" />
                          <p className="text-gray-500 font-medium">
                            No timetables found.
                          </p>
                          <p className="text-xs text-gray-400">
                            Try adjusting your filters or create a new one.
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    timetables.map((tt) => (
                      <tr
                        key={tt.id}
                        className="hover:bg-gray-50/50 dark:hover:bg-gray-900/20 transition-all duration-200"
                      >
                        <td className="px-6 py-4">
                          <div className="font-bold text-gray-900 dark:text-white">
                            {tt.name}
                          </div>
                          <div className="flex items-center gap-1.5 mt-1">
                            <div
                              className={`h-1.5 w-1.5 rounded-full ${tt.status === "active" ? "bg-emerald-500" : "bg-amber-500"}`}
                            ></div>
                            <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">
                              {tt.status || "Active"}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                            {tt.branch?.name || tt.branchId?.name || "N/A"}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400">
                              <BookOpen className="h-4 w-4" />
                            </div>
                            <span className="text-sm font-bold text-gray-900 dark:text-white">
                              {tt.class?.name || tt.classId?.name || "N/A"}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <Badge
                            variant="outline"
                            className="bg-slate-50 text-slate-600 border-slate-200"
                          >
                            {tt.section?.name || tt.section || "All"}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                            {getAcademicYearDisplay(
                              tt.academicYear ||
                                tt.academicYearId ||
                                tt.academic_year_id,
                            )}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="inline-flex items-center justify-center h-7 px-3 rounded-md bg-emerald-50 text-emerald-700 text-xs font-bold dark:bg-emerald-900/20 dark:text-emerald-400">
                            {tt.periods?.length || 0} Slots
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              title="View Calendar"
                              onClick={() => setViewingTimetable(tt)}
                              className="h-8 w-8 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                            >
                              <Calendar className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        open={showDialog}
        onClose={() => setShowDialog(false)}
        title={editingTimetable ? "Edit Timetable" : "Create Timetable"}
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
              {loading ? "Saving..." : editingTimetable ? "Update" : "Create"}
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
                }}
                options={academicYears.map((year) => ({
                  value: year.id,
                  label: year.name,
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
                  setFormData({
                    ...formData,
                    branchId: branchId,
                    classId: "",
                    section: "",
                    academicYear: "",
                  });
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
                  setFormData({ ...formData, classId: classId, section: "" });
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
                  const sRoom = getSectionByName(sec)?.roomNumber || "";
                  // update current form and ensure existing periods get the section's room if missing
                  setFormData((prev) => ({
                    ...prev,
                    section: sec,
                    periods: prev.periods.map((p) => ({
                      ...p,
                      section: sec,
                      roomNumber: sRoom,
                    })),
                  }));
                  // try to load existing timetable for selected branch/class/section
                  (async () => {
                    const existing = await fetchExistingTimetable(
                      formData.branchId,
                      formData.classId,
                      sec,
                      formData.academicYear,
                    );
                    if (existing) {
                      setEditingTimetable(existing);
                      setFormData((prev) => ({
                        ...prev,
                        name: existing.name,
                        academicYear: existing.academicYear,
                        branchId: existing.branchId?.id || existing.branchId,
                        classId: existing.classId?.id || existing.classId,
                        section: sec, // keep user-selected section
                        effectiveFrom:
                          existing.effectiveFrom?.split("T")[0] ||
                          prev.effectiveFrom,
                        effectiveTo:
                          existing.effectiveTo?.split("T")[0] ||
                          prev.effectiveTo,
                        status: existing.status,
                        periods: normalizePeriods(existing.periods, sec),
                        timeSettings:
                          existing.timeSettings || prev.timeSettings,
                      }));
                    }
                  })();
                }}
                options={sections.map((s) => {
                  // Check if this section already has a timetable in this branch, class, and academic year
                  const isUsed = branchTimetables.some((tt) => {
                    const ttBranchId = String(tt.branchId?.id || tt.branchId);
                    const ttClassId = String(tt.classId?.id || tt.classId);
                    const ttAcademicYear = String(tt.academicYear?.id || tt.academicYear);
                    const ttSection = String(tt.section?.name || tt.section);

                    return (
                      ttBranchId === String(formData.branchId) &&
                      ttClassId === String(formData.classId) &&
                      ttAcademicYear === String(formData.academicYear) &&
                      ttSection === String(s.name) &&
                      (!editingTimetable || tt.id !== editingTimetable.id)
                    );
                  });

                  return {
                    value: s.name,
                    label: isUsed
                      ? `${s.name} (Already Assigned)`
                      : `${s.name} ${s.roomNumber ? `(Room: ${s.roomNumber})` : ""}`,
                    disabled: isUsed,
                  };
                })}
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
                  { value: "draft", label: "Draft" },
                  { value: "active", label: "Active" },
                  { value: "inactive", label: "Inactive" },
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
                  value={formData.timeSettings.periodDuration ?? ""}
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
                  value={formData.timeSettings.firstPeriodDuration ?? ""}
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
                  value={formData.timeSettings.breakDuration ?? ""}
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
                  value={formData.timeSettings.lunchDuration ?? ""}
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
                <TimePicker
                  value={formData.timeSettings.coachingStartTime}
                  onChange={(val) =>
                    setFormData({
                      ...formData,
                      timeSettings: {
                        ...formData.timeSettings,
                        coachingStartTime: val,
                      },
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Coaching End Time</Label>
                <TimePicker
                  value={formData.timeSettings.coachingEndTime}
                  onChange={(val) =>
                    setFormData({
                      ...formData,
                      timeSettings: {
                        ...formData.timeSettings,
                        coachingEndTime: val,
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
                            updatePeriod(index, "day", e.target.value)
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
                              "periodNumber",
                              parseInt(e.target.value),
                            )
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Start Time</Label>
                        <TimePicker
                          value={period.startTime}
                          onChange={(val) =>
                            updatePeriod(index, "startTime", val)
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>End Time</Label>
                        <TimePicker
                          value={period.endTime}
                          onChange={(val) =>
                            updatePeriod(index, "endTime", val)
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Period Type</Label>
                        <Dropdown
                          value={period.periodType}
                          onChange={(e) =>
                            updatePeriod(index, "periodType", e.target.value)
                          }
                          options={PERIOD_TYPES.map((type) => ({
                            value: type.value,
                            label: type.label,
                          }))}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Teacher</Label>
                        <Dropdown
                          value={period.teacherId}
                          onChange={(e) =>
                            updatePeriod(index, "teacherId", e.target.value)
                          }
                          options={[
                            { value: "", label: "None" },
                            ...getAvailableTeachers(
                              period.day,
                              period.startTime,
                              period.endTime,
                              index,
                            ).map((teacher) => ({
                              value: teacher.id,
                              label: `${teacher.first_name} ${teacher.last_name}`,
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
                            updatePeriod(index, "roomNumber", e.target.value)
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

      <SimpleTimetableViewModal
        isOpen={!!viewingTimetable}
        onClose={() => setViewingTimetable(null)}
        timetable={viewingTimetable}
        teachers={allTeachers.length > 0 ? allTeachers : teachers}
      />

      {/* Loading Overlay */}
      {fetchingTimetables && <FullPageLoader message="Loading timetables..." />}
    </div>
  );
}
