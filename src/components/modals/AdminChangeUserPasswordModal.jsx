"use client";

import { useState } from "react";
import Modal from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";
import { Key, Loader2, User } from "lucide-react";
import { toast } from "sonner";
import apiClient from "@/lib/api-client";
import { API_ENDPOINTS } from "@/constants/api-endpoints";

/**
 * Reusable modal for Admin to force change a user's password
 * @param {boolean} isOpen - Modal visibility
 * @param {function} onClose - Close handler
 * @param {object} userToEdit - The user object (Student, Teacher, or Staff)
 * @param {string} userRole - 'student', 'teacher', or 'staff'
 * @param {string} adminRole - 'super_admin' or 'branch_admin'
 */
export default function AdminChangeUserPasswordModal({ 
  isOpen, 
  onClose, 
  userToEdit, 
  userRole, 
  adminRole 
}) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    newPassword: "",
    confirmPassword: "",
  });

  if (!userToEdit) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.newPassword) {
      return toast.error("Please enter a new password");
    }

    if (formData.newPassword !== formData.confirmPassword) {
      return toast.error("Passwords do not match");
    }

    if (formData.newPassword.length < 6) {
      return toast.error("Password must be at least 6 characters long");
    }

    try {
      setLoading(true);
      
      const userId = userToEdit.id || userToEdit._id;
      const isAdminSuper = adminRole?.toUpperCase() === 'SUPER_ADMIN';

      // Determine endpoint based on role and admin level
      let endpoint = "";
      const normalizedUserRole = userRole?.toLowerCase();

      if (normalizedUserRole === 'student') {
        endpoint = isAdminSuper 
          ? API_ENDPOINTS.SUPER_ADMIN.STUDENTS.UPDATE.replace(':id', userId)
          : API_ENDPOINTS.BRANCH_ADMIN.STUDENTS.UPDATE.replace(':id', userId);
      } else if (normalizedUserRole === 'teacher') {
        endpoint = isAdminSuper
          ? API_ENDPOINTS.SUPER_ADMIN.TEACHERS.UPDATE.replace(':id', userId)
          : API_ENDPOINTS.BRANCH_ADMIN.TEACHERS.UPDATE.replace(':id', userId);
      } else if (normalizedUserRole === 'staff') {
        endpoint = isAdminSuper
          ? API_ENDPOINTS.SUPER_ADMIN.STAFF.UPDATE.replace(':id', userId)
          : API_ENDPOINTS.BRANCH_ADMIN.STAFF.UPDATE.replace(':id', userId);
      } else if (normalizedUserRole === 'branch_admin') {
        endpoint = API_ENDPOINTS.SUPER_ADMIN.BRANCH_ADMINS.UPDATE.replace(':id', userId);
      }

      if (!endpoint) {
        throw new Error("Invalid user role platform configuration");
      }

      // We use the standard UPDATE endpoint but only send the password
      // The backend handlers for these usually accept partial updates
      const response = await apiClient.put(endpoint, {
        password: formData.newPassword
      });

      if (response.success) {
        toast.success(`Password for ${userToEdit.first_name || 'user'} updated successfully`);
        setFormData({ newPassword: "", confirmPassword: "" });
        onClose();
      } else {
        toast.error(response.message || "Failed to update password");
      }
    } catch (error) {
      console.error("Admin Password Change Error:", error);
      toast.error(error.message || "An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const footer = (
    <div className="flex justify-end gap-3">
      <Button
        type="button"
        variant="outline"
        onClick={onClose}
        disabled={loading}
      >
        Cancel
      </Button>
      <Button 
        type="submit" 
        form="admin-password-form" 
        disabled={loading}
        className="bg-blue-600 hover:bg-blue-700 text-white"
      >
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Change Password
      </Button>
    </div>
  );

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30">
            <Key className="w-5 h-5 text-red-600 dark:text-red-400" />
          </div>
          <div className="flex flex-col">
            <span className="text-base font-bold">Force Change Password</span>
            <span className="text-xs text-gray-500 font-normal">
              Changing password for: {userToEdit.first_name} {userToEdit.last_name} ({userToEdit.registration_no || userToEdit.email})
            </span>
          </div>
        </div>
      }
      size="sm"
      footer={footer}
    >
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-3 rounded-lg flex gap-3 mb-6">
        <div className="shrink-0">
          <User className="w-5 h-5 text-amber-600" />
        </div>
        <p className="text-xs text-amber-800 dark:text-amber-200 leading-relaxed">
          The user will be able to log in with this new password immediately. 
          They will <strong>not</strong> be notified automatically of this change.
        </p>
      </div>

      <form id="admin-password-form" onSubmit={handleSubmit} className="space-y-5 py-2">
        <PasswordInput
          label="Enter New Password"
          value={formData.newPassword}
          onChange={(e) =>
            setFormData({ ...formData, newPassword: e.target.value })
          }
          placeholder="New secret password"
          required
          autoFocus
        />

        <PasswordInput
          label="Confirm New Password"
          value={formData.confirmPassword}
          onChange={(e) =>
            setFormData({ ...formData, confirmPassword: e.target.value })
          }
          placeholder="Repeat the password"
          required
        />
      </form>
    </Modal>
  );
}