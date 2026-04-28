'use client';

import StaffAttendanceHistory from '@/components/attendance/StaffAttendanceHistory';
import { useParams } from 'next/navigation';

export default function SuperAdminStaffAttendanceDetailPage() {
    const params = useParams();
    const staffId = params.id;

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div>
                <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Staff Member History</h1>
                <p className="text-sm text-gray-500 mt-1">Detailed log of staff check-ins and attendance status across branches.</p>
            </div>
            
            <StaffAttendanceHistory 
                staffId={staffId} 
                isBranchAdmin={false} 
            />
        </div>
    );
}
