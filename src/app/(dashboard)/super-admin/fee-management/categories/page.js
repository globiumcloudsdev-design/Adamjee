'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, Tag, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';

import apiClient from '@/lib/api-client';
import { API_ENDPOINTS } from '@/constants/api-endpoints';
import Input from '@/components/ui/input';
import BranchSelect from '@/components/ui/branch-select';
import Dropdown from '@/components/ui/dropdown';
import { Button } from '@/components/ui/button';
import Modal from '@/components/ui/modal';
import FullPageLoader from '@/components/ui/full-page-loader';
import ButtonLoader from '@/components/ui/button-loader';
import Table, { TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const COLOR_OPTIONS = [
    { value: 'blue', label: 'Blue', class: 'bg-blue-100 text-blue-700 border-blue-200' },
    { value: 'green', label: 'Green', class: 'bg-green-100 text-green-700 border-green-200' },
    { value: 'purple', label: 'Purple', class: 'bg-purple-100 text-purple-700 border-purple-200' },
    { value: 'yellow', label: 'Yellow', class: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
    { value: 'pink', label: 'Pink', class: 'bg-pink-100 text-pink-700 border-pink-200' },
    { value: 'indigo', label: 'Indigo', class: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
    { value: 'orange', label: 'Orange', class: 'bg-orange-100 text-orange-700 border-orange-200' },
    { value: 'red', label: 'Red', class: 'bg-red-100 text-red-700 border-red-200' },
    { value: 'gray', label: 'Gray', class: 'bg-gray-100 text-gray-700 border-gray-200' },
];

const ICON_OPTIONS = [
    { value: 'book', label: 'Book 📚' },
    { value: 'graduation-cap', label: 'Graduation Cap 🎓' },
    { value: 'bus', label: 'Bus 🚌' },
    { value: 'library', label: 'Library 📖' },
    { value: 'flask', label: 'Flask 🧪' },
    { value: 'sports', label: 'Sports ⚽' },
    { value: 'home', label: 'Home 🏠' },
    { value: 'document', label: 'Document 📄' },
    { value: 'dollar', label: 'Dollar 💵' },
];

export default function FeeCategoriesPage() {
    const [categories, setCategories] = useState([]);
    const [branches, setBranches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [branchFilter, setBranchFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [categoryToDelete, setCategoryToDelete] = useState(null);

    const [formData, setFormData] = useState({
        name: '',
        code: '',
        description: '',
        color: 'blue',
        icon: 'book',
        isActive: true,
        branchId: '',
    });

    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        loadData();
    }, [searchTerm, branchFilter, statusFilter]);

    const loadData = async () => {
        try {
            setLoading(true);
            await Promise.all([loadCategories(), loadBranches()]);
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadCategories = async () => {
        try {
            const params = {};
            if (searchTerm) params.search = searchTerm;
            if (branchFilter) params.branchId = branchFilter;
            if (statusFilter) params.isActive = statusFilter === 'active';

            const res = await apiClient.get(API_ENDPOINTS.SUPER_ADMIN.FEE_CATEGORIES.LIST, params);

            if (res && res.success) {
                setCategories(res.data);
            } else {
                toast.error(res?.message || 'Failed to load fee categories');
            }
        } catch (error) {
            console.error('Error loading categories:', error);
            toast.error(error?.message || 'Failed to load fee categories');
        }
    };

    const loadBranches = async () => {
        try {
            const res = await apiClient.get(API_ENDPOINTS.SUPER_ADMIN.BRANCHES.LIST, { limit: 100 });
            if (res && res.success) {
                setBranches(res.data.branches);
            }
        } catch (error) {
            console.error('Error loading branches:', error);
            toast.error(error?.message || 'Failed to load branches');
        }
    };

    const handleAddNew = () => {
        setEditingCategory(null);
        setFormData({
            name: '',
            code: '',
            description: '',
            color: 'blue',
            icon: 'book',
            isActive: true,
            branchId: '',
        });
        setShowModal(true);
    };

    const handleEdit = (category) => {
        setEditingCategory(category);
        setFormData({
            name: category.name,
            code: category.code,
            description: category.description || '',
            color: category.color || 'blue',
            icon: category.icon || 'book',
            isActive: category.isActive !== false,
            branchId: category.branchId?._id || category.branchId || '',
        });
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.name || !formData.code) {
            toast.error('Please fill in all required fields');
            return;
        }

        setSubmitting(true);
        try {
            const payload = {
                ...formData,
                branchId: formData.branchId || null,
            };

            let response;
            if (editingCategory) {
                response = await apiClient.put(
                    API_ENDPOINTS.SUPER_ADMIN.FEE_CATEGORIES.UPDATE.replace(':id', editingCategory._id),
                    payload
                );
            } else {
                response = await apiClient.post(API_ENDPOINTS.SUPER_ADMIN.FEE_CATEGORIES.CREATE, payload);
            }

            if (response && response.success) {
                toast.success(`Fee category ${editingCategory ? 'updated' : 'created'} successfully`);
                setShowModal(false);
                loadCategories();
            } else {
                toast.error(response?.message || `Failed to ${editingCategory ? 'update' : 'create'} category`);
            }
        } catch (error) {
            console.error('Error submitting category:', error);
            toast.error(error?.message || `Failed to ${editingCategory ? 'update' : 'create'} category`);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteClick = (category) => {
        setCategoryToDelete(category);
        setShowDeleteModal(true);
    };

    const handleDelete = async () => {
        if (!categoryToDelete) return;

        try {
            const response = await apiClient.delete(
                API_ENDPOINTS.SUPER_ADMIN.FEE_CATEGORIES.DELETE.replace(':id', categoryToDelete._id)
            );

            if (response && response.success) {
                toast.success('Fee category archived successfully');
                setShowDeleteModal(false);
                setCategoryToDelete(null);
                loadCategories();
            } else {
                toast.error(response?.message || 'Failed to archive category');
            }
        } catch (error) {
            console.error('Error archiving category:', error);
            toast.error(error?.message || 'Failed to archive category');
        }
    };

    const getColorClass = (color) => {
        return COLOR_OPTIONS.find(c => c.value === color)?.class || COLOR_OPTIONS[0].class;
    };

    if (loading) {
        return <FullPageLoader />;
    }

    return (
        <div className="p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Fee Categories</h1>
                    <p className="text-gray-600 mt-1">Manage fee categories for your coaching system</p>
                </div>
                <Button onClick={handleAddNew}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Category
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white p-4 rounded-lg border">
                    <div className="flex items-center">
                        <Tag className="w-8 h-8 text-blue-600" />
                        <div className="ml-3">
                            <p className="text-sm text-gray-600">Total Categories</p>
                            <p className="text-2xl font-bold text-gray-900">{categories.length}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-lg border">
                    <div className="flex items-center">
                        <CheckCircle className="w-8 h-8 text-green-600" />
                        <div className="ml-3">
                            <p className="text-sm text-gray-600">Active</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {categories.filter(c => c.isActive).length}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-lg border">
                    <div className="flex items-center">
                        <XCircle className="w-8 h-8 text-red-600" />
                        <div className="ml-3">
                            <p className="text-sm text-gray-600">Inactive</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {categories.filter(c => !c.isActive).length}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-lg border">
                    <div className="flex items-center">
                        <Tag className="w-8 h-8 text-purple-600" />
                        <div className="ml-3">
                            <p className="text-sm text-gray-600">Coaching-wide</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {categories.filter(c => !c.branchId).length}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-lg border mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Input
                        placeholder="Search categories..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        icon={Search}
                    />
                    <BranchSelect
                        value={branchFilter}
                        onChange={(e) => setBranchFilter(e.target.value)}
                        branches={branches}
                        placeholder="All Branches"
                    />
                    <Dropdown
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        options={[
                            { value: '', label: 'All Status' },
                            { value: 'active', label: 'Active' },
                            { value: 'inactive', label: 'Inactive' },
                        ]}
                    />
                </div>
            </div>

            {/* Categories Table */}
            <div className="bg-white rounded-lg border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Category</TableHead>
                            <TableHead>Code</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Branch</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {categories.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                                    No categories found
                                </TableCell>
                            </TableRow>
                        ) : (
                            categories.map((category) => (
                                <TableRow key={category._id}>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <span className={`px-3 py-1 rounded-lg border ${getColorClass(category.color)}`}>
                                                {category.name}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <span className="font-mono text-sm">{category.code}</span>
                                    </TableCell>
                                    <TableCell>
                                        <span className="text-sm text-gray-600">{category.description || '-'}</span>
                                    </TableCell>
                                    <TableCell>
                                        {category.branchId?.name || (
                                            <span className="text-purple-600 font-medium">Coaching-wide</span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {category.isActive ? (
                                            <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-700">
                                                Active
                                            </span>
                                        ) : (
                                            <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700">
                                                Inactive
                                            </span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex gap-2">
                                            <Button variant="ghost" size="sm" onClick={() => handleEdit(category)}>
                                                <Edit className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleDeleteClick(category)}
                                            >
                                                <Trash2 className="w-4 h-4 text-red-600" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Add/Edit Modal */}
            <Modal
                open={showModal}
                onClose={() => setShowModal(false)}
                title={editingCategory ? 'Edit Fee Category' : 'Add Fee Category'}
                footer={
                    <div className="flex gap-2 pt-4 justify-end">
                        <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={submitting}>
                            {submitting ? <ButtonLoader /> : editingCategory ? 'Update' : 'Create'}
                        </Button>
                    </div>
                }
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">
                            Category Name <span className="text-red-500">*</span>
                        </label>
                        <Input
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="e.g., Tuition Fee"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">
                            Code <span className="text-red-500">*</span>
                        </label>
                        <Input
                            value={formData.code}
                            onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                            placeholder="e.g., TUITION"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Description</label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Optional description"
                            className="w-full px-3 py-2 border rounded-lg"
                            rows={2}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Color</label>
                            <Dropdown
                                value={formData.color}
                                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                                options={COLOR_OPTIONS}
                            />
                            <div className={`mt-2 px-3 py-1 rounded-lg border inline-block ${getColorClass(formData.color)}`}>
                                Preview
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Icon</label>
                            <Dropdown
                                value={formData.icon}
                                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                                options={ICON_OPTIONS}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Branch (optional)</label>
                        <BranchSelect
                            value={formData.branchId}
                            onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}
                            branches={branches}
                            placeholder="Coaching-wide (all branches)"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Leave empty to make this category available to all branches
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="isActive"
                            checked={formData.isActive}
                            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                            className="w-4 h-4"
                        />
                        <label htmlFor="isActive" className="text-sm font-medium">
                            Active
                        </label>
                    </div>
                </form>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                title="Archive Fee Category"
            >
                <div className="space-y-4">
                    <p>Are you sure you want to archive this category?</p>
                    <p className="font-medium">{categoryToDelete?.name}</p>
                    <div className="flex gap-2 pt-4">
                        <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                            Archive
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
