'use client';
import React, { useState } from 'react';
import Modal from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Camera, FileUp, X, User, FileText } from 'lucide-react';
import { toast } from 'sonner';
import apiClient from '@/lib/api-client';

export default function StudentUploadModal({ isOpen, onClose, student, onSuccess }) {
  const [profileImage, setProfileImage] = useState(null);
  const [profilePreview, setProfilePreview] = useState(student?.avatar_url || '');
  const [deleteProfilePhoto, setDeleteProfilePhoto] = useState(false);

  const [newDocuments, setNewDocuments] = useState([]);
  const [existingDocuments, setExistingDocuments] = useState([]);
  const [documentsToDelete, setDocumentsToDelete] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize with existing avatar if any
  React.useEffect(() => {
    if (student) {
      setProfilePreview(student.avatar_url || student.profilePhoto?.url || '');
      setProfileImage(null);
      setDeleteProfilePhoto(false);
      
      setExistingDocuments(student.details?.documents || []);
      setNewDocuments([]);
      setDocumentsToDelete([]);
    }
  }, [student, isOpen]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(file);
        setProfilePreview(reader.result);
        setDeleteProfilePhoto(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveProfilePhoto = () => {
    setProfileImage(null);
    setProfilePreview('');
    if (student?.avatar_url || student?.profilePhoto?.url) {
      setDeleteProfilePhoto(true);
    }
  };

  const addDocument = (file, type = 'other') => {
    const reader = new FileReader();
    reader.onloadend = () => {
      setNewDocuments(prev => [...prev, { file, type, label: file.name, base64: reader.result }]);
    };
    reader.readAsDataURL(file);
  };

  const removeNewDocument = (index) => {
    setNewDocuments(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingDocument = (doc) => {
    setDocumentsToDelete(prev => [...prev, doc]);
    setExistingDocuments(prev => prev.filter(d => d.id !== doc.id));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!profileImage && newDocuments.length === 0 && !deleteProfilePhoto && documentsToDelete.length === 0) {
      toast.error('No changes to save.');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        pendingProfileFile: profileImage ? profilePreview : undefined,
        deleteProfilePhoto,
        pendingDocuments: newDocuments.map(doc => ({
          file: doc.base64,
          name: doc.label,
          type: doc.type
        })),
        documentsToDelete,
      };

      const endpoint = `/api/users/students/${student.id || student._id}`;
      
      await apiClient.put(endpoint, payload);
      toast.success('Uploads saved successfully!');
      
      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      console.error('Error saving uploads:', error);
      toast.error(error.message || 'Failed to save uploads.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !student) return null;

  return (
    <Modal open={isOpen} onClose={onClose} title={`Upload Files - ${student.first_name || ''} ${student.last_name || ''}`} size="lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl bg-gray-50/50 border-gray-200">
          <div className="relative group">
            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg bg-gray-100 flex items-center justify-center">
              {profilePreview ? (
                <img src={profilePreview} alt="Profile Preview" className="w-full h-full object-cover" />
              ) : (
                <User className="w-12 h-12 text-gray-300" />
              )}
            </div>
            <label className="absolute bottom-0 right-0 p-2 bg-primary text-white rounded-full shadow-lg cursor-pointer hover:scale-110 transition-transform">
              <Camera className="w-4 h-4" />
              <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
            </label>
          </div>
          <div className="mt-4 text-center">
            <h4 className="font-semibold text-gray-800">Profile Picture</h4>
            <p className="text-xs text-gray-500 mt-1 mb-3">Upload a clear photo of the student (JPG, PNG)</p>
            {profilePreview && (
              <Button type="button" variant="destructive" size="sm" onClick={handleRemoveProfilePhoto} className="h-8 text-xs px-3">
                Remove Photo
              </Button>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-gray-800 flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              Supporting Documents
            </h4>
            <label className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-bold cursor-pointer hover:bg-indigo-100 transition-colors">
              <FileUp className="w-3.5 h-3.5" />
              Add Document
              <input
                type="file"
                className="hidden"
                multiple
                onChange={(e) => {
                  Array.from(e.target.files).forEach(file => addDocument(file));
                }}
              />
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {existingDocuments.map((doc, index) => (
              <div key={`existing-${index}`} className="flex items-center justify-between p-3 border rounded-xl bg-gray-50 shadow-sm group border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <FileText className="w-4 h-4 text-gray-500" />
                  </div>
                  <div className="max-w-[150px]">
                    <p className="text-sm font-medium text-gray-800 truncate" title={doc.name || 'Document'}>{doc.name || 'Document'}</p>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider">{doc.type || 'Other'}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeExistingDocument(doc)}
                  className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                  title="Delete Document"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}

            {newDocuments.map((doc, index) => (
              <div key={`new-${index}`} className="flex items-center justify-between p-3 border rounded-xl bg-white shadow-sm group hover:border-indigo-200 transition-colors border-indigo-100">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-50 rounded-lg">
                    <FileUp className="w-4 h-4 text-indigo-500" />
                  </div>
                  <div className="max-w-[150px]">
                    <p className="text-sm font-medium text-gray-800 truncate" title={doc.label || doc.file?.name || 'Document'}>{doc.label || doc.file?.name || 'Document'}</p>
                    <p className="text-[10px] text-indigo-500 uppercase tracking-wider">New: {doc.type || 'Other'}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeNewDocument(index)}
                  className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                  title="Remove"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}

            {existingDocuments.length === 0 && newDocuments.length === 0 && (
              <div className="col-span-full py-8 text-center border-2 border-dashed rounded-xl border-gray-100">
                <FileUp className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-400">No documents added</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-between items-center border-t pt-6 mt-4">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save Uploads'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
