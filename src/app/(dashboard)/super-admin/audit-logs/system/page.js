'use client';

import { useState, useEffect } from 'react';
import { Cog, Filter, Download, Search, AlertTriangle, Info, XCircle } from 'lucide-react';
import { format } from 'date-fns';

export default function SystemLogsPage() {
  const [logs, setLogs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState('');

  useEffect(() => {
    setLogs([
      { id: 1, level: 'error', message: 'Database connection timeout', module: 'Database', timestamp: new Date(), details: 'Connection pool exhausted' },
      { id: 2, level: 'warning', message: 'High memory usage detected', module: 'System', timestamp: new Date(Date.now() - 1800000), details: '85% memory utilized' },
      { id: 3, level: 'info', message: 'Backup completed successfully', module: 'Backup', timestamp: new Date(Date.now() - 3600000), details: 'Full backup to S3' },
      { id: 4, level: 'error', message: 'Failed to send email notification', module: 'Email', timestamp: new Date(Date.now() - 5400000), details: 'SMTP server unreachable' },
      { id: 5, level: 'info', message: 'System update installed', module: 'System', timestamp: new Date(Date.now() - 7200000), details: 'Version 2.1.0' },
    ]);
  }, []);

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.module.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLevel = !levelFilter || log.level === levelFilter;
    return matchesSearch && matchesLevel;
  });

  const getLevelIcon = (level) => {
    switch (level) {
      case 'error':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'info':
        return <Info className="h-5 w-5 text-blue-600" />;
      default:
        return <Info className="h-5 w-5 text-gray-600" />;
    }
  };

  const getLevelColor = (level) => {
    switch (level) {
      case 'error':
        return 'bg-red-50 text-red-800 border-red-200';
      case 'warning':
        return 'bg-yellow-50 text-yellow-800 border-yellow-200';
      case 'info':
        return 'bg-blue-50 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-50 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Cog className="h-7 w-7" />
          System Logs
        </h1>
        <p className="text-gray-600 mt-1">Monitor system events and errors</p>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search system logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Levels</option>
            <option value="error">Error</option>
            <option value="warning">Warning</option>
            <option value="info">Info</option>
          </select>

          <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {filteredLogs.map((log) => (
          <div key={log.id} className={`bg-white rounded-lg shadow-sm border p-4 ${getLevelColor(log.level)}`}>
            <div className="flex items-start gap-3">
              {getLevelIcon(log.level)}
              <div className="flex-1">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">{log.message}</h3>
                    <p className="text-xs text-gray-600 mt-1">Module: {log.module}</p>
                  </div>
                  <span className="text-xs text-gray-500 whitespace-nowrap">
                    {format(log.timestamp, 'dd MMM yyyy HH:mm:ss')}
                  </span>
                </div>
                {log.details && (
                  <p className="text-xs text-gray-600 bg-white bg-opacity-50 p-2 rounded">
                    {log.details}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
