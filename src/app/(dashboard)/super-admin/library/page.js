'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import Input from '@/components/ui/input';
import Dropdown from '@/components/ui/dropdown';
import Modal from '@/components/ui/modal';
import FullPageLoader from '@/components/ui/full-page-loader';
import ButtonLoader from '@/components/ui/button-loader';
import { Plus, Edit, Trash2, Search, BookOpen, Eye, FileText, Upload, X, Calendar, MapPin, Download, Building2, CheckCircle, Library as LibraryIcon } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import apiClient from '@/lib/api-client';
import { API_ENDPOINTS } from '@/constants/api-endpoints';
import { toast } from 'sonner';

const BOOK_CATEGORIES = [
  { value: 'Fiction', label: 'Fiction' },
  { value: 'Non-Fiction', label: 'Non-Fiction' },
  { value: 'Science', label: 'Science' },
  { value: 'Mathematics', label: 'Mathematics' },
  { value: 'English', label: 'English' },
  { value: 'Urdu', label: 'Urdu' },
  { value: 'Islamiyat', label: 'Islamiyat' },
  { value: 'Social Studies', label: 'Social Studies' },
  { value: 'Computer Science', label: 'Computer Science' },
  { value: 'Physics', label: 'Physics' },
  { value: 'Chemistry', label: 'Chemistry' },
  { value: 'Biology', label: 'Biology' },
  { value: 'Commerce', label: 'Commerce' },
  { value: 'Arts', label: 'Arts' },
  { value: 'History', label: 'History' },
  { value: 'Geography', label: 'Geography' },
  { value: 'Literature', label: 'Literature' },
  { value: 'Reference', label: 'Reference' },
  { value: 'Other', label: 'Other' },
];

const BOOK_STATUS = [
  { value: 'available', label: 'Available' },
  { value: 'checked_out', label: 'Checked Out' },
  { value: 'reserved', label: 'Reserved' },
  { value: 'damaged', label: 'Damaged' },
  { value: 'lost', label: 'Lost' },
  { value: 'maintenance', label: 'Maintenance' },
];

