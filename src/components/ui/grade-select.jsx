import React, { useEffect, useState } from 'react';
import Dropdown from './dropdown';
import apiClient from '@/lib/api-client';
import { API_ENDPOINTS } from '@/constants/api-endpoints';

export default function GradeSelect({ id, name, value, onChange, levelId = '', placeholder = 'Select Grade', className = '', label = '' }) {
  const [grades, setGrades] = useState([]);

  useEffect(() => {
    let mounted = true;
    const fetchGrades = async () => {
      try {
        const endpoint = API_ENDPOINTS.SCHOOL?.GRADES?.LIST || API_ENDPOINTS.SUPER_ADMIN?.GRADES?.LIST || API_ENDPOINTS.TEACHER?.GRADES?.LIST;
        const params = levelId ? `?levelId=${levelId}&limit=200` : '?limit=200';
        const res = await apiClient.get(endpoint + params);
        if (!mounted) return;
        if (res?.success) {
          setGrades(res.data || res.data?.grades || []);
        }
      } catch (err) {
        console.error('Failed to load grades', err);
      }
    };
    if (!levelId || levelId) fetchGrades();
    return () => { mounted = false; };
  }, [levelId]);

  const options = [{ label: placeholder, value: '' }, ...grades.map(g => ({ label: g.name || (g.gradeNumber ? `Grade ${g.gradeNumber}` : g._id), value: g._id }))];

  return (
    <div className={className}>
      {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
      <Dropdown
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        options={options}
        placeholder={placeholder}
      />
    </div>
  );
}
