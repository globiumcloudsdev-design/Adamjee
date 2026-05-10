"use client";

import { useState } from "react";
import Modal from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Key, Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import apiClient from "@/lib/api-client";

export default function ChangePasswordModal({ isOpen, onClose }) {
  const [loading, setLoading] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.newPassword !== formData.confirmPassword) {
      return toast.error("New passwords do not match");
    }

    if (formData.newPassword.length < 6) {
      return toast.error("Password must be at least 6 characters long");
    }

    try {
      setLoading(true);
      const response = await apiClient.put("/api/auth/change-password", {
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      });

      if (response.success) {
        toast.success("Password changed successfully");
        setFormData({ currentPassword: "", newPassword: "", confirmPassword: "" });
        onClose();
      } else {
        toast.error(response.message || "Failed to change password");
      }
    } catch (error) {
      console.error("Change password error:", error);
      toast.error("An error occurred. Please try again.");
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
      <Button type="submit" form="change-password-form" disabled={loading}>
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Update Password
      </Button>
    </div>
  );

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-primary/10">
            <Key className="w-5 h-5 text-primary" />
          </div>
          <span>Change Password</span>
        </div>
      }
      size="sm"
      footer={footer}
    >
      <form id="change-password-form" onSubmit={handleSubmit} className="space-y-4 py-2">
        <PasswordInput
          label="Current Password"
          value={formData.currentPassword}
          onChange={(e) =>
            setFormData({ ...formData, currentPassword: e.target.value })
          }
          required
        />

        <PasswordInput
          label="New Password"
          value={formData.newPassword}
          onChange={(e) =>
            setFormData({ ...formData, newPassword: e.target.value })
          }
          required
        />

        <PasswordInput
          label="Confirm New Password"
          value={formData.confirmPassword}
          onChange={(e) =>
            setFormData({ ...formData, confirmPassword: e.target.value })
          }
          required
        />
      </form>
    </Modal>
  );
}
