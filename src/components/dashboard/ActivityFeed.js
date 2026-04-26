'use client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, UserPlus, FileEdit, Trash2, Settings, DollarSign, User, Activity } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const activityIcons = {
  user_created: UserPlus,
  branch_updated: FileEdit,
  fee_collected: DollarSign,
  settings_changed: Settings,
  user_deleted: Trash2,
  default: User,
};

const activityColors = {
  user_created: 'text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400',
  branch_updated: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400',
  fee_collected: 'text-purple-600 bg-purple-50 dark:bg-purple-900/20 dark:text-purple-400',
  settings_changed: 'text-orange-600 bg-orange-50 dark:bg-orange-900/20 dark:text-orange-400',
  user_deleted: 'text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400',
  default: 'text-gray-600 bg-gray-50 dark:bg-gray-900/20 dark:text-gray-400',
};

export default function ActivityFeed({ activities }) {
  const defaultActivities = [
    {
      id: 1,
      type: 'user_created',
      user: 'Ahmed Ali',
      action: 'created a new branch admin',
      target: 'North Branch',
      timestamp: new Date(Date.now() - 1000 * 60 * 5),
      branch: 'Main Campus',
    },
    {
      id: 2,
      type: 'branch_updated',
      user: 'Sara Khan',
      action: 'updated branch information',
      target: 'South Branch',
      timestamp: new Date(Date.now() - 1000 * 60 * 15),
      branch: 'South Branch',
    },
    {
      id: 3,
      type: 'fee_collected',
      user: 'System',
      action: 'processed fee payment',
      target: '₨25,000',
      timestamp: new Date(Date.now() - 1000 * 60 * 30),
      branch: 'East Branch',
    },
    {
      id: 4,
      type: 'settings_changed',
      user: 'Admin',
      action: 'modified system settings',
      target: 'Academic Year Configuration',
      timestamp: new Date(Date.now() - 1000 * 60 * 45),
      branch: 'System',
    },
    {
      id: 5,
      type: 'user_created',
      user: 'Fatima Ahmed',
      action: 'enrolled a new student',
      target: 'Grade 5-A',
      timestamp: new Date(Date.now() - 1000 * 60 * 60),
      branch: 'North Branch',
    },
    {
      id: 6,
      type: 'branch_updated',
      user: 'Hassan Raza',
      action: 'updated fee structure',
      target: 'Monthly Fees',
      timestamp: new Date(Date.now() - 1000 * 60 * 90),
      branch: 'Main Campus',
    },
  ];

  const activityList = activities || defaultActivities;

  return (
    <Card className="hover:shadow-xl transition-all duration-300 border-0 shadow-lg bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900">
      <CardHeader className="pb-6">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Activity className="h-6 w-6 text-indigo-600" />
            Recent Activity
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            className="text-sm hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors duration-200"
          >
            View All
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 max-h-[600px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
          {activityList.map((activity, index) => {
            const Icon = activityIcons[activity.type] || activityIcons.default;
            const colorClass = activityColors[activity.type] || activityColors.default;

            return (
              <div
                key={activity.id}
                className="group flex items-start space-x-4 pb-6 border-b last:border-b-0 border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 p-4 rounded-lg transition-all duration-200"
              >
                <div className={`p-3 rounded-xl ${colorClass} shadow-sm group-hover:scale-105 transition-transform duration-200`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        <span className="font-semibold text-indigo-600 dark:text-indigo-400">{activity.user}</span>{' '}
                        <span className="text-gray-700 dark:text-gray-300">{activity.action}</span>
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        <span className="font-medium text-gray-900 dark:text-white">{activity.target}</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center space-x-3">
                      <span className="inline-flex items-center text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
                        <Clock className="h-3 w-3 mr-1" />
                        {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400 bg-indigo-100 dark:bg-indigo-900/30 px-3 py-1 rounded-full font-medium">
                      {activity.branch}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Activity Summary */}
        <div className="mt-6 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 p-4 rounded-xl border border-indigo-100 dark:border-indigo-800">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-lg font-bold text-indigo-600">{activityList.filter(a => a.type === 'user_created').length}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">New Users</p>
            </div>
            <div>
              <p className="text-lg font-bold text-blue-600">{activityList.filter(a => a.type === 'branch_updated').length}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Updates</p>
            </div>
            <div>
              <p className="text-lg font-bold text-purple-600">{activityList.filter(a => a.type === 'fee_collected').length}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Payments</p>
            </div>
            <div>
              <p className="text-lg font-bold text-orange-600">{activityList.filter(a => a.type === 'settings_changed').length}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Settings</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
