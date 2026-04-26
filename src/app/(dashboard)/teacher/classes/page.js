"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Modal from "@/components/ui/modal";
import Tabs, { TabPanel } from "@/components/ui/tabs";
import apiClient from "@/lib/api-client";
import { API_ENDPOINTS } from "@/constants/api-endpoints";
import {
  BookOpen,
  Users,
  TrendingUp,
  Clock,
  Search,
  FileText,
  CheckCircle2,
  AlertCircle,
  Calendar,
  MapPin,
  ChevronRight,
  ArrowLeft,
  Mail,
  Phone,
  GraduationCap,
  Activity,
  BarChart3,
  MessageSquare,
} from "lucide-react";
import DashboardSkeleton from "@/components/teacher/DashboardSkeleton";

export default function TeacherClassesPage() {
  const router = useRouter();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    loadClasses();
  }, []);

  const loadClasses = async () => {
    try {
      setLoading(true);
      // Use apiClient to fetch data (automatic token handling)
      const [classesResult, assignmentsResult] = await Promise.all([
        apiClient.get(API_ENDPOINTS.TEACHER.MY_CLASSES.LIST),
        apiClient.get(API_ENDPOINTS.TEACHER.ASSIGNMENTS.LIST)
      ]);      
      
      if (classesResult.success) {
        const classesData = classesResult.data || [];
        const assignmentsData = assignmentsResult.success ? (assignmentsResult.data || []) : [];
        
        // Merge assignments with classes
        const classesWithAssignments = classesData.map(classItem => {
          // Filter assignments for this class and section
          const classAssignments = assignmentsData.filter(assignment => {
            const matchClass = String(assignment.classId?._id || assignment.classId) === String(classItem.classId);
            const matchSection = !assignment.sectionId || assignment.sectionId === classItem.section;
            return matchClass && matchSection;
          }).map(assignment => ({
            id: assignment._id,
            title: assignment.title,
            description: assignment.description,
            dueDate: new Date(assignment.dueDate).toLocaleDateString(),
            status: assignment.status === 'published' ? 'Active' : assignment.status === 'draft' ? 'Draft' : 'Closed',
            type: assignment.subjectId?.name || classItem.subjectName || 'Assignment',
            submissions: assignment.submissionCount || 0,
            total: classItem.studentCount || 0,
            maxPoints: assignment.totalMarks || 0,
            _id: assignment._id,
            videoUrl: assignment.videoUrl,
            attachments: assignment.attachments || [],
          }));
          
          return {
            ...classItem,
            assignments: classAssignments
          };
        });
        
        setClasses(classesWithAssignments);
      } else {
        console.error('Failed to load classes:', classesResult.error);
        setClasses([]);
      }
    } catch (error) {
      console.error("Error loading classes:", error);
      setClasses([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredClasses = classes.filter(
    (cls) =>
      cls.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cls.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cls.subject.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenModal = (classItem) => {
    setSelectedClass(classItem);
    setSelectedStudent(null);
    setSelectedAssignment(null);
    setActiveTab("overview");
  };

  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
    // Reset detail views when switching tabs
    setSelectedStudent(null);
    setSelectedAssignment(null);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Active":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "Closed":
        return "bg-gray-50 text-gray-600 border-gray-200";
      case "Draft":
        return "bg-amber-50 text-amber-700 border-amber-200";
      default:
        return "bg-gray-50 text-gray-600";
    }
  };

  const getPerformanceColor = (performance) => {
    if (performance === "Excellent") return "text-green-600 bg-green-50";
    if (performance === "Very Good") return "text-blue-600 bg-blue-50";
    if (performance === "Good") return "text-indigo-600 bg-indigo-50";
    return "text-amber-600 bg-amber-50";
  };

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            My Classes
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage your assigned classes and track student progress
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge
            variant="outline"
            className="px-3 py-1.5 font-medium border-primary/30 bg-primary/5"
          >
            {classes.length} Active Classes
          </Badge>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <input
          type="text"
          placeholder="Search by name, code, or subject..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm transition-all"
        />
      </div>

      {/* Classes Grid */}
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {filteredClasses.map((classItem, index) => {
          const now = new Date();
          const currentDay = now.toLocaleDateString("en-US", {
            weekday: "long",
          });
          const currentTime = now.getHours() * 60 + now.getMinutes();

          const isLive = classItem.schedule.some((s) => {
            if (s.day !== currentDay) return false;
            const [startH, startM] = s.startTime.split(":").map(Number);
            const [endH, endM] = s.endTime.split(":").map(Number);
            const startMins = startH * 60 + startM;
            const endMins = endH * 60 + endM;
            return currentTime >= startMins && currentTime <= endMins;
          });

          return (
            <motion.div
              key={classItem._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="group"
            >
              <Card
                onClick={() => handleOpenModal(classItem)}
                className={`p-5 h-full hover:shadow-lg hover:border-primary/40 transition-all cursor-pointer border relative overflow-hidden ${
                  isLive ? "border-primary/60 shadow-md" : "border-border"
                }`}
              >
                {/* Live Indicator */}
                {isLive && (
                  <div className="absolute top-0 right-0 bg-gradient-to-l from-red-500/10 to-transparent w-full h-full pointer-events-none" />
                )}

                <div className="relative z-10">
                  {isLive && (
                    <div className="flex items-center gap-1.5 mb-3">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                      </span>
                      <span className="text-[10px] font-semibold text-red-600 uppercase tracking-wider">
                        Live Class
                      </span>
                    </div>
                  )}

                  <div className="flex items-start gap-3 mb-4">
                    <div className="p-2.5 bg-primary/10 rounded-lg shrink-0 group-hover:bg-primary/15 transition-colors">
                      <BookOpen className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-base leading-tight truncate group-hover:text-primary transition-colors">
                        {classItem.name}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {classItem.code} • {classItem.grade}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-muted/40 p-3 rounded-lg">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Users className="w-3.5 h-3.5 text-muted-foreground" />
                        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">
                          Students
                        </p>
                      </div>
                      <p className="text-lg font-semibold">
                        {classItem.studentCount}
                      </p>
                    </div>
                    <div className="bg-green-50 p-3 rounded-lg">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Activity className="w-3.5 h-3.5 text-green-600" />
                        <p className="text-[10px] text-green-700 font-medium uppercase tracking-wide">
                          Attendance
                        </p>
                      </div>
                      <p className="text-lg font-semibold text-green-700">
                        {classItem.attendanceRate}%
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-border/50 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <MapPin className="w-3.5 h-3.5" />
                      <span className="text-xs font-medium">
                        {classItem.room}
                      </span>
                    </div>
                    <Badge
                      variant="secondary"
                      className="text-[10px] font-medium px-2 py-0.5"
                    >
                      {classItem.subject}
                    </Badge>
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredClasses.length === 0 && (
        <div className="text-center py-16 border-2 border-dashed rounded-xl">
          <BookOpen className="w-12 h-12 mx-auto mb-3 text-muted-foreground/40" />
          <p className="text-muted-foreground font-medium">
            No classes found matching your search
          </p>
        </div>
      )}

      {/* Class Detail Modal */}
      {selectedClass && (
        <Modal
          open={!!selectedClass}
          onClose={() => setSelectedClass(null)}
          title={
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-primary/10 rounded-xl flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">{selectedClass.name}</h3>
                <p className="text-xs text-muted-foreground font-normal">
                  {selectedClass.code} • {selectedClass.section}
                </p>
              </div>
            </div>
          }
          size="lg"
          footer={
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Calendar className="w-3.5 h-3.5" />
                <span>{selectedClass.semester}</span>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedClass(null)}
                >
                  Close
                </Button>
              </div>
            </div>
          }
        >
          <div className="flex flex-col h-full -mt-4">
            <Tabs
              tabs={[
                {
                  id: "overview",
                  label: "Overview",
                  icon: <BarChart3 className="w-4 h-4" />,
                },
                {
                  id: "assignments",
                  label: "Assignments",
                  icon: <FileText className="w-4 h-4" />,
                  badge: selectedClass.assignments?.length,
                },
                {
                  id: "students",
                  label: "Students",
                  icon: <Users className="w-4 h-4" />,
                  badge: selectedClass.studentCount,
                },
              ]}
              activeTab={activeTab}
              onChange={handleTabChange}
              className="mb-5 border-b"
            />

            <div className="min-h-[450px] max-h-[600px] overflow-y-auto">
              <AnimatePresence mode="wait">
                {selectedStudent ? (
                  <motion.div
                    key="student-detail"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="space-y-6 pb-6"
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedStudent(null);
                        setActiveTab("students");
                      }}
                      className="mb-2 hover:bg-muted"
                    >
                      <ArrowLeft className="mr-2 w-4 h-4" /> Back to Student
                      List
                    </Button>

                    <div className="grid md:grid-cols-3 gap-6">
                      <div className="md:col-span-1">
                        <div className="border rounded-xl p-6 bg-gradient-to-br from-primary/5 to-transparent text-center space-y-4">
                          <div className="w-20 h-20 rounded-full bg-primary mx-auto flex items-center justify-center text-white text-2xl font-semibold shadow-lg">
                            {selectedStudent.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h4 className="text-xl font-semibold">
                              {selectedStudent.name}
                            </h4>
                            <p className="text-sm text-muted-foreground mt-1">
                              Roll No: {selectedStudent.rollNumber || selectedStudent.registrationNumber}
                            </p>
                            <Badge className="mt-3 bg-blue-50 text-blue-700 border-0">
                              Active Student
                            </Badge>
                          </div>
                        </div>
                      </div>

                      <div className="md:col-span-2 space-y-5">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-4 border rounded-lg bg-background hover:shadow-sm transition-shadow">
                            <div className="flex items-center gap-2 mb-2">
                              <Mail className="w-4 h-4 text-primary" />
                              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                                Email
                              </p>
                            </div>
                            <p className="text-sm font-medium text-primary">
                              {selectedStudent.email}
                            </p>
                          </div>
                          <div className="p-4 border rounded-lg bg-background hover:shadow-sm transition-shadow">
                            <div className="flex items-center gap-2 mb-2">
                              <Phone className="w-4 h-4 text-green-600" />
                              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                                Phone
                              </p>
                            </div>
                            <p className="text-sm font-medium text-green-600">
                              {selectedStudent.phone || 'Not provided'}
                            </p>
                          </div>
                          <div className="p-4 border rounded-lg bg-background hover:shadow-sm transition-shadow">
                            <div className="flex items-center gap-2 mb-2">
                              <GraduationCap className="w-4 h-4 text-blue-600" />
                              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                                Registration
                              </p>
                            </div>
                            <p className="text-sm font-medium text-blue-600">
                              {selectedStudent.registrationNumber}
                            </p>
                          </div>
                          <div className="p-4 border rounded-lg bg-background hover:shadow-sm transition-shadow">
                            <div className="flex items-center gap-2 mb-2">
                              <CheckCircle2 className="w-4 h-4 text-amber-600" />
                              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                                Status
                              </p>
                            </div>
                            <p className="text-sm font-medium text-amber-600">
                              Active Student
                            </p>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <h5 className="font-semibold text-sm flex items-center gap-2">
                            <Mail className="w-4 h-4 text-primary" />
                            Contact Information
                          </h5>
                          <div className="border rounded-lg divide-y bg-muted/20">
                            <div className="flex justify-between p-3 hover:bg-background transition-colors">
                              <span className="text-sm text-muted-foreground">
                                Student Email
                              </span>
                              <span className="text-sm font-medium">
                                {selectedStudent.email}
                              </span>
                            </div>
                            <div className="flex justify-between p-3 hover:bg-background transition-colors">
                              <span className="text-sm text-muted-foreground">
                                Student Phone
                              </span>
                              <span className="text-sm font-medium">
                                {selectedStudent.phone}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Parent/Guardian Information */}
                        <div className="space-y-3">
                          <h5 className="font-semibold text-sm flex items-center gap-2">
                            <Users className="w-4 h-4 text-primary" />
                            Parent & Guardian Details
                          </h5>
                          <div className="space-y-4">
                            {/* Primary Guardian/Parent Details */}
                            {selectedStudent.guardian && (
                              <div className="border rounded-lg p-4 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/30">
                                <h6 className="font-medium text-sm text-primary mb-3 flex items-center gap-2">
                                  <Users className="w-4 h-4" />
                                  {selectedStudent.guardian.relation} Information
                                </h6>
                                <div className="grid grid-cols-1 gap-2 text-sm">
                                  {selectedStudent.guardian.name && (
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">Name:</span>
                                      <span className="font-medium">{selectedStudent.guardian.name}</span>
                                    </div>
                                  )}
                                  {selectedStudent.guardian.relation && (
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">Relation:</span>
                                      <span className="font-medium">{selectedStudent.guardian.relation}</span>
                                    </div>
                                  )}
                                  {selectedStudent.guardian.phone && (
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">Phone:</span>
                                      <span className="font-medium">{selectedStudent.guardian.phone}</span>
                                    </div>
                                  )}
                                  {selectedStudent.guardian.email && (
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">Email:</span>
                                      <span className="font-medium">{selectedStudent.guardian.email}</span>
                                    </div>
                                  )}
                                  {selectedStudent.guardian.cnic && (
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">CNIC:</span>
                                      <span className="font-medium">{selectedStudent.guardian.cnic}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Father Details */}
                            {selectedStudent.studentProfile?.father?.name && (
                              <div className="border rounded-lg p-4 bg-blue-50/50 border-blue-200">
                                <h6 className="font-medium text-sm text-blue-900 mb-3 flex items-center gap-2">
                                  <Users className="w-4 h-4" />
                                  Father Information
                                </h6>
                                <div className="grid grid-cols-1 gap-2 text-sm">
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Name:</span>
                                    <span className="font-medium">{selectedStudent.studentProfile.father.name}</span>
                                  </div>
                                  {selectedStudent.studentProfile.father.occupation && (
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">Occupation:</span>
                                      <span className="font-medium">{selectedStudent.studentProfile.father.occupation}</span>
                                    </div>
                                  )}
                                  {selectedStudent.studentProfile.father.phone && (
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">Phone:</span>
                                      <span className="font-medium">{selectedStudent.studentProfile.father.phone}</span>
                                    </div>
                                  )}
                                  {selectedStudent.studentProfile.father.email && (
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">Email:</span>
                                      <span className="font-medium">{selectedStudent.studentProfile.father.email}</span>
                                    </div>
                                  )}
                                  {selectedStudent.studentProfile.father.cnic && (
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">CNIC:</span>
                                      <span className="font-medium">{selectedStudent.studentProfile.father.cnic}</span>
                                    </div>
                                  )}
                                  {selectedStudent.studentProfile.father.income && (
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">Income:</span>
                                      <span className="font-medium">Rs. {selectedStudent.studentProfile.father.income.toLocaleString()}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Mother Details */}
                            {selectedStudent.studentProfile?.mother?.name && (
                              <div className="border rounded-lg p-4 bg-pink-50/50 border-pink-200">
                                <h6 className="font-medium text-sm text-pink-900 mb-3 flex items-center gap-2">
                                  <Users className="w-4 h-4" />
                                  Mother Information
                                </h6>
                                <div className="grid grid-cols-1 gap-2 text-sm">
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Name:</span>
                                    <span className="font-medium">{selectedStudent.studentProfile.mother.name}</span>
                                  </div>
                                  {selectedStudent.studentProfile.mother.occupation && (
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">Occupation:</span>
                                      <span className="font-medium">{selectedStudent.studentProfile.mother.occupation}</span>
                                    </div>
                                  )}
                                  {selectedStudent.studentProfile.mother.phone && (
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">Phone:</span>
                                      <span className="font-medium">{selectedStudent.studentProfile.mother.phone}</span>
                                    </div>
                                  )}
                                  {selectedStudent.studentProfile.mother.email && (
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">Email:</span>
                                      <span className="font-medium">{selectedStudent.studentProfile.mother.email}</span>
                                    </div>
                                  )}
                                  {selectedStudent.studentProfile.mother.cnic && (
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">CNIC:</span>
                                      <span className="font-medium">{selectedStudent.studentProfile.mother.cnic}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Guardian Details */}
                            {selectedStudent.studentProfile?.guardian?.name && (
                              <div className="border rounded-lg p-4 bg-purple-50/50 border-purple-200">
                                <h6 className="font-medium text-sm text-purple-900 mb-3 flex items-center gap-2">
                                  <Users className="w-4 h-4" />
                                  Guardian Information
                                  {selectedStudent.studentProfile.guardianType && (
                                    <Badge variant="secondary" className="text-xs">
                                      {selectedStudent.studentProfile.guardianType}
                                    </Badge>
                                  )}
                                </h6>
                                <div className="grid grid-cols-1 gap-2 text-sm">
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Name:</span>
                                    <span className="font-medium">{selectedStudent.studentProfile.guardian.name}</span>
                                  </div>
                                  {selectedStudent.studentProfile.guardian.relation && (
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">Relation:</span>
                                      <span className="font-medium">{selectedStudent.studentProfile.guardian.relation}</span>
                                    </div>
                                  )}
                                  {selectedStudent.studentProfile.guardian.phone && (
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">Phone:</span>
                                      <span className="font-medium">{selectedStudent.studentProfile.guardian.phone}</span>
                                    </div>
                                  )}
                                  {selectedStudent.studentProfile.guardian.email && (
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">Email:</span>
                                      <span className="font-medium">{selectedStudent.studentProfile.guardian.email}</span>
                                    </div>
                                  )}
                                  {selectedStudent.studentProfile.guardian.cnic && (
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">CNIC:</span>
                                      <span className="font-medium">{selectedStudent.studentProfile.guardian.cnic}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* No Parent/Guardian Info */}
                            {!selectedStudent.studentProfile?.father?.name &&
                             !selectedStudent.studentProfile?.mother?.name &&
                             !selectedStudent.studentProfile?.guardian?.name && (
                              <div className="border rounded-lg p-4 bg-muted/20 text-center">
                                <Users className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                                <p className="text-sm text-muted-foreground">
                                  No parent or guardian information available
                                </p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Send Message to Parent */}
                        <div className="space-y-3">
                          <h5 className="font-semibold text-sm flex items-center gap-2">
                            <MessageSquare className="w-4 h-4 text-primary" />
                            Parent Communication
                          </h5>
                          <div className="border rounded-lg p-4 bg-gradient-to-br from-green-50 to-transparent border-green-200">
                            <div className="flex items-start gap-3 mb-3">
                              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                                <Phone className="w-5 h-5 text-green-600" />
                              </div>
                              <div className="flex-1">
                                <p className="text-sm font-semibold text-green-900">
                                  {selectedStudent.parentName || "Parent"}
                                </p>
                                <p className="text-xs text-green-700">
                                  {selectedStudent.parentPhone ||
                                    selectedStudent.phone}
                                </p>
                              </div>
                            </div>
                            <Button
                              onClick={() => {
                                // Navigate to Parent Contact page
                                router.push("/teacher/parent-contact");
                              }}
                              className="w-full bg-green-600 hover:bg-green-700 text-white"
                            >
                              <MessageSquare className="w-4 h-4 mr-2" />
                              Contact Parent
                            </Button>
                          </div>
                          <p className="text-xs text-muted-foreground bg-blue-50 border border-blue-200 rounded-lg p-2.5">
                            <strong className="text-blue-900">💡 Tip:</strong>{" "}
                            Use this to quickly communicate with parents about
                            student behavior, attendance issues, academic
                            performance, or any other concerns.
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ) : selectedAssignment ? (
                  <motion.div
                    key="assignment-detail"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="space-y-6 pb-6"
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedAssignment(null);
                        setActiveTab("assignments");
                      }}
                      className="mb-2 hover:bg-muted"
                    >
                      <ArrowLeft className="mr-2 w-4 h-4" /> Back to Assignment
                      List
                    </Button>

                    <div className="grid md:grid-cols-3 gap-6">
                      <div className="md:col-span-1">
                        <div className="border rounded-xl p-6 bg-gradient-to-br from-amber-500/5 to-transparent space-y-4">
                          <div className="w-20 h-20 rounded-full bg-amber-500/10 mx-auto flex items-center justify-center shadow-lg">
                            <FileText className="w-10 h-10 text-amber-600" />
                          </div>
                          <div className="text-center">
                            <h4 className="text-xl font-semibold">
                              {selectedAssignment.title}
                            </h4>
                            <Badge
                              className={`mt-3 ${getStatusColor(
                                selectedAssignment.status
                              )} border text-[10px] font-medium px-2 py-1`}
                            >
                              {selectedAssignment.status}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      <div className="md:col-span-2 space-y-5">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-4 border rounded-lg bg-background hover:shadow-sm transition-shadow">
                            <div className="flex items-center gap-2 mb-2">
                              <CheckCircle2 className="w-4 h-4 text-green-600" />
                              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                                Submissions
                              </p>
                            </div>
                            <p className="text-2xl font-semibold text-green-600">
                              {selectedAssignment.submissions}/
                              {selectedAssignment.total}
                            </p>
                          </div>
                          <div className="p-4 border rounded-lg bg-background hover:shadow-sm transition-shadow">
                            <div className="flex items-center gap-2 mb-2">
                              <TrendingUp className="w-4 h-4 text-primary" />
                              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                                Max Points
                              </p>
                            </div>
                            <p className="text-2xl font-semibold text-primary">
                              {selectedAssignment.maxPoints}
                            </p>
                          </div>
                          <div className="p-4 border rounded-lg bg-background hover:shadow-sm transition-shadow">
                            <div className="flex items-center gap-2 mb-2">
                              <Clock className="w-4 h-4 text-amber-600" />
                              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                                Due Date
                              </p>
                            </div>
                            <p className="text-sm font-medium text-amber-600">
                              {selectedAssignment.dueDate}
                            </p>
                          </div>
                          <div className="p-4 border rounded-lg bg-background hover:shadow-sm transition-shadow">
                            <div className="flex items-center gap-2 mb-2">
                              <FileText className="w-4 h-4 text-blue-600" />
                              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                                Type
                              </p>
                            </div>
                            <p className="text-sm font-medium text-blue-600">
                              {selectedAssignment.type}
                            </p>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <h5 className="font-semibold text-sm flex items-center gap-2">
                            <FileText className="w-4 h-4 text-primary" />
                            Assignment Details
                          </h5>
                          <div className="border rounded-lg p-4 bg-muted/20">
                            <p className="text-sm text-muted-foreground leading-relaxed">
                              {selectedAssignment.description}
                            </p>
                          </div>
                        </div>

                        <div className="border rounded-lg p-4 bg-primary/5 border-primary/20">
                          <h5 className="font-semibold text-sm mb-3 text-primary">
                            Submission Progress
                          </h5>
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">
                                Completion Rate
                              </span>
                              <span className="text-sm font-semibold text-primary">
                                {Math.round(
                                  (selectedAssignment.submissions /
                                    selectedAssignment.total) *
                                    100
                                )}
                                %
                              </span>
                            </div>
                            <div className="w-full bg-muted rounded-full h-2.5">
                              <div
                                className="bg-primary h-2.5 rounded-full transition-all"
                                style={{
                                  width: `${
                                    (selectedAssignment.submissions /
                                      selectedAssignment.total) *
                                    100
                                  }%`,
                                }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="tabs-content"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="pb-4"
                  >
                    <TabPanel value="overview" activeTab={activeTab}>
                      <div className="space-y-6">
                        <div className="grid sm:grid-cols-3 gap-4">
                          <Card className="p-5 border bg-gradient-to-br from-primary/5 to-transparent hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between mb-3">
                              <Users className="w-5 h-5 text-primary" />
                              <Badge
                                variant="outline"
                                className="text-[10px] font-medium"
                              >
                                Total
                              </Badge>
                            </div>
                            <p className="text-2xl font-semibold">
                              {selectedClass.studentCount}
                            </p>
                            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mt-1">
                              Students
                            </p>
                          </Card>
                          <Card className="p-5 border bg-gradient-to-br from-green-500/5 to-transparent hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between mb-3">
                              <Activity className="w-5 h-5 text-green-600" />
                              <Badge
                                variant="outline"
                                className="text-[10px] font-medium border-green-200 text-green-700"
                              >
                                Active
                              </Badge>
                            </div>
                            <p className="text-2xl font-semibold text-green-700">
                              {selectedClass.attendanceRate}%
                            </p>
                            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mt-1">
                              Attendance
                            </p>
                          </Card>
                          <Card className="p-5 border bg-gradient-to-br from-amber-500/5 to-transparent hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between mb-3">
                              <FileText className="w-5 h-5 text-amber-600" />
                              <Badge
                                variant="outline"
                                className="text-[10px] font-medium border-amber-200 text-amber-700"
                              >
                                Pending
                              </Badge>
                            </div>
                            <p className="text-2xl font-semibold text-amber-700">
                              {selectedClass.assignments?.filter(
                                (a) => a.status === "Active"
                              ).length || 0}
                            </p>
                            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mt-1">
                              Assignments
                            </p>
                          </Card>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                          <div className="space-y-4">
                            <div className="border rounded-lg p-4 bg-muted/20">
                              <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                                <BookOpen className="w-4 h-4 text-primary" />
                                Course Description
                              </h4>
                              <p className="text-sm text-muted-foreground leading-relaxed">
                                {selectedClass.description}
                              </p>
                            </div>

                            <div className="border rounded-lg p-4 bg-primary/5 border-primary/20">
                              <h4 className="font-semibold text-sm mb-3 text-primary">
                                Current Progress
                              </h4>
                              <div className="space-y-3">
                                <div className="flex items-start gap-2">
                                  <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                                  <div>
                                    <p className="text-[10px] text-muted-foreground uppercase font-medium tracking-wider">
                                      Completed
                                    </p>
                                    <p className="text-sm font-medium">
                                      {selectedClass.lastTopic}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-start gap-2">
                                  <AlertCircle className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                                  <div>
                                    <p className="text-[10px] text-muted-foreground uppercase font-medium tracking-wider">
                                      Next Topic
                                    </p>
                                    <p className="text-sm font-medium">
                                      {selectedClass.nextTopic}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-4">
                            <div className="border rounded-lg p-4">
                              <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                                <Clock className="w-4 h-4 text-primary" />
                                Class Schedule
                              </h4>
                              <div className="space-y-2">
                                {selectedClass.schedule.map((sch, i) => (
                                  <div
                                    key={i}
                                    className="flex justify-between items-center p-2.5 bg-muted/40 rounded-lg hover:bg-muted/60 transition-colors"
                                  >
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium">
                                          {sch.day}
                                        </span>
                                        <Badge variant="outline" className="text-xs">
                                          Period {sch.periodNumber}
                                        </Badge>
                                      </div>
                                      <div className="text-xs text-muted-foreground mt-1">
                                        <span className="font-medium">{sch.subjectName}</span>
                                        {sch.roomNumber && (
                                          <span className="ml-2">• Room {sch.roomNumber}</span>
                                        )}
                                      </div>
                                    </div>
                                    <span className="text-xs text-muted-foreground font-medium">
                                      {sch.startTime} - {sch.endTime}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div className="border rounded-lg p-4 bg-muted/20">
                              <h4 className="font-semibold text-sm mb-2">
                                Class Information
                              </h4>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between py-1">
                                  <span className="text-muted-foreground">
                                    Rooms
                                  </span>
                                  <span className="font-medium">
                                    {[...new Set(selectedClass.schedule.map(s => s.roomNumber).filter(r => r))].join(', ') || 'Not assigned'}
                                  </span>
                                </div>
                                <div className="flex justify-between py-1">
                                  <span className="text-muted-foreground">
                                    Section
                                  </span>
                                  <span className="font-medium">
                                    {selectedClass.section}
                                  </span>
                                </div>

                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </TabPanel>

                    <TabPanel value="assignments" activeTab={activeTab}>
                      <div className="space-y-3">
                        {selectedClass.assignments?.length > 0 ? (
                          <div className="space-y-3">
                            {selectedClass.assignments.map((assignment) => (
                              <Card
                                key={assignment.id}
                                onClick={() =>
                                  setSelectedAssignment(assignment)
                                }
                                className="p-4 border hover:shadow-md hover:border-primary/40 transition-all group cursor-pointer"
                              >
                                <div className="flex items-start justify-between gap-4">
                                  <div className="flex items-start gap-3 flex-1">
                                    <div className="p-2.5 bg-primary/10 rounded-lg shrink-0 group-hover:bg-primary/15 transition-colors">
                                      <FileText className="w-5 h-5 text-primary" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <h5 className="font-semibold text-sm mb-1 group-hover:text-primary transition-colors">
                                        {assignment.title}
                                      </h5>
                                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                        <div className="flex items-center gap-1">
                                          <Clock className="w-3 h-3" />
                                          <span>Due: {assignment.dueDate}</span>
                                        </div>
                                        <span>•</span>
                                        <Badge
                                          variant="outline"
                                          className="text-[9px] font-medium px-1.5 py-0"
                                        >
                                          {assignment.type}
                                        </Badge>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-4 shrink-0">
                                    <div className="text-right">
                                      <p className="text-lg font-semibold">
                                        {assignment.submissions}
                                        <span className="text-sm text-muted-foreground font-normal">
                                          /{assignment.total}
                                        </span>
                                      </p>
                                      <p className="text-[10px] text-muted-foreground uppercase font-medium tracking-wider">
                                        Submitted
                                      </p>
                                    </div>
                                    <Badge
                                      className={`${getStatusColor(
                                        assignment.status
                                      )} border text-[10px] font-medium px-2 py-1`}
                                    >
                                      {assignment.status}
                                    </Badge>
                                  </div>
                                </div>
                              </Card>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-12 border-2 border-dashed rounded-lg">
                            <FileText className="w-10 h-10 mx-auto mb-3 text-muted-foreground/40" />
                            <p className="text-sm text-muted-foreground">
                              No assignments created for this class yet.
                            </p>
                          </div>
                        )}
                      </div>
                    </TabPanel>

                    <TabPanel value="students" activeTab={activeTab}>
                      <div className="border rounded-lg overflow-hidden">
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="bg-muted/50 border-b">
                                <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                                  Student
                                </th>
                                <th className="px-4 py-3 text-center text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                                  Roll No
                                </th>
                                <th className="px-4 py-3 text-center text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                                  Attendance
                                </th>
                                <th className="px-4 py-3 text-center text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                                  Performance
                                </th>
                                <th className="px-4 py-3"></th>
                              </tr>
                            </thead>
                            <tbody className="divide-y">
                              {selectedClass.students?.map((student) => (
                                <tr
                                  key={student._id}
                                  onClick={() => setSelectedStudent(student)}
                                  className="hover:bg-muted/30 transition-colors cursor-pointer group"
                                >
                                  <td className="px-4 py-3">
                                    <div className="flex items-center gap-3">
                                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary/80 to-primary flex items-center justify-center text-white text-xs font-semibold shrink-0">
                                        {student.name.charAt(0).toUpperCase()}
                                      </div>
                                      <span className="font-medium group-hover:text-primary transition-colors">
                                        {student.name}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 text-center text-muted-foreground font-medium">
                                    {student.rollNumber || student.registrationNumber}
                                  </td>
                                  <td className="px-4 py-3 text-center">
                                    <span className="font-semibold text-green-600">
                                      --
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-center">
                                    <Badge className="bg-blue-50 text-blue-700 border-0 text-[10px] font-medium">
                                      Active
                                    </Badge>
                                  </td>
                                  <td className="px-4 py-3 text-right">
                                    <ChevronRight className="w-4 h-4 ml-auto text-muted-foreground group-hover:text-primary transition-colors" />
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        {(!selectedClass.students ||
                          selectedClass.students.length === 0) && (
                          <div className="p-10 text-center text-sm text-muted-foreground">
                            <Users className="w-10 h-10 mx-auto mb-3 text-muted-foreground/40" />
                            No student records found for this class.
                          </div>
                        )}
                      </div>
                    </TabPanel>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
