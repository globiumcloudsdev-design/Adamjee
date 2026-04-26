
'use client';

import { useState, useEffect } from 'react';
import apiClient from '@/lib/api-client';
import Dropdown from './dropdown';

/**
 * Reusable Academic Year Dropdown Component
 * Fetches academic years based on user role and branch
 * 
 * @param {string} value - Selected academic year ID
 * @param {function} onChange - Callback when selection changes
 * @param {string} placeholder - Placeholder text
 * @param {boolean} required - Whether the field is required
 * @param {string} branchId - Optional branch ID (for super-admin to filter)
 * @param {boolean} showCurrent - Whether to show "Current" indicator
 * @param {boolean} filterByBranch - Whether to filter by branch (default: false for super-admin)
 */
export default function AcademicYearDropdown({
  value,
  onChange,
  placeholder = 'Select Academic Year',
  required = false,
  branchId = null,
  showCurrent = true,
  disabled = false,
  className = '',
  filterByBranch = false,
}) {
  const [academicYears, setAcademicYears] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAcademicYears();
  }, [branchId, filterByBranch]);

  const loadAcademicYears = async () => {
    try {
      setLoading(true);
      let response;

      // Determine API endpoint based on whether branchId is provided and filterByBranch is true
      if (branchId && filterByBranch) {
        // Filter by specific branch
        response = await apiClient.get(`/api/super-admin/academic-years?branchId=${branchId}&limit=100`);
      } else {
        // Try branch-admin endpoint first, fallback to super-admin
        try {
          response = await apiClient.get('/api/branch-admin/academic-years');
        } catch (error) {
          // If branch-admin fails, try super-admin endpoint (get all academic years)
          response = await apiClient.get('/api/super-admin/academic-years?limit=100');
        }
      }

      if (response.success) {
        const yearsData = response.data.academicYears || response.data || [];
        setAcademicYears(yearsData);
      }
    } catch (error) {
      console.error('Error loading academic years:', error);
      setAcademicYears([]);
    } finally {
      setLoading(false);
    }
  };

  // Format options for dropdown
  const options = academicYears.map((year) => ({
    value: year._id,
    label: `${year.yearName}${year.isCurrent && showCurrent ? ' (Current)' : ''}`,
  }));

  // Add empty option if not required
  if (!required && options.length > 0) {
    options.unshift({ value: '', label: placeholder });
  }

  if (loading) {
    return (
      <div className={`animate-pulse bg-gray-200 h-10 rounded-lg ${className}`}>
        <div className="px-4 py-2 text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <Dropdown
      value={value}
      onChange={onChange}
      options={options}
      placeholder={placeholder}
      disabled={disabled}
      className={className}
    />
  );
}
