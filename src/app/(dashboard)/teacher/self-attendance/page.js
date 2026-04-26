"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
  Calendar,
  LogIn,
  LogOut,
  AlertCircle,
  Loader2,
  CalendarDays,
  CalendarRange,
  Calendar as CalendarIcon,
  Filter,
} from "lucide-react";
import { toast } from "sonner";
import apiClient from "@/lib/api-client";
import { API_ENDPOINTS } from "@/constants/api-endpoints";

export default function TeacherSelfAttendancePage() {
  const [attendanceStatus, setAttendanceStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [attendanceHistory, setAttendanceHistory] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [filterType, setFilterType] = useState('monthly'); // 'daily', 'weekly', 'monthly', 'date'
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedWeek, setSelectedWeek] = useState(() => {
    const now = new Date();
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
    return startOfWeek.toISOString().split('T')[0];
  });

  useEffect(() => {
    loadAttendanceStatus();
    getCurrentLocation();
    loadAttendanceHistory();
  }, [selectedMonth, selectedYear, filterType]);

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by this browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCurrentLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setLocationError(null);
      },
      (error) => {
        console.error("Error getting location:", error);
        setLocationError("Unable to get your location. Please enable location services.");
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // 5 minutes
      }
    );
  };

  const loadAttendanceStatus = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(API_ENDPOINTS.TEACHER.SELF_ATTENDANCE.STATUS);

      if (response.success) {
        setAttendanceStatus(response.data);
      } else {
        toast.error(response.message || "Failed to load attendance status");
      }
    } catch (error) {
      console.error("Error loading attendance status:", error);
      toast.error("Failed to load attendance status");
    } finally {
      setLoading(false);
    }
  };

  const loadAttendanceHistory = async (filter = filterType, month = selectedMonth, year = selectedYear, date = selectedDate) => {
    try {
      setHistoryLoading(true);
      let queryParams = `filterType=${filter}`;

      if (filter === 'monthly') {
        queryParams += `&month=${month}&year=${year}`;
      } else if (filter === 'date') {
        queryParams += `&date=${date}`;
      }

      console.log('Loading attendance history with params:', queryParams);

      const response = await apiClient.get(
        `${API_ENDPOINTS.TEACHER.SELF_ATTENDANCE.HISTORY}?${queryParams}`
      );

      if (response.success) {
        setAttendanceHistory(response.data);
        console.log('Attendance history loaded successfully:', response.data);
      } else {
        console.error('Failed to load attendance history:', response.message);
        toast.error(response.message || "Failed to load attendance history");
      }
    } catch (error) {
      console.error("Error loading attendance history:", error);
      toast.error("Failed to load attendance history");
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleCheckIn = async () => {
    if (!currentLocation) {
      toast.error("Location is required for check-in");
      return;
    }

    try {
      setActionLoading(true);
      const response = await apiClient.post(API_ENDPOINTS.TEACHER.SELF_ATTENDANCE.CHECK_IN, {
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
      });

      if (response.success) {
        // Refresh attendance status after check-in
        await loadAttendanceStatus();
        toast.success(response.message || "Checked in successfully!");
        // Refresh location for check-out
        getCurrentLocation();
      } else {
        toast.error(response.message || "Check-in failed");
      }
    } catch (error) {
      console.error("Error during check-in:", error);
      toast.error("Check-in failed");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckOut = async () => {
    if (!currentLocation) {
      toast.error("Location is required for check-out");
      return;
    }

    // Double-check that user is actually checked in
    if (!attendanceStatus?.isCheckedIn) {
      toast.error("You must check in first before checking out");
      await loadAttendanceStatus(); // Refresh status
      return;
    }

    try {
      setActionLoading(true);
      const response = await apiClient.post(API_ENDPOINTS.TEACHER.SELF_ATTENDANCE.CHECK_OUT, {
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
      });

      if (response.success) {
        // Refresh attendance status after check-out
        await loadAttendanceStatus();
        toast.success(response.message || "Checked out successfully!");
      } else {
        toast.error(response.message || "Check-out failed");
        // If check-out failed, refresh status to ensure UI is in sync
        await loadAttendanceStatus();
      }
    } catch (error) {
      console.error("Error during check-out:", error);
      toast.error("Check-out failed");
      // Refresh status on error to ensure UI consistency
      await loadAttendanceStatus();
    } finally {
      setActionLoading(false);
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  const isCheckedIn = attendanceStatus?.isCheckedIn;
  const todayRecord = attendanceStatus?.todayRecord;
  const hasCompletedToday = todayRecord && todayRecord.checkOutTime;

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold">Teacher Self Attendance</h1>
        <p className="text-muted-foreground mt-2">
          Mark your daily attendance with location tracking
        </p>
      </div>

      {/* Current Status */}
      <Card className="p-6">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center">
            {isCheckedIn ? (
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            ) : hasCompletedToday ? (
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-blue-600" />
              </div>
            ) : (
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <XCircle className="w-8 h-8 text-red-600" />
              </div>
            )}
          </div>

          <div>
            <h2 className="text-2xl font-semibold">
              {isCheckedIn ? "Checked In" : hasCompletedToday ? "Day Completed" : "Not Checked In"}
            </h2>
            <p className="text-muted-foreground">
              {isCheckedIn
                ? `Checked in at ${formatTime(todayRecord?.checkInTime)}`
                : hasCompletedToday
                ? `Completed at ${formatTime(todayRecord?.checkOutTime)}`
                : "Please check in to start your day"
              }
            </p>
          </div>

          <Badge
            variant={isCheckedIn ? "default" : hasCompletedToday ? "secondary" : "secondary"}
            className="text-lg px-4 py-2"
          >
            {isCheckedIn ? "Active Session" : hasCompletedToday ? "Completed" : "Inactive"}
          </Badge>
        </div>
      </Card>

      {/* Location Status */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <MapPin className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">Location Status</h3>
        </div>

        {locationError ? (
          <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <div>
              <p className="text-red-800 font-medium">Location Error</p>
              <p className="text-red-600 text-sm">{locationError}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={getCurrentLocation}
              className="ml-auto"
            >
              Retry
            </Button>
          </div>
        ) : currentLocation ? (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-green-800 font-medium">Location Detected</p>
                <p className="text-green-600 text-sm">
                  Lat: {currentLocation.latitude.toFixed(6)}, Lng: {currentLocation.longitude.toFixed(6)}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <Loader2 className="w-5 h-5 text-yellow-600 animate-spin" />
            <div>
              <p className="text-yellow-800 font-medium">Detecting Location</p>
              <p className="text-yellow-600 text-sm">Please wait...</p>
            </div>
          </div>
        )}
      </Card>

      {/* Today's Record */}
      {todayRecord && (
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Calendar className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold">Today's Record</h3>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <LogIn className="w-5 h-5 text-green-600" />
                <div>
                  <p className="font-medium">Check-in Time</p>
                  <p className="text-sm text-muted-foreground">
                    {formatTime(todayRecord.checkInTime)}
                  </p>
                </div>
              </div>

              {todayRecord.checkOutTime && (
                <div className="flex items-center gap-3">
                  <LogOut className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="font-medium">Check-out Time</p>
                    <p className="text-sm text-muted-foreground">
                      {formatTime(todayRecord.checkOutTime)}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-primary" />
                <div>
                  <p className="font-medium">Total Hours</p>
                  <p className="text-sm text-muted-foreground">
                    {todayRecord.totalHours || "N/A"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-primary" />
                <div>
                  <p className="font-medium">Location</p>
                  <p className="text-sm text-muted-foreground">
                    {todayRecord.location && todayRecord.location.latitude && todayRecord.location.longitude
                      ? `${todayRecord.location.latitude.toFixed(6)}, ${todayRecord.location.longitude.toFixed(6)}`
                      : "N/A"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Action Buttons */}
      <Card className="p-6">
        <div className="flex gap-4 justify-center">
          {hasCompletedToday ? (
            <div className="text-center">
              <Button
                disabled
                size="lg"
                className="px-8 opacity-50 cursor-not-allowed"
              >
                <CheckCircle className="w-5 h-5 mr-2" />
                Attendance Completed
              </Button>
              <p className="text-sm text-muted-foreground mt-2">
                You have completed today's attendance. Check-in will be available tomorrow.
              </p>
            </div>
          ) : !isCheckedIn ? (
            <Button
              onClick={handleCheckIn}
              disabled={actionLoading || !currentLocation}
              size="lg"
              className="px-8"
            >
              {actionLoading ? (
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
              ) : (
                <LogIn className="w-5 h-5 mr-2" />
              )}
              Check In
            </Button>
          ) : (
            <Button
              onClick={handleCheckOut}
              disabled={actionLoading || !currentLocation}
              variant="outline"
              size="lg"
              className="px-8"
            >
              {actionLoading ? (
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
              ) : (
                <LogOut className="w-5 h-5 mr-2" />
              )}
              Check Out
            </Button>
          )}
        </div>

        {locationError && (
          <p className="text-center text-sm text-muted-foreground mt-4">
            Location is required for attendance marking
          </p>
        )}
      </Card>

      {/* Attendance History */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Attendance History</h2>
          <div className="flex items-center gap-2">
            {/* Filter Type Selector */}
            <select
              value={filterType}
              onChange={(e) => {
                const newFilterType = e.target.value;
                setFilterType(newFilterType);
                loadAttendanceHistory(newFilterType);
              }}
              className="px-3 py-2 border border-border rounded-lg text-sm"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="date">Specific Date</option>
            </select>

            {/* Conditional Controls Based on Filter Type */}
            {filterType === 'monthly' && (
              <>
                <select
                  value={selectedMonth}
                  onChange={(e) => {
                    setSelectedMonth(parseInt(e.target.value));
                    loadAttendanceHistory('monthly', parseInt(e.target.value), selectedYear);
                  }}
                  className="px-3 py-2 border border-border rounded-lg text-sm"
                >
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {new Date(0, i).toLocaleString('default', { month: 'long' })}
                    </option>
                  ))}
                </select>
                <select
                  value={selectedYear}
                  onChange={(e) => {
                    setSelectedYear(parseInt(e.target.value));
                    loadAttendanceHistory('monthly', selectedMonth, parseInt(e.target.value));
                  }}
                  className="px-3 py-2 border border-border rounded-lg text-sm"
                >
                  {Array.from({ length: 5 }, (_, i) => {
                    const year = new Date().getFullYear() - i;
                    return (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    );
                  })}
                </select>
              </>
            )}

            {filterType === 'date' && (
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  loadAttendanceHistory('date', undefined, undefined, e.target.value);
                }}
                className="px-3 py-2 border border-border rounded-lg text-sm"
                max={new Date().toISOString().split('T')[0]}
              />
            )}
          </div>
        </div>

        {historyLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span className="ml-2">Loading history...</span>
          </div>
        ) : attendanceHistory?.records?.length > 0 ? (
          <>
            {/* Statistics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-muted-foreground">Present</p>
                <p className="text-2xl font-bold text-green-600">
                  {attendanceHistory.statistics.presentDays}
                </p>
              </div>
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-muted-foreground">Absent</p>
                <p className="text-2xl font-bold text-red-600">
                  {attendanceHistory.statistics.absentDays}
                </p>
              </div>
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-muted-foreground">Late</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {attendanceHistory.statistics.lateDays}
                </p>
              </div>
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-muted-foreground">Attendance Rate</p>
                <p className="text-2xl font-bold text-blue-600">
                  {attendanceHistory.statistics.attendancePercentage}%
                </p>
              </div>
            </div>

            {/* Records List */}
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {attendanceHistory.records.map((record, index) => (
                <motion.div
                  key={record.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`p-4 rounded-lg border ${
                    record.status === 'present'
                      ? 'bg-green-50 border-green-200'
                      : record.status === 'absent'
                      ? 'bg-red-50 border-red-200'
                      : record.status === 'late'
                      ? 'bg-yellow-50 border-yellow-200'
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">
                          {new Date(record.date).toLocaleDateString('en-US', {
                            weekday: 'long',
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </span>
                        <Badge
                          variant="outline"
                          className={`text-xs ${
                            record.status === 'present'
                              ? 'text-green-700 border-green-300'
                              : record.status === 'absent'
                              ? 'text-red-700 border-red-300'
                              : record.status === 'late'
                              ? 'text-yellow-700 border-yellow-300'
                              : 'text-gray-700 border-gray-300'
                          }`}
                        >
                          {record.status === 'present' ? 'Present' :
                           record.status === 'absent' ? 'Absent' :
                           record.status === 'late' ? 'Late' :
                           record.status === 'early_checkout' ? 'Early Checkout' :
                           record.status}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-4 text-sm">
                        {record.checkInTime && (
                          <div className="flex items-center gap-1">
                            <LogIn className="w-4 h-4 text-green-600" />
                            <span className="text-green-600 font-medium">
                              {formatTime(record.checkInTime)}
                            </span>
                            <span className="text-muted-foreground">Check-in</span>
                          </div>
                        )}
                        {record.checkOutTime && (
                          <div className="flex items-center gap-1">
                            <LogOut className="w-4 h-4 text-blue-600" />
                            <span className="text-blue-600 font-medium">
                              {formatTime(record.checkOutTime)}
                            </span>
                            <span className="text-muted-foreground">Check-out</span>
                          </div>
                        )}
                        {record.workingHours && (
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4 text-primary" />
                            <span className="text-primary font-medium">
                              {record.workingHours}
                            </span>
                            <span className="text-muted-foreground">Hours</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
            <p className="text-muted-foreground font-medium">
              No attendance records found
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Records for {new Date(selectedYear, selectedMonth - 1).toLocaleString('default', { month: 'long' })} {selectedYear} will appear here
            </p>
          </div>
        )}
      </Card>

      {/* Instructions */}
      <Card className="p-6 bg-muted/50">
        <h3 className="font-semibold mb-3">Instructions</h3>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li>• Ensure location services are enabled on your device</li>
          <li>• Check-in is required at the start of your workday</li>
          <li>• Check-out marks the end of your workday</li>
          <li>• Location data is recorded for attendance verification</li>
          <li>• You can only check-out after checking in</li>
        </ul>
      </Card>
    </div>
  );
}
