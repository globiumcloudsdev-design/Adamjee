import React from 'react';
import Dropdown from './dropdown';

export default function ClassSelect({ id, name, value, onChange, classes = [], placeholder = 'Select Class', className = '' }) {
  const options = [{ label: placeholder, value: '' }, ...classes.map(c => ({ label: `${c.name}${c.group?.name ? ' (' + c.group.name + ')' : c.grade?.name ? ' (Grade ' + c.grade.name + ')' : ''}`, value: c.id || c._id }))];
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
