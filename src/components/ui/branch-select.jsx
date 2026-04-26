import React from 'react';
import Dropdown from './dropdown';

export default function BranchSelect({ id, name, value, onChange, branches = [], placeholder = 'Select Branch', className = '', ...props }) {
  const options = [{ label: placeholder, value: '' }, ...branches.map(b => ({ label: `${b.name}${b.address?.city ? ' - ' + b.address.city : ''}`, value: b.id || b._id }))];
  return (
    <Dropdown
      id={id}
      name={name}
      value={value}
      onChange={onChange}
      options={options}
      placeholder={placeholder}
      className={className}
      {...props}
    />
  );
}
