'use client';
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import Modal from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  X,
  Calendar,
  Clock,
  Building2,
  Users,
  BookOpen,
  FileText,
  MapPin,
  CheckCircle,
  XCircle
} from 'lucide-react';

export default function ExamDetailsModal({ exam, onClose }) {
  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'ongoing': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'postponed': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getExamTypeColor = (type) => {
    switch (type) {
      case 'midterm': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'final': return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200';
      case 'quiz': return 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200';
      case 'unit_test': return 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200';
      case 'mock': return 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200';
      case 'surprise': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'practical': return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200';
      case 'oral': return 'bg-lime-100 text-lime-800 dark:bg-lime-900 dark:text-lime-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getGradeStatus = (marks, passingMarks) => {
    if (marks === null || marks === undefined) return null;
    return marks >= passingMarks ? 'pass' : 'fail';
  };

  return (
    <Modal
      open={true}
      onClose={onClose}
      title={<><FileText className="w-5 h-5 mr-2" />{exam?.title || 'Exam Details'}</>}
      size="lg"
      footer={null}
    >
      <div className="max-h-[70vh] overflow-y-auto">
        <Card className="border-0 shadow-none">
          <CardContent className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-3">Exam Information</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-gray-500" />
                      <span className="text-sm">
                        <strong>Branch:</strong> {exam.branchId?.name || 'N/A'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-gray-500" />
                      <span className="text-sm">
                        <strong>Class:</strong> {exam.classId?.name || 'N/A'}
                        {exam.section && ` - Section ${exam.section}`}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">
                        <strong>Created By:</strong> {exam.createdBy?.name || 'N/A'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">
                        <strong>Created:</strong> {formatDate(exam.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">Status & Type</h3>
                  <div className="flex flex-wrap gap-2">
                    <Badge className={getExamTypeColor(exam.examType)}>
                      {exam.examType?.replace('_', ' ').toUpperCase()}
                    </Badge>
                    <Badge className={getStatusColor(exam.status)}>
                      {exam.status?.toUpperCase()}
                    </Badge>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">Subjects Overview</h3>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <p><strong>Total Subjects:</strong> {exam.subjects?.length || 0}</p>
                  <p><strong>Exam Dates:</strong> {
                    exam.subjects && exam.subjects.length > 0
                      ? `${formatDate(exam.subjects[0].date)}${exam.subjects.length > 1 ? ` to ${formatDate(exam.subjects[exam.subjects.length - 1].date)}` : ''}`
                      : 'N/A'
                  }</p>
                </div>
              </div>
            </div>

            {/* Subjects Details */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Subject Details</h3>
              <div className="space-y-4">
                {exam.subjects?.map((subject, index) => (
                  <Card key={index} className="border border-gray-200 dark:border-gray-700">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <BookOpen className="w-4 h-4 text-blue-500" />
                          <h4 className="font-medium">
                            {subject.subjectId?.name || 'Unknown Subject'}
                          </h4>
                        </div>
                        <Badge variant="outline">
                          Subject {index + 1}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-3">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-500" />
                          <span className="text-sm">{formatDate(subject.date)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-500" />
                          <span className="text-sm">
                            {formatTime(subject.startTime)} - {formatTime(subject.endTime)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm">
                            <strong>Duration:</strong> {subject.duration} min
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm">
                            <strong>Marks:</strong> {subject.totalMarks} (Pass: {subject.passingMarks})
                          </span>
                        </div>
                      </div>

                      {subject.room && (
                        <div className="flex items-center gap-2 mb-3">
                          <MapPin className="w-4 h-4 text-gray-500" />
                          <span className="text-sm"><strong>Room:</strong> {subject.room}</span>
                        </div>
                      )}

                      {subject.instructions && (
                        <div className="mb-3">
                          <h5 className="font-medium text-sm mb-1">Instructions:</h5>
                          <p className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 p-2 rounded">
                            {subject.instructions}
                          </p>
                        </div>
                      )}

                      {subject.syllabus && (
                        <div>
                          <h5 className="font-medium text-sm mb-1">Syllabus:</h5>
                          <p className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 p-2 rounded">
                            {subject.syllabus}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}

                {(!exam.subjects || exam.subjects.length === 0) && (
                  <div className="text-center py-8 text-gray-500">
                    <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No subjects configured for this exam.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Results Summary (if available) */}
            {exam.results && exam.results.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Results Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <Card className="border border-gray-200 dark:border-gray-700">
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {exam.results.length}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Total Results
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border border-gray-200 dark:border-gray-700">
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {exam.results.filter(r => getGradeStatus(r.marksObtained, r.subjectId ? exam.subjects.find(s => s.subjectId === r.subjectId)?.passingMarks : 0) === 'pass').length}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Passed
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border border-gray-200 dark:border-gray-700">
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-red-600">
                        {exam.results.filter(r => r.isAbsent).length}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Absent
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </Modal>
  );
}
