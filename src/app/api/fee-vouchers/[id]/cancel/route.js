import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { FeeVoucher } from '@/backend/models/postgres';

export async function PUT(request, { params }) {
  try {
    const user = await getCurrentUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const voucher = await FeeVoucher.findByPk(id);

    if (!voucher) {
      return NextResponse.json({ success: false, error: 'Voucher not found' }, { status: 404 });
    }

    if (voucher.status === 'PAID') {
      return NextResponse.json({ success: false, error: 'Cannot cancel a paid voucher' }, { status: 400 });
    }

    // Cancel the voucher
    // There is no explicit CANCELLED enum, but the frontend checks for "cancelled"
    // Wait, the Postgres enum has: "UNPAID", "PAID", "PARTIAL", "OVERDUE"
    // If the enum doesn't have CANCELLED, we can either soft delete it (paranoid: true) 
    // or add CANCELLED to the ENUM. 
    // For now, let's just delete it (soft delete).
    await voucher.destroy();
    
    return NextResponse.json({ success: true, message: 'Voucher cancelled successfully' });
  } catch (error) {
    console.error('Error cancelling fee voucher:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
