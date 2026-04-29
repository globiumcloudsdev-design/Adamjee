"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import apiClient from "@/lib/api-client";
import { API_ENDPOINTS } from "@/constants/api-endpoints";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import Dropdown from "@/components/ui/dropdown";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Search, Calendar, Edit, Trash2, Plus, BookOpen, Filter, Users, User, Building2 } from "lucide-react";
import Modal from "@/components/ui/modal";
import FullPageLoader from "@/components/ui/full-page-loader";
import { Input } from "@/components/ui/input";
import ClassSelect from "@/components/ui/class-select";
import { toast } from "sonner";
import ButtonLoader from "@/components/ui/button-loader";
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
  { value: "lecture", label: "Lecture" },
  { value: "lab", label: "Lab" },
  { value: "practical", label: "Practical" },
  { value: "break", label: "Break" },
  { value: "lunch", label: "Lunch" },
  { value: "assembly", label: "Assembly" },
  { value: "sports", label: "Sports" },
  { value: "library", label: "Library" },
];

export default function BranchTimetablePage() {
  const { user } = useAuth();
  const branchId =
    user?.branch_id ||
    user?.branchId ||
    (typeof user?.branch === "object" ? user.branch?.id : "") ||
    "";

  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [timetables, setTimetables] = useState([]);
  const [branchTimetables, setBranchTimetables] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");

  const formatTime12h = (timeStr) => {
    if (!timeStr) return "--";
    try {
      const [hours, minutes] = timeStr.split(":");
      let h = parseInt(hours);
      const ampm = h >= 12 ? "PM" : "AM";
      h = h % 12 || 12;
      return `${h}:${minutes} ${ampm}`;
    } catch (e) {
      return timeStr;
    }
  };

  const getTeacherName = (id) => {
    if (!id) return "N/A";
    const normalizedId = typeof id === "object" ? id.id : id;
    const t = teachers.find((t) => String(t.id) === String(normalizedId));
    return t ? `${t.first_name} ${t.last_name}` : "N/A";
  };
  const [selectedSection, setSelectedSection] = useState("");
  const [selectedTeacher, setSelectedTeacher] = useState("");
  const [selectedAcademicYear, setSelectedAcademicYear] = useState("");
  const [loading, setLoading] = useState(false);
  const [viewingTimetable, setViewingTimetable] = useState(null);

  const [showDialog, setShowDialog] = useState(false);
  const [editingTimetable, setEditingTimetable] = useState(null);
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState("");
  const [academicYears, setAcademicYears] = useState([]);
  const [teacherSchedules, setTeacherSchedules] = useState({});
  const [formData, setFormData] = useState({
    status: "active",
    periods: [],
    academicYear: "",
    groupId: "",
    classId: "",
    section: "",
    timeSettings: {
      periodDuration: 40,
      firstPeriodDuration: 50,
      breakDuration: 10,
      lunchDuration: 30,
      coachingStartTime: "16:00",
      coachingEndTime: "21:00",
    },
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    console.log(
      "Timetable useEffect triggered. User:",
      !!user,
      "BranchId:",
      branchId,
    );
    if (!user) return;
    fetchGroups();
    fetchClasses();
    fetchTeachers();
    fetchAcademicYears();
    fetchTeacherSchedulesForBranch(branchId, selectedAcademicYear);
    fetchTimetables(true); // Fetch all for duplicate checks
    fetchTimetables(false); // Fetch with filters for display
  }, [user, branchId]);

  useEffect(() => {
    if (selectedClass) {
      fetchSections(selectedClass);
    }
  }, [selectedClass]);

  const fetchGroups = async () => {
    try {
      const res = await apiClient.get("/api/groups");
      console.log("Fetched groups:", res);
      const data = Array.isArray(res) ? res : res.data || res.groups || [];
      setGroups(data);
    } catch (e) {
      console.error("Failed to fetch groups:", e);
    }
  };

  const fetchClasses = async () => {
    try {
      const res = await apiClient.get(API_ENDPOINTS.BRANCH_ADMIN.CLASSES.LIST, {
        branch_id: branchId,
      });
      setClasses(
        Array.isArray(res) ? res : res.data?.classes || res.classes || [],
      );
    } catch (e) {
      console.error("Failed to fetch classes:", e);
    }
  };

  const fetchSections = async (classId) => {
    try {
      const cls = classes.find((c) => c.id === classId);
      if (cls && cls.sections) setSections(cls.sections);
      else setSections([]);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchExistingTimetable = async (
    branchIdParam,
    classId,
    section,
    academicYear,
  ) => {
    if (!branchIdParam || !classId || !academicYear) return null;
    try {
      const url = `${API_ENDPOINTS.BRANCH_ADMIN.TIMETABLES.LIST}?branch_id=${encodeURIComponent(branchIdParam)}&class_id=${encodeURIComponent(classId)}&academic_year_id=${encodeURIComponent(academicYear)}`;
      const response = await apiClient.get(url);
      if (
        response.success &&
        Array.isArray(response.data) &&
        response.data.length > 0
      ) {
        const existing = response.data.find(
          (t) =>
            (t.classId?.id || t.classId) === classId &&
            (t.section?.id || t.section) === section,
        );
        return existing || null;
      }
      return null;
    } catch (error) {
      console.error("Failed to fetch existing timetable:", error);
      return null;
    }
  };

  const handleSectionChange = (e) => {
    const sec = typeof e === "object" && e.target ? e.target.value : e;
    setSelectedSection(sec);

    const sRoom = getSectionByName(sec)?.roomNumber || "";
    setFormData((prev) => ({
      ...prev,
      section: sec,
      periods: prev.periods.map((p) => ({
        ...p,
        section: sec,
        roomNumber: sRoom,
      })),
    }));

    (async () => {
      const existing = await fetchExistingTimetable(
        branchId,
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
          branchId: branchId,
          classId: existing.classId?.id || existing.classId,
          section: existing.section?.id || existing.section,
          effectiveFrom:
            existing.effectiveFrom?.split("T")[0] || prev.effectiveFrom,
          effectiveTo: existing.effectiveTo?.split("T")[0] || prev.effectiveTo,
          status: existing.status,
          periods: normalizePeriods(existing.periods, sec),
          timeSettings: existing.timeSettings || prev.timeSettings,
        }));
      } else {
        setEditingTimetable(null);
        setFormData((prev) => ({
          ...prev,
          section: sec,
          periods: [],
          timeSettings: {
            periodDuration: 40,
            firstPeriodDuration: 50,
            breakDuration: 10,
            lunchDuration: 30,
            coachingStartTime: "08:00",
            coachingEndTime: "14:00",
          },
        }));
      }
    })();
  };

  const fetchAcademicYears = async () => {
    try {
      const res = await apiClient.get("/api/academic-years");
      console.log("Fetched academic years:", res);
      const years =
        res.academic_years || res.data || (Array.isArray(res) ? res : []);
      setAcademicYears(years);
      if (years.length > 0 && !selectedAcademicYear) {
        const current = years.find((y) => y.is_current) || years[0];
        if (current) {
          setSelectedAcademicYear(current.id);
          setFormData((prev) => ({ ...prev, academicYear: current.id }));
        }
      }
    } catch (e) {
      console.error("Failed to fetch academic years:", e);
    }
  };

  const fetchTeachers = async () => {
    try {
      const res = await apiClient.get(
        `${API_ENDPOINTS.BRANCH_ADMIN.TEACHERS.LIST}?limit=1000`,
      );
      if (res.success) {
        setTeachers(res.data?.teachers || res.data || []);
      }
    } catch (e) {
      console.error("Failed to fetch teachers:", e);
      toast.error("Failed to load teachers");
    }
  };

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

  const getMinutesDifference = (time1, time2) => {
    const [h1, m1] = time1.split(":").map(Number);
    const [h2, m2] = time2.split(":").map(Number);
    const minutes1 = h1 * 60 + m1;
    const minutes2 = h2 * 60 + m2;
    return minutes2 - minutes1;
  };

  const getSectionByName = (sectionName) => {
    if (!sections || !sectionName) return null;
    return sections.find((s) => s.name === sectionName) || null;
  };

  const normalizePeriods = (periods = [], sectionName = "") => {
    const section = getSectionByName(sectionName);
    return (periods || []).map((p) => ({
      ...p,
      subjectId: p.subjectId?.id || p.subjectId || "",
      teacherId: p.teacherId?.id || p.teacherId || "",
      roomNumber: p.roomNumber || section?.roomNumber || "",
      section: p.section || sectionName || "",
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

    let day = DAYS[0];
    if (formData.periods && formData.periods.length > 0) {
      const last = formData.periods[formData.periods.length - 1];
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
    if (sameDayPeriods.length > 0) {
      const lastOfDay = sameDayPeriods[sameDayPeriods.length - 1];
      const breakExists = sameDayPeriods.some((p) => p.periodType === "break");
      const lecturesCount = sameDayPeriods.filter(
        (p) => p.periodType === "lecture",
      ).length;
      const nextStart = lastOfDay.endTime;
      const minutesRemainingFromNextStart = getMinutesDifference(
        nextStart,
        coachingEndTime,
      );

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

      let startTime = lastOfDay.endTime;
      let endTime = addMinutes(startTime, periodDuration);
      if (getMinutesDifference(endTime, coachingEndTime) < 0) {
        const remainingMinutes = minutesRemainingFromNextStart;
        if (remainingMinutes >= 15) {
          endTime = coachingEndTime;
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
          teacherId: "",
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

    if (["day", "startTime", "endTime", "teacherId"].includes(field)) {
      if (isDuplicatePeriod(period, index)) {
        toast.error("This time slot is already occupied on this day for this section!");
        return;
      }

      if (period.teacherId && field !== "teacherId") {
        const conflict = isTeacherAvailable(
          period.teacherId,
          period.day,
          period.startTime,
          period.endTime,
          editingTimetable?.id,
          index
        );
        if (conflict) {
          toast.error(`Teacher Conflict: This teacher is busy in ${conflict.className} - ${conflict.sectionName}`);
          return;
        }
      }

      if (field === "teacherId" && value) {
        const conflict = isTeacherAvailable(
          value,
          period.day,
          period.startTime,
          period.endTime,
          editingTimetable?.id,
          index
        );
        if (conflict) {
          toast.error(`Teacher Conflict: This teacher is busy in ${conflict.className} - ${conflict.sectionName}`);
          return;
        }
      }
    }
    setFormData({ ...formData, periods: updatedPeriods });
  };

  const removePeriod = (index) => {
    const updated = formData.periods.filter((_, i) => i !== index);
    setFormData({ ...formData, periods: updated });
  };

  const isTeacherAvailable = (
    teacherId,
    day,
    startTime,
    endTime,
    currentTimetableId = null,
    currentPeriodIndex = -1,
  ) => {
    if (!teacherId || !day || !startTime || !endTime) return null;
    const normalizedTeacherId =
      typeof teacherId === "object" ? teacherId.id || teacherId : teacherId;
    if (!normalizedTeacherId) return null;

    // 1. Check existing timetables in database
    const teacherSchedule = teacherSchedules[normalizedTeacherId] || [];
    const dbConflict = teacherSchedule.find((s) => {
      if (currentTimetableId && s.timetableId === currentTimetableId)
        return false;
      if (s.day !== day) return false;
      const pStart = s.startTime;
      const pEnd = s.endTime;
      if (
        (startTime >= pStart && startTime < pEnd) ||
        (endTime > pStart && endTime <= pEnd) ||
        (startTime <= pStart && endTime >= pEnd)
      )
        return true;
      return false;
    });

    if (dbConflict) return dbConflict;

    // 2. Check current form periods (internal conflicts)
    const formConflict = formData.periods.find((p, idx) => {
      if (idx === currentPeriodIndex) return false;
      const pTid =
        typeof p.teacherId === "object"
          ? p.teacherId.id || p.teacherId
          : p.teacherId;
      if (
        !pTid ||
        String(pTid) !== String(normalizedTeacherId) ||
        p.day !== day
      )
        return false;

      const pStart = p.startTime;
      const pEnd = p.endTime;
      if (
        (startTime >= pStart && startTime < pEnd) ||
        (endTime > pStart && endTime <= pEnd) ||
        (startTime <= pStart && endTime >= pEnd)
      )
        return true;
      return false;
    });

    return formConflict
      ? { ...formConflict, className: "Current Form", sectionName: "Selection" }
      : null;
  };

  const getAvailableTeachers = (
    day,
    startTime,
    endTime,
    currentPeriodIndex = -1,
    currentTeacherId = null,
  ) => {
    if (!day || !startTime || !endTime) {
      return teachers.map((t) => ({
        value: t.id,
        label: `${t.first_name} ${t.last_name}`,
      }));
    }

    const currentTimetableId = editingTimetable ? editingTimetable.id : null;
    return teachers.map((teacher) => {
      const conflict = isTeacherAvailable(
        teacher.id,
        day,
        startTime,
        endTime,
        currentTimetableId,
        currentPeriodIndex,
      );

      const isCurrent =
        currentTeacherId &&
        (typeof currentTeacherId === "object"
          ? currentTeacherId.id === teacher.id
          : currentTeacherId === teacher.id);

      let label = `${teacher.first_name} ${teacher.last_name}`;
      if (conflict && !isCurrent) {
        label += ` (BUZY in ${conflict.className}${conflict.sectionName ? ` - ${conflict.sectionName}` : ""})`;
      }

      return {
        value: teacher.id,
        label: label,
        disabled: !!conflict && !isCurrent,
      };
    });
  };

  const fetchTeacherSchedulesForBranch = async (
    branchIdParam,
    academicYear,
  ) => {
    if (!branchIdParam || !academicYear) return;
    try {
      // Teacher API uses branchId (camelCase)
      const res = await apiClient.get(
        API_ENDPOINTS.BRANCH_ADMIN.TEACHERS.LIST,
        { branchId: branchIdParam },
      );
      const teachersList = Array.isArray(res)
        ? res
        : res.data?.teachers || res.teachers || res.data || [];
      setTeachers(teachersList);

      // Timetable API uses branch_id (snake_case)
      const ttUrl = `${API_ENDPOINTS.BRANCH_ADMIN.TIMETABLES.LIST}?branch_id=${encodeURIComponent(branchIdParam)}&academic_year_id=${encodeURIComponent(academicYear)}`;
      const ttRes = await apiClient.get(ttUrl);
      const ttList =
        ttRes.timetable || (Array.isArray(ttRes) ? ttRes : ttRes.data || []);

      const map = {};
      ttList.forEach((tt) => {
        const ttId = tt.id;
        (tt.periods || []).forEach((p) => {
          const tId = p.teacherId || p.teacher_id;
          if (!tId) return;
          const normalizedTid = typeof tId === "object" ? tId.id || tId : tId;
          if (!map[normalizedTid]) map[normalizedTid] = [];
          map[normalizedTid].push({
            day: p.day || p.day_of_week,
            startTime: p.startTime || p.start_time,
            endTime: p.endTime || p.end_time,
            timetableId: ttId,
            className: tt.class?.name || tt.classId?.name || "N/A",
            sectionName: tt.section?.name || tt.sectionId?.name || "N/A",
          });
        });
      });
      setTeacherSchedules(map);
    } catch (e) {
      console.error("Failed to fetch teacher schedules:", e);
    }
  };

  const fetchTimetables = async (fetchAll = false) => {
    setLoading(true);
    try {
      const params = fetchAll
        ? { branch_id: branchId }
        : {
            branch_id: branchId,
            class_id: selectedClass || undefined,
            section_id: selectedSection || undefined,
            academic_year_id: selectedAcademicYear || undefined,
            teacher_id: selectedTeacher || undefined,
          };

      const res = await apiClient.get(
        API_ENDPOINTS.BRANCH_ADMIN.TIMETABLES.LIST,
        params,
      );
      if (res.success) {
        if (fetchAll) {
          setBranchTimetables(res.data || []);
        } else {
          setTimetables(res.data || []);
        }
      }
    } catch (e) {
      console.error("Failed to fetch timetables:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = async () => {
    setEditingTimetable(null);
    setFormData((prev) => ({
      ...prev,
      name: "",
      academicYear: selectedAcademicYear || "2024-2025",
      classId: "",
      section: "",
      periods: [],
    }));
    setShowDialog(true);
  };

  const handleEdit = (timetable) => {
    setEditingTimetable(timetable);
    const classId = timetable.classId?.id || timetable.classId;
    const sectionId = timetable.section?.id || timetable.section;

    setFormData({
      ...formData,
      classId,
      section: sectionId,
      academicYear: timetable.academicYear?.id || timetable.academicYear,
      periods: (timetable.periods || []).map((p) => ({
        ...p,
        day: p.day || p.day_of_week,
        startTime: p.startTime || p.start_time,
        endTime: p.endTime || p.end_time,
        subjectId: p.subjectId || p.subject_id || "",
        teacherId: p.teacherId || p.teacher_id || "",
        roomNumber: p.roomNumber || p.room_no,
        periodType: p.periodType || p.period_type,
      })),
      timeSettings: timetable.timeSettings || {
        periodDuration: 40,
        firstPeriodDuration: 50,
        breakDuration: 10,
        lunchDuration: 30,
        coachingStartTime: "08:00",
        coachingEndTime: "14:00",
      },
    });
    setShowDialog(true);
  };

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    // Final validation for teacher conflicts
    for (let i = 0; i < formData.periods.length; i++) {
      const p = formData.periods[i];
      if (!p.teacherId) continue;

      const conflict = isTeacherAvailable(
        p.teacherId,
        p.day,
        p.startTime,
        p.endTime,
        editingTimetable?.id,
        i,
      );

      if (conflict) {
        toast.error(
          `Conflict: Teacher is already assigned to ${conflict.className} (${conflict.sectionName}) on ${p.day} at ${p.startTime}`,
        );
        return;
      }
    }

    setSubmitting(true);
    try {
      const payload = {
        class_id: formData.classId,
        section_id: formData.section,
        academic_year_id: formData.academicYear,
        periods: formData.periods.map((p) => ({
          day: p.day,
          startTime: p.startTime,
          endTime: p.endTime,
          subjectId: p.subjectId,
          teacherId: p.teacherId,
          roomNumber: p.roomNumber,
          periodType: p.periodType,
        })),
      };
      let res;
      if (editingTimetable && editingTimetable.id) {
        res = await apiClient.put(
          API_ENDPOINTS.BRANCH_ADMIN.TIMETABLES.UPDATE(editingTimetable.id),
          payload,
        );
      } else {
        res = await apiClient.post(
          API_ENDPOINTS.BRANCH_ADMIN.TIMETABLES.CREATE,
          payload,
        );
      }

      if (res?.success) {
        toast.success("Timetable saved");
        setShowDialog(false);
        fetchTimetables();
      } else {
        toast.error(res?.error || res?.message || "Failed to save timetable");
      }
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Failed to save timetable");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this timetable?")) return;
    try {
      const res = await apiClient.delete(
        `${API_ENDPOINTS.BRANCH_ADMIN.TIMETABLES.DELETE(id)}?id=${encodeURIComponent(id)}`,
      );
      if (res?.success) {
        toast.success(res.message || "Deleted");
        fetchTimetables();
      } else {
        toast.error(res?.message || "Failed to delete");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete timetable");
    }
  };

  const viewTimetable = (tt) => {
    // If teacher selected, aggregate teacher periods across fetched timetables
    if (selectedTeacher) {
      const aggregated = [];
      timetables.forEach((t) => {
        (t.periods || []).forEach((p) => {
          const pTid = p.teacherId || p.teacher_id;
          const normalizedTid =
            typeof pTid === "object" ? pTid.id || pTid : pTid;
          if (String(normalizedTid) === String(selectedTeacher)) {
            aggregated.push({
              ...p,
              className: t.class?.name || t.classId?.name,
              sectionName: t.section?.name || t.sectionId?.name,
            });
          }
        });
      });
      const teacherObj = teachers.find(
        (t) => String(t.id) === String(selectedTeacher),
      );
      setViewingTimetable({
        name: `Teacher Schedule - ${teacherObj ? `${teacherObj.first_name} ${teacherObj.last_name}` : selectedTeacher}`,
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
          <p className="text-sm text-muted-foreground mt-1">
            View and manage campus class schedules.
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleCreateNew} disabled={loading} className="font-bold shadow-lg shadow-indigo-500/10">
            <Plus className="mr-2 h-4 w-4" />
            Create Timetable
          </Button>
        </div>
      </div>

      <Card className="border-none shadow-sm bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border border-slate-200 dark:border-slate-800 mb-6">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg font-bold">
              <Filter className="h-5 w-5 text-indigo-500" />
              Filter Schedule
            </CardTitle>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => {
                setSelectedGroup("");
                setSelectedClass("");
                setSelectedSection("");
                setSelectedTeacher("");
                setSelectedAcademicYear("");
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
                <BookOpen className="h-3 w-3" />
                Group
              </Label>
              <Dropdown
                value={selectedGroup}
                onChange={(e) => {
                  setSelectedGroup(e.target.value);
                  setSelectedClass("");
                  setSelectedSection("");
                }}
                options={[
                  { value: "", label: "All Groups" },
                  ...groups.map((g) => ({ value: g.id, label: g.name })),
                ]}
                className="bg-white dark:bg-slate-950 font-medium"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                <Building2 className="h-3 w-3" />
                Class
              </Label>
              <Dropdown
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                options={[
                  { value: "", label: "All Classes" },
                  ...classes
                    .filter(
                      (c) => !selectedGroup || c.group_id === selectedGroup,
                    )
                    .map((c) => ({ value: c.id, label: c.name })),
                ]}
                className="bg-white dark:bg-slate-950 font-medium"
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
                  ...sections.map((s) => ({ value: s.id, label: s.name })),
                ]}
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
                  ...academicYears.map((y) => ({ value: y.id, label: y.name })),
                ]}
                className="bg-white dark:bg-slate-950 font-medium"
              />
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 flex justify-end">
            <Button
              onClick={() => fetchTimetables()}
              className="px-8 font-bold shadow-lg shadow-indigo-500/20 bg-indigo-600 hover:bg-indigo-700 transition-all"
              disabled={loading}
            >
              {loading ? (
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

      <Card className="mt-8 overflow-hidden border-none shadow-lg">
        <CardHeader className="bg-white dark:bg-gray-800 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">
                Existing Timetables
              </CardTitle>
              <CardDescription className="text-sm text-gray-500">
                Manage and view schedules for your branch
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10 dark:bg-blue-900/30 dark:text-blue-400">
                {timetables.length} Total
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-12 gap-4">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
              <p className="text-sm text-gray-500 font-medium">
                Loading schedules...
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700">
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Class & Section
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Academic Year
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500 text-center">
                      Periods
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Last Modified
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {timetables.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-16 text-center">
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
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400">
                              <BookOpen className="h-5 w-5" />
                            </div>
                            <div>
                              <div className="font-bold text-gray-900 dark:text-white">
                                {tt.class?.name || "N/A"}
                              </div>
                              <div className="text-xs text-gray-500 font-medium uppercase tracking-tight">
                                Section {tt.section?.name || "All"}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                            {tt.academicYear?.name ||
                              tt.academicYearId?.name ||
                              tt.academic_year_id?.name ||
                              tt.academicYear ||
                              "N/A"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="inline-flex items-center justify-center h-7 px-3 rounded-md bg-emerald-50 text-emerald-700 text-xs font-bold dark:bg-emerald-900/20 dark:text-emerald-400">
                            {tt.periods?.length || 0} Slots
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs text-gray-500">
                            {new Date(
                              tt.updated_at || tt.created_at,
                            ).toLocaleDateString()}
                          </span>
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
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Edit"
                              onClick={() => handleEdit(tt)}
                              className="h-8 w-8 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/30"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Delete"
                              onClick={() => handleDelete(tt.id)}
                              className="h-8 w-8 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30"
                            >
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
          )}
        </CardContent>
      </Card>

      {/* Create / Edit Modal */}
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
            <Button type="submit" form="timetable-form" disabled={submitting}>
              {submitting
                ? "Saving..."
                : editingTimetable
                  ? "Update"
                  : "Create"}
            </Button>
          </div>
        }
      >
        <form id="timetable-form" onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Academic Year *</Label>
              <Dropdown
                value={formData.academicYear}
                onChange={(e) => {
                  const val = e.target.value;
                  setFormData({ ...formData, academicYear: val });
                  if (branchId) fetchTeacherSchedulesForBranch(branchId, val);
                }}
                options={
                  academicYears.length > 0
                    ? academicYears.map((y) => ({ value: y.id, label: y.name }))
                    : [{ value: "", label: "No record found", disabled: true }]
                }
                placeholder="Select Year"
              />
            </div>

            <div className="space-y-2">
              <Label>Group *</Label>
              <Dropdown
                value={formData.groupId}
                onChange={(e) => {
                  const val = e.target.value;
                  setFormData({
                    ...formData,
                    groupId: val,
                    classId: "",
                    section: "",
                    periods: [],
                  });
                }}
                options={
                  groups.length > 0
                    ? groups.map((g) => ({ value: g.id, label: g.name }))
                    : [{ value: "", label: "No record found", disabled: true }]
                }
                placeholder="Select Group"
              />
            </div>

            <div className="space-y-2">
              <Label>Class *</Label>
              <Dropdown
                value={formData.classId}
                onChange={(e) => {
                  const val = e.target.value;
                  setFormData({
                    ...formData,
                    classId: val,
                    section: "",
                    periods: [],
                  });
                  if (val) {
                    fetchSections(val);
                    fetchSubjects(val);
                  }
                }}
                options={(() => {
                  if (!formData.groupId)
                    return [
                      {
                        value: "",
                        label: "Please select Group first",
                        disabled: true,
                      },
                    ];
                  const filtered = classes.filter(
                    (c) => c.group_id === formData.groupId,
                  );
                  return filtered.length > 0
                    ? filtered.map((c) => ({ value: c.id, label: c.name }))
                    : [{ value: "", label: "No record found", disabled: true }];
                })()}
                disabled={!formData.groupId}
                placeholder="Select Class"
              />
            </div>

            <div className="space-y-2">
              <Label>Section *</Label>
              <Dropdown
                value={formData.section}
                onChange={(e) => {
                  const val = e.target.value;
                  handleSectionChange(val);
                }}
                options={(() => {
                  if (!formData.classId)
                    return [
                      {
                        value: "",
                        label: "Please select Class first",
                        disabled: true,
                      },
                    ];

                  // Filter out sections that already have a timetable using FULL branch list
                  const usedSectionIds = branchTimetables
                    .filter(
                      (tt) =>
                        (String(tt.class_id || tt.class?.id) === String(formData.classId)) &&
                        (String(tt.academic_year_id || tt.academicYear?.id || tt.academicYear) === String(formData.academicYear)) &&
                        (!editingTimetable || tt.id !== editingTimetable.id),
                    )
                    .map((tt) => String(tt.section_id || tt.section?.id || tt.section));

                  return sections.length > 0
                    ? sections.map((s) => {
                        const isUsed = usedSectionIds.includes(String(s.id));
                        return {
                          value: s.id,
                          label: isUsed
                            ? `${s.name} (Already Assigned)`
                            : s.name,
                          disabled: isUsed,
                        };
                      })
                    : [{ value: "", label: "No record found", disabled: true }];
                })()}
                disabled={!formData.classId}
                placeholder="Select Section"
              />
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
                            if (!formData.section) return true;
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
                              period.teacherId,
                            ).map((t) => ({
                              value: t.value,
                              label: t.label,
                              disabled: t.disabled,
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
        teachers={teachers}
      />

    </div>
  );
}
