import React, { useEffect, useState } from 'react';
import Dropdown from './dropdown';
import apiClient from '@/lib/api-client';
import { API_ENDPOINTS } from '@/constants/api-endpoints';

export default function GradeStreamSubjectSelect({ id, name, value, onChange, gradeId = '', streamId = '', placeholder = 'Select Subject', className = '' }) {
  const [items, setItems] = useState([]);

  useEffect(() => {
    let mounted = true;
    const fetchItems = async () => {
      try {
        const endpoint = API_ENDPOINTS.SCHOOL?.GRADE_STREAM_SUBJECTS?.LIST || '/api/coaching/grade-stream-subjects';
        const params = new URLSearchParams();
        if (gradeId) params.append('gradeId', gradeId);
        if (streamId) params.append('streamId', streamId);
        const res = await apiClient.get(endpoint + (params.toString() ? `?${params.toString()}` : ''));
        if (!mounted) return;
        if (res?.success) setItems(res.data || []);
      } catch (err) {
        console.error('Failed to load grade-stream subjects', err);
      }
    };
    if (gradeId || streamId) fetchItems();
    return () => { mounted = false; };
  }, [gradeId, streamId]);

  const options = [{ label: placeholder, value: '' }, ...items.map(it => ({ label: it.subjectId?.name || it.subjectId, value: it.subjectId?._id || it.subjectId }))];

  return (
    <Dropdown id={id} name={name} value={value} onChange={onChange} options={options} placeholder={placeholder} className={className} />
  );
}
