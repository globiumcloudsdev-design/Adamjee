'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import FullPageLoader from '@/components/ui/full-page-loader';
import Input from '@/components/ui/input';
import { Search, BarChart3, TrendingUp, FolderOpen } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import apiClient from '@/lib/api-client';
import { API_ENDPOINTS } from '@/constants/api-endpoints';

// Tab component
const Tab = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
      active
        ? 'border-blue-500 text-blue-600'
        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
    }`}
  >
    {children}
  </button>
);

// Levels Tab Component
const LevelsTab = () => {
  const { user } = useAuth();
  const [levels, setLevels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  React.useEffect(() => {
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
    <div>
      <div className="mb-6">
        <Input
          placeholder="Search levels..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          icon={Search}
        />
      </div>

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
    </div>
  );
};

// Grades Tab Component
const GradesTab = () => {
  const { user } = useAuth();
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, pages: 0 });

  React.useEffect(() => {
    fetchGrades();
  }, [search, pagination.page]);

  const fetchGrades = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        search,
      };

      const response = await apiClient.get(API_ENDPOINTS.BRANCH_ADMIN.GRADES_VIEW.LIST, params);
      if (response.success) {
        setGrades(response.data.grades);
        setPagination(response.data.pagination);
      }
    } catch (error) {
      console.error('Error fetching grades:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading && grades.length === 0) {
    return <FullPageLoader message="Loading grades..." />;
  }

  return (
    <div>
      <div className="mb-6">
        <Input
          placeholder="Search grades..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          icon={Search}
        />
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Grade Number</TableHead>
            <TableHead>Code</TableHead>
            <TableHead>Level</TableHead>
            <TableHead>Academic Year</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {grades.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-gray-500">
                No grades found
              </TableCell>
            </TableRow>
          ) : (
            grades.map((grade) => (
              <TableRow key={grade._id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    {grade.name}
                  </div>
                </TableCell>
                <TableCell>
                  <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-700">
                    {grade.gradeNumber || 'N/A'}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-700">
                    {grade.code || 'N/A'}
                  </span>
                </TableCell>
                <TableCell>{grade.levelId?.name || 'N/A'}</TableCell>
                <TableCell>{grade.academicYear || 'N/A'}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <div className="flex justify-between items-center mt-4">
        <div className="text-sm text-gray-600">
          Showing {grades.length} of {pagination.total} grades
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
            disabled={pagination.page === 1}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
            disabled={pagination.page >= pagination.pages}
          >
            Next
          </Button>
        </div>
      </div>

      <div className="mt-4 text-sm text-gray-500 text-center">
        Grades are managed at coaching level by Super Admin
      </div>
    </div>
  );
};

// Streams Tab Component
const StreamsTab = () => {
  const { user } = useAuth();
  const [streams, setStreams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  React.useEffect(() => {
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
    <div>
      <div className="mb-6">
        <Input
          placeholder="Search streams..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          icon={Search}
        />
      </div>

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
    </div>
  );
};

export default function AcademicStructurePage() {
  const [activeTab, setActiveTab] = useState('levels');

  const tabs = [
    { id: 'levels', label: 'Levels', component: LevelsTab },
    { id: 'grades', label: 'Grades', component: GradesTab },
    { id: 'streams', label: 'Streams', component: StreamsTab },
  ];

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component;

  return (
    <div className="p-6">
      <Card>
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <CardTitle>Academic Structure</CardTitle>
            <div className="text-sm text-gray-500">Coaching-wide configuration</div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Tabs */}
          <div className="flex border-b border-gray-200 mb-6">
            {tabs.map((tab) => (
              <Tab
                key={tab.id}
                active={activeTab === tab.id}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </Tab>
            ))}
          </div>

          {/* Tab Content */}
          {ActiveComponent && <ActiveComponent />}
        </CardContent>
      </Card>
    </div>
  );
}
