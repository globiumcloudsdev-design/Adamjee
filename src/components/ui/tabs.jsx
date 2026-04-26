/**
 * Tabs Component
 * - Responsive tab navigation with active state
 * - Supports icons and badges
 * - Mobile-friendly horizontal scroll
 */

export default function Tabs({ tabs, activeTab, onChange, className = '' }) {
  return (
    <div className={`border-b border-gray-200 ${className}`}>
      <div className="flex overflow-x-auto scrollbar-hide">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`
              relative px-4 py-3 text-sm font-medium whitespace-nowrap
              transition-colors duration-200 flex items-center gap-2
              ${
                activeTab === tab.id
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }
            `}
          >
            {tab.icon && <span className="h-5 w-5">{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.badge && (
              <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-600 rounded-full">
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

// Tab Panel Component for content
export function TabPanel({ value, activeTab, children }) {
  if (value !== activeTab) return null;
  return <div className="py-4">{children}</div>;
}
