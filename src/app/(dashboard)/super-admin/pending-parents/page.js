'use client';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import ButtonLoader from '@/components/ui/button-loader';
import FullPageLoader from '@/components/ui/full-page-loader';
export default function PendingParentsPage() {
  const [parents, setParents] = useState([]);
  const [filteredParents, setFilteredParents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(null);
  const [selectedParent, setSelectedParent] = useState(null);
  const [selectedParents, setSelectedParents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [rejecting, setRejecting] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [checkingMatches, setCheckingMatches] = useState(null);
  const [childrenMatches, setChildrenMatches] = useState({});
  const [showClassSelection, setShowClassSelection] = useState(null);
  const [classSelections, setClassSelections] = useState({});

  useEffect(() => {
    loadPendingParents();
  }, []);

  useEffect(() => {
    const filtered = parents.filter(parent =>
      parent && parent.fullName && parent.email &&
      (parent.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
       parent.email.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    setFilteredParents(filtered);
  }, [parents, searchTerm]);

  const loadPendingParents = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(API_ENDPOINTS.SUPER_ADMIN.PENDING_PARENTS);
      if (response) {
        setParents(response.parents || []);
      }
    } catch (error) {
      console.error('Failed to load pending parents:', error);
      toast.error('Failed to load pending parents');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (parentId) => {
    try {
      setApproving(parentId);

      // Prepare approval data with class selections
      const approvalData = {};
      if (classSelections[parentId]) {
        approvalData.childrenMappings = classSelections[parentId];
      }

      const response = await apiClient.post(
        API_ENDPOINTS.SUPER_ADMIN.APPROVE_PARENT.replace(':id', parentId),
        approvalData
      );

      if (response?.success) {
        toast.success('Parent approved successfully');
        setParents(parents.filter(p => p._id !== parentId));
        setSelectedParents(selectedParents.filter(id => id !== parentId));
        setChildrenMatches(prev => {
          const newMatches = { ...prev };
          delete newMatches[parentId];
          return newMatches;
        });
        setClassSelections(prev => {
          const newSelections = { ...prev };
          delete newSelections[parentId];
          return newSelections;
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
      const promises = selectedParents.map(parentId =>
        apiClient.post(
          API_ENDPOINTS.SUPER_ADMIN.APPROVE_PARENT.replace(':id', parentId)
        )
      );

      const results = await Promise.all(promises);
      const successCount = results.filter(r => r?.success).length;

      if (successCount > 0) {
        toast.success(`${successCount} parent(s) approved successfully`);
        setParents(parents.filter(p => !selectedParents.includes(p._id)));
        setSelectedParents([]);
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
        API_ENDPOINTS.SUPER_ADMIN.REJECT_PARENT.replace(':id', parentId),
        { reason: rejectReason }
      );

      if (response?.success) {
        toast.success('Parent rejected successfully');
        setParents(parents.filter(p => p._id !== parentId));
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
      const response = await apiClient.post(
        API_ENDPOINTS.SUPER_ADMIN.CHECK_CHILDREN_MATCHES,
        { parentId }
      );

      if (response?.matches) {
        setChildrenMatches(prev => ({
          ...prev,
          [parentId]: response.matches
        }));

        // Check if any child has multiple available classes
        const hasMultipleClasses = response.matches.some(childMatch =>
          childMatch.availableClasses && childMatch.availableClasses.length > 1
        );

        if (hasMultipleClasses) {
          toast.info('Multiple classes found for some children. Please select appropriate classes.');
        } else {
          toast.success('Children matches found successfully');
        }
      } else {
        toast.error('No matches found for children');
      }
    } catch (error) {
      console.error('Failed to check children matches:', error);
      toast.error('Failed to check children matches');
    } finally {
      setCheckingMatches(null);
    }
  };

  const handleClassSelection = (parentId, childIndex, selectedClassId, studentId) => {
    setClassSelections(prev => ({
      ...prev,
      [parentId]: {
        ...prev[parentId],
        [childIndex]: {
          childIndex,
          studentId,
          selectedClassId
        }
      }
    }));
  };

  const handleOpenClassSelection = (parentId, childMatch) => {
    setShowClassSelection({ parentId, childMatch });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return <FullPageLoader message="Loading pending parents..." />;
  }

  return (
    <div className="p-4 sm:p-2 space-y-1 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-left pt-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 sm:width-100%">
            Pending Parent Approvals
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
            Review and approve parent accounts before they can access the system
          </p>
        </div>
        <Button onClick={loadPendingParents} variant="outline" size="sm sm:sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center">
              <Users className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
              <div className="ml-3 sm:ml-4">
                <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Total Pending</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">{parents.length}</p>
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
      </div>

      {/* Parents List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg sm:text-xl">Pending Parents</CardTitle>
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
                {searchTerm ? 'No parents found matching your search' : 'No pending parents to approve'}
              </p>
            </div>
          ) : (
            <>
              {/* Bulk Actions */}
              {selectedParents.length > 0 && (
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
              <div className="overflow-x-auto">
                <table className="w-full table-auto">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                      <th className="text-left py-3 px-4 sm:px-6 font-semibold text-xs sm:text-sm text-gray-900 dark:text-gray-100">
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={selectedParents.length === filteredParents.length && filteredParents.length > 0}
                            onChange={handleSelectAll}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-xs sm:text-sm">Parent</span>
                        </div>
                      </th>
                      <th className="text-left py-3 px-4 sm:px-6 font-semibold text-xs sm:text-sm text-gray-900 dark:text-gray-100">Email</th>
                      <th className="text-left py-3 px-4 sm:px-6 font-semibold text-xs sm:text-sm text-gray-900 dark:text-gray-100">Phone</th>
                      <th className="text-left py-3 px-4 sm:px-6 font-semibold text-xs sm:text-sm text-gray-900 dark:text-gray-100">Applied Date</th>
                      <th className="text-center py-3 px-4 sm:px-6 font-semibold text-xs sm:text-sm text-gray-900 dark:text-gray-100">Status</th>
                      <th className="text-center py-3 px-4 sm:px-6 font-semibold text-xs sm:text-sm text-gray-900 dark:text-gray-100">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredParents.map((parent) => (
                      <tr key={parent._id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                        <td className="min-w-0 py-3 px-4 sm:px-6">
                          <div className="flex items-center space-x-3">
                            <input
                              type="checkbox"
                              checked={selectedParents.includes(parent._id)}
                              onChange={() => handleSelectParent(parent._id)}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
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
                        </td>
                        <td className="min-w-0 py-3 px-4 sm:px-6 text-sm text-gray-900 dark:text-gray-100">
                          <span className="truncate block max-w-xs" title={parent.email}>
                            {parent.email}
                          </span>
                        </td>
                        <td className="min-w-0 py-3 px-4 sm:px-6 text-sm text-gray-900 dark:text-gray-100">{parent.phone || 'N/A'}</td>
                        <td className="min-w-0 py-3 px-4 sm:px-6 text-sm text-gray-900 dark:text-gray-100">{formatDate(parent.createdAt)}</td>
                        <td className="py-3 px-4 sm:px-6 text-center">
                          <Badge variant="secondary" className="inline-flex items-center text-xs">
                            <Clock className="h-3 w-3 mr-1" />
                            Pending
                          </Badge>
                        </td>
                        <td className="py-3 px-4 sm:px-6">
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
                                    <Button
                                      onClick={() => handleCheckChildrenMatches(selectedParent._id)}
                                      disabled={checkingMatches === selectedParent._id}
                                      size="sm"
                                      variant="outline"
                                      className="text-xs"
                                    >
                                      {checkingMatches === selectedParent._id ? (
                                          <ButtonLoader size={3} />
                                      ) : (
                                        <Search className="h-3 w-3 mr-2" />
                                      )}
                                      Check Matches
                                    </Button>
                                  </div>
                                  <div className="space-y-2">
                                    {selectedParent.parentProfile?.children?.map((child, index) => {
                                      const childMatches = childrenMatches[selectedParent._id]?.find(cm => cm.childName === child.name);
                                      const selectedClass = classSelections[selectedParent._id]?.[index];

                                      return (
                                        <div key={index} className="border rounded p-3 bg-gray-50 dark:bg-gray-800">
                                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs mb-2">
                                            <div><strong>Name:</strong> {child.name}</div>
                                            <div><strong>Registration:</strong> {child.registrationNumber || 'N/A'}</div>
                                            <div><strong>Class Name:</strong> {child.className || 'N/A'}</div>
                                            <div><strong>Status:</strong>
                                              {childMatches ? (
                                                <Badge variant="secondary" className="ml-2 text-xs">
                                                  {childMatches.matches.length} match(es) found
                                                </Badge>
                                              ) : (
                                                <span className="text-gray-500 ml-2">Not checked</span>
                                              )}
                                            </div>
                                          </div>

                                          {/* Show matches if available */}
                                          {childMatches && childMatches.matches.length > 0 && (
                                            <div className="mt-2 space-y-1">
                                              <p className="text-xs font-medium text-gray-700 dark:text-gray-300">Possible Matches:</p>
                                              {childMatches.matches.map((match, matchIndex) => (
                                                <div key={matchIndex} className="bg-white dark:bg-gray-700 p-2 rounded text-xs">
                                                  <div className="flex items-center justify-between">
                                                    <div>
                                                      <span className="font-medium">{match.student.fullName}</span>
                                                      <span className="text-gray-500 ml-2">({match.matchReason})</span>
                                                      <Badge variant={match.confidence >= 70 ? "default" : "secondary"} className="ml-2 text-xs">
                                                        {match.confidence}% confidence
                                                      </Badge>
                                                    </div>
                                                    {childMatches.availableClasses && childMatches.availableClasses.length > 1 && (
                                                      <Button
                                                        onClick={() => handleOpenClassSelection(selectedParent._id, childMatches)}
                                                        size="sm"
                                                        variant="outline"
                                                        className="text-xs h-6"
                                                      >
                                                        Select Class
                                                      </Button>
                                                    )}
                                                  </div>
                                                  {selectedClass && selectedClass.studentId === match.student.id && (
                                                    <div className="mt-1 text-green-600 text-xs">
                                                      ✓ Selected: {childMatches.availableClasses?.find(cls => cls.id === selectedClass.selectedClassId)?.name || 'Class selected'}
                                                    </div>
                                                  )}
                                                </div>
                                              ))}
                                            </div>
                                          )}

                                          {/* Show available classes if multiple */}
                                          {childMatches && childMatches.availableClasses && childMatches.availableClasses.length > 1 && (
                                            <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-xs">
                                              <p className="font-medium text-blue-800 dark:text-blue-200">Multiple classes found with name "{child.className}":</p>
                                              <div className="mt-1 space-y-1">
                                                {childMatches.availableClasses.map((cls, clsIndex) => (
                                                  <div key={clsIndex} className="flex items-center space-x-2">
                                                    <input
                                                      type="radio"
                                                      name={`class-${selectedParent._id}-${index}`}
                                                      value={cls.id}
                                                      checked={selectedClass?.selectedClassId === cls.id}
                                                      onChange={() => {
                                                        // Find the best matching student for this class
                                                        const bestMatch = childMatches.matches.find(m =>
                                                          m.student.classId === cls.id ||
                                                          m.matchReason.includes(cls.name)
                                                        );
                                                        handleClassSelection(selectedParent._id, index, cls.id, bestMatch?.student.id);
                                                      }}
                                                      className="text-blue-600"
                                                    />
                                                    <span>{cls.name} - {cls.branchName}</span>
                                                  </div>
                                                ))}
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>

                                {/* Action */}
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
                                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-white mr-2"></div>
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
                            {/* <Button
                              onClick={() => {
                                setShowRejectInput(parent._id);
                                setRejectReason('');
                              }}
                              disabled={rejecting === parent._id}
                              variant="outline"
                              size="sm"
                              className="bg-red-50 hover:bg-red-100 border-red-300 text-red-700 text-xs h-8"
                            >
                              {rejecting === parent._id ? (
                                  <ButtonLoader size={4} />
                              ) : (
                                <X className="h-4 w-4 mr-2" />
                              )}
                              Reject
                            </Button> */}
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
                            <Modal
                              open={showClassSelection !== null}
                              onClose={() => setShowClassSelection(null)}
                              title="Select Class for Child"
                            >
                              {showClassSelection && (
                                <div className="space-y-4">
                                  <div>
                                    <h4 className="font-semibold mb-2">Child: {showClassSelection.childMatch.childName}</h4>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                                      Multiple classes found with name "{showClassSelection.childMatch.childClassName}".
                                      Please select the appropriate class for this child.
                                    </p>
                                    <div className="space-y-2">
                                      {showClassSelection.childMatch.availableClasses.map((cls, index) => (
                                        <div key={index} className="border rounded p-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                                          <div className="flex items-center space-x-3">
                                            <input
                                              type="radio"
                                              name="class-selection"
                                              value={cls.id}
                                              onChange={() => {
                                                // Find child index
                                                const parent = parents.find(p => p._id === showClassSelection.parentId);
                                                const childIndex = parent?.parentProfile?.children?.findIndex(c => c.name === showClassSelection.childMatch.childName);
                                                if (childIndex !== -1) {
                                                  // Find best matching student for this class
                                                  const bestMatch = showClassSelection.childMatch.matches.find(m =>
                                                    m.student.classId === cls.id ||
                                                    m.matchReason.includes(cls.name)
                                                  );
                                                  handleClassSelection(showClassSelection.parentId, childIndex, cls.id, bestMatch?.student.id);
                                                }
                                              }}
                                              className="text-blue-600"
                                            />
                                            <div>
                                              <div className="font-medium">{cls.name}</div>
                                              <div className="text-sm text-gray-500">{cls.branchName} • Code: {cls.code}</div>
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                  <div className="flex justify-end space-x-2">
                                    <Button
                                      onClick={() => setShowClassSelection(null)}
                                      variant="outline"
                                      size="sm"
                                    >
                                      Done
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </Modal>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
