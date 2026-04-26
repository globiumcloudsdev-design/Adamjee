'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Bell, Save, Mail, MessageSquare } from 'lucide-react';

export default function NotificationsPage() {
  const [settings, setSettings] = useState({
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    attendanceAlerts: true,
    feeReminders: true,
    examNotifications: true,
    eventReminders: true,
  });

  const handleSave = () => {
    toast.success('Notification settings saved successfully');
  };

  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="mb-4 sm:mb-6 pt-8">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Bell className="h-5 w-5 sm:h-6 sm:w-6" />
          Notification Settings
        </h1>
        <p className="text-sm sm:text-base text-gray-600 mt-1">Configure notification preferences</p>
      </div>

      {/* Settings Card */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
        <div className="space-y-6">
          {/* Notification Channels */}
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Notification Channels</h3>
            <div className="space-y-2 sm:space-y-3">
              <label className="flex items-start sm:items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.emailNotifications}
                  onChange={(e) => setSettings({...settings, emailNotifications: e.target.checked})}
                  className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mt-0.5 sm:mt-0 flex-shrink-0"
                />
                <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600 flex-shrink-0" />
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">Email Notifications</div>
                  <div className="text-xs text-gray-500 mt-0.5">Send notifications via email</div>
                </div>
              </label>

              <label className="flex items-start sm:items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.smsNotifications}
                  onChange={(e) => setSettings({...settings, smsNotifications: e.target.checked})}
                  className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mt-0.5 sm:mt-0 flex-shrink-0"
                />
                <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600 flex-shrink-0" />
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">SMS Notifications</div>
                  <div className="text-xs text-gray-500 mt-0.5">Send notifications via SMS</div>
                </div>
              </label>

              <label className="flex items-start sm:items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.pushNotifications}
                  onChange={(e) => setSettings({...settings, pushNotifications: e.target.checked})}
                  className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mt-0.5 sm:mt-0 flex-shrink-0"
                />
                <Bell className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600 flex-shrink-0" />
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">Push Notifications</div>
                  <div className="text-xs text-gray-500 mt-0.5">Send in-app push notifications</div>
                </div>
              </label>
            </div>
          </div>

          {/* Notification Types */}
          <div className="border-t border-gray-200 pt-4 sm:pt-6">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Notification Types</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
              <label className="flex items-center gap-2 p-2 sm:p-3 rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.attendanceAlerts}
                  onChange={(e) => setSettings({...settings, attendanceAlerts: e.target.checked})}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 flex-shrink-0"
                />
                <span className="text-sm text-gray-700">Attendance Alerts</span>
              </label>

              <label className="flex items-center gap-2 p-2 sm:p-3 rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.feeReminders}
                  onChange={(e) => setSettings({...settings, feeReminders: e.target.checked})}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 flex-shrink-0"
                />
                <span className="text-sm text-gray-700">Fee Payment Reminders</span>
              </label>

              <label className="flex items-center gap-2 p-2 sm:p-3 rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.examNotifications}
                  onChange={(e) => setSettings({...settings, examNotifications: e.target.checked})}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 flex-shrink-0"
                />
                <span className="text-sm text-gray-700">Exam Notifications</span>
              </label>

              <label className="flex items-center gap-2 p-2 sm:p-3 rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.eventReminders}
                  onChange={(e) => setSettings({...settings, eventReminders: e.target.checked})}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 flex-shrink-0"
                />
                <span className="text-sm text-gray-700">Event Reminders</span>
              </label>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end pt-4 sm:pt-6 border-t border-gray-200">
            <button
              onClick={handleSave}
              className="w-full sm:w-auto px-4 sm:px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 text-sm sm:text-base"
            >
              <Save className="h-4 w-4 sm:h-5 sm:w-5" />
              Save Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}