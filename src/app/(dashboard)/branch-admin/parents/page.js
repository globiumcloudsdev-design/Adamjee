'use client';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import ButtonLoader from '@/components/ui/button-loader';
import FullPageLoader from '@/components/ui/full-page-loader';
import apiClient from '@/lib/api-client';
import { API_ENDPOINTS } from '@/constants/api-endpoints';
import { CheckCircle, Eye, User, Phone, Mail, MapPin, Calendar, Search, Filter, RefreshCw, Users, Clock, CheckCircle2, CheckSquare, Square, X } from 'lucide-react';
import { toast } from 'sonner';
import Modal from '@/components/ui/modal';
import Tabs, { TabPanel } from '@/components/ui/tabs';

export default function ParentsPage() {
  const [allParents, setAllParents] = useState([]);
  const [pendingParents, setPendingParents] = useState([]);
  const [filteredParents, setFilteredParents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [approving, setApproving] = useState(null);
  const [selectedParent, setSelectedParent] = useState(null);
  const [selectedParents, setSelectedParents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [rejecting, setRejecting] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [checkingMatches, setCheckingMatches] = useState(null);
  const [childrenMatches, setChildrenMatches] = useState({});
  const [selectedChildIds, setSelectedChildIds] = useState({});

  const tabs = [
    { id: 'all', label: 'All Parents', badge: allParents.length },
    { id: 'pending', label: 'Pending Parents', badge: pendingParents.length },
  ];

  useEffect(() => {
    loadParents();
  }, []);

  useEffect(() => {
    if (activeTab === 'all') {
      const filtered = allParents.filter(parent =>
        parent.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        parent.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredParents(filtered);
    } else {
      const filtered = pendingParents.filter(parent =>
        parent.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        parent.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredParents(filtered);
    }
  }, [allParents, pendingParents, searchTerm, activeTab]);

  const loadParents = async () => {
    try {
      setLoading(true);
      const [allResponse, pendingResponse] = await Promise.all([
        apiClient.get(API_ENDPOINTS.BRANCH_ADMIN.PARENTS),
        apiClient.get(API_ENDPOINTS.BRANCH_ADMIN.PENDING_PARENTS)
      ]);
      if (allResponse) {
        setAllParents(allResponse.parents || []);
      }
      if (pendingResponse) {
        setPendingParents(pendingResponse.parents || []);
      }
    } catch (error) {
      console.error('Failed to load parents:', error);
      toast.error('Failed to load parents');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (parentId) => {
    try {
      setApproving(parentId);
      
      // Get selected children mapping
      const childrenMapping = selectedChildIds[parentId] || {};
      
      const response = await apiClient.post(
        API_ENDPOINTS.BRANCH_ADMIN.APPROVE_PARENT.replace(':id', parentId),
        { childrenMapping }
      );

      if (response?.success) {
        toast.success('Parent approved successfully');
        setAllParents(allParents.map(p => p._id === parentId ? { ...p, approved: true } : p));
        setPendingParents(pendingParents.filter(p => p._id !== parentId));
        setSelectedParents(selectedParents.filter(id => id !== parentId));
        setSelectedParent(null); // Close modal
        
        // Clear matching data for this parent
        setChildrenMatches(prev => {
          const updated = { ...prev };
          delete updated[parentId];
          return updated;
        });
        setSelectedChildIds(prev => {
          const updated = { ...prev };
          delete updated[parentId];
          return updated;
        });
      } else {
        toast.error(response?.error || 'Failed to approve parent');
      }
    } catch (error) {
      console.error('Failed to approve parent:', error);
      toast.error('Failed to approve parent');
    } finally {
      setApproving(null);
    }
  };

  const handleBulkApprove = async () => {
    if (selectedParents.length === 0) {
      toast.error('Please select parents to approve');
      return;
    }

    try {
      setApproving('bulk');
      const promises = selectedParents.map(parentId => {
        const childrenMapping = selectedChildIds[parentId] || {};
        return apiClient.post(
          API_ENDPOINTS.BRANCH_ADMIN.APPROVE_PARENT.replace(':id', parentId),
          { childrenMapping }
        );
      });

      const results = await Promise.all(promises);
      const successCount = results.filter(r => r?.success).length;

      if (successCount > 0) {
        toast.success(`${successCount} parent(s) approved successfully`);
        setAllParents(allParents.map(p => selectedParents.includes(p._id) ? { ...p, approved: true } : p));
        setPendingParents(pendingParents.filter(p => !selectedParents.includes(p._id)));
        setSelectedParents([]);
        
        // Clear matching data for approved parents
        setChildrenMatches(prev => {
          const updated = { ...prev };
          selectedParents.forEach(id => delete updated[id]);
          return updated;
        });
        setSelectedChildIds(prev => {
          const updated = { ...prev };
          selectedParents.forEach(id => delete updated[id]);
          return updated;
        });
      } else {
        toast.error('Failed to approve selected parents');
      }
    } catch (error) {
      console.error('Failed to bulk approve parents:', error);
      toast.error('Failed to approve selected parents');
    } finally {
      setApproving(null);
    }
  };

  const handleReject = async (parentId) => {
    if (!rejectReason.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }

    try {
      setRejecting(parentId);
      const response = await apiClient.post(
        API_ENDPOINTS.BRANCH_ADMIN.REJECT_PARENT.replace(':id', parentId),
        { reason: rejectReason }
      );

      if (response?.success) {
        toast.success('Parent rejected successfully');
        setAllParents(allParents.filter(p => p._id !== parentId));
        setPendingParents(pendingParents.filter(p => p._id !== parentId));
        setSelectedParents(selectedParents.filter(id => id !== parentId));
        setShowRejectInput(false);
        setRejectReason('');
      } else {
        toast.error(response?.error || 'Failed to reject parent');
      }
    } catch (error) {
      console.error('Failed to reject parent:', error);
      toast.error('Failed to reject parent');
    } finally {
      setRejecting(null);
    }
  };

  const handleSelectParent = (parentId) => {
    setSelectedParents(prev =>
      prev.includes(parentId)
        ? prev.filter(id => id !== parentId)
        : [...prev, parentId]
    );
  };

  const handleSelectAll = () => {
    if (selectedParents.length === filteredParents.length) {
      setSelectedParents([]);
    } else {
      setSelectedParents(filteredParents.map(p => p._id));
    }
  };

  const handleCheckChildrenMatches = async (parentId) => {
    try {
      setCheckingMatches(parentId);
      const response = await apiClient.post(API_ENDPOINTS.BRANCH_ADMIN.CHECK_CHILDREN_MATCHES, {
        parentId
      });
      
      if (response?.success) {
        setChildrenMatches(prev => ({
          ...prev,
          [parentId]: response.childrenMatches
        }));
        
        // Auto-select matched students
        const autoSelections = {};
        response.childrenMatches.forEach((match, index) => {
          if (match.matched && match.matchedStudents.length > 0) {
            // Select the highest scoring match
            const bestMatch = match.matchedStudents.sort((a, b) => b.matchScore - a.matchScore)[0];
            autoSelections[index] = bestMatch._id;
          }
        });
        setSelectedChildIds(prev => ({
          ...prev,
          [parentId]: autoSelections
        }));
        
        toast.success(`Found ${response.totalMatched} matching children`);
      }
    } catch (error) {
      console.error('Failed to check matches:', error);
      toast.error('Failed to check children matches');
    } finally {
      setCheckingMatches(null);
    }
  };

  const handleChildSelection = (parentId, childIndex, studentId) => {
    setSelectedChildIds(prev => ({
      ...prev,
      [parentId]: {
        ...(prev[parentId] || {}),
        [childIndex]: studentId
      }
    }));
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (parent) => {
    if (activeTab === 'pending') {
      return <Badge variant="secondary" className="inline-flex items-center text-xs">
        <Clock className="h-3 w-3 mr-1" />
        Pending
      </Badge>;
    }
    return <Badge variant={parent.approved ? 'default' : 'secondary'} className="inline-flex items-center text-xs">
      {parent.approved ? <CheckCircle2 className="h-3 w-3 mr-1" /> : <Clock className="h-3 w-3 mr-1" />}
      {parent.approved ? 'Approved' : 'Pending'}
    </Badge>;
  };

  if (loading) {
    return <FullPageLoader message="Loading parents..." />;
  }

  return (
    <div className="p-4 sm:p-2 space-y-1 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pt-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
            Parent Management
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
            Manage all parent accounts and approvals
          </p>
        </div>
        <Button onClick={loadParents} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Tabs */}
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      <TabPanel value={activeTab} activeTab={activeTab}>
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center">
                <Users className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
                <div className="ml-3 sm:ml-4">
                  <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Total {activeTab === 'all' ? 'Parents' : 'Pending'}</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">{activeTab === 'all' ? allParents.length : pendingParents.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center">
                <Clock className="h-6 w-6 sm:h-8 sm:w-8 text-orange-600" />
                <div className="ml-3 sm:ml-4">
                  <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Filtered Results</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">{filteredParents.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          {activeTab === 'pending' && (
            <Card>
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center">
                  <CheckCircle2 className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
                  <div className="ml-3 sm:ml-4">
                    <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Ready to Approve</p>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">{filteredParents.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Parents List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg sm:text-xl">{activeTab === 'all' ? 'All Parents' : 'Pending Parents'}</CardTitle>
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-full sm:w-64 text-sm"
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredParents.length === 0 ? (
              <div className="text-center py-8">
                <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {searchTerm ? 'No parents found matching your search' : `No ${activeTab === 'all' ? '' : 'pending '}parents ${activeTab === 'all' ? 'found' : 'to approve'}`}
                </p>
              </div>
            ) : (
              <>
                {/* Bulk Actions for Pending */}
                {activeTab === 'pending' && selectedParents.length > 0 && (
                  <div className="mb-4 p-3 sm:p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0 sm:space-x-2">
                      <div className="flex items-center space-x-2">
                        <CheckSquare className="h-4 w-5 text-blue-600" />
                        <span className="text-xs sm:text-sm font-medium text-blue-900 dark:text-blue-100">
                          {selectedParents.length} parent(s) selected
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center space-x-2">
                        <Button
                          onClick={handleBulkApprove}
                          disabled={approving === 'bulk'}
                          className="bg-green-600 hover:bg-green-700 text-xs sm:text-sm"
                          size="sm"
                        >
                          {approving === 'bulk' ? (
                            <ButtonLoader size={4} />
                          ) : (
                            <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                          )}
                          Approve Selected ({selectedParents.length})
                        </Button>
                        <Button
                          onClick={() => setSelectedParents([])}
                          variant="outline"
                          size="sm"
                          className="text-xs sm:text-sm"
                        >
                          Clear Selection
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
                {/* Table View */}
                <Table>
                  <TableHeader>
                    <TableRow>
                      {activeTab === 'pending' && (
                        <TableHead>
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={selectedParents.length === filteredParents.length && filteredParents.length > 0}
                              onChange={handleSelectAll}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span>Parent</span>
                          </div>
                        </TableHead>
                      )}
                      {activeTab !== 'pending' && (
                        <TableHead>Parent</TableHead>
                      )}
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Applied Date</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                      <TableHead className="text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredParents.map((parent) => (
                      <TableRow key={parent._id}>
                        <TableCell>
                            <div className="flex items-center space-x-3">
                              {activeTab === 'pending' && (
                                <input
                                  type="checkbox"
                                  checked={selectedParents.includes(parent._id)}
                                  onChange={() => handleSelectParent(parent._id)}
                                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                              )}
                              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0">
                                <User className="h-5 w-5 text-blue-600" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">{parent.fullName}</p>
                                <p className="text-xs text-gray-600 dark:text-gray-400">
                                  {parent.parentProfile?.children?.length || 0} children
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="truncate block max-w-xs" title={parent.email}>
                              {parent.email}
                            </span>
                          </TableCell>
                          <TableCell>{parent.phone || 'N/A'}</TableCell>
                          <TableCell>{formatDate(parent.createdAt)}</TableCell>
                          <TableCell className="text-center">
                            {getStatusBadge(parent)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-center space-x-2">
                              <Modal
                                open={selectedParent && selectedParent._id === parent._id}
                                onClose={() => setSelectedParent(null)}
                                title="Parent Details"
                                >
                                  {selectedParent && (
                                    <div className="space-y-6">
                                      {/* Basic Info */}
                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="flex items-center space-x-2 text-xs">
                                          <User className="h-4 w-4 text-gray-500" />
                                          <span className="font-medium">Name:</span>
                                          <span>{selectedParent.fullName}</span>
                                        </div>
                                        <div className="flex items-center space-x-2 text-xs">
                                          <Mail className="h-4 w-4 text-gray-500" />
                                          <span className="font-medium">Email:</span>
                                          <span>{selectedParent.email}</span>
                                        </div>
                                        <div className="flex items-center space-x-2 text-xs">
                                          <Phone className="h-4 w-4 text-gray-500" />
                                          <span className="font-medium">Phone:</span>
                                          <span>{selectedParent.phone}</span>
                                        </div>
                                        <div className="flex items-center space-x-2 text-xs">
                                          <MapPin className="h-4 w-4 text-gray-500" />
                                          <span className="font-medium">Address:</span>
                                          <span>{selectedParent.address?.street}, {selectedParent.address?.city}</span>
                                        </div>
                                        <div className="flex items-center space-x-2 text-xs">
                                          <Calendar className="h-4 w-4 text-gray-500" />
                                          <span className="font-medium">Applied:</span>
                                          <span>{formatDate(selectedParent.createdAt)}</span>
                                        </div>
                                      </div>

                                      {/* Children */}
                                      <div>
                                        <div className="flex items-center justify-between mb-3">
                                          <h4 className="font-semibold text-sm">Children ({selectedParent.parentProfile?.children?.length || 0})</h4>
                                          {selectedParent.status === 'pending' && (
                                            <Button
                                              onClick={() => handleCheckChildrenMatches(selectedParent._id)}
                                              disabled={checkingMatches === selectedParent._id}
                                              variant="outline"
                                              size="sm"
                                              className="text-xs"
                                            >
                                              {checkingMatches === selectedParent._id ? (
                                              <ButtonLoader size={3} />
                                              ) : (
                                                <Search className="h-3 w-3 mr-2" />
                                              )}
                                              Check Matches
                                            </Button>
                                          )}
                                        </div>
                                        <div className="space-y-3">
                                          {selectedParent.parentProfile?.children?.map((child, index) => {
                                            const matchInfo = childrenMatches[selectedParent._id]?.[index];
                                            const hasMatches = matchInfo?.matched && matchInfo?.matchedStudents?.length > 0;
                                            const isLinkedStudent = child.id && typeof child.id === 'object';
                                            const linkedStudent = isLinkedStudent ? child.id : null;
                                            
                                            return (
                                              <div key={index} className={`border rounded p-3 ${isLinkedStudent ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300' : hasMatches ? 'bg-green-50 dark:bg-green-900/20 border-green-300' : 'bg-gray-50 dark:bg-gray-800'}`}>
                                                {isLinkedStudent && linkedStudent ? (
                                                  <div>
                                                    <div className="flex items-center space-x-2 mb-2">
                                                      <CheckCircle className="h-4 w-4 text-blue-600" />
                                                      <span className="text-xs font-medium text-blue-700 dark:text-blue-400">Linked to Student Account</span>
                                                    </div>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                                      <div><strong>Name:</strong> {linkedStudent.fullName || child.name}</div>
                                                      <div><strong>Registration:</strong> {linkedStudent.registrationNumber || 'N/A'}</div>
                                                      <div><strong>Class:</strong> {linkedStudent.className || 'N/A'}</div>
                                                      <div><strong>Section:</strong> {linkedStudent.section || 'N/A'}</div>
                                                      <div><strong>Guardian:</strong> {linkedStudent.guardianName || 'N/A'}</div>
                                                      {linkedStudent.email && <div><strong>Email:</strong> {linkedStudent.email}</div>}
                                                      {linkedStudent.phone && <div><strong>Phone:</strong> {linkedStudent.phone}</div>}
                                                    </div>
                                                  </div>
                                                ) : (
                                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs mb-2">
                                                    <div><strong>Name:</strong> {child.name}</div>
                                                    <div><strong>Registration:</strong> {child.registrationNumber || 'N/A'}</div>
                                                    <div><strong>Class:</strong> {child.className || 'N/A'}</div>
                                                    <div><strong>Section:</strong> {child.section || 'N/A'}</div>
                                                  </div>
                                                )}
                                                
                                                {/* Matching Status */}
                                                {matchInfo && (
                                                  <div className="mt-2 pt-2 border-t">
                                                    {hasMatches ? (
                                                      <div className="space-y-2">
                                                        <div className="flex items-center space-x-2">
                                                          <CheckCircle className="h-4 w-4 text-green-600" />
                                                          <span className="text-xs font-medium text-green-700 dark:text-green-400">
                                                            {matchInfo.matchedStudents.length} Match(es) Found
                                                          </span>
                                                        </div>
                                                        {/* Show matched students */}
                                                        <div className="space-y-2">
                                                          {matchInfo.matchedStudents.map((student, idx) => (
                                                            <div key={student._id} className="flex items-start space-x-2 text-xs bg-white dark:bg-gray-700 p-2 rounded">
                                                              <input
                                                                type="radio"
                                                                name={`child-${selectedParent._id}-${index}`}
                                                                checked={selectedChildIds[selectedParent._id]?.[index] === student._id}
                                                                onChange={() => handleChildSelection(selectedParent._id, index, student._id)}
                                                                className="mt-1"
                                                              />
                                                              <div className="flex-1">
                                                                <div className="font-medium">{student.fullName}</div>
                                                                <div className="text-gray-600 dark:text-gray-400">
                                                                  Reg: {student.registrationNumber} | Class: {student.className || 'N/A'}
                                                                </div>
                                                                <div className="text-gray-500">
                                                                  Guardian: {student.guardianName || 'N/A'}
                                                                </div>
                                                                <Badge variant="default" className="text-xs mt-1">
                                                                  Match Score: {student.matchScore}%
                                                                </Badge>
                                                              </div>
                                                            </div>
                                                          ))}
                                                        </div>
                                                      </div>
                                                    ) : (
                                                      <div className="flex items-center space-x-2">
                                                        <X className="h-4 w-4 text-red-600" />
                                                        <span className="text-xs text-red-600 dark:text-red-400">
                                                          No matching student found
                                                        </span>
                                                      </div>
                                                    )}
                                                  </div>
                                                )}
                                              </div>
                                            );
                                          })}
                                        </div>
                                      </div>

                                      {/* Action */}
                                      {selectedParent.status === 'pending' && (
                                        <div className="flex justify-end space-x-2">
                                          <Button
                                            onClick={() => handleApprove(selectedParent._id)}
                                            disabled={approving === selectedParent._id}
                                            className="bg-green-600 hover:bg-green-700 text-sm"
                                            size="sm"
                                          >
                                            {approving === selectedParent._id ? (
                                              <ButtonLoader size={4} />
                                            ) : (
                                              <CheckCircle className="h-4 w-4 mr-2" />
                                            )}
                                            Approve Parent
                                          </Button>
                                          <Button
                                            onClick={() => {
                                              setShowRejectInput(selectedParent._id);
                                              setRejectReason('');
                                            }}
                                            disabled={rejecting === selectedParent._id}
                                            variant="outline"
                                            className="bg-red-50 hover:bg-red-100 border-red-300 text-red-700"
                                            size="sm"
                                          >
                                            {rejecting === selectedParent._id ? (
                                              <ButtonLoader size={4} />
                                            ) : (
                                              <X className="h-4 w-4 mr-2" />
                                            )}
                                            Reject Parent
                                          </Button>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </Modal>
                                <Modal
                                  open={showRejectInput === parent._id}
                                  onClose={() => setShowRejectInput(false)}
                                  title="Reject Parent Application"
                                >
                                  <div className="space-y-4">
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Reason for Rejection *
                                      </label>
                                      <textarea
                                        value={rejectReason}
                                        onChange={(e) => setRejectReason(e.target.value)}
                                        placeholder="Please provide a reason for rejecting this parent application..."
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 dark:bg-gray-700 dark:text-gray-100"
                                        rows={4}
                                        required
                                      />
                                    </div>
                                    <div className="flex justify-end space-x-2">
                                      <Button
                                        onClick={() => setShowRejectInput(false)}
                                        variant="outline"
                                        size="sm"
                                      >
                                        Cancel
                                      </Button>
                                      <Button
                                        onClick={() => handleReject(parent._id)}
                                        disabled={!rejectReason.trim() || rejecting === parent._id}
                                        className="bg-red-600 hover:bg-red-700 text-white"
                                        size="sm"
                                      >
                                        {rejecting === parent._id ? (
                                          <ButtonLoader size={4} />
                                        ) : (
                                          <X className="h-4 w-4 mr-2" />
                                        )}
                                        Reject Parent
                                      </Button>
                                    </div>
                                  </div>
                                </Modal>
                                <Button variant="outline" size="sm" onClick={() => setSelectedParent(parent)} className="text-xs h-8">
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Details
                                </Button>
                                {activeTab === 'pending' && (
                                  <Button
                                    onClick={() => handleApprove(parent._id)}
                                    disabled={approving === parent._id}
                                    size="sm"
                                    className="bg-green-600 hover:bg-green-700 text-xs h-8"
                                  >
                                    {approving === parent._id ? (
                                      <ButtonLoader size={4} />
                                    ) : (
                                      <CheckCircle2 className="h-4 w-4 mr-2" />
                                    )}
                                    Approve
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
              </>
            )}
          </CardContent>
        </Card>
      </TabPanel>
    </div>
  );
}