'use client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, AlertCircle, Info, CheckCircle, X, Shield, Clock } from 'lucide-react';
import { useState } from 'react';

const alertIcons = {
  high: AlertTriangle,
  medium: AlertCircle,
  low: Info,
};

const alertColors = {
  high: {
    bg: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
    icon: 'text-red-600 dark:text-red-400',
    badge: 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-300',
    hover: 'hover:bg-red-100 dark:hover:bg-red-900/30',
  },
  medium: {
    bg: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
    icon: 'text-yellow-600 dark:text-yellow-400',
    badge: 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-300',
    hover: 'hover:bg-yellow-100 dark:hover:bg-yellow-900/30',
  },
  low: {
    bg: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
    icon: 'text-blue-600 dark:text-blue-400',
    badge: 'bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300',
    hover: 'hover:bg-blue-100 dark:hover:bg-blue-900/30',
  },
};

export default function SystemAlerts({ alerts }) {
  const [dismissedAlerts, setDismissedAlerts] = useState([]);

  const defaultAlerts = [
    {
      id: 1,
      priority: 'high',
      category: 'System',
      title: 'High Server Load Detected',
      message: 'Server CPU usage exceeded 85% in the last hour',
      timestamp: new Date(Date.now() - 1000 * 60 * 10),
      actionRequired: true,
    },
    {
      id: 2,
      priority: 'high',
      category: 'Financial',
      title: 'Low Fee Collection Rate',
      message: 'South Branch fee collection below 70% for this month',
      timestamp: new Date(Date.now() - 1000 * 60 * 30),
      actionRequired: true,
    },
    {
      id: 3,
      priority: 'medium',
      category: 'Academic',
      title: 'Attendance Alert',
      message: '15 students with attendance below 75% this month',
      timestamp: new Date(Date.now() - 1000 * 60 * 45),
      actionRequired: true,
    },
    {
      id: 4,
      priority: 'medium',
      category: 'System',
      title: 'Backup Pending',
      message: 'Database backup not completed in last 24 hours',
      timestamp: new Date(Date.now() - 1000 * 60 * 60),
      actionRequired: false,
    },
    {
      id: 5,
      priority: 'low',
      category: 'User',
      title: 'Inactive Accounts',
      message: '8 admin accounts haven\'t logged in for 30+ days',
      timestamp: new Date(Date.now() - 1000 * 60 * 120),
      actionRequired: false,
    },
  ];

  const alertList = (alerts || defaultAlerts).filter(
    (alert) => !dismissedAlerts.includes(alert.id)
  );

  const handleDismiss = (alertId) => {
    setDismissedAlerts([...dismissedAlerts, alertId]);
  };

  const handleAcknowledge = (alertId) => {
    console.log('Acknowledged alert:', alertId);
    // TODO: API call to acknowledge alert
  };

  const highPriorityCount = alertList.filter((a) => a.priority === 'high').length;
  const mediumPriorityCount = alertList.filter((a) => a.priority === 'medium').length;
  const lowPriorityCount = alertList.filter((a) => a.priority === 'low').length;

  return (
    <Card className="hover:shadow-xl transition-all duration-300 border-0 shadow-lg bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900">
      <CardHeader className="pb-6">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Shield className="h-6 w-6 text-red-600" />
            System Alerts
          </CardTitle>
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2 text-xs">
              {highPriorityCount > 0 && (
                <span className="bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-300 px-2 py-1 rounded-full font-medium">
                  {highPriorityCount} High
                </span>
              )}
              {mediumPriorityCount > 0 && (
                <span className="bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-300 px-2 py-1 rounded-full font-medium">
                  {mediumPriorityCount} Medium
                </span>
              )}
              {lowPriorityCount > 0 && (
                <span className="bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 px-2 py-1 rounded-full font-medium">
                  {lowPriorityCount} Low
                </span>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 max-h-[600px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
          {alertList.length === 0 ? (
            <div className="text-center py-12 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border border-green-100 dark:border-green-800">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <p className="text-lg font-semibold text-gray-900 dark:text-white">No active alerts</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">System is running smoothly</p>
            </div>
          ) : (
            alertList.map((alert) => {
              const Icon = alertIcons[alert.priority];
              const colors = alertColors[alert.priority];

              return (
                <div
                  key={alert.id}
                  className={`${colors.bg} border rounded-xl p-5 relative group hover:shadow-md transition-all duration-200 ${colors.hover}`}
                >
                  <button
                    onClick={() => handleDismiss(alert.id)}
                    className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors duration-200 opacity-0 group-hover:opacity-100"
                  >
                    <X className="h-4 w-4" />
                  </button>

                  <div className="flex items-start space-x-4 mb-3">
                    <div className="flex-shrink-0">
                      <div className={`p-3 rounded-xl bg-white dark:bg-gray-800 shadow-sm`}>
                        <Icon className={`h-6 w-6 ${colors.icon}`} />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className={`text-xs font-bold px-3 py-1 rounded-full ${colors.badge} shadow-sm`}>
                          {alert.priority.toUpperCase()}
                        </span>
                        <span className="text-xs bg-white dark:bg-gray-800 px-3 py-1 rounded-full border border-gray-200 dark:border-gray-600 font-medium text-gray-700 dark:text-gray-300">
                          {alert.category}
                        </span>
                      </div>
                      <h4 className="text-base font-bold text-gray-900 dark:text-white mb-2 leading-tight">
                        {alert.title}
                      </h4>
                      <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{alert.message}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-200 dark:border-gray-600">
                    <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                      <Clock className="h-4 w-4 mr-1" />
                      {alert.timestamp.toLocaleString()}
                    </div>
                    {alert.actionRequired && (
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-red-600 dark:text-red-400 font-medium">Action Required</span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAcknowledge(alert.id)}
                          className="text-xs h-8 px-3 border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
                        >
                          Acknowledge
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Alert Summary */}
        {alertList.length > 0 && (
          <div className="mt-6 bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-800 dark:to-slate-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-lg font-bold text-red-600">{highPriorityCount}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Critical</p>
              </div>
              <div>
                <p className="text-lg font-bold text-yellow-600">{mediumPriorityCount}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Warning</p>
              </div>
              <div>
                <p className="text-lg font-bold text-blue-600">{lowPriorityCount}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Info</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
