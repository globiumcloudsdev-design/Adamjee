import React from 'react';
import Dropdown from './dropdown';

export default function DepartmentSelect({ id, name, value, onChange, departments = [], placeholder = 'Select Department', className = '' }) {
  const options = [{ label: placeholder, value: '' }, ...departments.map(d => ({ label: d.name, value: d._id }))];
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
