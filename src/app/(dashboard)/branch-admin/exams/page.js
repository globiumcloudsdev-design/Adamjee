"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import Dropdown from "@/components/ui/dropdown";
import FullPageLoader from "@/components/ui/full-page-loader";
import { toast } from "sonner";
import apiClient from "@/lib/api-client";
import { API_ENDPOINTS } from "@/constants/api-endpoints";
import { useAuth } from "@/hooks/useAuth";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  Calendar,
  BookOpen,
  FileText,
  Clock,
  ClipboardCheck,
} from "lucide-react";
import { format } from "date-fns";
import ExamFormModal from "@/components/modals/ExamFormModal";
import EnterMarksModal from "@/components/modals/EnterMarksModal";
import ExamDetailsModal from "@/components/modals/ExamDetailsModal";
import ExamTable from "@/components/exams/ExamTable";
import { generateAdmitCards } from "@/lib/generateAdmitCards";

export default function ExamsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [exams, setExams] = useState([]);
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [groups, setGroups] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isMarksModalOpen, setIsMarksModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [editingExam, setEditingExam] = useState(null);
  const [selectedExam, setSelectedExam] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [generatingAdmitCards, setGeneratingAdmitCards] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("");

  useEffect(() => {
    if (user) {
      fetchExams();
      fetchInitialData();
    }
  }, [user, classFilter]);

  const fetchInitialData = async () => {
    try {
      console.log("Fetching initial data...");
      const [classesRes, sectionsRes, subjectsRes, groupsRes, academicYearsRes] = await Promise.all([
        apiClient.get("/api/classes"),
        apiClient.get("/api/sections"), 
        apiClient.get("/api/subjects"),
        apiClient.get("/api/groups"),
        apiClient.get("/api/academic-years"),
      ]);

      console.log("Classes Response Raw:", classesRes);
      console.log("Academic Years Response Raw:", academicYearsRes);

      // Robust data extraction
      const extractData = (res, keys = []) => {
        if (!res) return [];
        if (Array.isArray(res)) return res;
        if (res.data && Array.isArray(res.data)) return res.data;
        if (res.success && res.data && Array.isArray(res.data)) return res.data;
        
        // Check for specific keys like 'academic_years', 'groups', etc.
        for (const key of keys) {
          if (res[key] && Array.isArray(res[key])) return res[key];
        }
        
        return [];
      };

      const classesData = extractData(classesRes, ['classes', 'data']);
      const sectionsData = extractData(sectionsRes, ['sections', 'data']);
      const subjectsData = extractData(subjectsRes, ['subjects', 'data']);
      const groupsData = extractData(groupsRes, ['groups', 'data']);
      const ayData = extractData(academicYearsRes, ['academic_years', 'academicYears', 'data']);

      console.log("Parsed Data counts:", {
        classes: classesData.length,
        sections: sectionsData.length,
        groups: groupsData.length,
        academicYears: ayData.length
      });

      setClasses(classesData);
      setSections(sectionsData);
      setSubjects(subjectsData);
      setGroups(groupsData);
      setAcademicYears(ayData);
    } catch (error) {
      console.error("Error fetching initial data:", error);
    }
  };

  const fetchExams = async () => {
    try {
      setLoading(true);
      const params = {};
      if (classFilter) params.class_id = classFilter;

      const response = await apiClient.get(API_ENDPOINTS.BRANCH_ADMIN.EXAMS.LIST, params);
      if (response.success) {
        setExams(response.data || []);
      }
    } catch (error) {
      toast.error("Failed to fetch exams");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrUpdate = async (formData) => {
    setSubmitting(true);
    try {
      let response;
      if (editingExam) {
        response = await apiClient.put(API_ENDPOINTS.BRANCH_ADMIN.EXAMS.UPDATE(editingExam.id), formData);
      } else {
        response = await apiClient.post(API_ENDPOINTS.BRANCH_ADMIN.EXAMS.CREATE, formData);
      }

      if (response.success) {
        toast.success(editingExam ? "Exam updated" : "Exam created");
        setIsFormModalOpen(false);
        setEditingExam(null);
        fetchExams();
      }
    } catch (error) {
      toast.error(error.message || "Failed to save exam");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this exam?")) return;
    try {
      const response = await apiClient.delete(API_ENDPOINTS.BRANCH_ADMIN.EXAMS.DELETE(id));
      if (response.success) {
        toast.success("Exam deleted");
        fetchExams();
      }
    } catch (error) {
      toast.error("Failed to delete exam");
    }
  };

  const handleAdmitCard = async (exam) => {
    try {
      setGeneratingAdmitCards(true);
      toast.info("Fetching students, please wait...");

      const studentsRes = await apiClient.get(`/api/exams/${exam.id}/students`);
      if (!studentsRes.success || !studentsRes.data?.length) {
        toast.error("No students found for this exam/section.");
        return;
      }

      await generateAdmitCards({ exam, students: studentsRes.data });
      toast.success(`Admit cards generated for ${studentsRes.data.length} student(s)!`);
    } catch (error) {
      console.error("Admit card error:", error);
      toast.error("Failed to generate admit cards.");
    } finally {
      setGeneratingAdmitCards(false);
    }
  };

  if (loading && exams.length === 0) return <FullPageLoader message="Loading exams..." />;

  const filteredExams = exams.filter(e => 
    e.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Exam Management</h1>
          <p className="text-gray-500">
            {user.role === "SUPER_ADMIN" ? "View and monitor exams across all branches" : "Create exams and manage student marks"}
          </p>
        </div>
        {user.role === "BRANCH_ADMIN" && (
          <Button onClick={() => { setEditingExam(null); setIsFormModalOpen(true); }} className="bg-indigo-600 hover:bg-indigo-700">
            <Plus className="w-4 h-4 mr-2" /> Create Exam
          </Button>
        )}
      </div>

      <Card>
        <CardHeader className="pb-3 border-b">
          <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
            <CardTitle>All Examinations</CardTitle>
            <div className="flex flex-wrap gap-2 w-full md:w-auto">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input 
                  placeholder="Search exams..." 
                  className="pl-9"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Dropdown
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value)}
                options={[
                  { value: "", label: "All Classes" },
                  ...classes.map(c => ({ value: c.id, label: c.name }))
                ]}
                className="w-40"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ExamTable 
            exams={filteredExams}
            onView={(exam) => { setSelectedExam(exam); setIsViewModalOpen(true); }}
            onEdit={(exam) => { setEditingExam(exam); setIsFormModalOpen(true); }}
            onDelete={handleDelete}
            onResults={(exam) => router.push(`/branch-admin/exams/${exam.id}/marks`)}
            onAdmitCard={handleAdmitCard}
            onReports={(exam) => router.push(`/branch-admin/exams/${exam.id}/results`)}
            userRole="branch-admin"
            loading={loading}
          />
        </CardContent>
      </Card>

      {isFormModalOpen && (
        <ExamFormModal
          exam={editingExam}
          branches={user?.branch ? [user.branch] : (user?.branch_id ? [{ id: user.branch_id, name: user.branch_name || 'Current Branch' }] : [])}
          classes={classes}
          sections={sections}
          subjects={subjects}
          groups={groups}
          academicYears={academicYears}
          onClose={() => { setIsFormModalOpen(false); setEditingExam(null); }}
          onSubmit={handleCreateOrUpdate}
          loading={submitting}
        />
      )}

      {isMarksModalOpen && selectedExam && (
        <EnterMarksModal
          exam={selectedExam}
          onClose={() => { setIsMarksModalOpen(false); setSelectedExam(null); }}
        />
      )}

      {isViewModalOpen && selectedExam && (
        <ExamDetailsModal
          exam={selectedExam}
          onClose={() => { setIsViewModalOpen(false); setSelectedExam(null); }}
        />
      )}
    </div>
  );
}
