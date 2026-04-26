import React from 'react';
import Modal from '@/components/ui/modal';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  BookOpen,
  User,
  Hash,
  Tag,
  Calendar,
  DollarSign,
  MapPin,
  FileText,
  Download,
  Edit,
  Trash2,
  Eye,
  CheckCircle,
  Clock,
  AlertTriangle,
  XCircle,
  Package,
  Globe,
  Building2
} from 'lucide-react';

const BookDetailModal = ({
  isOpen,
  onClose,
  book,
  onEdit,
  onDelete,
  userRole = 'branch_admin',
  showActions = true
}) => {
  if (!book) return null;

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    if (!amount) return 'N/A';
    return `$${parseFloat(amount).toFixed(2)}`;
  };

  const getStatusConfig = (status) => {
    switch (status) {
      case 'available':
        return {
          icon: CheckCircle,
          color: 'text-green-600',
          bgColor: 'bg-green-100',
          label: 'Available'
        };
      case 'checked_out':
        return {
          icon: Clock,
          color: 'text-blue-600',
          bgColor: 'bg-blue-100',
          label: 'Checked Out'
        };
      case 'reserved':
        return {
          icon: Eye,
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-100',
          label: 'Reserved'
        };
      case 'damaged':
        return {
          icon: AlertTriangle,
          color: 'text-orange-600',
          bgColor: 'bg-orange-100',
          label: 'Damaged'
        };
      case 'lost':
        return {
          icon: XCircle,
          color: 'text-red-600',
          bgColor: 'bg-red-100',
          label: 'Lost'
        };
      case 'maintenance':
        return {
          icon: Package,
          color: 'text-purple-600',
          bgColor: 'bg-purple-100',
          label: 'Maintenance'
        };
      default:
        return {
          icon: BookOpen,
          color: 'text-gray-600',
          bgColor: 'bg-gray-100',
          label: status || 'Unknown'
        };
    }
  };

  const statusConfig = getStatusConfig(book.status);
  const StatusIcon = statusConfig.icon;

  const handleDownloadAttachment = (attachment) => {
    window.open(attachment.url, '_blank');
  };

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <BookOpen className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Book Details</h2>
            <p className="text-sm text-gray-600">View complete book information</p>
          </div>
        </div>
      }
      size="xl"
    >
      <div className="space-y-6">
        {/* Status Banner */}
        <div className={`flex items-center gap-3 p-4 rounded-lg ${statusConfig.bgColor}`}>
          <StatusIcon className={`w-5 h-5 ${statusConfig.color}`} />
          <div>
            <span className={`font-medium ${statusConfig.color}`}>
              {statusConfig.label}
            </span>
            <span className="text-sm text-gray-600 ml-2">
              {book.availableCopies} of {book.totalCopies} copies available
            </span>
          </div>
        </div>

        {/* Basic Information */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="w-5 h-5 text-blue-600" />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-medium text-gray-500">Title</label>
                <p className="text-lg font-semibold text-gray-900 mt-1">{book.title || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Author</label>
                <p className="text-lg text-gray-900 mt-1 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  {book.author || 'N/A'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">ISBN</label>
                <p className="text-gray-900 mt-1 flex items-center gap-2">
                  <Hash className="w-4 h-4" />
                  {book.isbn || 'N/A'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Category</label>
                <p className="text-gray-900 mt-1 flex items-center gap-2">
                  <Tag className="w-4 h-4" />
                  {book.category || 'N/A'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Sub-Category</label>
                <p className="text-gray-900 mt-1">{book.subCategory || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Language</label>
                <p className="text-gray-900 mt-1 flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  {book.language || 'N/A'}
                </p>
              </div>
            </div>

            {book.description && (
              <div className="pt-4 border-t">
                <label className="text-sm font-medium text-gray-500">Description</label>
                <p className="text-gray-700 mt-1 leading-relaxed">{book.description}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Publication Details */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calendar className="w-5 h-5 text-green-600" />
              Publication Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <label className="text-sm font-medium text-gray-500">Publisher</label>
                <p className="text-gray-900 mt-1">{book.publisher || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Publication Year</label>
                <p className="text-gray-900 mt-1">{book.publicationYear || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Edition</label>
                <p className="text-gray-900 mt-1">{book.edition || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Pages</label>
                <p className="text-gray-900 mt-1">{book.pages || 'N/A'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Inventory & Acquisition */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Package className="w-5 h-5 text-purple-600" />
              Inventory & Acquisition
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <label className="text-sm font-medium text-gray-500">Total Copies</label>
                <p className="text-2xl font-bold text-gray-900 mt-1">{book.totalCopies || 0}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Available Copies</label>
                <p className="text-2xl font-bold text-green-600 mt-1">{book.availableCopies || 0}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Purchase Price</label>
                <p className="text-gray-900 mt-1 flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  {formatCurrency(book.purchasePrice)}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Book Value</label>
                <p className="text-gray-900 mt-1 flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  {formatCurrency(book.bookValue)}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Purchase Date</label>
                <p className="text-gray-900 mt-1">{formatDate(book.purchaseDate)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Supplier</label>
                <p className="text-gray-900 mt-1">{book.supplier || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Shelf Location</label>
                <p className="text-gray-900 mt-1 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  {book.shelfLocation || 'N/A'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Call Number</label>
                <p className="text-gray-900 mt-1">{book.callNumber || 'N/A'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Additional Information */}
        {(book.keywords?.length > 0 || book.notes) && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Eye className="w-5 h-5 text-indigo-600" />
                Additional Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {book.keywords?.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Keywords</label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {book.keywords.map((keyword, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {book.notes && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Notes</label>
                  <p className="text-gray-700 mt-1 leading-relaxed">{book.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Attachments */}
        {book.attachments?.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Download className="w-5 h-5 text-orange-600" />
                Attachments ({book.attachments.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {book.attachments.map((attachment, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-gray-500" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {attachment.filename}
                        </p>
                        <p className="text-xs text-gray-500">
                          {(attachment.size / 1024 / 1024).toFixed(2)} MB • {attachment.fileType?.toUpperCase()}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadAttachment(attachment)}
                      className="flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Branch Information (for Super Admin) */}
        {userRole === 'super_admin' && book.branchId && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Building2 className="w-5 h-5 text-teal-600" />
                Branch Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium text-gray-500">Branch Name</label>
                  <p className="text-gray-900 mt-1">{book.branchId.name || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Branch Location</label>
                  <p className="text-gray-900 mt-1">{book.branchId.location || 'N/A'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Audit Information */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Clock className="w-5 h-5 text-gray-600" />
              Audit Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-medium text-gray-500">Added By</label>
                <p className="text-gray-900 mt-1">
                  {book.addedBy?.firstName && book.addedBy?.lastName
                    ? `${book.addedBy.firstName} ${book.addedBy.lastName}`
                    : 'N/A'
                  }
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Date Added</label>
                <p className="text-gray-900 mt-1">{formatDate(book.createdAt)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Last Updated By</label>
                <p className="text-gray-900 mt-1">
                  {book.lastUpdatedBy?.firstName && book.lastUpdatedBy?.lastName
                    ? `${book.lastUpdatedBy.firstName} ${book.lastUpdatedBy.lastName}`
                    : 'N/A'
                  }
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Last Updated</label>
                <p className="text-gray-900 mt-1">{formatDate(book.updatedAt)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Footer with Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-6 border-t border-gray-200 bg-gray-50 -m-6 px-6 py-4 rounded-b-lg">
        <div className="text-sm text-gray-600">
          Book ID: {book._id}
        </div>
        {showActions && (
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="px-6"
            >
              Close
            </Button>
            {onEdit && (
              <Button
                variant="outline"
                onClick={() => {
                  onClose();
                  onEdit(book);
                }}
                className="px-6 flex items-center gap-2"
              >
                <Edit className="w-4 h-4" />
                Edit Book
              </Button>
            )}
            {onDelete && (
              <Button
                variant="destructive"
                onClick={() => {
                  onClose();
                  onDelete(book._id);
                }}
                className="px-6 flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete Book
              </Button>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};

export default BookDetailModal;
