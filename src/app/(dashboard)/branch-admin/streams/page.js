'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import FullPageLoader from '@/components/ui/full-page-loader';
import Input from '@/components/ui/input';
import { Search, FolderOpen } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import apiClient from '@/lib/api-client';
import { API_ENDPOINTS } from '@/constants/api-endpoints';

export default function StreamsPage() {
  const { user } = useAuth();
  const [streams, setStreams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchStreams();
  }, [search]);

  const fetchStreams = async () => {
    try {
      setLoading(true);
      const params = { search };

      const response = await apiClient.get(API_ENDPOINTS.BRANCH_ADMIN.STREAMS.LIST, params);
      if (response.success) {
        setStreams(response.data);
      }
    } catch (error) {
      console.error('Error fetching streams:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <FullPageLoader message="Loading streams..." />;
  }

  return (
    <div className="p-6">
      <Card>
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <CardTitle>Academic Streams (Read-Only)</CardTitle>
            <div className="text-sm text-gray-500">Coaching-wide configuration</div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Search */}
          <div className="mb-6">
            <Input
              placeholder="Search streams..."
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
                <TableHead>Description</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {streams.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-gray-500">
                    No streams found
                  </TableCell>
                </TableRow>
              ) : (
                streams.map((stream) => (
                  <TableRow key={stream._id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <FolderOpen className="w-4 h-4" />
                        {stream.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-700">
                        {stream.code || 'N/A'}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">{stream.description || 'N/A'}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          <div className="mt-4 text-sm text-gray-500 text-center">
            Streams are managed at coaching level by Super Admin
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
