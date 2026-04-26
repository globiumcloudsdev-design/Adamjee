'use client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Plus, UserPlus, Settings, FileSearch, Bell, Zap, BarChart3, Users, Shield, Database } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function QuickActions() {
  const router = useRouter();

  const actions = [
    {
      id: 'generate-report',
      label: 'Generate Report',
      icon: BarChart3,
      color: 'bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700',
      shadowColor: 'shadow-blue-500/25',
      action: () => router.push('/super-admin/analytics/financial'),
    },
    {
      id: 'add-branch',
      label: 'Add New Branch',
      icon: Plus,
      color: 'bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700',
      shadowColor: 'shadow-green-500/25',
      action: () => router.push('/super-admin/branches'),
    },
    {
      id: 'create-admin',
      label: 'Create Admin',
      icon: UserPlus,
      color: 'bg-gradient-to-br from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700',
      shadowColor: 'shadow-purple-500/25',
      action: () => router.push('/super-admin/user-management/administrators'),
    },
    {
      id: 'system-settings',
      label: 'System Settings',
      icon: Settings,
      color: 'bg-gradient-to-br from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700',
      shadowColor: 'shadow-orange-500/25',
      action: () => router.push('/super-admin/configuration/general'),
    },
    {
      id: 'audit-logs',
      label: 'View Audit Logs',
      icon: FileSearch,
      color: 'bg-gradient-to-br from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700',
      shadowColor: 'shadow-indigo-500/25',
      action: () => router.push('/super-admin/audit-logs/activity'),
    },
    {
      id: 'notifications',
      label: 'Notification Center',
      icon: Bell,
      color: 'bg-gradient-to-br from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700',
      shadowColor: 'shadow-pink-500/25',
      action: () => router.push('/super-admin/notifications'),
    },
  ];

  const quickStats = [
    { label: 'Active Users', value: '1,247', icon: Users, color: 'text-blue-600' },
    { label: 'System Health', value: '98%', icon: Shield, color: 'text-green-600' },
    { label: 'Database Size', value: '2.4GB', icon: Database, color: 'text-purple-600' },
  ];

  return (
    <Card className="hover:shadow-xl transition-all duration-300 border-0 shadow-lg bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900">
      <CardHeader className="pb-6">
        <CardTitle className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Zap className="h-6 w-6 text-yellow-600" />
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {quickStats.map((stat, index) => (
            <div key={index} className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                </div>
                <stat.icon className={`h-8 w-8 ${stat.color}`} />
              </div>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <Button
                key={action.id}
                onClick={action.action}
                className={`${action.color} ${action.shadowColor} text-white flex flex-col items-center justify-center h-28 space-y-3 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 border-0`}
              >
                <Icon className="h-7 w-7" />
                <span className="text-sm font-semibold text-center leading-tight">{action.label}</span>
              </Button>
            );
          })}
        </div>

        {/* Recent Actions */}
        <div className="bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-800 dark:to-slate-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <FileText className="h-4 w-4 text-blue-600" />
            Recent Actions
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between text-gray-600 dark:text-gray-400">
              <span>Generated monthly report</span>
              <span className="text-xs">2 hours ago</span>
            </div>
            <div className="flex items-center justify-between text-gray-600 dark:text-gray-400">
              <span>Created new branch admin</span>
              <span className="text-xs">5 hours ago</span>
            </div>
            <div className="flex items-center justify-between text-gray-600 dark:text-gray-400">
              <span>Updated system settings</span>
              <span className="text-xs">1 day ago</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
