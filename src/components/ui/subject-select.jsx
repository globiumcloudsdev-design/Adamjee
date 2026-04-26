import React from 'react';
import Dropdown from './dropdown';

export default function SubjectSelect({ id, name, value, onChange, subjects = [], placeholder = 'Select Subject', className = '', disabled = false }) {
  const options = [{ label: placeholder, value: '' }, ...subjects.map(s => ({ label: s.name, value: s._id }))];
  return (
    <Dropdown
      id={id}
      name={name}
      value={value}
      onChange={onChange}
      options={options}
      placeholder={placeholder}
      className={className}
      disabled={disabled}
    />
  );
}
