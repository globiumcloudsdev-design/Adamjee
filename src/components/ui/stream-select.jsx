import React, { useEffect, useState } from 'react';
import Dropdown from './dropdown';
import apiClient from '@/lib/api-client';
import { API_ENDPOINTS } from '@/constants/api-endpoints';

export default function StreamSelect({ id, name, value, onChange, placeholder = 'Select Stream', className = '' }) {
  const [streams, setStreams] = useState([]);

  useEffect(() => {
    let mounted = true;
    const fetchStreams = async () => {
      try {
        const endpoint = API_ENDPOINTS.SCHOOL?.STREAMS?.LIST || '/api/coaching/streams';
        const res = await apiClient.get(endpoint + '?limit=200');
        if (!mounted) return;
        if (res?.success) setStreams(res.data || res.data?.streams || []);
      } catch (err) {
        console.error('Failed to load streams', err);
      }
    };
    fetchStreams();
    return () => { mounted = false; };
  }, []);

  const options = [{ label: placeholder, value: '' }, ...streams.map(s => ({ label: s.name, value: s._id }))];

  return (
    <Dropdown id={id} name={name} value={value} onChange={onChange} options={options} placeholder={placeholder} className={className} />
  );
}
