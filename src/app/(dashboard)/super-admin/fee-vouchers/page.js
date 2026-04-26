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
  
  // Dropdown data
  const [branches, setBranches] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [studentDropdownOpen, setStudentDropdownOpen] = useState(false);
  
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
    if (authLoading || !user) return;
    fetchAllVouchers();
    fetchBranches();
  }, [authLoading, user]);

  // Load templates/classes when branch changes in form
  useEffect(() => {
    if (formData.branchId) {
      fetchTemplates();
      fetchClasses();
    } else {
      setTemplates([]);
      setClasses([]);
    }
  }, [formData.branchId]);

  useEffect(() => {
    if (formData.classId) fetchStudents();
  }, [formData.classId]);

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
      const res = await apiClient.get(API_ENDPOINTS.SUPER_ADMIN.FEE_TEMPLATES.LIST, { 
        branchId: formData.branchId, 
        limit: 200, 
        status: 'active' 
      });
      console.log('Templates response:', res);
      if (res?.success) {
        // Handle different response structures
        const templatesData = res.data?.templates || res.data?.data || res.data || [];
        console.log('Templates data:', templatesData);
        setTemplates(Array.isArray(templatesData) ? templatesData : []);
      } else {
        console.error('Templates API returned success false:', res);
        toast.error('Failed to load fee templates');
      }
    } catch (err) {
      console.error('Error loading templates:', err);
      toast.error('Failed to load templates');
    }
  };

  const fetchClasses = async () => {
    if (!formData.branchId) return;
    try {
      const res = await apiClient.get(API_ENDPOINTS.SUPER_ADMIN.CLASSES.LIST, { 
        branchId: formData.branchId, 
        limit: 200 
      });
      if (res?.success) {
        // Handle different response structures
        const classesData = res.data?.classes || res.data || [];
        setClasses(Array.isArray(classesData) ? classesData : []);
      }
    } catch (err) {
      console.error('Error loading classes:', err);
    }
  };

  const fetchStudents = async () => {
    try {
      const params = { limit: 500, classId: formData.classId, branchId: formData.branchId };
      const res = await apiClient.get(API_ENDPOINTS.SUPER_ADMIN.STUDENTS.LIST, params);
      if (res?.success) setStudents(res.data.students || []);
    } catch (err) {
      console.error('Error loading students:', err);
      toast.error('Failed to load students');
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
      filtered = filtered.filter(v => v.month.toString() === monthFilter);
    }

    // Apply year filter
    if (yearFilter) {
      filtered = filtered.filter(v => v.year.toString() === yearFilter);
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
      if (!formData.branchId) return toast.error('Please select a branch');
      if (!formData.templateId) return toast.error('Please select a fee template');
      if (!formData.dueDate) return toast.error('Please select a due date');

      const payload = {
        branchId: formData.branchId,
        templateId: formData.templateId,
        dueDate: formData.dueDate,
        month: parseInt(formData.month),
        year: parseInt(formData.year),
        remarks: formData.remarks,
      };

      if (formData.studentIds.length > 0 || formData.selectAllStudents) {
        const studentIds = formData.selectAllStudents ? students.map(s => s._id) : formData.studentIds;
        payload.studentIds = studentIds;
      }

      const res = await apiClient.post(API_ENDPOINTS.SUPER_ADMIN.FEE_VOUCHERS.CREATE, payload);
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

    setProcessingPayment(true);
    try {
      const res = await apiClient.post(
        API_ENDPOINTS.SUPER_ADMIN.FEE_VOUCHERS.MANUAL_PAYMENT.replace(':id', selectedVoucherForPayment._id),
        {
          amount: parseFloat(paymentAmount),
          remarks: paymentRemarks,
          paymentMethod: 'cash',
        }
      );

      if (res?.success) {
        toast.success('Payment recorded successfully');
        setIsManualPaymentModalOpen(false);
        setSelectedVoucherForPayment(null);
        setPaymentAmount('');
        setPaymentRemarks('');
        fetchAllVouchers(); // Refresh data
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
                <TableHead>Template</TableHead>
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
                          Reg: {registrationNumber} | Roll: {rollNumber} | Sec: {section}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{voucher.templateId?.name || '---'}</div>
                      <div className="text-xs text-gray-500">{voucher.templateId?.code || '---'}</div>
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
                        <Button variant="ghost" size="icon-sm" title="View" onClick={() => handleViewVoucher(voucher._id)}>
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
                            <Button variant="ghost" size="icon-sm" title="Cancel" onClick={() => handleCancelVoucher(voucher._id)}>
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
              <Label>Branch *</Label>
              <BranchSelect
                value={formData.branchId}
                onChange={(e) => setFormData(prev => ({ ...prev, branchId: e.target.value }))}
                branches={branches}
                placeholder="Select Branch"
              />
            </div>
            <div>
              <Label>Fee Template *</Label>
              <Dropdown
                value={formData.templateId}
                onChange={(e) => setFormData(prev => ({ ...prev, templateId: e.target.value }))}
                options={templates.map(t => ({ value: t._id, label: t.name }))}
                placeholder="Select Template"
                disabled={!formData.branchId}
              />
            </div>
            <div>
              <Label>Class (Optional)</Label>
              <Dropdown
                value={formData.classId}
                onChange={(e) => setFormData(prev => ({ ...prev, classId: e.target.value }))}
                options={[{ value: '', label: 'All Classes' }, ...classes.map(c => ({ value: c._id, label: c.name }))]}
                placeholder="Select Class"
                disabled={!formData.branchId}
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
              <Input
                type="number"
                value={formData.year}
                onChange={(e) => setFormData(prev => ({ ...prev, year: e.target.value }))}
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
                <Label className="text-gray-500">Student</Label>
                <p className="font-semibold">{formatStudent(viewingVoucher.studentId).name}</p>
              </div>
              <div>
                <Label className="text-gray-500">Branch</Label>
                <p>{viewingVoucher.branchId?.name}</p>
              </div>
              <div>
                <Label className="text-gray-500">Total Amount</Label>
                <p className="font-semibold">PKR {viewingVoucher.totalAmount?.toLocaleString()}</p>
              </div>
              <div>
                <Label className="text-gray-500">Due Date</Label>
                <p>{new Date(viewingVoucher.dueDate).toLocaleDateString('en-PK')}</p>
              </div>
              {viewingVoucher.status === 'partial' && (
                <>
                  <div>
                    <Label className="text-gray-500">Paid Amount</Label>
                    <p className="font-semibold text-green-600">PKR {viewingVoucher.paidAmount?.toLocaleString()}</p>
                  </div>
                  <div>
                    <Label className="text-gray-500">Remaining</Label>
                    <p className="font-semibold text-blue-600">PKR {viewingVoucher.remainingAmount?.toLocaleString()}</p>
                  </div>
                </>
              )}
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
    </div>
  );
}
