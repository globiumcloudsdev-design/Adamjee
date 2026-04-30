'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import Input from '@/components/ui/input';
import Dropdown from '@/components/ui/dropdown';
import Modal from '@/components/ui/modal';
import FullPageLoader from '@/components/ui/full-page-loader';
import ButtonLoader from '@/components/ui/button-loader';
import BranchSelect from '@/components/ui/branch-select';
import { Plus, Search, DollarSign, Trash2, Eye, ChevronDown, Download, Clock, CheckCircle, XCircle, RefreshCw, AlertTriangle, FileText, User, GraduationCap, Calendar, CreditCard, Check, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { TabPanel } from '@/components/ui/tabs';
import Textarea from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import apiClient from '@/lib/api-client';
import { API_ENDPOINTS } from '@/constants/api-endpoints';
import { toast } from 'sonner';
import { generateFeeVoucherPDF } from '@/lib/pdf-generator';
import ConfirmDeleteModal from '@/components/modals/ConfirmDeleteModal';

const MONTHS = [
  { value: '1', label: 'January' },
  { value: '2', label: 'February' },
  { value: '3', label: 'March' },
  { value: '4', label: 'April' },
  { value: '5', label: 'May' },
  { value: '6', label: 'June' },
  { value: '7', label: 'July' },
  { value: '8', label: 'August' },
  { value: '9', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' },
];

const YEARS = (() => {
  const current = new Date().getFullYear();
  const list = [];
  for (let y = current; y >= 2020; y--) {
    list.push({ value: String(y), label: String(y) });
  }
  return list;
})();

const ITEMS_PER_PAGE = 10;

const getStatusBadge = (status) => {
  const badges = {
    pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    paid: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    partial: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    overdue: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    cancelled: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
  };
  return badges[status] || badges.pending;
};

export default function SuperAdminFeeVouchersPage() {
  const { user, loading: authLoading } = useAuth();
  
  // All vouchers loaded once
  const [allVouchers, setAllVouchers] = useState([]);
  
  // Modal states
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isManualPaymentModalOpen, setIsManualPaymentModalOpen] = useState(false);
  
  // Loading states
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [viewLoading, setViewLoading] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  
  // View/Edit states
  const [viewingVoucher, setViewingVoucher] = useState(null);
  const [selectedVoucherForPayment, setSelectedVoucherForPayment] = useState(null);
  
  // Filter states
  const [search, setSearch] = useState('');
  const [monthFilter, setMonthFilter] = useState('');
  const [yearFilter, setYearFilter] = useState(new Date().getFullYear().toString());
  const [branchFilter, setBranchFilter] = useState('');
  
  // Pagination state - separate for each tab
  const [pagination, setPagination] = useState({
    all: { page: 1 },
    pending: { page: 1 },
    partial: { page: 1 },
    overdue: { page: 1 },
    paid: { page: 1 },
    cancelled: { page: 1 },
  });
  
  // Tab state
  const [activeTab, setActiveTab] = useState('all');
  
  // Form data for generate modal
  const [formData, setFormData] = useState({
    generation_type: 'branch',
    branchId: '',
    academic_year_id: '',
    groupId: '',
    classId: '',
    sectionId: '',
    studentId: '',
    studentIds: [],
    dueDate: '',
    month: (new Date().getMonth() + 1).toString(),
    year: new Date().getFullYear().toString(),
    remarks: '',
  });
  
  // Dropdown data
  const [branches, setBranches] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [groups, setGroups] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [studentDropdownOpen, setStudentDropdownOpen] = useState(false);
  
  // Delete confirmation modal states
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingVoucherId, setDeletingVoucherId] = useState(null);
  
  // Payment modal states
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentRemarks, setPaymentRemarks] = useState('');

  const formatStudent = (student) => {
    const nameRaw = student?.fullName || `${student?.firstName || ''} ${student?.lastName || ''}`;
    const name = (nameRaw || 'Student').trim() || 'Student';
    const registrationNumber = student?.studentProfile?.registrationNumber || student?.registrationNumber || '---';
    const rollNumber = student?.studentProfile?.rollNumber || student?.rollNumber || '---';
    const section = student?.studentProfile?.section || '---';
    return { name, registrationNumber, rollNumber, section };
  };

  // Load all vouchers once on mount
  useEffect(() => {
    if (authLoading || (!user?.id && !user?._id)) return;
    fetchAllVouchers();
    fetchBranches();
    fetchAcademicYears();
  }, [authLoading, user?.id, user?._id]);

  // Load templates/classes/groups/academic-years when branch changes in form
  useEffect(() => {
    if (formData.branchId) {
      fetchTemplates();
      fetchClasses();
      fetchGroups();
      fetchAcademicYears();
    } else {
      setTemplates([]);
      setClasses([]);
      setGroups([]);
      setAcademicYears([]);
    }
  }, [formData.branchId]);

  useEffect(() => {
    if (formData.branchId || formData.generation_type === 'institute') {
      fetchStudents();
    }
  }, [formData.branchId, formData.generation_type]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (studentDropdownOpen && !e.target.closest('.student-dropdown-container')) {
        setStudentDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [studentDropdownOpen]);

  // Reset pagination when filters change
  useEffect(() => {
    setPagination(prev => ({
      ...prev,
      [activeTab]: { page: 1 }
    }));
  }, [search, monthFilter, yearFilter, branchFilter, activeTab]);

  // Fetch all vouchers in one API call
  const fetchAllVouchers = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(API_ENDPOINTS.SUPER_ADMIN.FEE_VOUCHERS.LIST, { limit: 10000 });
      
      if (response.success) {
        setAllVouchers(response.data.vouchers || []);
      }
    } catch (err) {
      console.error('Error fetching vouchers:', err);
      toast.error('Failed to load vouchers');
    } finally {
      setLoading(false);
    }
  };

  const fetchBranches = async () => {
    try {
      const res = await apiClient.get(API_ENDPOINTS.SUPER_ADMIN.BRANCHES.LIST, { limit: 200 });
      if (res?.success) setBranches(res.data.branches || []);
    } catch (err) {
      console.error('Error loading branches:', err);
    }
  };

  const fetchTemplates = async () => {
    if (!formData.branchId) return;
    try {
      const res = await apiClient.get('/api/fee-templates', { 
        branchId: formData.branchId, 
        limit: 200, 
        status: 'active' 
      });
      if (Array.isArray(res)) setTemplates(res);
      else if (res?.success) setTemplates(res.data.templates || res.data || []);
    } catch (err) {
      console.error('Error loading templates:', err);
    }
  };

  const fetchGroups = async () => {
    if (!formData.branchId) return;
    try {
      const res = await apiClient.get('/api/groups', { branch_id: formData.branchId });
      if (Array.isArray(res)) setGroups(res);
      else if (res?.success) setGroups(res.data.groups || res.data || []);
    } catch (err) {
      console.error('Error loading groups:', err);
    }
  };

  const fetchAcademicYears = async () => {
    try {
      const res = await apiClient.get('/api/academic-years', { branch_id: formData.branchId });
      if (Array.isArray(res)) setAcademicYears(res);
      else if (res?.academic_years) setAcademicYears(res.academic_years);
      else if (res?.success) setAcademicYears(res.data.academicYears || res.data || []);
    } catch (err) {
      console.error('Error loading academic years:', err);
    }
  };

  const fetchClasses = async () => {
    if (!formData.branchId) return;
    try {
      const res = await apiClient.get('/api/classes', { 
        branch_id: formData.branchId, 
        limit: 200 
      });
      if (Array.isArray(res)) setClasses(res);
      else if (res?.success) setClasses(res.data.classes || res.data || []);
    } catch (err) {
      console.error('Error loading classes:', err);
    }
  };

  const fetchStudents = async () => {
    try {
      const params = { limit: 1000 };
      if (formData.branchId) params.branch_id = formData.branchId;
      if (formData.classId) params.class_id = formData.classId;
      
      const res = await apiClient.get('/api/users/students', params);
      if (Array.isArray(res)) setStudents(res);
      else if (res?.success) setStudents(res.data.students || res.data || []);
    } catch (err) {
      console.error('Error loading students:', err);
    }
  };

  const fetchVoucherDetail = async (id) => {
    setViewLoading(true);
    try {
      const res = await apiClient.get(API_ENDPOINTS.SUPER_ADMIN.FEE_VOUCHERS.GET.replace(':id', id));
      if (res?.success) setViewingVoucher(res.data);
    } catch (err) {
      toast.error(err.message || 'Failed to load voucher');
      setIsViewModalOpen(false);
    } finally {
      setViewLoading(false);
    }
  };

  // Client-side filtering and categorization
  const filteredAndCategorizedVouchers = useMemo(() => {
    let filtered = allVouchers;

    // Apply search filter
    if (search.trim()) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter((voucher) => {
        const voucherNumber = voucher.voucherNumber?.toString().toLowerCase() || '';
        const studentName = formatStudent(voucher.studentId).name.toLowerCase();
        const registrationNumber = voucher.studentId?.studentProfile?.registrationNumber?.toString().toLowerCase() || '';
        const rollNumber = voucher.studentId?.studentProfile?.rollNumber?.toString().toLowerCase() || '';
        return voucherNumber.includes(searchLower) ||
               studentName.includes(searchLower) ||
               registrationNumber.includes(searchLower) ||
               rollNumber.includes(searchLower);
      });
    }

    // Apply month filter
    if (monthFilter) {
      filtered = filtered.filter(v => v.month?.toString() === monthFilter);
    }

    // Apply year filter
    if (yearFilter) {
      filtered = filtered.filter(v => v.year?.toString() === yearFilter || v.dueDate?.substring(0, 4) === yearFilter);
    }

    // Apply branch filter
    if (branchFilter) {
      filtered = filtered.filter(v => v.branchId?._id === branchFilter || v.branchId === branchFilter);
    }

    // Categorize by status
    return {
      all: filtered,
      pending: filtered.filter(v => v.status === 'pending'),
      partial: filtered.filter(v => v.status === 'partial'),
      overdue: filtered.filter(v => v.status === 'overdue'),
      paid: filtered.filter(v => v.status === 'paid'),
      cancelled: filtered.filter(v => v.status === 'cancelled'),
    };
  }, [allVouchers, search, monthFilter, yearFilter, branchFilter]);

  // Statistics
  const statistics = useMemo(() => ({
    all: {
      count: filteredAndCategorizedVouchers.all.length,
      totalAmount: filteredAndCategorizedVouchers.all.reduce((sum, v) => sum + (v.totalAmount || 0), 0)
    },
    pending: {
      count: filteredAndCategorizedVouchers.pending.length,
      totalAmount: filteredAndCategorizedVouchers.pending.reduce((sum, v) => sum + (v.totalAmount || 0), 0)
    },
    partial: {
      count: filteredAndCategorizedVouchers.partial.length,
      totalAmount: filteredAndCategorizedVouchers.partial.reduce((sum, v) => sum + (v.remainingAmount || v.totalAmount || 0), 0)
    },
    overdue: {
      count: filteredAndCategorizedVouchers.overdue.length,
      totalAmount: filteredAndCategorizedVouchers.overdue.reduce((sum, v) => sum + (v.remainingAmount || v.totalAmount || 0), 0)
    },
    paid: {
      count: filteredAndCategorizedVouchers.paid.length,
      totalAmount: filteredAndCategorizedVouchers.paid.reduce((sum, v) => sum + (v.totalAmount || 0), 0)
    },
    cancelled: {
      count: filteredAndCategorizedVouchers.cancelled.length,
      totalAmount: filteredAndCategorizedVouchers.cancelled.reduce((sum, v) => sum + (v.totalAmount || 0), 0)
    },
  }), [filteredAndCategorizedVouchers]);

  // Get paginated vouchers for current tab
  const getPaginatedVouchers = (tabKey) => {
    const vouchers = filteredAndCategorizedVouchers[tabKey] || [];
    const currentPage = pagination[tabKey]?.page || 1;
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    
    return {
      data: vouchers.slice(startIndex, endIndex),
      total: vouchers.length,
      totalPages: Math.ceil(vouchers.length / ITEMS_PER_PAGE),
      currentPage,
      startIndex: startIndex + 1,
      endIndex: Math.min(endIndex, vouchers.length),
    };
  };

  const handlePageChange = (tabKey, newPage) => {
    setPagination(prev => ({
      ...prev,
      [tabKey]: { page: newPage }
    }));
  };

  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
    // Reset to page 1 when changing tabs
    setPagination(prev => ({
      ...prev,
      [newTab]: { page: prev[newTab]?.page || 1 }
    }));
  };

  const handleGenerateVouchers = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (!formData.dueDate) return toast.error('Please select a due date');
      if (formData.generation_type !== 'institute' && !formData.branchId) return toast.error('Please select a branch');

      const payload = {
        generation_type: formData.generation_type,
        branch_id: formData.branchId,
        academic_year_id: formData.academic_year_id,
        group_id: formData.groupId,
        class_id: formData.classId,
        section_id: formData.sectionId,
        student_id: formData.studentId,
        due_date: formData.dueDate,
        month: parseInt(formData.month),
        year: parseInt(formData.year),
        remarks: formData.remarks,
      };

      const res = await apiClient.post('/api/fee-vouchers', payload);
      if (res?.success) {
        toast.success(res.message || 'Fee vouchers generated successfully!');
        setIsGenerateModalOpen(false);
        resetForm();
        fetchAllVouchers(); // Refresh data
      }
    } catch (err) {
      console.error('Error generating vouchers:', err);
      toast.error(err.message || 'Failed to generate vouchers');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelVoucher = async (id) => {
    if (!confirm('Are you sure you want to cancel this voucher?')) return;
    
    try {
      const res = await apiClient.put(API_ENDPOINTS.SUPER_ADMIN.FEE_VOUCHERS.CANCEL.replace(':id', id));
      if (res?.success) {
        toast.success('Voucher cancelled successfully');
        fetchAllVouchers(); // Refresh data
      }
    } catch (err) {
      toast.error(err.message || 'Failed to cancel voucher');
    }
  };

  const handleDeleteVoucher = (id) => {
    setDeletingVoucherId(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteVoucher = async () => {
    if (!deletingVoucherId) return;
    try {
      const res = await apiClient.delete(`/api/fee-vouchers/${deletingVoucherId}`);
      if (res?.success) {
        toast.success('Voucher deleted successfully');
        setIsDeleteModalOpen(false);
        setDeletingVoucherId(null);
        fetchAllVouchers(); 
      }
    } catch (err) {
      toast.error(err.message || 'Failed to delete voucher');
    }
  };

  const handleViewVoucher = (id) => {
    setIsViewModalOpen(true);
    fetchVoucherDetail(id);
  };

  const handleDownloadVoucher = async (voucher) => {
    try {
      const pdfBuffer = await generateFeeVoucherPDF(voucher);
      const blob = new Blob([pdfBuffer], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `FeeVoucher_${voucher.voucherNumber || 'download'}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('PDF generation error:', err);
      toast.error('Failed to generate PDF');
    }
  };

  const handleOpenManualPayment = (voucher) => {
    setSelectedVoucherForPayment(voucher);
    setPaymentAmount(voucher.remainingAmount?.toString() || voucher.totalAmount?.toString() || '');
    setPaymentRemarks('');
    setIsManualPaymentModalOpen(true);
  };

  const handleManualPayment = async () => {
    if (!selectedVoucherForPayment || !paymentAmount) {
      toast.error('Please enter payment amount');
      return;
    }

    const outstanding = Number(selectedVoucherForPayment.remainingAmount || selectedVoucherForPayment.totalAmount || 0);
    if (parseFloat(paymentAmount) > outstanding) {
      toast.error(`Payment amount exceeds outstanding balance (PKR ${outstanding})`);
      return;
    }

    setProcessingPayment(true);
    try {
      const res = await apiClient.post(
        `/api/fee-vouchers/${selectedVoucherForPayment.id || selectedVoucherForPayment._id}/manual-payment`,
        {
          amount: parseFloat(paymentAmount),
          remarks: paymentRemarks,
          method: 'Cash',
        }
      );

      if (res?.success) {
        toast.success('Payment recorded successfully');
        setIsManualPaymentModalOpen(false);
        setSelectedVoucherForPayment(null);
        setPaymentAmount('');
        setPaymentRemarks('');
        
        if (res.data) {
          setAllVouchers(prev => prev.map(v => (v.id === res.data.id || v._id === res.data._id) ? res.data : v));
        }
        fetchAllVouchers(); 
      }
    } catch (err) {
      toast.error(err.message || 'Failed to process payment');
    } finally {
      setProcessingPayment(false);
    }
  };

  const resetForm = () => {
    setFormData({
      branchId: '',
      templateId: '',
      classId: '',
      studentIds: [],
      selectAllStudents: false,
      dueDate: '',
      month: (new Date().getMonth() + 1).toString(),
      year: new Date().getFullYear().toString(),
      remarks: '',
    });
    setTemplates([]);
    setClasses([]);
    setStudents([]);
  };

  // Common table component for consistent UI
  const VoucherTable = ({ vouchers, showExtraColumns = false, tabKey }) => {
    const paginatedData = getPaginatedVouchers(tabKey);
    const displayVouchers = tabKey === 'all' ? paginatedData.data : vouchers;
    
    if (displayVouchers.length === 0) {
      return (
        <div className="text-center py-12 text-muted-foreground">
          <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No vouchers found</p>
        </div>
      );
    }

    return (
      <>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Voucher #</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Branch</TableHead>
                <TableHead>Month/Year</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead className="text-right">Total Amount</TableHead>
                {tabKey === 'partial' && <TableHead className="text-right">Paid</TableHead>}
                {tabKey === 'partial' && <TableHead className="text-right">Remaining</TableHead>}
                {tabKey === 'overdue' && <TableHead className="text-right">Remaining</TableHead>}
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayVouchers.map((voucher) => {
                const { name, registrationNumber, rollNumber, section } = formatStudent(voucher.studentId);
                const daysOverdue = tabKey === 'overdue' 
                  ? Math.floor((new Date() - new Date(voucher.dueDate)) / (1000 * 60 * 60 * 24)) 
                  : 0;
                
                return (
                  <TableRow 
                    key={voucher._id} 
                    className={
                      tabKey === 'overdue' ? 'bg-red-50 dark:bg-red-900/10' :
                      tabKey === 'partial' ? 'bg-blue-50 dark:bg-blue-900/10' :
                      tabKey === 'paid' ? 'bg-green-50 dark:bg-green-900/10' : ''
                    }
                  >
                    <TableCell className="font-medium">{voucher.voucherNumber}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{name}</div>
                        <div className="text-xs text-gray-500">
                          Reg: {registrationNumber} | Roll: {rollNumber} | Sec: {voucher.section?.name || section}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{voucher.branchId?.name || '---'}</TableCell>
                    <TableCell>{MONTHS.find(m => m.value === voucher.month?.toString())?.label} {voucher.year}</TableCell>
                    <TableCell>
                      <div className={tabKey === 'overdue' ? 'text-red-600 font-medium' : ''}>
                        {new Date(voucher.dueDate).toLocaleDateString('en-PK')}
                      </div>
                      {tabKey === 'overdue' && (
                        <div className="text-xs text-orange-600">{daysOverdue} days overdue</div>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      PKR {(voucher.totalAmount || 0).toLocaleString()}
                    </TableCell>
                    {tabKey === 'partial' && (
                      <TableCell className="text-right font-semibold text-green-600">
                        PKR {(voucher.paidAmount || 0).toLocaleString()}
                      </TableCell>
                    )}
                    {tabKey === 'partial' && (
                      <TableCell className="text-right font-semibold text-blue-600">
                        PKR {(voucher.remainingAmount || voucher.totalAmount || 0).toLocaleString()}
                      </TableCell>
                    )}
                    {tabKey === 'overdue' && (
                      <TableCell className="text-right font-semibold text-orange-600">
                        PKR {(voucher.remainingAmount || voucher.totalAmount || 0).toLocaleString()}
                      </TableCell>
                    )}
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs ${getStatusBadge(voucher.status)}`}>
                        {voucher.status.charAt(0).toUpperCase() + voucher.status.slice(1)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon-sm" title="View" onClick={() => handleViewVoucher(voucher.id || voucher._id)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon-sm" title="Download" onClick={() => handleDownloadVoucher(voucher)}>
                          <Download className="w-4 h-4" />
                        </Button>
                        {voucher.status !== 'paid' && voucher.status !== 'cancelled' && (
                          <>
                            <Button variant="ghost" size="icon-sm" title="Payment" onClick={() => handleOpenManualPayment(voucher)}>
                              <CreditCard className="w-4 h-4 text-green-600" />
                            </Button>
                            <Button variant="ghost" size="icon-sm" title="Cancel" onClick={() => handleCancelVoucher(voucher.id || voucher._id)}>
                              <XCircle className="w-4 h-4 text-orange-600" />
                            </Button>
                            <Button variant="ghost" size="icon-sm" title="Delete" onClick={() => handleDeleteVoucher(voucher.id || voucher._id)}>
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
        
        {/* Pagination */}
        <PaginationControls 
          tabKey={tabKey} 
          paginatedData={paginatedData} 
          onPageChange={handlePageChange} 
        />
      </>
    );
  };

  // Pagination component
  const PaginationControls = ({ tabKey, paginatedData, onPageChange }) => {
    const { total, totalPages, currentPage, startIndex, endIndex } = paginatedData;
    
    if (total <= ITEMS_PER_PAGE) return null;

    return (
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4 pt-4 border-t">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Showing {startIndex} to {endIndex} of {total} vouchers
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === 1}
            onClick={() => onPageChange(tabKey, currentPage - 1)}
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </Button>
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              
              return (
                <Button
                  key={pageNum}
                  variant={currentPage === pageNum ? 'default' : 'outline'}
                  size="sm"
                  className="w-8 h-8 p-0"
                  onClick={() => onPageChange(tabKey, pageNum)}
                >
                  {pageNum}
                </Button>
              );
            })}
          </div>
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === totalPages}
            onClick={() => onPageChange(tabKey, currentPage + 1)}
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  };

  if (authLoading || loading) {
    return <FullPageLoader message="Loading fee vouchers..." />;
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Fee Vouchers</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage fee Vouchers for All Branches</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchAllVouchers}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => { resetForm(); setIsGenerateModalOpen(true); }}>
            <Plus className="w-4 h-4 mr-2" />
            Generate Vouchers
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleTabChange('all')}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-gray-600" />
              <span className="text-sm text-gray-600">All</span>
            </div>
            <div className="text-2xl font-bold mt-2">{statistics.all.count}</div>
            <div className="text-xs text-gray-500">PKR {statistics.all.totalAmount.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleTabChange('pending')}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-yellow-600" />
              <span className="text-sm text-gray-600">Pending</span>
            </div>
            <div className="text-2xl font-bold mt-2">{statistics.pending.count}</div>
            <div className="text-xs text-gray-500">PKR {statistics.pending.totalAmount.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleTabChange('partial')}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-blue-600" />
              <span className="text-sm text-gray-600">Partial</span>
            </div>
            <div className="text-2xl font-bold mt-2">{statistics.partial.count}</div>
            <div className="text-xs text-gray-500">PKR {statistics.partial.totalAmount.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleTabChange('overdue')}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <span className="text-sm text-gray-600">Overdue</span>
            </div>
            <div className="text-2xl font-bold mt-2">{statistics.overdue.count}</div>
            <div className="text-xs text-gray-500">PKR {statistics.overdue.totalAmount.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleTabChange('paid')}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="text-sm text-gray-600">Paid</span>
            </div>
            <div className="text-2xl font-bold mt-2">{statistics.paid.count}</div>
            <div className="text-xs text-gray-500">PKR {statistics.paid.totalAmount.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleTabChange('cancelled')}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <XCircle className="w-5 h-5 text-gray-600" />
              <span className="text-sm text-gray-600">Cancelled</span>
            </div>
            <div className="text-2xl font-bold mt-2">{statistics.cancelled.count}</div>
            <div className="text-xs text-gray-500">PKR {statistics.cancelled.totalAmount.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="space-y-6">
        <div className="flex flex-wrap gap-2 mb-4">
          <button onClick={() => handleTabChange('all')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'all' ? 'bg-primary text-white' : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
            All Vouchers
          </button>
          <button onClick={() => handleTabChange('pending')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'pending' ? 'bg-yellow-500 text-white' : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
            Pending
          </button>
          <button onClick={() => handleTabChange('partial')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'partial' ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
            Partial
          </button>
          <button onClick={() => handleTabChange('overdue')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'overdue' ? 'bg-red-500 text-white' : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
            Overdue
          </button>
          <button onClick={() => handleTabChange('paid')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'paid' ? 'bg-green-500 text-white' : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
            Paid
          </button>
          <button onClick={() => handleTabChange('cancelled')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'cancelled' ? 'bg-gray-500 text-white' : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
            Cancelled
          </button>
        </div>

        {/* Common Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Input 
                placeholder="Search by voucher #, student name, reg #..." 
                value={search} 
                onChange={(e) => setSearch(e.target.value)} 
                icon={Search} 
              />
              <Dropdown 
                placeholder="All Months" 
                value={monthFilter} 
                onChange={(e) => setMonthFilter(e.target.value)} 
                options={[{ value: '', label: 'All Months' }, ...MONTHS]} 
              />
              <Input 
                type="number" 
                placeholder="Year" 
                value={yearFilter} 
                onChange={(e) => setYearFilter(e.target.value)} 
              />
              <BranchSelect 
                value={branchFilter} 
                onChange={(e) => setBranchFilter(e.target.value)} 
                branches={branches} 
                placeholder="All Branches" 
              />
            </div>
          </CardContent>
        </Card>

        {/* Tab Panels */}
        <TabPanel value="all" activeTab={activeTab}>
          <Card>
            <CardHeader>
              <CardTitle>All Fee Vouchers ({statistics.all.count})</CardTitle>
            </CardHeader>
            <CardContent>
              <VoucherTable 
                vouchers={filteredAndCategorizedVouchers.all} 
                tabKey="all" 
              />
            </CardContent>
          </Card>
        </TabPanel>

        <TabPanel value="pending" activeTab={activeTab}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-yellow-600" />
                Pending Fee Vouchers ({statistics.pending.count})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <VoucherTable 
                vouchers={filteredAndCategorizedVouchers.pending} 
                tabKey="pending" 
              />
            </CardContent>
          </Card>
        </TabPanel>

        <TabPanel value="partial" activeTab={activeTab}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-blue-600" />
                Partially Paid Fee Vouchers ({statistics.partial.count})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <VoucherTable 
                vouchers={filteredAndCategorizedVouchers.partial} 
                tabKey="partial" 
              />
            </CardContent>
          </Card>
        </TabPanel>

        <TabPanel value="overdue" activeTab={activeTab}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                Overdue Fee Vouchers ({statistics.overdue.count})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <VoucherTable 
                vouchers={filteredAndCategorizedVouchers.overdue} 
                tabKey="overdue" 
              />
            </CardContent>
          </Card>
        </TabPanel>

        <TabPanel value="paid" activeTab={activeTab}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                Paid Fee Vouchers ({statistics.paid.count})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <VoucherTable 
                vouchers={filteredAndCategorizedVouchers.paid} 
                tabKey="paid" 
              />
            </CardContent>
          </Card>
        </TabPanel>

        <TabPanel value="cancelled" activeTab={activeTab}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <XCircle className="w-5 h-5 text-gray-600" />
                Cancelled Fee Vouchers ({statistics.cancelled.count})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <VoucherTable 
                vouchers={filteredAndCategorizedVouchers.cancelled} 
                tabKey="cancelled" 
              />
            </CardContent>
          </Card>
        </TabPanel>
      </div>

      {/* Generate Voucher Modal */}
      <Modal open={isGenerateModalOpen} onClose={() => setIsGenerateModalOpen(false)} title="Generate Fee Vouchers" size="lg">
        <form onSubmit={handleGenerateVouchers} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Generation Type *</Label>
              <Dropdown
                value={formData.generation_type}
                onChange={(e) => setFormData(prev => ({ ...prev, generation_type: e.target.value }))}
                options={[
                  { value: 'institute', label: 'Institute Wide (All Branches)' },
                  { value: 'branch', label: 'Branch Wise' },
                  { value: 'group', label: 'Group Wise' },
                  { value: 'class', label: 'Class Wise' },
                  { value: 'single', label: 'Single Student' },
                ]}
              />
            </div>

            <div>
              <Label>Due Date *</Label>
              <Input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
              />
            </div>

            {formData.generation_type !== 'institute' && (
              <div>
                <Label>Branch *</Label>
                <BranchSelect
                  value={formData.branchId}
                  onChange={(e) => setFormData(prev => ({ ...prev, branchId: e.target.value, academic_year_id: '', groupId: '', classId: '', sectionId: '' }))}
                  branches={branches}
                  placeholder="Select Branch"
                />
              </div>
            )}

            {formData.generation_type !== 'institute' && (
              <div>
                <Label>Academic Year *</Label>
                <Dropdown
                  value={formData.academic_year_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, academic_year_id: e.target.value, groupId: '', classId: '', sectionId: '' }))}
                  options={[
                    { value: '', label: 'Select Academic Year' },
                    ...academicYears.map(ay => ({ value: ay.id || ay._id, label: ay.name })),
                  ]}
                  disabled={!formData.branchId}
                />
              </div>
            )}

            {(formData.generation_type === 'group' || formData.generation_type === 'class') && (
              <div>
                <Label>Group *</Label>
                <Dropdown
                  value={formData.groupId}
                  onChange={(e) => setFormData(prev => ({ ...prev, groupId: e.target.value, classId: '', sectionId: '' }))}
                  options={[
                    { value: '', label: 'Select Group' },
                    ...groups.map(g => ({ value: g.id || g._id, label: g.name })),
                  ]}
                  disabled={!formData.branchId}
                />
              </div>
            )}

            {formData.generation_type === 'class' && (
              <div>
                <Label>Class *</Label>
                <Dropdown
                  value={formData.classId}
                  onChange={(e) => setFormData(prev => ({ ...prev, classId: e.target.value, sectionId: '' }))}
                  options={[
                    { value: '', label: 'Select Class' },
                    ...classes.filter(c => !formData.groupId || c.group_id === formData.groupId || c.group?.id === formData.groupId).map(c => ({ value: c.id || c._id, label: c.name })),
                  ]}
                  disabled={!formData.groupId}
                />
              </div>
            )}

            {(formData.generation_type === 'class') && formData.classId && (
              <div>
                <Label>Section (Optional)</Label>
                <Dropdown
                  value={formData.sectionId}
                  onChange={(e) => setFormData(prev => ({ ...prev, sectionId: e.target.value }))}
                  options={[
                    { value: '', label: 'All Sections' },
                    ...(classes.find(c => (c.id || c._id) === formData.classId)?.sections || []).map(s => ({ value: s.id || s._id, label: s.name }))
                  ]}
                />
              </div>
            )}

            {formData.generation_type === 'single' && (
              <div>
                <Label>Student *</Label>
                <Dropdown
                  value={formData.studentId}
                  onChange={(e) => setFormData(prev => ({ ...prev, studentId: e.target.value }))}
                  options={[
                    { value: '', label: 'Select Student' },
                    ...students.map(st => ({ value: st.id || st._id, label: `${st.first_name} ${st.last_name}` })),
                  ]}
                  disabled={!formData.branchId}
                />
              </div>
            )}
            <div>
              <Label>Month</Label>
              <Dropdown
                value={formData.month}
                onChange={(e) => setFormData(prev => ({ ...prev, month: e.target.value }))}
                options={MONTHS}
              />
            </div>
            <div>
              <Label>Year</Label>
              <Dropdown
                value={formData.year}
                onChange={(e) => setFormData(prev => ({ ...prev, year: e.target.value }))}
                options={YEARS}
              />
            </div>
          </div>
          <div>
            <Label>Remarks</Label>
            <Textarea
              value={formData.remarks}
              onChange={(e) => setFormData(prev => ({ ...prev, remarks: e.target.value }))}
              placeholder="Optional remarks..."
              rows={2}
            />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsGenerateModalOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? <ButtonLoader text="Generating..." /> : 'Generate Vouchers'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* View Voucher Modal */}
      <Modal open={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="Voucher Details" size="lg">
        {viewLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : viewingVoucher ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-500">Voucher Number</Label>
                <p className="font-semibold">{viewingVoucher.voucherNumber}</p>
              </div>
              <div>
                <Label className="text-gray-500">Status</Label>
                <p><span className={`px-2 py-1 rounded-full text-xs ${getStatusBadge(viewingVoucher.status)}`}>
                  {viewingVoucher.status?.toUpperCase()}
                </span></p>
              </div>
              <div>
                <Label className="text-gray-500">Student Name</Label>
                <p className="font-semibold">{formatStudent(viewingVoucher.studentId).name}</p>
              </div>
              <div>
                <Label className="text-gray-500">Registration No / Roll No</Label>
                <p className="font-semibold">{formatStudent(viewingVoucher.studentId).registrationNumber} / {formatStudent(viewingVoucher.studentId).rollNumber}</p>
              </div>
              <div>
                <Label className="text-gray-500">Branch</Label>
                <p>{viewingVoucher.branchId?.name || viewingVoucher.branch?.name || '---'}</p>
              </div>
              <div>
                <Label className="text-gray-500">Month / Year</Label>
                <p className="font-semibold">{MONTHS.find(m => m.value === viewingVoucher.month?.toString())?.label} {viewingVoucher.year}</p>
              </div>
              <div>
                <Label className="text-gray-500">Fee Type</Label>
                <p className="font-semibold">{viewingVoucher.feeType || viewingVoucher.fee_type || 'Monthly'}</p>
              </div>
              {(viewingVoucher.feeType === 'Installment' || viewingVoucher.fee_type === 'Installment') && (
                <div>
                  <Label className="text-gray-500">Installment No / Total</Label>
                  <p className="font-semibold">{viewingVoucher.installmentNo} / {viewingVoucher.totalInstallments}</p>
                </div>
              )}
              <div>
                <Label className="text-gray-500">Academic Year</Label>
                <p>{viewingVoucher.academicYear?.name || viewingVoucher.academic_year?.name || '---'}</p>
              </div>
              <div>
                <Label className="text-gray-500">Class / Section</Label>
                <p>{viewingVoucher.class?.name || '---'} {viewingVoucher.section?.name ? ` - ${viewingVoucher.section.name}` : ''}</p>
              </div>
              <div>
                <Label className="text-gray-500">Group</Label>
                <p>{groups.find(g => g.id === viewingVoucher.group || g._id === viewingVoucher.group)?.name || '---'}</p>
              </div>
              <div>
                <Label className="text-gray-500">Total Amount</Label>
                <p className="font-semibold">PKR {viewingVoucher.totalAmount?.toLocaleString()}</p>
              </div>
              <div>
                <Label className="text-gray-500">Due Date</Label>
                <p>{new Date(viewingVoucher.dueDate).toLocaleDateString('en-PK')}</p>
              </div>
              <div>
                <Label className="text-gray-500">Paid Amount</Label>
                <p className="font-semibold text-green-600">PKR {(viewingVoucher.paidAmount || 0).toLocaleString()}</p>
              </div>
              <div>
                <Label className="text-gray-500">Remaining Amount</Label>
                <p className="font-semibold text-blue-600">PKR {(viewingVoucher.remainingAmount || 0).toLocaleString()}</p>
              </div>
            </div>
            {viewingVoucher.paymentHistory?.length > 0 && (
              <div>
                <Label className="text-gray-500 mb-2 block">Payment History</Label>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Method</TableHead>
                        <TableHead>Remarks</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {viewingVoucher.paymentHistory.map((payment, idx) => (
                        <TableRow key={idx}>
                          <TableCell>{new Date(payment.date).toLocaleDateString('en-PK')}</TableCell>
                          <TableCell>PKR {payment.amount?.toLocaleString()}</TableCell>
                          <TableCell>{payment.method}</TableCell>
                          <TableCell>{payment.remarks || '---'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsViewModalOpen(false)}>Close</Button>
              <Button onClick={() => handleDownloadVoucher(viewingVoucher)}>
                <Download className="w-4 h-4 mr-2" />
                Download PDF
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>

      {/* Manual Payment Modal */}
      <Modal open={isManualPaymentModalOpen} onClose={() => setIsManualPaymentModalOpen(false)} title="Record Manual Payment" size="md">
        {selectedVoucherForPayment && (
          <div className="space-y-4">
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Voucher #:</span>
                  <span className="font-semibold ml-2">{selectedVoucherForPayment.voucherNumber}</span>
                </div>
                <div>
                  <span className="text-gray-500">Student:</span>
                  <span className="font-semibold ml-2">{formatStudent(selectedVoucherForPayment.studentId).name}</span>
                </div>
                <div>
                  <span className="text-gray-500">Total Amount:</span>
                  <span className="font-semibold ml-2">PKR {selectedVoucherForPayment.totalAmount?.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-gray-500">Remaining:</span>
                  <span className="font-semibold ml-2 text-blue-600">PKR {(selectedVoucherForPayment.remainingAmount || selectedVoucherForPayment.totalAmount)?.toLocaleString()}</span>
                </div>
              </div>
            </div>
            <div>
              <Label>Payment Amount (PKR) *</Label>
              <Input
                type="number"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder="Enter amount"
              />
            </div>
            <div>
              <Label>Remarks</Label>
              <Textarea
                value={paymentRemarks}
                onChange={(e) => setPaymentRemarks(e.target.value)}
                placeholder="Optional remarks..."
                rows={2}
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsManualPaymentModalOpen(false)}>Cancel</Button>
              <Button onClick={handleManualPayment} disabled={processingPayment}>
                {processingPayment ? <ButtonLoader text="Processing..." /> : 'Record Payment'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
      {isDeleteModalOpen && (
        <ConfirmDeleteModal
          title="Delete Fee Voucher"
          message="Are you sure you want to delete this fee voucher permanently? This action cannot be undone."
          onConfirm={confirmDeleteVoucher}
          onCancel={() => {
            setIsDeleteModalOpen(false);
            setDeletingVoucherId(null);
          }}
        />
      )}
    </div>
  );
}
