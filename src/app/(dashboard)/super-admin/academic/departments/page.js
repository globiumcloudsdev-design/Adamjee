'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import apiClient from '@/lib/api-client';
import { toast } from 'sonner';
import { Briefcase, Plus, Search, Edit, Trash2, X, Users, Mail, Phone } from 'lucide-react';
import Input from '@/components/ui/input';
import Dropdown from '@/components/ui/dropdown';
import Modal from '@/components/ui/modal';
import Table, { TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import API_ENDPOINTS from '@/constants/api-endpoints';

export default function DepartmentsPage() {
  const { user } = useAuth();
  const [departments, setDepartments] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingDept, setEditingDept] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    branchId: '',
    officeLocation: '',
    status: 'active',
  });

  const [stats, setStats] = useState({ total: 0, active: 0 });

  useEffect(() => {
    fetchDepartments();
    fetchBranches();
  }, [searchTerm, selectedBranch]);

  const branchOptions = branches.map((b) => ({ value: b._id, label: b.name }));

  const handleFormChange = (e) => {
    const { name, value } = e.target || {};
    if (!name) return;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        limit: '100',
        ...(searchTerm && { search: searchTerm }),
        ...(selectedBranch && { branchId: selectedBranch }),
      });

      // const response = await apiClient.get(`/api/super-admin/departments?${params}`);
      const response = await apiClient.get(`${API_ENDPOINTS.SUPER_ADMIN.DEPARTMENTS.LIST}?${params}`);

      if (response?.success) {
        const depts = response.data || response.data?.departments || [];
        setDepartments(depts);
        setStats({
          total: depts.length,
          active: depts.filter((d) => d.status === 'active').length,
        });
      }
    } catch (error) {
      toast.error('Failed to fetch departments');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBranches = async () => {
    try {
      // const response = await apiClient.get('/api/super-admin/branches?limit=100');
      const response = await apiClient.get(`${API_ENDPOINTS.SUPER_ADMIN.BRANCHES.LIST}?limit=100`);
      if (response?.success) {
        const branchesData = response.data?.branches || response.data || [];
        setBranches(branchesData);
      }
    } catch (error) {
      console.error('Failed to fetch branches:', error);
    }
  };

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();

    try {
      if (!formData.name || !formData.code || !formData.branchId) {
        toast.error('Please provide name, code and branch');
        return;
      }
      const payload = { ...formData, code: formData.code.toUpperCase() };

      if (editingDept) {
        // const response = await apiClient.put(`/api/super-admin/departments/${editingDept._id}`, payload);
        const response = await apiClient.put(`${API_ENDPOINTS.SUPER_ADMIN.DEPARTMENTS.DETAIL.replace('{id}', editingDept._id)}`, payload);
        if (response?.success) {
          toast.success('Department updated successfully');
          fetchDepartments();
          handleCloseModal();
        } else {
          toast.error(response?.message || 'Failed to update department');
        }
      } else {
        // const response = await apiClient.post('/api/super-admin/departments', payload);
        const response = await apiClient.post(`${API_ENDPOINTS.SUPER_ADMIN.DEPARTMENTS.LIST}`, payload);
        if (response?.success) {
          toast.success('Department created successfully');
          fetchDepartments();
          handleCloseModal();
        } else {
          toast.error(response?.message || 'Failed to create department');
        }
      }
    } catch (error) {
      toast.error(error.message || 'Failed to save department');
      console.error(error);
    }
  };

  const handleEdit = (dept) => {
    setEditingDept(dept);
    setFormData({
      name: dept.name || '',
      code: dept.code || '',
      description: dept.description || '',
      branchId: dept.branchId?._id || '',
      officeLocation: dept.officeLocation || '',
      status: dept.status || 'active',
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure?')) return;
    try {
      // const response = await apiClient.delete(`/api/super-admin/departments/${id}`);
      const response = await apiClient.delete(`${API_ENDPOINTS.SUPER_ADMIN.DEPARTMENTS.DETAIL.replace('{id}', id)}`);
      if (response.success) {
        toast.success('Department archived successfully');
        fetchDepartments();
      }
    } catch (error) {
      toast.error(error.message || 'Failed to delete department');
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingDept(null);
    setFormData({
      name: '',
      code: '',
      description: '',
      branchId: '',
      email: '',
      phone: '',
      officeLocation: '',
      status: 'active',
    });
  };

  return (
    <div className="p-6">
      <div className="mb-6 pt-8">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Briefcase className="h-7 w-7" />
          Department Management
        </h1>
        <p className="text-gray-600 mt-1">Manage academic departments</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Departments</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <Briefcase className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active</p>
              <p className="text-2xl font-bold text-green-600">{stats.active}</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <Briefcase className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search departments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="w-64">
            <Dropdown
              name="selectedBranch"
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              options={[{ value: '', label: 'All Branches' }, ...branchOptions]}
              placeholder="All Branches"
            />
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 whitespace-nowrap"
          >
            <Plus className="h-5 w-5" />
            Add Department
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : departments.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No departments found</div>
        ) : (
          <Table>
            <TableHeader>
              <tr className="bg-gray-50">
                <TableHead>Department</TableHead>
                <TableHead>Branch</TableHead>
                <TableHead>Branch</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </tr>
            </TableHeader>
            <TableBody>
              {departments.map((dept) => (
                <TableRow key={dept._id}>
                  <TableCell>
                    <div>
                      <div className="text-sm font-medium text-gray-900">{dept.name}</div>
                      <div className="text-sm text-gray-500">{dept.code}</div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-gray-900">{dept.branchId?.name}</TableCell>
                  <TableCell className="text-sm text-gray-900">{dept.branchId?.name}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      dept.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {dept.status.charAt(0).toUpperCase() + dept.status.slice(1)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <button onClick={() => handleEdit(dept)} className="text-blue-600 hover:text-blue-900">
                        <Edit className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleDelete(dept._id)} className="text-red-600 hover:text-red-900">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <Modal
        open={showModal}
        onClose={handleCloseModal}
        title={editingDept ? 'Edit Department' : 'Add New Department'}
        footer={(
          <div className="flex justify-end gap-3">
            <button type="button" onClick={handleCloseModal} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">Cancel</button>
            <button type="button" onClick={() => handleSubmit()} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">{editingDept ? 'Update' : 'Add'} Department</button>
          </div>
        )}
        footerClassName="mt-0"
        size="md"
      >
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Input name="name" label="Name *" placeholder="Enter department name" required value={formData.name} onChange={handleFormChange} />
            </div>

            <div>
              <Input name="code" label="Code *" placeholder="E.g., CSE" required value={formData.code} onChange={handleFormChange} />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => handleFormChange({ target: { name: 'description', value: e.target.value } })}
                rows="2"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Branch *</label>
              <Dropdown
                name="branchId"
                value={formData.branchId}
                onChange={handleFormChange}
                options={[{ value: '', label: 'Select Branch' }, ...branchOptions]}
              />
            </div>

            <div>
              <Input name="officeLocation" label="Office Location" placeholder="Building / Room (optional)" value={formData.officeLocation} onChange={handleFormChange} />
            </div>

            <div>
              <Dropdown name="status" value={formData.status} onChange={handleFormChange} options={[{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }]} />
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
