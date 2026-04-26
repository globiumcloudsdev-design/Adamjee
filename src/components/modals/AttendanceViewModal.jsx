import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Calendar,
  Clock,
  MapPin,
  User,
  CheckCircle,
  XCircle,
  AlertCircle,
  Activity,
  Phone,
  Mail,
  Building,
  Timer,
  TrendingUp,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import Modal from '@/components/ui/modal';

const AttendanceViewModal = ({ open, onClose, attendanceRecord }) => {
  if (!attendanceRecord) return null;

  const [addresses, setAddresses] = useState({});

  const formatTime = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  // Reverse geocoding function using OpenStreetMap Nominatim API
  const reverseGeocode = async (lat, lng) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'Ease-Academy/1.0 (contact@easeacademy.com)',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch address');
      }

      const data = await response.json();

      if (data && data.display_name) {
        return data.display_name;
      } else {
        return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
      }
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    }
  };

  // Get address from coordinates with caching
  const getAddressFromCoordinates = async (lat, lng) => {
    if (!lat || !lng) return 'Location not recorded';

    const key = `${lat.toFixed(4)},${lng.toFixed(4)}`;

    if (addresses[key]) {
      return addresses[key];
    }

    // Start with coordinates while fetching
    setAddresses(prev => ({ ...prev, [key]: `${lat.toFixed(4)}, ${lng.toFixed(4)} (Loading...)` }));

    try {
      const address = await reverseGeocode(lat, lng);
      setAddresses(prev => ({ ...prev, [key]: address }));
      return address;
    } catch (error) {
      const fallback = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
      setAddresses(prev => ({ ...prev, [key]: fallback }));
      return fallback;
    }
  };

  useEffect(() => {
    if (attendanceRecord && open) {
      // Fetch addresses for check-in and check-out locations
      const fetchAddresses = async () => {
        if (attendanceRecord.checkIn?.location) {
          await getAddressFromCoordinates(
            attendanceRecord.checkIn.location.latitude,
            attendanceRecord.checkIn.location.longitude
          );
        }
        if (attendanceRecord.checkOut?.location) {
          await getAddressFromCoordinates(
            attendanceRecord.checkOut.location.latitude,
            attendanceRecord.checkOut.location.longitude
          );
        }
      };

      fetchAddresses();
    }
  }, [attendanceRecord, open]);

  const getStatusBadge = (status) => {
    const variants = {
      present: 'bg-green-100 text-green-800 border-green-200',
      absent: 'bg-red-100 text-red-800 border-red-200',
      late: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'half-day': 'bg-orange-100 text-orange-800 border-orange-200',
      leave: 'bg-blue-100 text-blue-800 border-blue-200',
      excused: 'bg-purple-100 text-purple-800 border-purple-200',
      'early_checkout': 'bg-amber-100 text-amber-800 border-amber-200',
    };

    const icons = {
      present: <CheckCircle className="w-3 h-3" />,
      absent: <XCircle className="w-3 h-3" />,
      late: <AlertCircle className="w-3 h-3" />,
      'half-day': <Activity className="w-3 h-3" />,
      leave: <Calendar className="w-3 h-3" />,
      excused: <CheckCircle className="w-3 h-3" />,
      'early_checkout': <Timer className="w-3 h-3" />,
    };

    return (
      <Badge className={`${variants[status] || 'bg-gray-100 text-gray-800 border-gray-200'} flex items-center gap-1`}>
        {icons[status]}
        {status.replace('-', ' ').replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  const getCheckInStatusBadge = (status) => {
    if (!status) return null;
    const variants = {
      'on-time': 'bg-green-100 text-green-800 border-green-200',
      'late': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    };

    return (
      <Badge className={`${variants[status]} text-xs`}>
        {status === 'on-time' ? '✓ On Time' : '⚠ Late'}
      </Badge>
    );
  };

  const getCheckOutStatusBadge = (status) => {
    if (!status) return null;
    const variants = {
      'on-time': 'bg-green-100 text-green-800 border-green-200',
      'early': 'bg-orange-100 text-orange-800 border-orange-200',
    };

    return (
      <Badge className={`${variants[status]} text-xs`}>
        {status === 'on-time' ? '✓ On Time' : '⚠ Early'}
      </Badge>
    );
  };

  // Component to display address with async loading
  const AddressDisplay = ({ lat, lng }) => {
    const [address, setAddress] = useState('');

    useEffect(() => {
      const fetchAddress = async () => {
        if (!lat || !lng) {
          setAddress('Location not recorded');
          return;
        }

        const key = `${lat.toFixed(4)},${lng.toFixed(4)}`;

        if (addresses[key]) {
          setAddress(addresses[key]);
          return;
        }

        // Start with loading state
        setAddress(`${lat.toFixed(4)}, ${lng.toFixed(4)} (Loading...)`);
        setAddresses(prev => ({ ...prev, [key]: `${lat.toFixed(4)}, ${lng.toFixed(4)} (Loading...)` }));

        try {
          const fetchedAddress = await reverseGeocode(lat, lng);
          setAddress(fetchedAddress);
          setAddresses(prev => ({ ...prev, [key]: fetchedAddress }));
        } catch (error) {
          const fallback = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
          setAddress(fallback);
          setAddresses(prev => ({ ...prev, [key]: fallback }));
        }
      };

      fetchAddress();
    }, [lat, lng]);

    return <p className="text-sm font-medium">{address}</p>;
  };



  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Attendance Details"
      size="xl"
    >
      <div className="space-y-6">
        {/* Employee Info */}
        <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-900">
                {attendanceRecord.userId?.firstName} {attendanceRecord.userId?.lastName}
              </h3>
              <p className="text-gray-600 flex items-center gap-2">
                <Mail className="w-4 h-4" />
                {attendanceRecord.userId?.email}
              </p>
              {attendanceRecord.userId?.phone && (
                <p className="text-gray-600 flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  {attendanceRecord.userId.phone}
                </p>
              )}
            </div>
            <div className="text-right">
              {getStatusBadge(attendanceRecord.status)}
            </div>
          </div>
        </Card>

        {/* Date and Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-sm text-gray-500">Date</p>
                <p className="font-semibold">{formatDate(attendanceRecord.date)}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-sm text-gray-500">Working Hours</p>
                <p className="font-semibold">
                  {attendanceRecord.workingHours ? `${attendanceRecord.workingHours.toFixed(1)}h` : 'N/A'}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-5 h-5 text-purple-500" />
              <div>
                <p className="text-sm text-gray-500">Overtime</p>
                <p className="font-semibold">
                  {attendanceRecord.overtimeHours ? `${attendanceRecord.overtimeHours.toFixed(1)}h` : '0h'}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Check-in Details */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <h4 className="text-lg font-semibold">Check-in Details</h4>
          </div>

          {attendanceRecord.checkIn?.time ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Time:</span>
                  <span className="font-medium">{formatTime(attendanceRecord.checkIn.time)}</span>
                </div>

                {attendanceRecord.checkIn.status && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Status:</span>
                    {getCheckInStatusBadge(attendanceRecord.checkIn.status)}
                  </div>
                )}

                {attendanceRecord.lateBy > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Late by:</span>
                    <span className="font-medium text-yellow-600">{attendanceRecord.lateBy} minutes</span>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                {attendanceRecord.checkIn.location && (
                  <div>
                    <span className="text-sm text-gray-600 flex items-center gap-1 mb-1">
                      <MapPin className="w-3 h-3" />
                      Location:
                    </span>
                    <AddressDisplay
                      lat={attendanceRecord.checkIn.location.latitude}
                      lng={attendanceRecord.checkIn.location.longitude}
                    />
                  </div>
                )}

                {attendanceRecord.checkIn.device && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Device:</span>
                    <span className="font-medium text-xs bg-gray-100 px-2 py-1 rounded">
                      {attendanceRecord.checkIn.device}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <p className="text-gray-500 italic">No check-in recorded</p>
          )}
        </Card>

        {/* Check-out Details */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <XCircle className="w-5 h-5 text-blue-500" />
            <h4 className="text-lg font-semibold">Check-out Details</h4>
          </div>

          {attendanceRecord.checkOut?.time ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Time:</span>
                  <span className="font-medium">{formatTime(attendanceRecord.checkOut.time)}</span>
                </div>

                {attendanceRecord.checkOut.status && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Status:</span>
                    {getCheckOutStatusBadge(attendanceRecord.checkOut.status)}
                  </div>
                )}

                {attendanceRecord.earlyLeaveBy > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Early by:</span>
                    <span className="font-medium text-orange-600">{attendanceRecord.earlyLeaveBy} minutes</span>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                {attendanceRecord.checkOut.location && (
                  <div>
                    <span className="text-sm text-gray-600 flex items-center gap-1 mb-1">
                      <MapPin className="w-3 h-3" />
                      Location:
                    </span>
                    <AddressDisplay
                      lat={attendanceRecord.checkOut.location.latitude}
                      lng={attendanceRecord.checkOut.location.longitude}
                    />
                  </div>
                )}

                {attendanceRecord.checkOut.device && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Device:</span>
                    <span className="font-medium text-xs bg-gray-100 px-2 py-1 rounded">
                      {attendanceRecord.checkOut.device}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <p className="text-gray-500 italic">No check-out recorded</p>
          )}
        </Card>

        {/* Additional Information */}
        {(attendanceRecord.remarks || attendanceRecord.leaveType || attendanceRecord.leaveReason) && (
          <Card className="p-6">
            <h4 className="text-lg font-semibold mb-4">Additional Information</h4>
            <div className="space-y-3">
              {attendanceRecord.leaveType && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Leave Type:</span>
                  <Badge variant="outline">{attendanceRecord.leaveType}</Badge>
                </div>
              )}

              {attendanceRecord.leaveReason && (
                <div>
                  <span className="text-sm text-gray-600">Leave Reason:</span>
                  <p className="text-sm font-medium mt-1">{attendanceRecord.leaveReason}</p>
                </div>
              )}

              {attendanceRecord.remarks && (
                <div>
                  <span className="text-sm text-gray-600">Remarks:</span>
                  <p className="text-sm font-medium mt-1">{attendanceRecord.remarks}</p>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* System Information */}
        <Card className="p-4 bg-gray-50">
          <div className="text-xs text-gray-500 space-y-1">
            <p>Record ID: {attendanceRecord._id}</p>
            <p>Created: {new Date(attendanceRecord.createdAt).toLocaleString()}</p>
            {attendanceRecord.updatedAt !== attendanceRecord.createdAt && (
              <p>Last Updated: {new Date(attendanceRecord.updatedAt).toLocaleString()}</p>
            )}
          </div>
        </Card>
      </div>
    </Modal>
  );
};

export default AttendanceViewModal;
