import React from 'react';
import Dropdown from './dropdown';

export default function GenderSelect({ id, name, value, onChange, placeholder = 'Select Gender', className = '' }) {
  const options = [
    { label: 'Male', value: 'male' },
    { label: 'Female', value: 'female' },
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
