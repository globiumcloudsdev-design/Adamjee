"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import CheckInOutCard from "@/components/teacher/CheckInOutCard";
import AttendanceHistoryCard from "@/components/teacher/AttendanceHistoryCard";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Award,
  BookOpen,
  Clock,
  Edit,
  Save,
  CreditCard,
  Star,
  TrendingUp,
  Users,
  Shield,
  Key,
  Bell,
} from "lucide-react";
import { toast } from "sonner";

export default function TeacherProfilePage() {
  const { user } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
      setLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 500));

      const mockData = {
        profile: {
          firstName: "Shoaib",
          lastName: "Raza Attari",
          email: "m.ahmed.khan@ease.edu",
          phone: "+92 300 1234567",
          address: "House #123, Street 4, DHA Phase 5, Karachi",
          dateOfBirth: "1990-01-15",
          joiningDate: "2020-01-01",
          employeeId: "TCH001",
          qualification: "M.Sc. Mathematics, B.Ed.",
          experience: "5 years",
          subjects: ["Mathematics", "Physics", "Computer Science"],
          department: "Science & Technology",
          salary: "80,000 PKR",
          bankAccount: "PK**************2345",
        },
        teacherAttendance: {
          status: "checked_in",
          checkInTime: new Date(Date.now() - 28800000).toISOString(),
          checkOutTime: null,
          workingHours: null,
        },
        attendanceHistory: [
          {
            _id: "1",
            date: new Date(Date.now() - 86400000).toISOString(),
            status: "present",
            checkInTime: new Date(
              Date.now() - 86400000 - 28800000
            ).toISOString(),
            checkOutTime: new Date(
              Date.now() - 86400000 - 3600000
            ).toISOString(),
            workingHours: "9h 0m",
          },
          {
            _id: "2",
            date: new Date(Date.now() - 86400000 * 2).toISOString(),
            status: "present",
            checkInTime: new Date(
              Date.now() - 86400000 * 2 - 28800000
            ).toISOString(),
            checkOutTime: new Date(
              Date.now() - 86400000 * 2 - 3600000
            ).toISOString(),
            workingHours: "8h 30m",
          },
          {
            _id: "3",
            date: new Date(Date.now() - 86400000 * 3).toISOString(),
            status: "late",
            checkInTime: new Date(
              Date.now() - 86400000 * 3 - 25200000
            ).toISOString(),
            checkOutTime: new Date(
              Date.now() - 86400000 * 3 - 3600000
            ).toISOString(),
            workingHours: "8h 0m",
          },
        ],
        stats: {
          totalClasses: 8,
          totalStudents: 240,
          attendanceRate: 94,
          averageGrade: 87,
        },
      };

      setProfileData(mockData);
    } catch (error) {
      console.error("Error loading profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      setProfileData((prev) => ({
        ...prev,
        teacherAttendance: {
          status: "checked_in",
          checkInTime: new Date().toISOString(),
          checkOutTime: null,
          workingHours: null,
        },
      }));
      toast.success("Checked in successfully!");
    } catch (error) {
      console.error("Check-in error:", error);
      throw error;
    }
  };

  const handleCheckOut = async () => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      const checkInTime = new Date(profileData?.teacherAttendance?.checkInTime);
      const checkOutTime = new Date();
      const diffMs = checkOutTime - checkInTime;
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const workingHours = `${hours}h ${minutes}m`;

      setProfileData((prev) => ({
        ...prev,
        teacherAttendance: {
          status: "checked_out",
          checkInTime: prev.teacherAttendance.checkInTime,
          checkOutTime: checkOutTime.toISOString(),
          workingHours,
        },
      }));
      toast.success("Checked out successfully!");
    } catch (error) {
      console.error("Check-out error:", error);
      throw error;
    }
  };

  const handleSave = () => {
    setIsEditing(false);
    toast.success("Profile updated successfully!");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto"
          />
          <p className="mt-4 text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  const { profile, teacherAttendance, attendanceHistory, stats } = profileData;

  return (
    <div className="min-h-screen bg-gradient-to-br from-muted/30 via-background to-muted/20 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header with Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative"
        >
          <Card className="overflow-hidden border-2 shadow-xl">
            {/* Cover Banner */}
            <div className="h-32 bg-gradient-to-r from-primary via-primary/90 to-primary/70 relative">
              <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
            </div>

            {/* Profile Content */}
            <div className="px-8 pb-8 -mt-16 relative">
              <div className="flex flex-col md:flex-row items-start md:items-end gap-6">
                {/* Avatar */}
                <div className="relative">
                  <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-white text-4xl font-bold shadow-2xl border-4 border-background">
                    {profile.firstName[0]}
                    {profile.lastName[0]}
                  </div>
                  <Badge className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-green-500 text-white px-3 shadow-lg">
                    Active
                  </Badge>
                </div>

                {/* Info */}
                <div className="flex-1 mt-4 md:mt-0">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <h1 className="text-3xl font-bold mb-1">
                        {profile.firstName} {profile.lastName}
                      </h1>
                      <p className="text-muted-foreground flex items-center gap-2 mb-2">
                        <Award className="w-4 h-4" />
                        {profile.department}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {profile.subjects.map((subject, idx) => (
                          <Badge
                            key={idx}
                            variant="outline"
                            className="text-xs"
                          >
                            {subject}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <Button
                      onClick={() =>
                        isEditing ? handleSave() : setIsEditing(true)
                      }
                      className="w-full md:w-auto"
                    >
                      {isEditing ? (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Save Changes
                        </>
                      ) : (
                        <>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit Profile
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
                <div className="text-center p-4 rounded-xl bg-blue-50 border border-blue-200">
                  <BookOpen className="w-6 h-6 mx-auto mb-2 text-blue-600" />
                  <p className="text-2xl font-bold text-blue-600">
                    {stats.totalClasses}
                  </p>
                  <p className="text-xs text-muted-foreground">Classes</p>
                </div>
                <div className="text-center p-4 rounded-xl bg-green-50 border border-green-200">
                  <Users className="w-6 h-6 mx-auto mb-2 text-green-600" />
                  <p className="text-2xl font-bold text-green-600">
                    {stats.totalStudents}
                  </p>
                  <p className="text-xs text-muted-foreground">Students</p>
                </div>
                <div className="text-center p-4 rounded-xl bg-purple-50 border border-purple-200">
                  <Clock className="w-6 h-6 mx-auto mb-2 text-purple-600" />
                  <p className="text-2xl font-bold text-purple-600">
                    {stats.attendanceRate}%
                  </p>
                  <p className="text-xs text-muted-foreground">Attendance</p>
                </div>
                <div className="text-center p-4 rounded-xl bg-orange-50 border border-orange-200">
                  <Star className="w-6 h-6 mx-auto mb-2 text-orange-600 fill-orange-600" />
                  <p className="text-2xl font-bold text-orange-600">
                    {stats.averageGrade}%
                  </p>
                  <p className="text-xs text-muted-foreground">Avg Grade</p>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Check-In & History */}
        <div className="grid gap-6 lg:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <CheckInOutCard
              teacherAttendance={teacherAttendance}
              onCheckIn={handleCheckIn}
              onCheckOut={handleCheckOut}
            />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <AttendanceHistoryCard attendanceHistory={attendanceHistory} />
          </motion.div>
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Personal Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-2"
          >
            <Card className="p-6 border-2">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                Personal Information
              </h2>

              <div className="grid gap-4 sm:grid-cols-2">
                <InfoField icon={Mail} label="Email" value={profile.email} />
                <InfoField icon={Phone} label="Phone" value={profile.phone} />
                <InfoField
                  icon={Calendar}
                  label="Date of Birth"
                  value={new Date(profile.dateOfBirth).toLocaleDateString()}
                />
                <InfoField
                  icon={Calendar}
                  label="Joining Date"
                  value={new Date(profile.joiningDate).toLocaleDateString()}
                />
                <InfoField
                  icon={Shield}
                  label="Employee ID"
                  value={profile.employeeId}
                />
                <InfoField
                  icon={CreditCard}
                  label="Bank Account"
                  value={profile.bankAccount}
                />
                <div className="sm:col-span-2">
                  <InfoField
                    icon={MapPin}
                    label="Address"
                    value={profile.address}
                  />
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Professional Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="p-6 border-2 h-full">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Award className="w-5 h-5 text-primary" />
                Professional
              </h2>

              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                  <p className="text-xs text-muted-foreground mb-1">
                    Qualification
                  </p>
                  <p className="font-medium text-sm">{profile.qualification}</p>
                </div>

                <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                  <p className="text-xs text-muted-foreground mb-1">
                    Experience
                  </p>
                  <p className="font-medium text-sm">{profile.experience}</p>
                </div>

                <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                  <p className="text-xs text-muted-foreground mb-1">
                    Monthly Salary
                  </p>
                  <p className="font-bold text-green-700">{profile.salary}</p>
                </div>

                <div className="pt-4 border-t">
                  <Button variant="outline" className="w-full" size="sm">
                    <Key className="w-4 h-4 mr-2" />
                    Change Password
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

// Info Field Component
function InfoField({ icon: Icon, label, value }) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
        <Icon className="w-3.5 h-3.5" />
        {label}
      </label>
      <div className="p-3 bg-muted/30 rounded-lg border border-border">
        <p className="text-sm font-medium truncate">{value}</p>
      </div>
    </div>
  );
}
