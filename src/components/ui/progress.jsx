import React from 'react';

// Progress bar component - visual indicator of progress
export default function Progress({ 
  value = 0,
  max = 100,
  className = '',
  ...props
}) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  
  return (
    <div
      className={`
        relative h-2 w-full overflow-hidden rounded-full 
        bg-gray-200 dark:bg-gray-700
        ${className}
      `}
      {...props}
    >
      <div
        className="h-full bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-400 dark:to-blue-500 transition-all duration-300 ease-out"
        style={{ width: `${percentage}%` }}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
      />
    </div>
  );
}

// Named export for backward compatibility
export { Progress };
