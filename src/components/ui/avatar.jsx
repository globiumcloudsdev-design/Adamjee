import React from 'react';

// Avatar component - displays user profile picture or initials
function Avatar({ 
  className = '', 
  children,
  ...props 
}) {
  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden bg-gray-200 dark:bg-gray-700 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

// Avatar Image component
function AvatarImage({ 
  src, 
  alt = '',
  className = ''
}) {
  return (
    <img 
      src={src} 
      alt={alt}
      className={`h-full w-full object-cover ${className}`}
    />
  );
}

// Avatar Fallback component - shows when image is not available
function AvatarFallback({ 
  children,
  className = ''
}) {
  return (
    <div className={`flex items-center justify-center h-full w-full font-semibold ${className}`}>
      {children}
    </div>
  );
}

// Named exports
export { Avatar, AvatarImage, AvatarFallback };

// Default export
export default Avatar;
