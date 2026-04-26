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
import BookDetailModal from '@/components/BookDetailModal';
import { Plus, Edit, Trash2, Search, BookOpen, Eye, FileText, Upload, X, Calendar, MapPin, Download } from 'lucide-react';
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

export default function LibraryPage() {
  const { user } = useAuth();
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [gradeFilter, setGradeFilter] = useState('');
  const [sectionFilter, setSectionFilter] = useState('');
  const [levelFilter, setLevelFilter] = useState('');
  const [streamFilter, setStreamFilter] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 });

  // Book detail modal state
  const [selectedBook, setSelectedBook] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Data states for dropdowns
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
    classId: '' // Class association for the book
  });

  // File upload state
  const [attachments, setAttachments] = useState([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchBooks();
    fetchDropdownData();
  }, [search, categoryFilter, statusFilter, classFilter, gradeFilter, sectionFilter, levelFilter, streamFilter, pagination.page]);

  const fetchDropdownData = async () => {
    try {
      const [classesRes, gradesRes, levelsRes, streamsRes] = await Promise.all([
        apiClient.get(API_ENDPOINTS.BRANCH_ADMIN.CLASSES.LIST),
        apiClient.get(API_ENDPOINTS.BRANCH_ADMIN.GRADES.LIST),
        apiClient.get(API_ENDPOINTS.BRANCH_ADMIN.LEVELS.LIST),
        apiClient.get(API_ENDPOINTS.BRANCH_ADMIN.STREAMS.LIST)
      ]);

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
        class: classFilter,
        grade: gradeFilter,
        section: sectionFilter,
        level: levelFilter,
        stream: streamFilter
      };

      // Remove empty parameters
      Object.keys(params).forEach(key => {
        if (!params[key]) delete params[key];
      });

      const response = await apiClient.get(API_ENDPOINTS.BRANCH_ADMIN.LIBRARY_MANAGEMENT.BOOKS, params);
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
      classId: ''
    });
    setAttachments([]);
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
      classId: book.classId || ''
    });
    setIsModalOpen(true);
  };

  const handleViewDetails = (book) => {
    setSelectedBook(book);
    setIsDetailModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this book?')) return;

    try {
      const endpoint = API_ENDPOINTS.BRANCH_ADMIN.LIBRARY_MANAGEMENT.DELETE.replace(':id', id);
      const response = await apiClient.delete(endpoint);
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
      if (!formData.title || !formData.author || !formData.category || !formData.totalCopies) {
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
        // Use ID in URL for updates
        const endpoint = API_ENDPOINTS.BRANCH_ADMIN.LIBRARY_MANAGEMENT.UPDATE.replace(':id', editingBook._id);
        response = await apiClient.put(endpoint, submitData);
      } else {
        response = await apiClient.post(API_ENDPOINTS.BRANCH_ADMIN.LIBRARY_MANAGEMENT.BOOKS, submitData);
      }

      if (response.success) {
        toast.success(editingBook ? 'Book updated successfully!' : 'Book added successfully!');
        setIsModalOpen(false);
        setEditingBook(null);
        setAttachments([]);
        fetchBooks();
      } else {
        toast.error(response.message || 'Operation failed');
      }
    } catch (error) {
      console.error('Error saving book:', error);
      console.error('Error details:', {
        message: error.message,
        status: error.status,
        errors: error.errors,
        stack: error.stack
      });
      toast.error(error?.message || error?.response?.data?.message || 'Operation failed');
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

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'image/jpeg',
      'image/png',
      'image/gif'
    ];

    const validFiles = files.filter(file => {
      if (file.size > maxSize) {
        toast.error(`${file.name} is too large. Maximum size is 10MB.`);
        return false;
      }
      if (!allowedTypes.includes(file.type)) {
        toast.error(`${file.name} has an unsupported file type.`);
        return false;
      }
      return true;
    });

    setAttachments(prev => [...prev, ...validFiles]);
  };

  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
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
              placeholder="Filter by class"
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              options={[
                { value: '', label: 'All Classes' },
                ...classes
              ]}
            />
            <Dropdown
              placeholder="Filter by grade"
              value={gradeFilter}
              onChange={(e) => setGradeFilter(e.target.value)}
              options={[
                { value: '', label: 'All Grades' },
                ...grades
              ]}
            />
            <Dropdown
              placeholder="Filter by level"
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              options={[
                { value: '', label: 'All Levels' },
                ...levels
              ]}
            />
            <Dropdown
              placeholder="Filter by stream"
              value={streamFilter}
              onChange={(e) => setStreamFilter(e.target.value)}
              options={[
                { value: '', label: 'All Streams' },
                ...streams
              ]}
            />
            <Input
              placeholder="Filter by section"
              value={sectionFilter}
              onChange={(e) => setSectionFilter(e.target.value)}
            />
          </div>

          {/* Table */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Author</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Copies</TableHead>
                <TableHead>Available</TableHead>
                <TableHead>Attachments</TableHead>
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
                    <TableCell>{book.totalCopies}</TableCell>
                    <TableCell>{book.availableCopies}</TableCell>
                    <TableCell>
                      {book.attachments?.length > 0 ? (
                        <div className="flex items-center gap-1">
                          <FileText className="w-4 h-4 text-blue-600" />
                          <span className="text-sm text-blue-600 font-medium">
                            {book.attachments.length}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">None</span>
                      )}
                    </TableCell>
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
                        <Button variant="ghost" size="icon-sm" onClick={() => handleViewDetails(book)} title="View Details">
                          <Eye className="w-4 h-4" />
                        </Button>
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
              <Input
                label="Total Copies *"
                placeholder="Number of copies"
                type="number"
                min="1"
                value={formData.totalCopies}
                onChange={(e) => handleInputChange('totalCopies', e.target.value)}
                required
              />
            </div>

            <Dropdown
              label="Class Association"
              placeholder="Select class (optional)"
              value={formData.classId}
              onChange={(e) => handleInputChange('classId', e.target.value)}
              options={[
                { value: '', label: '📚 General Book (Available to all classes)' },
                ...classes.map(cls => ({ ...cls, label: `🏫 ${cls.label}` }))
              ]}
              helperText="Leave empty for general books available to all students"
            />

            <Input
              label="Book Description"
              placeholder="Enter a brief description of the book"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              type="textarea"
              rows={3}
            />
          </div>

          {/* Publication Details Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
              <Calendar className="w-5 h-5 text-green-600" />
              <h3 className="text-lg font-medium text-gray-900">Publication Details</h3>
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
                placeholder="e.g., 2023"
                type="number"
                min="1000"
                max={new Date().getFullYear() + 1}
                value={formData.publicationYear}
                onChange={(e) => handleInputChange('publicationYear', e.target.value)}
              />
              <Input
                label="Edition"
                placeholder="e.g., 1st Edition"
                value={formData.edition}
                onChange={(e) => handleInputChange('edition', e.target.value)}
              />
            </div>
          </div>





          {/* File Attachments Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
              <Upload className="w-5 h-5 text-purple-600" />
              <h3 className="text-lg font-medium text-gray-900">File Attachments</h3>
              <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">Optional</span>
            </div>

            <div className="space-y-4">
              <div
                className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-purple-400 transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600 mb-1">
                  Click to upload or drag and drop files here
                </p>
                <p className="text-xs text-gray-500">
                  Supported formats: PDF, Word, PowerPoint, Excel, Text, Images (Max 10MB each)
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.jpg,.jpeg,.png,.gif"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>

              {attachments.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-700">Selected Files:</h4>
                  {attachments.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="w-4 h-4 text-gray-500" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{file.name}</p>
                          <p className="text-xs text-gray-500">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => removeAttachment(index)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Enhanced Footer */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-6 border-t border-gray-200 bg-gray-50 -m-6 px-6 py-4 rounded-b-lg">
            <div className="text-sm text-gray-600">
              {editingBook ? 'Update the book information' : 'Add this book to the library collection'}
            </div>
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                disabled={submitting}
                className="px-6"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="px-8 bg-blue-600 hover:bg-blue-700"
              >
                {submitting ? (
                  <div className="flex items-center gap-2">
                    <ButtonLoader />
                    {editingBook ? 'Updating...' : 'Adding...'}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    {editingBook ? 'Update Book' : 'Add Book'}
                  </div>
                )}
              </Button>
            </div>
          </div>
        </form>
      </Modal>

      {/* Book Detail Modal */}
      <BookDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        book={selectedBook}
        onEdit={handleEdit}
        onDelete={handleDelete}
        userRole="BRANCH_ADMIN"
        showActions={true}
      />
    </div>
  );
}