export default function SuperAdminLibraryPage() {
  const { user } = useAuth();
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [branchFilter, setBranchFilter] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 });

  // Data states for dropdowns
  const [branches, setBranches] = useState([]);
  const [classes, setClasses] = useState([]);
  const [grades, setGrades] = useState([]);
  const [levels, setLevels] = useState([]);
  const [streams, setStreams] = useState([]);
  const formRef = useRef(null);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    isbn: '',
    description: '',
    category: '',
    subCategory: '',
    publisher: '',
    publicationYear: '',
    edition: '',
    totalCopies: 1,
    purchasePrice: '',
    bookValue: '',
    purchaseDate: '',
    supplier: '',
    shelfLocation: '',
    callNumber: '',
    language: 'English',
    pages: '',
    keywords: '',
    notes: '',
    branchId: '', // Branch association for the book
    classId: '' // Class association for the book
  });

  useEffect(() => {
    fetchBooks();
    fetchDropdownData();
  }, [search, categoryFilter, statusFilter, branchFilter, pagination.page]);

  const fetchDropdownData = async () => {
    try {
      const [branchesRes, classesRes, gradesRes, levelsRes, streamsRes] = await Promise.all([
        apiClient.get(API_ENDPOINTS.SUPER_ADMIN.BRANCHES.LIST),
        apiClient.get(API_ENDPOINTS.SUPER_ADMIN.CLASSES.LIST),
        apiClient.get(API_ENDPOINTS.SUPER_ADMIN.GRADES.LIST),
        apiClient.get(API_ENDPOINTS.SUPER_ADMIN.LEVELS.LIST),
        apiClient.get(API_ENDPOINTS.SUPER_ADMIN.STREAMS.LIST)
      ]);

      if (branchesRes.success) {
        setBranches(branchesRes.data.branches.map(branch => ({ value: branch._id, label: branch.name })));
      }
      if (classesRes.success) {
        setClasses(classesRes.data.map(cls => ({ value: cls._id, label: cls.name })));
      }
      if (gradesRes.success) {
        setGrades(gradesRes.data.map(grade => ({ value: grade._id, label: grade.name })));
      }
      if (levelsRes.success) {
        setLevels(levelsRes.data.map(level => ({ value: level._id, label: level.name })));
      }
      if (streamsRes.success) {
        setStreams(streamsRes.data.map(stream => ({ value: stream._id, label: stream.name })));
      }
    } catch (error) {
      console.error('Error fetching dropdown data:', error);
    }
  };

  const fetchBooks = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        search,
        category: categoryFilter,
        status: statusFilter,
        branch: branchFilter
      };

      // Remove empty parameters
      Object.keys(params).forEach(key => {
        if (!params[key]) delete params[key];
      });

      const response = await apiClient.get(API_ENDPOINTS.SUPER_ADMIN.LIBRARY.BOOKS, params);
      if (response.success) {
        setBooks(response.data.books);
        setPagination(response.data.pagination);
      }
    } catch (error) {
      console.error('Error fetching books:', error);
      toast.error('Failed to load books');
    } finally {
      setLoading(false);
    }
  };

  const handleAddNew = () => {
    setEditingBook(null);
    setFormData({
      title: '',
      author: '',
      isbn: '',
      description: '',
      category: '',
      subCategory: '',
      publisher: '',
      publicationYear: '',
      edition: '',
      totalCopies: 1,
      purchasePrice: '',
      bookValue: '',
      purchaseDate: '',
      supplier: '',
      shelfLocation: '',
      callNumber: '',
      language: 'English',
      pages: '',
      keywords: '',
      notes: '',
      branchId: '',
      classId: ''
    });
    setIsModalOpen(true);
  };

  const handleEdit = (book) => {
    setEditingBook(book);
    setFormData({
      title: book.title || '',
      author: book.author || '',
      isbn: book.isbn || '',
      description: book.description || '',
      category: book.category || '',
      subCategory: book.subCategory || '',
      publisher: book.publisher || '',
      publicationYear: book.publicationYear || '',
      edition: book.edition || '',
      totalCopies: book.totalCopies || 1,
      purchasePrice: book.purchasePrice || '',
      bookValue: book.bookValue || '',
      purchaseDate: book.purchaseDate ? new Date(book.purchaseDate).toISOString().split('T')[0] : '',
      supplier: book.supplier || '',
      shelfLocation: book.shelfLocation || '',
      callNumber: book.callNumber || '',
      language: book.language || 'English',
      pages: book.pages || '',
      keywords: book.keywords ? book.keywords.join(', ') : '',
      notes: book.notes || '',
      branchId: book.branchId || '',
      classId: book.classId || ''
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this book?')) return;

    try {
      const response = await apiClient.delete(`${API_ENDPOINTS.SUPER_ADMIN.LIBRARY.BOOKS}/${id}`);
      if (response.success) {
        toast.success('Book deleted successfully!');
        fetchBooks();
      }
    } catch (error) {
      toast.error(error.message || 'Failed to delete book');
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    try {
      setSubmitting(true);

      // Validate required fields
      if (!formData.title || !formData.author || !formData.category || !formData.totalCopies || !formData.branchId) {
        toast.error('Please fill in all required fields');
        return;
      }

      const submitData = {
        ...formData,
        totalCopies: parseInt(formData.totalCopies),
        publicationYear: formData.publicationYear ? parseInt(formData.publicationYear) : undefined,
        pages: formData.pages ? parseInt(formData.pages) : undefined,
        purchasePrice: formData.purchasePrice ? parseFloat(formData.purchasePrice) : undefined,
        bookValue: formData.bookValue ? parseFloat(formData.bookValue) : undefined,
        keywords: formData.keywords ? formData.keywords.split(',').map(k => k.trim()).filter(k => k) : [],
        purchaseDate: formData.purchaseDate || undefined
      };

      let response;
      if (editingBook) {
        response = await apiClient.put(`${API_ENDPOINTS.SUPER_ADMIN.LIBRARY.BOOKS}/${editingBook._id}`, submitData);
      } else {
        response = await apiClient.post(API_ENDPOINTS.SUPER_ADMIN.LIBRARY.BOOKS, submitData);
      }

      if (response.success) {
        toast.success(editingBook ? 'Book updated successfully!' : 'Book added successfully!');
        setIsModalOpen(false);
        setEditingBook(null);
        fetchBooks();
      } else {
        toast.error(response.message || 'Operation failed');
      }
    } catch (error) {
      console.error('Error saving book:', error);
      toast.error(error.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (loading && books.length === 0) {
    return <FullPageLoader message="Loading library books..." />;
  }

  return (
    <div className="p-6">
      <Card>
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <CardTitle>Library Management</CardTitle>
            <div className="flex gap-2">
              <Button onClick={handleAddNew}>
                <Plus className="w-4 h-4 mr-2" />
                Add Book
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <BookOpen className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Books</p>
                    <p className="text-2xl font-bold text-gray-900">{pagination.total}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Available Books</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {books.reduce((sum, book) => sum + (book.availableCopies || 0), 0)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Building2 className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Branches</p>
                    <p className="text-2xl font-bold text-gray-900">{branches.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <LibraryIcon className="w-6 h-6 text-orange-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Categories</p>
                    <p className="text-2xl font-bold text-gray-900">{BOOK_CATEGORIES.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
            <Input
              placeholder="Search books..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              icon={Search}
            />
            <Dropdown
              placeholder="Filter by category"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              options={[
                { value: '', label: 'All Categories' },
                ...BOOK_CATEGORIES
              ]}
            />
            <Dropdown
              placeholder="Filter by status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                { value: '', label: 'All Status' },
                ...BOOK_STATUS
              ]}
            />
            <Dropdown
              placeholder="Filter by branch"
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              options={[
                { value: '', label: 'All Branches' },
                ...branches
              ]}
            />
          </div>

          {/* Table */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Author</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Branch</TableHead>
                <TableHead>Copies</TableHead>
                <TableHead>Available</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
            </TableRow>
            </TableHeader>
            <TableBody>
              {books.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-gray-500">
                    No books found
                  </TableCell>
                </TableRow>
              ) : (
                books.map((book) => (
                  <TableRow key={book._id}>
                    <TableCell className="font-medium">{book.title}</TableCell>
                    <TableCell>{book.author}</TableCell>
                    <TableCell>{book.category}</TableCell>
                    <TableCell>{book.branchId?.name || 'N/A'}</TableCell>
                    <TableCell>{book.totalCopies}</TableCell>
                    <TableCell>{book.availableCopies}</TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          book.status === 'available'
                            ? 'bg-green-100 text-green-700'
                            : book.status === 'checked_out'
                              ? 'bg-blue-100 text-blue-700'
                              : book.status === 'damaged'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {book.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon-sm" onClick={() => handleEdit(book)} title="Edit Book">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon-sm" onClick={() => handleDelete(book._id)} title="Delete Book">
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
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
              Showing {books.length} of {pagination.total} books
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

      {/* Enhanced Add/Edit Book Modal */}
      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <BookOpen className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {editingBook ? 'Edit Book Details' : 'Add New Book'}
              </h2>
              <p className="text-sm text-gray-600">
                {editingBook ? 'Update book information and settings' : 'Enter book details to add to library'}
              </p>
            </div>
          </div>
        }
        size="xl"
      >
        <form ref={formRef} onSubmit={handleFormSubmit} className="space-y-8">
          {/* Basic Information Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
              <FileText className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">Required</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Book Title *"
                placeholder="Enter the book title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                required
                className="text-lg"
              />
              <Input
                label="Author Name *"
                placeholder="Enter the author's name"
                value={formData.author}
                onChange={(e) => handleInputChange('author', e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="ISBN"
                placeholder="Enter ISBN (optional)"
                value={formData.isbn}
                onChange={(e) => handleInputChange('isbn', e.target.value)}
              />
              <Dropdown
                label="Book Category *"
                placeholder="Select category"
                value={formData.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
                options={BOOK_CATEGORIES}
                required
              />
            </div>
            <div>
              <Input
                label="Description" 
                placeholder="Enter a brief description of the book"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                as="textarea"
                className="h-24"
              />
            </div>
          </div>

          {/* Publishing Details */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
              <Calendar className="w-5 h-5 text-purple-600" />
              <h3 className="text-lg font-medium text-gray-900">Publishing Details</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Input
                label="Publisher"
                placeholder="Publisher name"
                value={formData.publisher}
                onChange={(e) => handleInputChange('publisher', e.target.value)}
              />
              <Input
                label="Publication Year"
                type="number"
                placeholder="YYYY"
                value={formData.publicationYear}
                onChange={(e) => handleInputChange('publicationYear', e.target.value)}
              />
              <Input
                label="Edition"
                placeholder="e.g. 2nd Edition"
                value={formData.edition}
                onChange={(e) => handleInputChange('edition', e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Language"
                placeholder="Language (default English)"
                value={formData.language}
                onChange={(e) => handleInputChange('language', e.target.value)}
              />
              <Input
                label="Number of Pages"
                type="number"
                placeholder="Total pages"
                value={formData.pages}
                onChange={(e) => handleInputChange('pages', e.target.value)}
              />
            </div>
          </div>

          {/* Inventory & Location */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
              <MapPin className="w-5 h-5 text-green-600" />
              <h3 className="text-lg font-medium text-gray-900">Inventory & Location</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Dropdown
                label="Branch *"
                placeholder="Select Branch"
                value={formData.branchId}
                onChange={(e) => handleInputChange('branchId', e.target.value)}
                options={branches}
                required
              />
               <Dropdown
                label="Class (Optional)"
                placeholder="Select Class Association"
                value={formData.classId}
                onChange={(e) => handleInputChange('classId', e.target.value)}
                options={classes}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Input
                label="Shelf Location"
                placeholder="e.g. A-12"
                value={formData.shelfLocation}
                onChange={(e) => handleInputChange('shelfLocation', e.target.value)}
              />
              <Input
                label="Call Number"
                placeholder="e.g. 823.91"
                value={formData.callNumber}
                onChange={(e) => handleInputChange('callNumber', e.target.value)}
              />
              <Input
                label="Total Copies *"
                type="number"
                min="1"
                value={formData.totalCopies}
                onChange={(e) => handleInputChange('totalCopies', e.target.value)}
                required
              />
            </div>
          </div>

          {/* Pricing & Supplier */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
              <FileText className="w-5 h-5 text-orange-600" />
              <h3 className="text-lg font-medium text-gray-900">Pricing & Supplier</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Input
                label="Book Value"
                type="number"
                placeholder="0.00"
                value={formData.bookValue}
                onChange={(e) => handleInputChange('bookValue', e.target.value)}
              />
              <Input
                label="Purchase Price"
                type="number"
                placeholder="0.00"
                value={formData.purchasePrice}
                onChange={(e) => handleInputChange('purchasePrice', e.target.value)}
              />
              <Input
                label="Purchase Date"
                type="date"
                value={formData.purchaseDate}
                onChange={(e) => handleInputChange('purchaseDate', e.target.value)}
              />
            </div>

             <div className="grid grid-cols-1 gap-6">
              <Input
                label="Supplier/Vendor"
                placeholder="Name of supplier"
                value={formData.supplier}
                onChange={(e) => handleInputChange('supplier', e.target.value)}
              />
            </div>
          </div>

          {/* Additional Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
              <Eye className="w-5 h-5 text-gray-600" />
              <h3 className="text-lg font-medium text-gray-900">Additional Information</h3>
            </div>

            <div className="grid grid-cols-1 gap-6">
              <Input
                label="Keywords"
                placeholder="Comma separated keywords (e.g. History, War, Novel)"
                value={formData.keywords}
                onChange={(e) => handleInputChange('keywords', e.target.value)}
              />
              <Input
                label="Internal Notes"
                placeholder="Any private notes about this book..."
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                as="textarea"
                className="h-24"
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="sticky bottom-0 bg-white pt-4 pb-0 flex justify-end gap-3 border-t border-gray-100 mt-8">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {submitting ? <ButtonLoader /> : (editingBook ? 'Update Book' : 'Add Book')}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}