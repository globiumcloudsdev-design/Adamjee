'use client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, DollarSign, GraduationCap, Cpu, Users2 } from 'lucide-react';

export default function PerformanceMetrics({ metrics }) {
  const cards = [
    {
      id: 'financial',
      title: 'Financial Performance',
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      metrics: [
        { label: 'Monthly Revenue', value: `₨${(metrics?.monthlyRevenue || 0).toLocaleString()}`, change: metrics?.revenueGrowth || 0 },
        { label: 'Collection Efficiency', value: `${metrics?.collectionEfficiency || 0}%`, change: metrics?.efficiencyChange || 0 },
        { label: 'Outstanding Amount', value: `₨${(metrics?.outstandingAmount || 0).toLocaleString()}`, change: metrics?.outstandingChange || 0 },
      ],
    },
    {
      id: 'academic',
      title: 'Academic Performance',
      icon: GraduationCap,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      metrics: [
        { label: 'Average Attendance', value: `${metrics?.avgAttendance || 0}%`, change: metrics?.attendanceChange || 0 },
        { label: 'Pass Percentage', value: `${metrics?.passPercentage || 0}%`, change: metrics?.passChange || 0 },
        { label: 'Active Students', value: metrics?.activeStudents || 0, change: metrics?.studentChange || 0 },
      ],
    },
    {
      id: 'system',
      title: 'System Performance',
      icon: Cpu,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      metrics: [
        { label: 'API Response Time', value: `${metrics?.apiResponseTime || 0}ms`, change: metrics?.responseChange || 0 },
        { label: 'System Uptime', value: `${metrics?.systemUptime || 99.9}%`, change: 0 },
        { label: 'Active Users', value: metrics?.activeUsers || 0, change: metrics?.userChange || 0 },
      ],
    },
    {
      id: 'engagement',
      title: 'User Engagement',
      icon: Users2,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      metrics: [
        { label: 'Daily Active Users', value: metrics?.dailyActiveUsers || 0, change: metrics?.dauChange || 0 },
        { label: 'Login Success Rate', value: `${metrics?.loginSuccessRate || 0}%`, change: metrics?.loginChange || 0 },
        { label: 'Avg Session Duration', value: `${metrics?.avgSessionDuration || 0}min`, change: metrics?.sessionChange || 0 },
      ],
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2 md:pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs md:text-sm font-medium text-gray-700">
                  {card.title}
                </CardTitle>
                <div className={`${card.bgColor} p-1.5 md:p-2 rounded-lg`}>
                  <Icon className={`h-3 w-3 md:h-4 md:w-4 ${card.color}`} />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 md:space-y-3">
              {card.metrics.map((metric, idx) => (
                <div key={idx} className="flex items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500 truncate">{metric.label}</p>
                    <p className="text-base md:text-lg font-semibold text-gray-900">{metric.value}</p>
                  </div>
                  {metric.change !== 0 && (
                    <div className="flex items-center flex-shrink-0">
                      {metric.change > 0 ? (
                        <TrendingUp className="h-3 w-3 md:h-4 md:w-4 text-green-600" />
                      ) : (
                        <TrendingDown className="h-3 w-3 md:h-4 md:w-4 text-red-600" />
                      )}
                      <span
                        className={`ml-1 text-xs font-medium ${
                          metric.change > 0 ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {Math.abs(metric.change)}%
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
