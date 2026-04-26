/**
 * THIS PAGE HAS BEEN COMMENTED OUT
 * Reason: All functionality is now available in the Fee Vouchers page
 * The Fee Vouchers page now includes:
 * - Pending Tab: Shows pending payment submissions
 * - Overdue Tab: Shows overdue fee vouchers
 * - Statistics for pending, overdue, approved, rejected payments
 * 
 * Navigate to: /branch-admin/fee-vouchers
 * 
 * Original code is preserved below in comments for reference.
 */

'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

export default function BranchAdminPendingFeesPage() {
  const router = useRouter();
  
  useEffect(() => {
    // Auto redirect to fee vouchers page after 3 seconds
    const timer = setTimeout(() => {
      router.push('/branch-admin/fee-vouchers');
    }, 3000);
    
    return () => clearTimeout(timer);
  }, [router]);
  
  return (
    <div className="p-6">
      <Card>
        <CardContent className="p-8 text-center">
          <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-yellow-500" />
          <h2 className="text-xl font-bold mb-2">This page has been moved</h2>
          <p className="text-gray-600 mb-4">
            Pending fees functionality is now available in the Fee Vouchers page.
            You will be redirected automatically in a few seconds...
          </p>
          <Button onClick={() => router.push('/branch-admin/fee-vouchers')}>
            Go to Fee Vouchers Now
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

/*
// ==================== ORIGINAL CODE (COMMENTED OUT) ====================
// All the original code is preserved here for reference

'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useApi } from '@/hooks/useApi';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Textarea from '@/components/ui/textarea';
import Modal from '@/components/ui/modal';
import FullPageLoader from '@/components/ui/full-page-loader';
import Dropdown from '@/components/ui/dropdown';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import Tabs, { TabPanel } from '@/components/ui/tabs';
import {
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Check,
  X,
  FileText,
  User,
  GraduationCap,
  DollarSign,
  CreditCard,
  Calendar,
  AlertCircle,
  Receipt,
  Building2,
  Filter,
  RefreshCw,
  AlertTriangle,
  Search,
  MoreHorizontal,
  EyeIcon,
  Download,
  Trash2,
  AlertOctagon
} from 'lucide-react';

export default function BranchAdminPendingFeesPage() {
  const { user, loading: authLoading } = useAuth();
  const { execute: request } = useApi();
  const [pendingPayments, setPendingPayments] = useState([]);
  const [approvedPayments, setApprovedPayments] = useState([]);
  const [rejectedPayments, setRejectedPayments] = useState([]);
  const [overduePayments, setOverduePayments] = useState([]);
  const [statistics, setStatistics] = useState({
    pending: { count: 0, totalAmount: 0 },
    approved: { count: 0, totalAmount: 0 },
    rejected: { count: 0, totalAmount: 0 },
    overdue: { count: 0, totalAmount: 0 },
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // ... rest of original component code would be here
}

// ==================== END OF ORIGINAL CODE ====================
*/
