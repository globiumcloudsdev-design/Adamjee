'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  QrCode,
  Camera,
  Loader2,
  CheckCircle,
  Clock,
  XCircle,
  Users,
  Building2,
  Info,
  PauseCircle,
  PlayCircle,
} from 'lucide-react';
import { format } from 'date-fns';

const SAMPLE_CODES = [
  { id: 'EA-1004', name: 'Maria Khan', type: 'student', branch: 'Gulberg Campus' },
  { id: 'T-201', name: 'Ahmed Raza', type: 'teacher', branch: 'DHA Campus' },
  { id: 'ST-05', name: 'Support Staff', type: 'staff', branch: 'Johar Town Campus' },
];

export default function QrScannerAttendancePage() {
  const [isScanning, setIsScanning] = useState(false);
  const [scannedEntries, setScannedEntries] = useState([]);
  const [scanIndex, setScanIndex] = useState(0);

  useEffect(() => {
    if (!isScanning) return;

    const interval = setInterval(() => {
      const nextRecord = SAMPLE_CODES[scanIndex % SAMPLE_CODES.length];
      setScannedEntries((prev) => [
        {
          ...nextRecord,
          status: 'present',
          timestamp: new Date().toISOString(),
        },
        ...prev,
      ]);
      setScanIndex((prev) => prev + 1);
      toast.success(`${nextRecord.name} marked present via QR`);
    }, 2500);

    return () => clearInterval(interval);
  }, [isScanning, scanIndex]);

  const toggleScanning = () => {
    setIsScanning((prev) => !prev);
  };

  const clearEntries = () => {
    setScannedEntries([]);
    setScanIndex(0);
  };

  return (
    <div className="p-6 space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <QrCode className="h-7 w-7 text-blue-600" />
          QR Code Attendance Scanner
        </h1>
        <p className="text-gray-600">Use camera-enabled devices to capture attendance instantly for students, teachers, and staff.</p>
      </header>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-lg shadow-sm p-6 space-y-5">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Camera className="h-4 w-4" />
            Live Scanner
          </div>
          <div className="relative bg-gray-100 border border-dashed border-gray-300 rounded-xl h-72 flex flex-col items-center justify-center gap-4">
            <QrCode className="h-16 w-16 text-gray-400" />
            <p className="text-gray-600 text-sm max-w-xs text-center">
              Position the QR badge in front of the camera. Scans are processed instantly and logged below.
            </p>
            {isScanning && (
              <div className="absolute bottom-6 flex items-center gap-2 text-sm text-blue-600">
                <Loader2 className="h-4 w-4 animate-spin" />
                Scanning...
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={toggleScanning}
              className={`px-4 py-2 rounded-lg text-white flex items-center gap-2 ${isScanning ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}`}
            >
              {isScanning ? <PauseCircle className="h-5 w-5" /> : <PlayCircle className="h-5 w-5" />}
              {isScanning ? 'Pause Scanning' : 'Start Scanning'}
            </button>
            <button
              onClick={clearEntries}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Clear Log
            </button>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Info className="h-4 w-4" />
            Setup Checklist
          </div>
          <ul className="space-y-3 text-sm text-gray-600">
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-1" />
              Ensure the webcam or device camera is enabled with browser permissions.
            </li>
            <li className="flex items-start gap-2">
              <Clock className="h-4 w-4 text-blue-500 mt-1" />
              Recommended scanning distance: 20-30 cm for fastest recognition.
            </li>
            <li className="flex items-start gap-2">
              <Users className="h-4 w-4 text-purple-500 mt-1" />
              QR badges should include student/employee ID, full name, and branch code.
            </li>
            <li className="flex items-start gap-2">
              <Building2 className="h-4 w-4 text-gray-500 mt-1" />
              Offline scanning supported via mobile app. Sync once internet is restored.
            </li>
            <li className="flex items-start gap-2">
              <XCircle className="h-4 w-4 text-red-500 mt-1" />
              Duplicate scans within 30 seconds are ignored to prevent accidental double entries.
            </li>
          </ul>
        </div>
      </section>

      <section className="bg-white border border-gray-200 rounded-lg shadow-sm">
        {!scannedEntries.length ? (
          <div className="p-8 text-center text-gray-500">
            Scanned records will appear here in real time.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-6 py-3 text-left">Name</th>
                  <th className="px-6 py-3 text-left">Profile Type</th>
                  <th className="px-6 py-3 text-left">Branch</th>
                  <th className="px-6 py-3 text-left">Identifier</th>
                  <th className="px-6 py-3 text-left">Status</th>
                  <th className="px-6 py-3 text-left">Scanned At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-sm">
                {scannedEntries.map((entry, index) => (
                  <tr key={`${entry.id}-${index}`} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                      {entry.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap capitalize text-gray-600">{entry.type}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">{entry.branch}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">{entry.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap capitalize text-green-600">{entry.status}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                      {format(new Date(entry.timestamp), 'dd MMM yyyy, hh:mm:ss a')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
