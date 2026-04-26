import React, { useEffect, useState } from 'react';
import Dropdown from './dropdown';
import apiClient from '@/lib/api-client';
import { API_ENDPOINTS } from '@/constants/api-endpoints';

export default function LevelSelect({ id, name, value, onChange, placeholder = 'Select Level', className = '' }) {
  const [levels, setLevels] = useState([]);

  useEffect(() => {
    let mounted = true;
    const fetchLevels = async () => {
      try {
        const endpoint = API_ENDPOINTS.SCHOOL?.LEVELS?.LIST || '/api/coaching/levels';
        const res = await apiClient.get(endpoint + '?limit=200');
        if (!mounted) return;
        if (res?.success) setLevels(res.data || res.data?.levels || []);
      } catch (err) {
        console.error('Failed to load levels', err);
      }
    };
    fetchLevels();
    return () => { mounted = false; };
  }, []);

  const options = [{ label: placeholder, value: '' }, ...levels.map(l => ({ label: l.name, value: l._id }))];

  return (
    <Dropdown id={id} name={name} value={value} onChange={onChange} options={options} placeholder={placeholder} className={className} />
  );
}
