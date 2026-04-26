'use client';

import StaffAttendanceManager from '@/components/attendance/StaffAttendanceManager';
import { Briefcase } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export default function BranchAdminStaffAttendancePage() {
    const { user } = useAuth();

    return (
        <div className="p-6 space-y-6">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Briefcase className="h-7 w-7 text-blue-600" />
                        Staff Attendance
                    </h1>
                    <p className="text-gray-600">
                        Monitor and manage attendance for your branch staff and teachers.
                    </p>
                </div>
            </header>

            <StaffAttendanceManager
                isBranchAdmin={true}
                defaultBranchId={user?.branch_id}
            />
        </div>
    );
}
