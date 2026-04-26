import React from 'react';

export default function ButtonLoader({ size = 4 }) {
  return (
    <div className="flex items-center">
      <div className={`w-${size} h-${size} border-2 border-white border-t-transparent rounded-full animate-spin`}></div>
    </div>
  );
}
