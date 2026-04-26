'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import FullPageLoader from '@/components/ui/full-page-loader';
import Input from '@/components/ui/input';
import { Search, BarChart3 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import apiClient from '@/lib/api-client';
import { API_ENDPOINTS } from '@/constants/api-endpoints';

export default function LevelsPage() {
  const { user } = useAuth();
  const [levels, setLevels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchLevels();
  }, [search]);

  const fetchLevels = async () => {
    try {
      setLoading(true);
      const params = { search };

      const response = await apiClient.get(API_ENDPOINTS.BRANCH_ADMIN.LEVELS.LIST, params);
      if (response.success) {
        setLevels(response.data);
      }
    } catch (error) {
      console.error('Error fetching levels:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <FullPageLoader message="Loading levels..." />;
  }

  return (
    <div className="p-6">
      <Card>
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <CardTitle>Academic Levels (Read-Only)</CardTitle>
            <div className="text-sm text-gray-500">Coaching-wide configuration</div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Search */}
          <div className="mb-6">
            <Input
              placeholder="Search levels..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              icon={Search}
            />
          </div>

          {/* Table */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Order</TableHead>
                <TableHead>Description</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {levels.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-gray-500">
                    No levels found
                  </TableCell>
                </TableRow>
              ) : (
                levels.map((level) => (
                  <TableRow key={level._id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <BarChart3 className="w-4 h-4" />
                        {level.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-700">
                        {level.code || 'N/A'}
                      </span>
                    </TableCell>
                    <TableCell>{level.order}</TableCell>
                    <TableCell className="text-sm text-gray-600">{level.description || 'N/A'}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          <div className="mt-4 text-sm text-gray-500 text-center">
            Levels are managed at coaching level by Super Admin
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
