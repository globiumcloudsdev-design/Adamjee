import React from 'react';

// Separator component - dividing line for visual separation
export default function Separator({ 
  className = '',
  orientation = 'horizontal',
  ...props
}) {
  const isHorizontal = orientation === 'horizontal';
  
  return (
    <div
      className={`
        ${isHorizontal 
          ? 'h-px w-full bg-gray-200 dark:bg-gray-700' 
          : 'h-full w-px bg-gray-200 dark:bg-gray-700'
        }
        ${className}
      `}
      {...props}
    />
  );
}

// Named export for backward compatibility
export { Separator };
