import React from 'react';
import Dropdown from './dropdown';

const DEFAULT_DOC_TYPES = [
  { label: 'B-Form', value: 'b_form' },
  { label: 'Birth Certificate', value: 'birth_certificate' },
  { label: 'Previous Result', value: 'previous_result' },
  { label: 'Other', value: 'other' },
];

export default function DocumentTypeSelect({ id, name, value, onChange, options = DEFAULT_DOC_TYPES, placeholder = 'Select', className = '' }) {
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
