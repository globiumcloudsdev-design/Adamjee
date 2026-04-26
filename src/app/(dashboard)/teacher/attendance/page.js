"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Modal from "@/components/ui/modal";
import LiveJsQRScanner from "@/components/LiveJsQRScanner";
import {
  ClipboardCheck,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  Users,
  ScanLine,
  Camera,
  UserCheck,
} from "lucide-react";
import DashboardSkeleton from "@/components/teacher/DashboardSkeleton";
import { toast } from "sonner";
import apiClient from "@/lib/api-client";
import { API_ENDPOINTS } from "@/constants/api-endpoints";

export default function TeacherAttendancePage() {
  const [attendanceData, setAttendanceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [showScannerModal, setShowScannerModal] = useState(false);
  const [scannedStudents, setScannedStudents] = useState([]);
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    loadAttendanceData();
  }, []);

  const loadAttendanceData = async () => {
    try {
      setLoading(true);
      // Import centralized mock data
      const { mockClasses } = await import("@/data/teacher");
      await new Promise((resolve) => setTimeout(resolve, 800));

      const mockData = {
        classes: mockClasses.map((c) => ({
          _id: c._id,
          name: c.name,
          code: c.code,
          studentCount: c.studentCount,
          subject: c.subject,
          grade: c.grade,
          section: c.section,
        })),
        todayStats: {
          totalClasses: mockClasses.length,
          completedClasses: 2,
          pendingClasses: mockClasses.length - 2,
          totalStudents: mockClasses.reduce(
            (sum, c) => sum + c.studentCount,
            0
          ),
          presentStudents: 75,
          absentStudents: 6,
          lateStudents: 2,
          attendanceRate: 90,
        },
        recentAttendance: [
          {
            _id: "1",
            className: mockClasses[0]?.name || "Mathematics 101",
            date: new Date().toISOString(),
            present: 28,
            absent: 2,
            late: 0,
            total: mockClasses[0]?.studentCount || 30,
            rate: 93,
          },
          {
            _id: "2",
            className: mockClasses[1]?.name || "Physics 201",
            date: new Date().toISOString(),
            present: 23,
            absent: 1,
            late: 1,
            total: mockClasses[1]?.studentCount || 25,
            rate: 92,
          },
          {
            _id: "3",
            className: mockClasses[2]?.name || "Chemistry 301",
            date: new Date(Date.now() - 86400000).toISOString(),
            present: 26,
            absent: 2,
            late: 0,
            total: mockClasses[2]?.studentCount || 28,
            rate: 93,
          },
        ],
      };

      setAttendanceData(mockData);
    } catch (error) {
      console.error("Error loading attendance:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleScan = async (studentData) => {
    if (studentData && !scanning) {
      setScanning(true);
      try {
        // Send QR data to backend
        const response = await apiClient.post(API_ENDPOINTS.TEACHER.ATTENDANCE.SCAN, {
          qr: studentData,
          date: selectedDate,
          attendanceType: 'daily'
        });

        if (response.success) {
          const student = response.data.student;
          const alreadyMarked = response.data.alreadyMarked;
          
          // Check if student already in scanned list (for UI only)
          const existingIndex = scannedStudents.findIndex(s => s.id === student._id);
          
          if (existingIndex >= 0) {
            // Update existing entry
            setScannedStudents(prev => {
              const updated = [...prev];
              updated[existingIndex] = {
                ...updated[existingIndex],
                time: new Date().toLocaleTimeString(),
                alreadyMarked: true
              };
              return updated;
            });
            toast.info(`${student.fullName || student.firstName} - Attendance updated`);
          } else {
            // Add new entry
            const newStudent = {
              id: student._id,
              name: student.fullName || `${student.firstName} ${student.lastName}`,
              roll: student.rollNumber || student.registrationNumber,
              section: student.section,
              time: new Date().toLocaleTimeString(),
              avatar: student.profilePhoto?.url || student.fullName?.substring(0, 2).toUpperCase() || "ST",
              hasPaidFees: student.hasPaidFees,
              feeStatus: student.feeStatus,
              alreadyMarked
            };

            setScannedStudents((prev) => [newStudent, ...prev]);
            
            if (alreadyMarked) {
              toast.success(`${newStudent.name} - Attendance updated (was already marked)`);
            } else {
              toast.success(`${newStudent.name} - Attendance marked successfully!`);
            }
          }
        } else {
          toast.error(response.message || 'Failed to mark attendance');
        }
      } catch (error) {
        console.error("Error marking attendance:", error);
        toast.error(error.message || 'Failed to mark attendance');
      } finally {
        // Delay before allowing next scan
        setTimeout(() => setScanning(false), 1500);
      }
    }
  };

  const handleStartScanning = () => {
    setScannedStudents([]);
    setShowScannerModal(true);
  };

  const handleCloseScanner = () => {
    setShowScannerModal(false);
  };

  const handleSaveAttendance = () => {
    // Attendance is already saved via API on each scan
    toast.success(
      `Attendance session completed! ${scannedStudents.length} student(s) marked present.`
    );
    handleCloseScanner();
  };

  if (loading) {
    return <DashboardSkeleton />;
  }

  const { classes, todayStats, recentAttendance } = attendanceData;

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Attendance Management</h1>
          <p className="text-muted-foreground mt-1">
            Mark and track student attendance
          </p>
        </div>
        <Badge variant="outline" className="text-lg px-4 py-2">
          {todayStats.attendanceRate}% Today
        </Badge>
      </div>

      {/* Today's Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-6 bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle className="w-8 h-8 text-green-600" />
            <span className="text-sm text-muted-foreground">Present</span>
          </div>
          <p className="text-3xl font-bold text-green-600">
            {todayStats.presentStudents}
          </p>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-red-500/10 to-red-500/5 border-red-500/20">
          <div className="flex items-center gap-3 mb-2">
            <XCircle className="w-8 h-8 text-red-600" />
            <span className="text-sm text-muted-foreground">Absent</span>
          </div>
          <p className="text-3xl font-bold text-red-600">
            {todayStats.absentStudents}
          </p>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-yellow-500/10 to-yellow-500/5 border-yellow-500/20">
          <div className="flex items-center gap-3 mb-2">
            <Clock className="w-8 h-8 text-yellow-600" />
            <span className="text-sm text-muted-foreground">Late</span>
          </div>
          <p className="text-3xl font-bold text-yellow-600">
            {todayStats.lateStudents}
          </p>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-8 h-8 text-blue-600" />
            <span className="text-sm text-muted-foreground">Total</span>
          </div>
          <p className="text-3xl font-bold text-blue-600">
            {todayStats.totalStudents}
          </p>
        </Card>
      </div>

      {/* Mark Attendance Section */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Mark Attendance</h2>
        <div className="grid gap-4 md:grid-cols-1 mb-6">
          <div>
            <label className="block text-sm font-medium mb-2">
              Select Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        <Button
          onClick={handleStartScanning}
          className="w-full md:w-auto"
        >
          <ScanLine className="w-4 h-4 mr-2" />
          Start QR Scanner
        </Button>
      </Card>

      {/* Recent Attendance */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Recent Attendance Records</h2>
          <Badge variant="outline">{recentAttendance.length} Records</Badge>
        </div>

        <div className="space-y-3">
          {recentAttendance.map((record, index) => (
            <motion.div
              key={record._id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">{record.className}</span>
                    <Badge variant="outline" className="text-xs">
                      {new Date(record.date).toLocaleDateString()}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-green-600 font-medium">
                        {record.present}
                      </span>
                      <span className="text-muted-foreground">Present</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <XCircle className="w-4 h-4 text-red-600" />
                      <span className="text-red-600 font-medium">
                        {record.absent}
                      </span>
                      <span className="text-muted-foreground">Absent</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4 text-yellow-600" />
                      <span className="text-yellow-600 font-medium">
                        {record.late}
                      </span>
                      <span className="text-muted-foreground">Late</span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-2xl font-bold text-primary">
                    {record.rate}%
                  </p>
                  <p className="text-xs text-muted-foreground">Rate</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </Card>

      {/* QR Scanner Modal */}
      <AnimatePresence>
        {showScannerModal && (
          <Modal
            open={showScannerModal}
            onClose={handleCloseScanner}
            title={
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-primary/10 rounded-xl flex items-center justify-center">
                  <Camera className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">
                    Scan Student QR Codes
                  </h3>
                  <p className="text-xs text-muted-foreground font-normal">
                    Attendance Date: {selectedDate}
                  </p>
                </div>
              </div>
            }
            size="xl"
          >
            <div className="space-y-4">
              {/* Info Card */}
              <Card className="p-4 bg-gradient-to-br from-primary/5 to-transparent border-primary/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Attendance Mode
                    </p>
                    <p className="font-semibold text-lg">
                      General Attendance Scan
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Date: {selectedDate}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2">
                      <UserCheck className="w-5 h-5 text-green-600" />
                      <span className="text-2xl font-bold text-green-600">
                        {scannedStudents.length}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Students Scanned
                    </p>
                  </div>
                </div>
              </Card>

              <div className="grid md:grid-cols-2 gap-4">
                {/* Scanner */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold flex items-center gap-2">
                      <Camera className="w-4 h-4 text-primary" />
                      Fast QR Scanner
                    </h4>
                  </div>

                  <div className="relative border-2 border-primary/30 rounded-lg overflow-hidden bg-black min-h-[300px]">
                    <LiveJsQRScanner 
                      onDetected={handleScan}
                      continuous={true}
                      beep={true}
                      vibrate={true}
                    />
                  </div>

                  <Card className="p-3 bg-blue-50 border-blue-200">
                    <p className="text-xs text-blue-700">
                      <strong>Fast Scan:</strong> Point camera at student's
                      QR code. Scanning happens instantly when QR is
                      detected.
                    </p>
                  </Card>
                </div>

                {/* Scanned Students List */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold flex items-center gap-2">
                      <UserCheck className="w-4 h-4 text-green-600" />
                      Present Students
                    </h4>
                    <Badge className="bg-green-100 text-green-700 border-green-300">
                      {scannedStudents.length} Scanned
                    </Badge>
                  </div>

                  <div className="border rounded-lg max-h-[400px] overflow-y-auto">
                    {scannedStudents.length === 0 ? (
                      <div className="p-8 text-center text-muted-foreground">
                        <Users className="w-12 h-12 mx-auto mb-3 opacity-40" />
                        <p className="text-sm">No students scanned yet</p>
                        <p className="text-xs mt-1">Start scanning QR codes</p>
                      </div>
                    ) : (
                      <div className="divide-y">
                        {scannedStudents.map((student, index) => (
                          <motion.div
                            key={student.id}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className={`p-3 hover:bg-muted/50 transition-colors ${student.alreadyMarked ? 'bg-yellow-50' : ''}`}
                          >
                            <div className="flex items-center gap-3">
                              {typeof student.avatar === 'string' && student.avatar.startsWith('http') ? (
                                <img 
                                  src={student.avatar} 
                                  alt={student.name}
                                  className="w-10 h-10 rounded-full object-cover"
                                />
                              ) : (
                                <div className={`w-10 h-10 rounded-full ${student.alreadyMarked ? 'bg-gradient-to-br from-yellow-500 to-yellow-600' : 'bg-gradient-to-br from-green-500 to-green-600'} flex items-center justify-center text-white font-semibold text-sm`}>
                                  {student.avatar}
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="font-medium text-sm truncate">
                                    {student.name}
                                  </p>
                                  {student.alreadyMarked && (
                                    <Badge variant="outline" className="text-[9px] text-yellow-700 border-yellow-400 px-1 py-0">
                                      Updated
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <span>Roll: {student.roll}</span>
                                  {student.section && (
                                    <>
                                      <span>•</span>
                                      <span>Sec: {student.section}</span>
                                    </>
                                  )}
                                </div>
                                {student.feeStatus && (
                                  <Badge 
                                    variant="outline" 
                                    className={`text-[9px] mt-1 ${
                                      student.hasPaidFees 
                                        ? 'text-green-700 border-green-300 bg-green-50' 
                                        : 'text-red-700 border-red-300 bg-red-50'
                                    }`}
                                  >
                                    Fee: {student.feeStatus}
                                  </Badge>
                                )}
                              </div>
                              <div className="text-right shrink-0">
                                <Badge
                                  variant="outline"
                                  className={`text-[10px] ${student.alreadyMarked ? 'text-yellow-600 border-yellow-300' : 'text-green-600 border-green-300'}`}
                                >
                                  {student.time}
                                </Badge>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={handleCloseScanner}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveAttendance}
                  disabled={scannedStudents.length === 0}
                  className="flex-1"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Save Attendance ({scannedStudents.length})
                </Button>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}