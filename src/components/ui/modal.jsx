import React from 'react';

/**
 * Modal
 * - Responsive and scrollable when content is large.
 * - Header and footer are sticky so actions remain visible.
 * - Props:
 *    open: boolean
 *    onClose: function
 *    title: string or node
 *    children: content (can be long)
 *    footerClassName: optional classes applied to footer
 *    className: extra classes for dialog
 *    size: 'sm' | 'md' | 'lg' | 'xl' (controls max width)
 */
export default function Modal({ open, onClose, title, children, footerClassName = '', className = '', size = 'md', footer = null, closeOnBackdrop = true }) {
  if (!open) return null;

  const sizeClass = {
    sm: 'max-w-lg',
    md: 'max-w-3xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
  }[size] || 'max-w-3xl';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40"
        onClick={closeOnBackdrop ? onClose : undefined}
      />

      {/* Dialog container: limit height and allow internal scrolling */}
      <div
        className={`relative w-full ${sizeClass} mx-auto ${className}`}
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden flex flex-col max-h-[calc(100vh-4rem)]">
          {/* Header (sticky) */}
          <div className="sticky top-0 z-20 bg-white dark:bg-gray-800 border-b px-6 py-4 flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">{title}</h3>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-300">✕</button>
          </div>

          {/* Content: scrollable when tall */}
          <div className="p-6 overflow-y-auto">
            {children}
          </div>

          {/* Footer (sticky) */}
          <div className={`px-6 py-3 border-t bg-gray-50 dark:bg-gray-900 ${footerClassName}`}>
            {footer}
          </div>
        </div>
      </div>
    </div>
  );
}
