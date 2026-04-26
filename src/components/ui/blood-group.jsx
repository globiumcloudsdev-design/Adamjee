import React from 'react';
import Dropdown from './dropdown';

export default function BloodGroupSelect({ id, name, value, onChange, placeholder = 'Select Blood Group', className = '' }) {
  const options = [
    { label: 'Select', value: '' },
    { label: 'A+', value: 'A+' },
    { label: 'A-', value: 'A-' },
    { label: 'B+', value: 'B+' },
    { label: 'B-', value: 'B-' },
    { label: 'AB+', value: 'AB+' },
    { label: 'AB-', value: 'AB-' },
    { label: 'O+', value: 'O+' },
    { label: 'O-', value: 'O-' },
  ];

  return (
    <Dropdown
      id={id}
      name={name}
      value={value}
      onChange={onChange}
      options={options}
      placeholder={placeholder}
      className={className}
    />
  );
}
