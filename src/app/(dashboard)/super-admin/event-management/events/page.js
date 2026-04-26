'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import apiClient from '@/lib/api-client';
import { toast } from 'sonner';
import {
  Calendar,
  Plus,
  Edit,
  Trash2,
  Search,
  ChevronDown,
  Clock,
  MapPin,
  X,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import API_ENDPOINTS, { buildUrl } from '@/constants/api-endpoints';
import Input from '@/components/ui/input';
import BranchSelect from '@/components/ui/branch-select';
import Dropdown from '@/components/ui/dropdown';
import Modal from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import ButtonLoader from '@/components/ui/button-loader';
import FullPageLoader from '@/components/ui/full-page-loader';

export default function EventsListPage() {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    eventType: 'academic',
    startDate: '',
    endDate: '',
    startTime: '',
    endTime: '',
    location: '',
    branchId: '',
    allDay: false,
    status: 'scheduled',
  });

  useEffect(() => {
    // Fetch branches once
    fetchBranches();
  }, []);

  // Re-fetch events when filters change
  useEffect(() => {
    fetchEvents();
  }, [selectedBranch, selectedType, selectedStatus, search]);

  const fetchEvents = async () => {
    try {
      setLoading(true);

      const params = {
        limit: 500,
        ...(selectedBranch && { branchId: selectedBranch }),
        ...(selectedType && { eventType: selectedType }),
        ...(selectedStatus && { status: selectedStatus }),
        ...(search && { search }),
      };

      const response = await apiClient.get(API_ENDPOINTS.SUPER_ADMIN.EVENTS.LIST, { params });

      if (response.success) {
        // response.data may be { events, pagination } or an array depending on backend wrapper
        const payload = response.data || response.data?.events || response.data?.data || response;
        if (payload.events) setEvents(payload.events);
        else if (Array.isArray(payload)) setEvents(payload);
        else if (payload.data && Array.isArray(payload.data.events)) setEvents(payload.data.events);
        else setEvents(payload);
      }
    } catch (error) {
      toast.error('Failed to fetch events');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBranches = async () => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.SUPER_ADMIN.BRANCHES.LIST, { params: { limit: 100 } });
      if (response.success) setBranches(response.data.branches);
    } catch (error) {
      console.error('Failed to fetch branches:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // Normalize empty branch to null (global event)
      const payload = { ...formData, branchId: formData.branchId || null };

      if (!editingId) {
        // include createdBy only on create
        payload.createdBy = user?._id || user?.id || null;
      }

      if (editingId) {
        const response = await apiClient.put(buildUrl(API_ENDPOINTS.SUPER_ADMIN.EVENTS.UPDATE, { id: editingId }), payload);
        if (response.success) {
          toast.success('Event updated successfully');
        }
      } else {
        const response = await apiClient.post(API_ENDPOINTS.SUPER_ADMIN.EVENTS.CREATE, payload);
        if (response.success) {
          toast.success('Event created successfully');
        }
      }
      
      fetchEvents();
      handleCloseModal();
    } catch (error) {
      toast.error(error.message || 'Failed to save event');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this event?')) return;
    
    try {
      const response = await apiClient.delete(buildUrl(API_ENDPOINTS.SUPER_ADMIN.EVENTS.DELETE, { id }));
      
      if (response.success) {
        toast.success('Event deleted successfully');
        fetchEvents();
      }
    } catch (error) {
      toast.error('Failed to delete event');
      console.error(error);
    }
  };

  const handleEdit = (event) => {
    setEditingId(event._id);
    setFormData({
      title: event.title,
      description: event.description || '',
      eventType: event.eventType,
      startDate: event.startDate.split('T')[0],
      endDate: event.endDate.split('T')[0],
      startTime: event.startTime || '',
      endTime: event.endTime || '',
      location: event.location || '',
      branchId: event.branchId?._id || event.branchId || '',
      allDay: event.allDay || false,
      status: event.status,
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData({
      title: '',
      description: '',
      eventType: 'academic',
      startDate: '',
      endDate: '',
      startTime: '',
      endTime: '',
      location: '',
      branchId: '',
      allDay: false,
      status: 'scheduled',
    });
  };

  // Filter events
  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(search.toLowerCase());
    const eventBranchId = event.branchId?._id || event.branchId || '';
    const matchesBranch = !selectedBranch || eventBranchId === selectedBranch;
    const matchesType = !selectedType || event.eventType === selectedType;
    const matchesStatus = !selectedStatus || event.status === selectedStatus;
    
    return matchesSearch && matchesBranch && matchesType && matchesStatus;
  });

  const eventTypeColors = {
    academic: 'bg-blue-100 text-blue-800',
    holiday: 'bg-red-100 text-red-800',
    exam: 'bg-purple-100 text-purple-800',
    meeting: 'bg-yellow-100 text-yellow-800',
    sports: 'bg-green-100 text-green-800',
    cultural: 'bg-pink-100 text-pink-800',
    workshop: 'bg-indigo-100 text-indigo-800',
    seminar: 'bg-cyan-100 text-cyan-800',
    parent_teacher: 'bg-orange-100 text-orange-800',
    celebration: 'bg-rose-100 text-rose-800',
    other: 'bg-gray-100 text-gray-800',
  };

  const statusColors = {
    scheduled: 'bg-blue-100 text-blue-800',
    ongoing: 'bg-yellow-100 text-yellow-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
    postponed: 'bg-orange-100 text-orange-800',
  };

  // Stats
  const stats = [
    {
      label: 'Total Events',
      value: events.length,
      icon: Calendar,
      color: 'bg-blue-100 text-blue-600',
    },
    {
      label: 'Scheduled',
      value: events.filter(e => e.status === 'scheduled').length,
      icon: AlertCircle,
      color: 'bg-yellow-100 text-yellow-600',
    },
    {
      label: 'Completed',
      value: events.filter(e => e.status === 'completed').length,
      icon: CheckCircle,
      color: 'bg-green-100 text-green-600',
    },
  ];

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 pt-8">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Calendar className="h-7 w-7" />
          Events Management
        </h1>
        <p className="text-gray-600 mt-1">Create, edit, and manage coaching events</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                </div>
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <Icon className="h-6 w-6" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Controls */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
          <div>
            <Input
              label="Search Events"
              placeholder="Search by title..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              icon={Search}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Branch</label>
            <BranchSelect
              id="event-branch"
              name="branch"
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              branches={branches}
              placeholder="All Branches"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <Dropdown
              name="eventType"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              options={[
                { label: 'All Types', value: '' },
                { label: 'Academic', value: 'academic' },
                { label: 'Holiday', value: 'holiday' },
                { label: 'Exam', value: 'exam' },
                { label: 'Meeting', value: 'meeting' },
                { label: 'Sports', value: 'sports' },
                { label: 'Cultural', value: 'cultural' },
                { label: 'Workshop', value: 'workshop' },
                { label: 'Seminar', value: 'seminar' },
                { label: 'Parent-Teacher', value: 'parent_teacher' },
                { label: 'Celebration', value: 'celebration' },
              ]}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <Dropdown
              name="status"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              options={[
                { label: 'All Status', value: '' },
                { label: 'Scheduled', value: 'scheduled' },
                { label: 'Ongoing', value: 'ongoing' },
                { label: 'Completed', value: 'completed' },
                { label: 'Cancelled', value: 'cancelled' },
                { label: 'Postponed', value: 'postponed' },
              ]}
            />
          </div>

          <Button className="w-full flex items-center justify-center gap-2" onClick={() => setShowModal(true)}>
            <Plus className="h-5 w-5" />
            Add Event
          </Button>
        </div>
      </div>

      {/* Events Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <FullPageLoader message="Loading events..." />
        ) : filteredEvents.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No events found</div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <tr>
                  <TableHead>Event Title</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Branch</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </tr>
              </TableHeader>

              <TableBody>
                {filteredEvents.map((event) => (
                  <TableRow key={event._id}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-gray-900">{event.title}</p>
                        {event.description && (
                          <p className="text-gray-600 text-xs mt-1 line-clamp-1">{event.description}</p>
                        )}
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Calendar className="h-4 w-4" />
                        <div>
                          <p>{format(parseISO(event.startDate), 'MMM d, yyyy')}</p>
                          {event.startDate !== event.endDate && (
                            <p className="text-xs">to {format(parseISO(event.endDate), 'MMM d, yyyy')}</p>
                          )}
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${eventTypeColors[event.eventType] || eventTypeColors.other}`}>
                        {event.eventType.replace('_', ' ').toUpperCase()}
                      </span>
                    </TableCell>

                    <TableCell>
                      {event.location ? (
                        <div className="flex items-center gap-1 text-gray-600"><MapPin className="h-4 w-4" />{event.location}</div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>

                    <TableCell className="text-sm text-gray-900">{event.branchId?.name || 'All Branches'}</TableCell>

                    <TableCell>
                      <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${statusColors[event.status] || statusColors.scheduled}`}>{event.status.toUpperCase()}</span>
                    </TableCell>

                    <TableCell className="text-sm text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleEdit(event)} title="Edit">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => handleDelete(event._id)} title="Delete">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Event Modal */}
      <Modal open={showModal} onClose={handleCloseModal} title={editingId ? 'Edit Event' : 'Add New Event'} size="lg" closeOnBackdrop>
        <form onSubmit={handleSubmit} >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Input label="Event Title *" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="Event title" />
            </div>

            <div className="md:col-span-2">
              <Input label="Description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Brief description" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Event Type *</label>
              <Dropdown
                name="eventType"
                value={formData.eventType}
                onChange={(e) => setFormData({ ...formData, eventType: e.target.value })}
                options={[
                  { label: 'Academic', value: 'academic' },
                  { label: 'Holiday', value: 'holiday' },
                  { label: 'Exam', value: 'exam' },
                  { label: 'Meeting', value: 'meeting' },
                  { label: 'Sports', value: 'sports' },
                  { label: 'Cultural', value: 'cultural' },
                  { label: 'Workshop', value: 'workshop' },
                  { label: 'Seminar', value: 'seminar' },
                  { label: 'Parent-Teacher', value: 'parent_teacher' },
                  { label: 'Celebration', value: 'celebration' },
                  { label: 'Other', value: 'other' },
                ]}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Branch (optional)</label>
              <BranchSelect id="modal-branch" name="branch" value={formData.branchId} onChange={(e) => setFormData({ ...formData, branchId: e.target.value })} branches={branches} placeholder="All Branches (Global)" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
              <input type="date" required value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date *</label>
              <input type="date" required value={formData.endDate} onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2"><input type="checkbox" checked={formData.allDay} onChange={(e) => setFormData({ ...formData, allDay: e.target.checked })} className="mr-2" />All Day Event</label>
            </div>

            {!formData.allDay && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                  <input type="time" value={formData.startTime} onChange={(e) => setFormData({ ...formData, startTime: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                  <input type="time" value={formData.endTime} onChange={(e) => setFormData({ ...formData, endTime: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                </div>
              </>
            )}

            <div className="md:col-span-2">
                  <Input label="Location" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} placeholder="Location (optional)" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <Dropdown
                name="status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                options={[
                  { label: 'Scheduled', value: 'scheduled' },
                  { label: 'Ongoing', value: 'ongoing' },
                  { label: 'Completed', value: 'completed' },
                  { label: 'Cancelled', value: 'cancelled' },
                  { label: 'Postponed', value: 'postponed' },
                ]}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
            <Button variant="outline" type="button" onClick={handleCloseModal} disabled={isSubmitting}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <ButtonLoader /> : (editingId ? 'Update Event' : 'Create Event')}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
