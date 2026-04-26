import React from 'react';
import Dropdown from './dropdown';

const DEFAULT_DESIGNATIONS = [
  { label: 'Principal', value: 'Principal' },
  { label: 'Vice Principal', value: 'Vice Principal' },
  { label: 'Head Teacher', value: 'Head Teacher' },
  { label: 'Senior Teacher', value: 'Senior Teacher' },
  { label: 'Teacher', value: 'Teacher' },
];

export default function DesignationSelect({ id, name, value, onChange, options = DEFAULT_DESIGNATIONS, placeholder = 'Select Designation', className = '' }) {
  const opts = [{ label: placeholder, value: '' }, ...options];
  return (
    <Dropdown
      id={id}
      name={name}
      value={value}
      onChange={onChange}
      options={opts}
      placeholder={placeholder}
      className={className}
    />
  );
}
