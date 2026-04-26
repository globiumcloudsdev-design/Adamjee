'use client';
import { Building2, Users, DollarSign, Activity, UserCheck, TrendingUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function HeaderStats({ stats }) {
  const statsConfig = [
    {
      id: 'branches',
      title: 'Total Branches',
      value: stats?.totalBranches || 0,
      subtitle: `${stats?.activeBranches || 0} Active / ${stats?.inactiveBranches || 0} Inactive`,
      icon: Building2,
      color: 'bg-blue-500',
      trend: stats?.branchGrowth || 0,
    },
    {
      id: 'students',
      title: 'Total Students',
      value: stats?.totalStudents || 0,
      subtitle: `+${stats?.studentGrowth || 0}% this month`,
      icon: Users,
      color: 'bg-green-500',
      trend: stats?.studentGrowth || 0,
    },
    {
      id: 'revenue',
      title: 'Total Revenue',
      value: `₨${(stats?.totalRevenue || 0).toLocaleString()}`,
      subtitle: `${stats?.revenueChange > 0 ? '+' : ''}${stats?.revenueChange || 0}% vs last month`,
      icon: DollarSign,
      color: 'bg-purple-500',
      trend: stats?.revenueChange || 0,
    },
    {
      id: 'systemHealth',
      title: 'System Health',
      value: `${stats?.systemUptime || 99.9}%`,
      subtitle: 'Uptime this month',
      icon: Activity,
      color: 'bg-orange-500',
      trend: 0,
    },
    {
      id: 'activeSessions',
      title: 'Active Sessions',
      value: stats?.activeSessions || 0,
      subtitle: `Peak: ${stats?.peakSessions || 0}`,
      icon: UserCheck,
      color: 'bg-indigo-500',
      trend: stats?.sessionChange || 0,
    },
    {
      id: 'feeCollection',
      title: 'Fee Collection Rate',
      value: `${stats?.feeCollectionRate || 0}%`,
      subtitle: `₨${(stats?.collectedAmount || 0).toLocaleString()} collected`,
      icon: TrendingUp,
      color: 'bg-pink-500',
      trend: stats?.collectionChange || 0,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 md:gap-4 mb-6">
      {statsConfig.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-3 md:p-4">
              <div className="flex items-start justify-between mb-2 md:mb-3">
                <div className={`${stat.color} p-2 md:p-3 rounded-lg`}>
                  <Icon className="h-4 w-4 md:h-5 md:w-5 text-white" />
                </div>
                {stat.trend !== 0 && (
                  <span
                    className={`text-xs font-semibold px-1.5 md:px-2 py-0.5 md:py-1 rounded ${
                      stat.trend > 0
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {stat.trend > 0 ? '+' : ''}{stat.trend}%
                  </span>
                )}
              </div>
              <div>
                <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 mb-1">
                  {stat.title}
                </p>
                <p className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-1">
                  {stat.value}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  {stat.subtitle}
                </p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
