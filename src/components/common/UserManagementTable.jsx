"use client";

import React from "react";
import { motion } from "framer-motion";
import { 
  Eye, 
  Edit, 
  Trash2, 
  Download, 
  Mail, 
  Phone,
  User,
  Building2,
  Key
} from "lucide-react";
import { 
  Table, 
  TableHeader, 
  TableBody, 
  TableRow, 
  TableHead, 
  TableCell 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import Skeleton from "@/components/ui/skeleton";
import Tooltip from "@/components/ui/tooltip";

/**
 * UserManagementTable - A standardized table component for Students, Teachers, Staff, and Admins.
 * 
 * @param {Array} data - Array of user objects
 * @param {Boolean} loading - Loading state
 * @param {Function} onView - View action callback
 * @param {Function} onEdit - Edit action callback
 * @param {Function} onDelete - Delete action callback
 * @param {Function} onToggleStatus - Status toggle callback
 * @param {Function} onDownloadQR - QR Download callback
 */
export default function UserManagementTable({
  data = [],
  loading = false,
  onView,
  onEdit,
  onDelete,
  onToggleStatus,
  onDownloadQR,
  onChangePassword,
}) {
  if (loading) {
    return (
      <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-gray-50/50 dark:bg-gray-800/50">
              <TableRow>
                <TableHead className="w-[280px]">User Profile</TableHead>
                <TableHead className="w-[250px]">Contact Information</TableHead>
                <TableHead className="w-[180px]">Branch & Location</TableHead>
                <TableHead className="w-[120px]">Account Status</TableHead>
                <TableHead className="text-right w-[150px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <div className="flex items-center gap-4">
                      <Skeleton className="h-12 w-12 rounded-xl" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-2">
                      <Skeleton className="h-3 w-40" />
                      <Skeleton className="h-3 w-28" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-6 w-20 rounded-full" />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Skeleton className="h-8 w-8 rounded-lg" />
                      <Skeleton className="h-8 w-8 rounded-lg" />
                      <Skeleton className="h-8 w-8 rounded-lg" />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-20 text-center">
        <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-full mb-4">
          <User className="h-12 w-12 text-gray-400" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">No Records Found</h3>
        <p className="text-gray-500 max-w-xs mx-auto">We couldn't find any users matching your current filters.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-gray-50/50 dark:bg-gray-800/50">
            <TableRow>
              <TableHead className="w-[280px]">User Profile</TableHead>
              <TableHead className="w-[250px]">Contact Information</TableHead>
              <TableHead className="w-[180px]">Branch & Location</TableHead>
              <TableHead className="w-[120px]">Account Status</TableHead>
              <TableHead className="text-right w-[150px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((user, index) => (
              <motion.tr
                key={user.id || index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                className="group hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors"
              >
                {/* User Profile Cell */}
                <TableCell>
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/40 dark:to-indigo-900/40 flex items-center justify-center overflow-hidden border border-white dark:border-gray-800 shadow-sm group-hover:shadow-md transition-shadow">
                        {(user.avatar_url || user.profilePhoto?.url || user.profile_photo?.url) ? (
                          <img
                            src={user.avatar_url || user.profilePhoto?.url || user.profile_photo?.url}
                            alt={`${user.first_name} ${user.last_name}`}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="text-blue-600 dark:text-blue-400 font-bold text-lg">
                            {user.first_name?.charAt(0)}{user.last_name?.charAt(0)}
                          </span>
                        )}
                      </div>
                      {user.is_active && (
                        <div className="absolute -bottom-1 -right-1 h-3.5 w-3.5 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full" />
                      )}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-bold text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors">
                        {user.first_name} {user.last_name}
                      </span>
                      <span className="text-[11px] font-bold text-gray-400 uppercase tracking-tighter">
                        {user.role === 'STUDENT' ? 'GR NO: ' : 'REG NO: '}
                        { (user.details?.academic_info?.roll_no || user.details?.student?.roll_no) || 'NOT ASSIGNED'}
                      </span>
                    </div>
                  </div>
                </TableCell>

                {/* Contact Info Cell */}
                <TableCell>
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 font-medium">
                      <Mail className="h-3.5 w-3.5 text-blue-500" />
                      <span className="truncate max-w-[180px]">{user.email}</span>
                    </div>
                    {user.phone && (
                      <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 font-medium">
                        <Phone className="h-3.5 w-3.5 text-indigo-500" />
                        <span>{user.phone}</span>
                      </div>
                    )}
                  </div>
                </TableCell>

                {/* Branch Cell */}
                <TableCell>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-200">
                      <Building2 className="h-4 w-4 text-orange-500" />
                      {user.branch?.name || user.Branch?.name || 'Main Campus'}
                    </div>
                    <span className="text-[10px] text-gray-400 font-bold uppercase ml-6">
                      {user.branch?.city || 'Karachi'}
                    </span>
                  </div>
                </TableCell>

                {/* Status Toggle Cell */}
                <TableCell>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => onToggleStatus && onToggleStatus(user)}
                      className={`relative inline-flex h-5 w-10 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        user.is_active ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          user.is_active ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                    <span className={`text-[10px] font-extrabold uppercase tracking-tight ${
                      user.is_active ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {user.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </TableCell>

                {/* Actions Cell */}
                <TableCell className="text-right">
                   <div className="flex items-center justify-end gap-1 transition-opacity">
                    {onView && (
                      <Tooltip content="View Profile">
                        <Button onClick={() => onView(user)} variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:bg-blue-50">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Tooltip>
                    )}
                    {onEdit && (
                      <Tooltip content="Edit Details">
                        <Button onClick={() => onEdit(user)} variant="ghost" size="icon" className="h-8 w-8 text-yellow-600 hover:bg-yellow-50">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Tooltip>
                    )}
                    {onChangePassword && (
                      <Tooltip content="Change Password">
                        <Button onClick={() => onChangePassword(user)} variant="ghost" size="icon" className="h-8 w-8 text-orange-600 hover:bg-orange-50">
                          <Key className="h-4 w-4" />
                        </Button>
                      </Tooltip>
                    )}
                    {onDownloadQR && (
                      <Tooltip content="Download ID Card / QR">
                        <Button onClick={() => onDownloadQR(user)} variant="ghost" size="icon" className="h-8 w-8 text-green-600 hover:bg-green-50">
                          <Download className="h-4 w-4" />
                        </Button>
                      </Tooltip>
                    )}
                    {onDelete && (
                      <Tooltip content="Delete User">
                        <Button onClick={() => onDelete(user)} variant="ghost" size="icon" className="h-8 w-8 text-red-600 hover:bg-red-50">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </Tooltip>
                    )}
                  </div>
                </TableCell>
              </motion.tr>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
