'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import Input from '@/components/ui/input';
import Dropdown from '@/components/ui/dropdown';
import Modal from '@/components/ui/modal';
import FullPageLoader from '@/components/ui/full-page-loader';
import ButtonLoader from '@/components/ui/button-loader';
import { Plus, Edit, Trash2, Search, DollarSign, Copy, Building2, ChevronDown } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import apiClient from '@/lib/api-client';
import { API_ENDPOINTS } from '@/constants/api-endpoints';
import { toast } from 'sonner';

const FEE_FREQUENCIES = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'semi-annually', label: 'Semi-Annually' },
  { value: 'annually', label: 'Annually' },
  { value: 'one-time', label: 'One-Time' },
];

export default function FeeTemplatesPage() {
  const { user } = useAuth();
  const [templates, setTemplates] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentTemplate, setCurrentTemplate] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 });
  const [classDropdownOpen, setClassDropdownOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    baseAmount: 0,
    description: '',
    items: [{ name: '', amount: '', discount: { enabled: false, type: 'fixed', amount: 0 } }],
    frequency: 'monthly',
    isActive: true,
    classes: [], // class IDs that this template applies to
    sections: [], // sections array
    applicableTo: 'all', // 'all', 'class-specific', 'student-specific'
    lateFee: { enabled: false, type: 'fixed', amount: '', graceDays: '' },
    discount: { enabled: false, type: 'fixed', amount: '', criteria: '' },
    paymentMethods: ['cash', 'bank-transfer', 'online'],
  });

  useEffect(() => {
    fetchTemplates();
    fetchClasses();
  }, [search, typeFilter, pagination.page]);

  // Close class dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (classDropdownOpen && !e.target.closest('.class-dropdown-container')) {
        setClassDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [classDropdownOpen]);

  const fetchClasses = async () => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.BRANCH_ADMIN.CLASSES.LIST, { limit: 200 });
      if (response.success) {
        setClasses(response.data.classes || []);
      }
    } catch (error) {
      console.error('Error fetching classes:', error);
      toast.error('Failed to load classes');
    }
  };

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        search,
      };
      if (typeFilter) params.frequency = typeFilter;

      const response = await apiClient.get(API_ENDPOINTS.BRANCH_ADMIN.FEE_TEMPLATES.LIST, params);
      if (response.success) {
        // Server returns { success: true, data: { templates, pagination } }
        setTemplates(response.data.templates || []);
        setPagination(response.data.pagination || { page: 1, limit: 10, total: 0, pages: 0 });
      }
    } catch (error) {
      // Enhanced error logging for debugging
      if (error && typeof error === 'object') {
        console.error('Error fetching templates:', error.message, error.response || error);
      } else {
        console.error('Error fetching templates:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Map front-end fields to the FeeTemplate schema
      const payload = {
        name: formData.name,
        code: (formData.code || '').toUpperCase(),
        description: formData.description,
        baseAmount: parseFloat(formData.baseAmount) || 0,
        items: formData.items.map(item => ({
          ...item,
          amount: parseFloat(item.amount) || 0,
          discount: {
            ...item.discount,
            amount: parseFloat(item.discount?.amount) || 0
          }
        })),
        frequency: formData.frequency,
        applicableTo: formData.applicableTo,
        classes: formData.applicableTo === 'class-specific' ? formData.classes : [],
        sections: formData.sections,
        lateFee: {
          enabled: formData.lateFee.enabled,
          type: formData.lateFee.type,
          amount: parseFloat(formData.lateFee.amount) || 0,
          graceDays: parseInt(formData.lateFee.graceDays) || 0,
        },
        discount: {
          enabled: formData.discount.enabled,
          type: formData.discount.type,
          amount: parseFloat(formData.discount.amount) || 0,
          criteria: formData.discount.criteria,
        },
        paymentMethods: formData.paymentMethods,
        status: formData.isActive ? 'active' : 'inactive',
      };

      if (isEditMode) {
        const response = await apiClient.put(
          API_ENDPOINTS.BRANCH_ADMIN.FEE_TEMPLATES.UPDATE.replace(':id', currentTemplate._id),
          payload
        );
        if (response.success) {
          toast.success('Fee template updated successfully!');
          setIsModalOpen(false);
          fetchTemplates();
        }
      } else {
        const response = await apiClient.post(API_ENDPOINTS.BRANCH_ADMIN.FEE_TEMPLATES.CREATE, payload);
        if (response.success) {
          toast.success('Fee template created successfully!');
          setIsModalOpen(false);
          fetchTemplates();
        }
      }
    } catch (error) {
      toast.error(error.message || 'Failed to save fee template');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (template) => {
    setCurrentTemplate(template);
    setFormData({
      name: template.name || '',
      code: template.code || '',
      baseAmount: template.baseAmount || 0,
      description: template.description || '',
      items: template.items?.length > 0 ? template.items.map(item => ({
        name: item.name,
        amount: item.amount.toString(),
        discount: item.discount || { enabled: false, type: 'fixed', amount: 0 }
      })) : [{ name: '', amount: '', discount: { enabled: false, type: 'fixed', amount: 0 } }],
      frequency: template.frequency || 'monthly',
      isActive: template.status === 'active',
      classes: template.classes?.map(c => c._id || c) || [],
      sections: template.sections || [],
      applicableTo: template.applicableTo || 'all',
      lateFee: template.lateFee || { enabled: false, type: 'fixed', amount: '', graceDays: '' },
      discount: template.discount || { enabled: false, type: 'fixed', amount: '', criteria: '' },
      paymentMethods: template.paymentMethods || ['cash', 'bank-transfer', 'online'],
    });
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this fee template?')) return;

    try {
      const response = await apiClient.delete(API_ENDPOINTS.BRANCH_ADMIN.FEE_TEMPLATES.DELETE.replace(':id', id));
      if (response.success) {
        toast.success('Fee template deleted successfully!');
        fetchTemplates();
      }
    } catch (error) {
      toast.error(error.message || 'Failed to delete fee template');
    }
  };

  const handleClone = (template) => {
    setCurrentTemplate(null);
    setFormData({
      name: template.name + ' (Copy)',
      code: (template.code || '') + '-COPY',
      baseAmount: template.baseAmount || 0,
      description: template.description || '',
      items: template.items?.length > 0 ? template.items.map(item => ({
        name: item.name,
        amount: item.amount.toString(),
        discount: item.discount || { enabled: false, type: 'fixed', amount: 0 }
      })) : [{ name: '', amount: '', discount: { enabled: false, type: 'fixed', amount: 0 } }],
      frequency: template.frequency || 'monthly',
      isActive: true,
      classes: template.classes?.map(c => c._id || c) || [],
      sections: template.sections || [],
      applicableTo: template.applicableTo || 'all',
      lateFee: template.lateFee || { enabled: false, type: 'fixed', amount: '', graceDays: '' },
      discount: template.discount || { enabled: false, type: 'fixed', amount: '', criteria: '' },
      paymentMethods: template.paymentMethods || ['cash', 'bank-transfer', 'online'],
    });
    setIsEditMode(false);
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setCurrentTemplate(null);
    setFormData({
      name: '',
      code: '',
      baseAmount: 0,
      description: '',
      items: [{ name: '', amount: '', discount: { enabled: false, type: 'fixed', amount: 0 } }],
      frequency: 'monthly',
      isActive: true,
      classes: [],
      sections: [],
      applicableTo: 'all',
      lateFee: { enabled: false, type: 'fixed', amount: '', graceDays: '' },
      discount: { enabled: false, type: 'fixed', amount: '', criteria: '' },
      paymentMethods: ['cash', 'bank-transfer', 'online'],
    });
    setIsEditMode(false);
    setIsModalOpen(true);
  };

  const calculateTotalAmount = (template) => {
    const base = parseFloat(template.baseAmount) || 0;
    const itemsTotal = (template.items || []).reduce((sum, item) => {
      let amt = parseFloat(item.amount) || 0;
      if (item.discount?.enabled) {
        if (item.discount.type === 'fixed') amt -= parseFloat(item.discount.amount) || 0;
        else amt -= (amt * (parseFloat(item.discount.amount) || 0)) / 100;
      }
      return sum + Math.max(0, amt);
    }, 0);
    return base + itemsTotal;
  };

  if (loading && templates.length === 0) {
    return <FullPageLoader message="Loading fee templates..." />;
  }

  return (
    <div className="p-6">
      <Card>
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Fee Templates Management</CardTitle>
              <p className="text-sm text-gray-500 mt-1">Create reusable fee structures and generate vouchers for students</p>
            </div>
            <div className="flex gap-2">
              <Link href="/branch-admin/fee-vouchers">
                <Button variant="outline">
                  <DollarSign className="w-4 h-4 mr-2" />
                  Generate Vouchers
                </Button>
              </Link>
              <Button onClick={handleAddNew}>
                <Plus className="w-4 h-4 mr-2" />
                Add Template
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <Input
              placeholder="Search templates..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              icon={Search}
            />
            <Dropdown
              placeholder="Filter by frequency"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              options={[{ value: '', label: 'All Frequencies' }, ...FEE_FREQUENCIES]}
            />
          </div>

          {/* Table */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Template Name</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Components</TableHead>
                <TableHead>Total Amount</TableHead>
                <TableHead>Frequency</TableHead>
                <TableHead>Late Fee</TableHead>
                <TableHead>Discount</TableHead>
                <TableHead>Applicable To</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {templates.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center text-gray-500">
                    No fee templates found
                  </TableCell>
                </TableRow>
              ) : (
                templates.map((template) => (
                  <TableRow key={template._id}>
                    <TableCell className="font-medium">{template.name}</TableCell>
                    <TableCell className="text-xs text-gray-600">{template.code}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {template.baseAmount > 0 && (
                          <div className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                            Base Amount: PKR {template.baseAmount.toLocaleString()}
                          </div>
                        )}
                        {template.items?.map((item, idx) => (
                          <div key={idx} className="text-[10px] text-gray-600 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100">
                            {item.name}: PKR {(item.amount || 0).toLocaleString()}
                            {item.discount?.enabled && (
                              <span className="text-green-600 ml-1">
                                (-{item.discount.type === 'percentage' ? `${item.discount.amount}%` : `PKR ${item.discount.amount}`})
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold">PKR {template.totalAmount?.toLocaleString() || '0'}</TableCell>
                    <TableCell>
                      <span className="capitalize">{template.frequency}</span>
                    </TableCell>
                    <TableCell>
                      {template.lateFee?.enabled ? (
                        <span className="text-xs text-orange-600">
                          {template.lateFee.type === 'percentage'
                            ? `${template.lateFee.amount}%`
                            : `PKR ${template.lateFee.amount}`}
                          {template.lateFee.graceDays > 0 && ` (${template.lateFee.graceDays}d grace)`}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">None</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {template.discount?.enabled ? (
                        <span className="text-xs text-green-600">
                          {template.discount.type === 'percentage'
                            ? `${template.discount.amount}%`
                            : `PKR ${template.discount.amount}`}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">None</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {template.applicableTo === 'class-specific' && template.classes?.length > 0 ? (
                        <span className="text-xs text-blue-600">
                          {template.classes.length} class{template.classes.length > 1 ? 'es' : ''}
                        </span>
                      ) : template.applicableTo === 'student-specific' ? (
                        <span className="text-xs text-orange-600">Student Specific</span>
                      ) : (
                        <span className="text-xs text-green-600">All Students</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${template.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                          }`}
                      >
                        {template.status === 'active' ? 'Active' : 'Inactive'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon-sm" onClick={() => handleClone(template)} title="Clone">
                          <Copy className="w-4 h-4" />
                        </Button>
                        {(() => {
                          const templateBranchId = template.branchId?._id || template.branchId;
                          if (templateBranchId && String(templateBranchId) === String(user?.branchId._id)) {
                            return (
                              <>
                                <Button variant="ghost" size="icon-sm" onClick={() => handleEdit(template)}>
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="icon-sm" onClick={() => handleDelete(template._id)}>
                                  <Trash2 className="w-4 h-4 text-red-600" />
                                </Button>
                              </>
                            );
                          }
                          return null;
                        })()}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          <div className="flex justify-between items-center mt-4">
            <div className="text-sm text-gray-600">
              Showing {templates.length} of {pagination.total} templates
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
                disabled={pagination.page === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
                disabled={pagination.page >= pagination.pages}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modal */}
      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={isEditMode ? 'Edit Fee Template' : 'Add New Fee Template'}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? <ButtonLoader /> : isEditMode ? 'Update' : 'Create'}
            </Button>
          </div>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Template Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border rounded-lg"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Template Code *</label>
              <input
                type="text"
                name="code"
                value={formData.code}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border rounded-lg"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border rounded-lg"
              rows="2"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Frequency *</label>
              <Dropdown
                name="frequency"
                value={formData.frequency}
                onChange={handleInputChange}
                options={FEE_FREQUENCIES}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Applicable To *</label>
              <Dropdown
                name="applicableTo"
                value={formData.applicableTo}
                onChange={handleInputChange}
                options={[
                  { value: 'all', label: 'All Students' },
                  { value: 'class-specific', label: 'Specific Classes' },
                  { value: 'student-specific', label: 'Student Specific' },
                ]}
              />
            </div>
          </div>

          {formData.applicableTo === 'class-specific' && (
            <div>
              <label className="block text-sm font-medium mb-1">Select Classes *</label>
              <div className="relative class-dropdown-container">
                <button
                  type="button"
                  onClick={() => setClassDropdownOpen(!classDropdownOpen)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-left bg-white hover:border-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                >
                    <span className="text-gray-700">
                      {formData.classes.length === 0
                        ? 'Select classes...'
                        : `${formData.classes.length} class${formData.classes.length > 1 ? 'es' : ''} selected`}
                    </span>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  </button>

                  {classDropdownOpen && (
                    <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {classes.length === 0 ? (
                        <div className="px-4 py-3 text-sm text-gray-500">No classes available</div>
                      ) : (
                        classes.map((cls) => {
                          const isSelected = formData.classes.includes(cls._id);
                          return (
                            <label
                              key={cls._id}
                              className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 cursor-pointer transition-colors"
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setFormData((prev) => ({
                                      ...prev,
                                      classes: [...prev.classes, cls._id],
                                    }));
                                  } else {
                                    setFormData((prev) => ({
                                      ...prev,
                                      classes: prev.classes.filter((id) => id !== cls._id),
                                    }));
                                  }
                                }}
                                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                              />
                              <div className="flex-1">
                                <div className="font-medium text-gray-900">{cls.name}</div>
                                <div className="text-xs text-gray-500">
                                  {cls.code} • {cls.grade?.name || 'N/A'}
                                </div>
                              </div>
                            </label>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>

                {/* Selected Classes Badges */}
                {formData.classes.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.classes.map((classId) => {
                      const cls = classes.find((c) => c._id === classId);
                      if (!cls) return null;
                      return (
                        <span
                          key={classId}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-md text-xs font-medium"
                        >
                          {cls.name}
                          <button
                            type="button"
                            onClick={() => {
                              setFormData((prev) => ({
                                ...prev,
                                classes: prev.classes.filter((id) => id !== classId),
                              }));
                            }}
                            className="hover:text-blue-900"
                          >
                            ×
                          </button>
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

          {/* Sections */}
          <div>
            <label className="block text-sm font-medium mb-1">Sections (Optional)</label>
            <input
              type="text"
              placeholder="Enter sections separated by commas (e.g., A, B, C)"
              value={Array.isArray(formData.sections) ? formData.sections.join(', ') : ''}
              onChange={(e) => {
                const sections = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                setFormData((prev) => ({ ...prev, sections }));
              }}
              className="w-full px-3 py-2 border rounded-lg"
            />
            <p className="text-xs text-gray-500 mt-1">Comma-separated list of sections</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Base Template Amount (Fixed)
            </label>
            <input
              type="number"
              value={formData.baseAmount}
              onChange={(e) => setFormData({ ...formData, baseAmount: e.target.value })}
              placeholder="0.00"
              className="w-full px-3 py-2 border rounded-lg"
            />
            <p className="text-[10px] text-gray-500 mt-1 italic">This amount will be added to the total regardless of components.</p>
          </div>

          {/* Fee Items/Components */}
          <div className="border border-gray-200 rounded-lg p-4 space-y-4 bg-gray-50/50">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-gray-900 flex items-center gap-2 text-sm">
                <DollarSign className="w-4 h-4 text-blue-600" />
                Fee Components
              </h3>
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={() => {
                  setFormData({
                    ...formData,
                    items: [...formData.items, { name: '', amount: '', discount: { enabled: false, type: 'fixed', amount: 0 } }]
                  });
                }}
                className="h-8 text-xs"
              >
                <Plus className="w-3 h-3 mr-1" /> Add Component
              </Button>
            </div>

            <div className="space-y-3">
              {formData.items.map((item, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-start bg-white p-3 rounded-md border border-gray-200 shadow-sm">
                  <div className="md:col-span-5">
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Component Name</label>
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) => {
                        const newItems = [...formData.items];
                        newItems[index].name = e.target.value;
                        setFormData({ ...formData, items: newItems });
                      }}
                      placeholder="e.g. Tuition Fee"
                      className="w-full px-3 py-1.5 border rounded-lg text-sm"
                    />
                  </div>
                  <div className="md:col-span-3">
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Amount</label>
                    <input
                      type="number"
                      value={item.amount}
                      onChange={(e) => {
                        const newItems = [...formData.items];
                        newItems[index].amount = e.target.value;
                        setFormData({ ...formData, items: newItems });
                      }}
                      placeholder="0.00"
                      className="w-full px-3 py-1.5 border rounded-lg text-sm"
                    />
                  </div>
                  <div className="md:col-span-3">
                    <div className="flex items-center gap-2 mb-1">
                      <input
                        type="checkbox"
                        checked={item.discount?.enabled}
                        onChange={(e) => {
                          const newItems = [...formData.items];
                          newItems[index].discount.enabled = e.target.checked;
                          setFormData({ ...formData, items: newItems });
                        }}
                        className="w-3 h-3 text-blue-600 rounded"
                      />
                      <label className="text-[10px] font-bold text-gray-500 uppercase">Discount</label>
                    </div>
                    {item.discount?.enabled && (
                      <div className="flex gap-1">
                        <select
                          value={item.discount.type}
                          onChange={(e) => {
                            const newItems = [...formData.items];
                            newItems[index].discount.type = e.target.value;
                            setFormData({ ...formData, items: newItems });
                          }}
                          className="text-[10px] border border-gray-300 rounded px-1 h-7 bg-gray-50"
                        >
                          <option value="fixed">PKR</option>
                          <option value="percentage">%</option>
                        </select>
                        <input
                          type="number"
                          value={item.discount.amount}
                          onChange={(e) => {
                            const newItems = [...formData.items];
                            newItems[index].discount.amount = e.target.value;
                            setFormData({ ...formData, items: newItems });
                          }}
                          className="w-full px-2 py-1 border rounded text-[10px] h-7"
                          placeholder="0"
                        />
                      </div>
                    )}
                  </div>
                  <div className="md:col-span-1 pt-5">
                    {formData.items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          const newItems = formData.items.filter((_, i) => i !== index);
                          setFormData({ ...formData, items: newItems });
                        }}
                        className="text-red-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex justify-end pt-2 border-t border-gray-200">
              <div className="text-right">
                <p className="text-[10px] font-bold text-gray-500 uppercase">Total Template Amount</p>
                <p className="text-lg font-black text-blue-600">
                  PKR {calculateTotalAmount(formData).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* Info Alert */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex gap-2">
              <div className="text-blue-600 mt-0.5">ℹ️</div>
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">About Fee Vouchers:</p>
                <p>This template will be used to generate fee vouchers. The <strong>due date</strong> will be assigned when you generate vouchers for students, not in this template. Late fees will be automatically calculated based on the voucher's due date.</p>
              </div>
            </div>
          </div>

          {/* Late Fee Settings */}
          <div className="border rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Late Fee Settings</h3>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.lateFee && typeof formData.lateFee === 'object' ? formData.lateFee.enabled : false}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    lateFee: { ...prev.lateFee, enabled: e.target.checked }
                  }))}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="text-sm">Enable Late Fee</span>
              </label>
            </div>

            {formData.lateFee && typeof formData.lateFee === 'object' && formData.lateFee.enabled && (
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Type</label>
                  <Dropdown
                    value={formData.lateFee.type}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      lateFee: { ...prev.lateFee, type: e.target.value }
                    }))}
                    options={[
                      { value: 'fixed', label: 'Fixed Amount' },
                      { value: 'percentage', label: 'Percentage' },
                    ]}
                    placeholder="Select Type"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Amount {formData.lateFee.type === 'percentage' && '(%)'}
                  </label>
                  <input
                    type="number"
                    value={formData.lateFee.amount}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      lateFee: { ...prev.lateFee, amount: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border rounded-lg"
                    min="0"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Grace Days</label>
                  <input
                    type="number"
                    value={formData.lateFee.graceDays}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      lateFee: { ...prev.lateFee, graceDays: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border rounded-lg"
                    min="0"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Discount Settings */}
          <div className="border rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Discount Settings</h3>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.discount && typeof formData.discount === 'object' ? formData.discount.enabled : false}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    discount: { ...prev.discount, enabled: e.target.checked }
                  }))}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="text-sm">Enable Discount</span>
              </label>
            </div>

            {formData.discount && typeof formData.discount === 'object' && formData.discount.enabled && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Type</label>
                      <Dropdown
                        value={formData.discount.type}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          discount: { ...prev.discount, type: e.target.value }
                        }))}
                        options={[
                          { value: 'fixed', label: 'Fixed Amount' },
                          { value: 'percentage', label: 'Percentage' },
                        ]}
                        placeholder="Select Type"
                      />
                    </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Amount {formData.discount.type === 'percentage' && '(%)'}
                    </label>
                    <input
                      type="number"
                      value={formData.discount.amount}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        discount: { ...prev.discount, amount: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border rounded-lg"
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Discount Criteria</label>
                  <textarea
                    value={formData.discount.criteria}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      discount: { ...prev.discount, criteria: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border rounded-lg"
                    rows="2"
                    placeholder="e.g., Early payment discount, Sibling discount"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Payment Methods */}
          <div>
            <label className="block text-sm font-medium mb-2">Payment Methods *</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {['cash', 'bank-transfer', 'online', 'cheque', 'card'].map(method => (
                <label key={method} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.paymentMethods.includes(method)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFormData(prev => ({
                          ...prev,
                          paymentMethods: [...prev.paymentMethods, method]
                        }));
                      } else {
                        setFormData(prev => ({
                          ...prev,
                          paymentMethods: prev.paymentMethods.filter(m => m !== method)
                        }));
                      }
                    }}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="text-sm capitalize">{method.replace('-', ' ')}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              name="isActive"
              checked={formData.isActive}
              onChange={handleInputChange}
              className="w-4 h-4"
            />
            <label className="text-sm font-medium">Active Template</label>
          </div>
        </form>
      </Modal>
    </div>
  );
}
