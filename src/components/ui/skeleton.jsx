import React from 'react';

const Skeleton = ({ className = '', ...props }) => {
  return (
    <div
      className={`animate-pulse rounded-md bg-gray-200/80 ${className}`}
      {...props}
    />
  );
};

export const CardSkeleton = () => (
  <div className="bg-white rounded-lg border border-gray-100 overflow-hidden shadow-sm">
    <div className="h-20 bg-gray-100 animate-pulse" />
    <div className="p-4 space-y-4">
      <div className="space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
      <div className="space-y-2 pt-2">
        <div className="flex items-center gap-2">
           <Skeleton className="h-4 w-4 rounded-full" />
           <Skeleton className="h-3 w-2/3" />
        </div>
        <div className="flex items-center gap-2">
           <Skeleton className="h-4 w-4 rounded-full" />
           <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <div className="pt-4 border-t border-dashed border-gray-100 grid grid-cols-3 gap-2">
        <Skeleton className="h-12 rounded-lg" />
        <Skeleton className="h-12 rounded-lg" />
        <Skeleton className="h-12 rounded-lg" />
      </div>
      <div className="pt-4 flex gap-3">
        <Skeleton className="h-10 flex-1 rounded-xl" />
        <Skeleton className="h-10 w-10 rounded-xl" />
        <Skeleton className="h-10 w-10 rounded-xl" />
      </div>
    </div>
  </div>
);

export const TableSkeleton = ({ rows = 5 }) => (
  <div className="w-full space-y-4">
    {[...Array(rows)].map((_, i) => (
      <div key={i} className="flex items-center space-x-4 p-4 border-b border-gray-50">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-[250px]" />
          <Skeleton className="h-4 w-[200px]" />
        </div>
        <Skeleton className="h-8 w-20 rounded-lg" />
      </div>
    ))}
  </div>
);

export const BranchManagementSkeleton = () => (
  <div className="space-y-6">
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-8">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>
      <Skeleton className="h-10 w-32" />
    </div>
    
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
      {[...Array(4)].map((_, i) => (
        <Skeleton key={i} className="h-28 rounded-xl" />
      ))}
    </div>

    <div className="bg-white p-4 rounded-lg border border-gray-100">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Skeleton className="h-10 rounded-lg" />
        <Skeleton className="h-10 rounded-lg" />
      </div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(3)].map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  </div>
);

export const AdminManagementSkeleton = () => (
  <div className="space-y-6">
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-8 gap-4">
      <div className="space-y-2">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>
    </div>
    
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <Skeleton key={i} className="h-28 rounded-xl" />
      ))}
    </div>

    <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
      <Skeleton className="h-12 w-full rounded-lg" />
    </div>

    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
      <div className="p-6 border-b border-gray-100 flex justify-between items-center">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-40 rounded-lg" />
      </div>
      <div className="p-6">
        <TableSkeleton rows={6} />
      </div>
    </div>
  </div>
);

export const TimetableGridSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {[...Array(6)].map((_, i) => (
      <div key={i} className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
          <Skeleton className="h-6 w-24" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <Skeleton className="h-8 w-8 rounded-lg" />
          </div>
        </div>
        <div className="p-4 space-y-4">
          {[...Array(4)].map((_, j) => (
            <div key={j} className="flex gap-4 items-start p-3 rounded-lg border border-gray-50">
              <div className="space-y-1">
                <Skeleton className="h-3 w-12" />
                <Skeleton className="h-3 w-12" />
              </div>
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <div className="flex gap-2">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    ))}
  </div>
);

export const TimetableSkeleton = () => (
  <div className="space-y-6">
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-8 gap-4">
      <div className="space-y-2">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>
      <Skeleton className="h-10 w-40 rounded-lg" />
    </div>

    {/* Filters Area */}
    <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-wrap gap-4">
      <Skeleton className="h-10 w-48 rounded-lg" />
      <Skeleton className="h-10 w-48 rounded-lg" />
      <Skeleton className="h-10 w-48 rounded-lg" />
      <Skeleton className="h-10 w-48 rounded-lg" />
    </div>

    {/* Timetable Grid */}
    <TimetableGridSkeleton />
  </div>
);

export const ExamTableSkeleton = () => (
  <div className="w-full">
    <div className="bg-slate-50 border-b border-gray-100 grid grid-cols-7 gap-4 p-4">
      {[...Array(7)].map((_, i) => (
        <Skeleton key={i} className="h-4 w-20" />
      ))}
    </div>
    <div className="divide-y divide-gray-100">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="grid grid-cols-7 gap-4 p-4 items-center">
          <div className="space-y-1">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-5 w-10 rounded-full mx-auto" />
          <Skeleton className="h-5 w-10 rounded-full mx-auto" />
          <Skeleton className="h-8 w-24 rounded mx-auto" />
          <Skeleton className="h-6 w-20 rounded-full mx-auto" />
          <div className="flex justify-end">
            <Skeleton className="h-8 w-20 rounded-md" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

export const ExamSkeleton = () => (
  <div className="p-6 space-y-6">
    {/* Header */}
    <div className="flex justify-between items-center">
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>
      <Skeleton className="h-10 w-40 rounded-lg" />
    </div>

    {/* KPI Cards */}
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="bg-white p-4 rounded-xl border border-gray-100 flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-12" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
      ))}
    </div>

    {/* Filters */}
    <div className="flex gap-4">
      <Skeleton className="h-10 flex-1 rounded-lg" />
      <Skeleton className="h-10 w-48 rounded-lg" />
    </div>

    {/* Main Content Card */}
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
      <div className="p-4 border-b border-gray-100">
        <Skeleton className="h-6 w-48" />
      </div>
      <ExamTableSkeleton />
    </div>
  </div>
);

export const BranchExamSkeleton = () => (
  <div className="p-6 space-y-6">
    {/* Header */}
    <div className="flex justify-between items-center">
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>
      <Skeleton className="h-10 w-40 rounded-lg" />
    </div>

    {/* Main Content Card */}
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
      <div className="p-4 border-b border-gray-100 flex justify-between items-center">
        <Skeleton className="h-6 w-48" />
        <div className="flex gap-2">
          <Skeleton className="h-10 w-64 rounded-lg" />
          <Skeleton className="h-10 w-40 rounded-lg" />
        </div>
      </div>
      <ExamTableSkeleton />
    </div>
  </div>
);

export const MarkSheetSkeleton = () => (
  <div className="p-6 space-y-6">
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <div className="space-y-2">
        <div className="flex gap-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-8 w-64 mt-2" />
        <div className="flex gap-2 mt-2">
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
      </div>
      <div className="flex gap-3 w-full md:w-auto">
        <Skeleton className="h-10 flex-1 md:w-64 rounded-lg" />
        <Skeleton className="h-10 w-40 rounded-lg" />
      </div>
    </div>

    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
      <div className="bg-slate-50 border-b border-gray-100 grid grid-cols-9 gap-4 p-4">
        {[...Array(9)].map((_, i) => (
          <Skeleton key={i} className="h-4 w-full" />
        ))}
      </div>
      <div className="divide-y divide-gray-100">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="grid grid-cols-9 gap-4 p-4 items-center">
            <Skeleton className="h-4 w-4 mx-auto" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-10 mx-auto" />
            <Skeleton className="h-4 w-10 mx-auto" />
            <Skeleton className="h-9 w-20 mx-auto rounded" />
            <Skeleton className="h-4 w-4 mx-auto" />
            <Skeleton className="h-6 w-16 mx-auto rounded-full" />
          </div>
        ))}
      </div>
    </div>
  </div>
);

export const AcademicGridSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {[...Array(6)].map((_, i) => (
      <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm h-64 flex flex-col">
        <div className="p-5 border-b bg-gray-50/50 space-y-3">
          <div className="flex justify-between items-start">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
          <Skeleton className="h-4 w-24 rounded-md" />
        </div>
        <div className="p-5 space-y-4 flex-1">
          <div className="space-y-3">
            <Skeleton className="h-10 w-full rounded-xl" />
            <div className="flex gap-2">
              <Skeleton className="h-5 w-16 rounded-lg" />
              <Skeleton className="h-5 w-16 rounded-lg" />
            </div>
          </div>
          <div className="mt-auto pt-4 flex gap-2">
            <Skeleton className="h-10 flex-1 rounded-xl" />
            <Skeleton className="h-10 w-12 rounded-xl" />
          </div>
        </div>
      </div>
    ))}
  </div>
);

export const AcademicManagementSkeleton = () => (
  <div className="space-y-6">
    {/* Header Skeleton */}
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
      <div className="flex items-center gap-4">
        <Skeleton className="h-12 w-12 rounded-xl" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
      </div>
      <Skeleton className="h-11 w-40 rounded-xl" />
    </div>

    {/* Stats Skeleton (Optional) */}
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-white p-5 rounded-2xl border border-gray-100 flex items-center gap-4">
          <Skeleton className="h-12 w-12 rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-6 w-12" />
          </div>
        </div>
      ))}
    </div>

    {/* Grid Content */}
    <AcademicGridSkeleton />
  </div>
);

export const ExamResultsSkeleton = () => (
  <div className="p-6 space-y-6">
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <div className="space-y-2">
        <div className="flex gap-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-8 w-64 mt-2" />
        <div className="flex gap-2 mt-2">
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
      </div>
      <div className="flex gap-3 w-full md:w-auto">
        <Skeleton className="h-10 flex-1 md:w-60 rounded-lg" />
        <Skeleton className="h-10 w-40 rounded-lg" />
      </div>
    </div>

    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-8 w-12" />
        </div>
      ))}
    </div>

    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
      <div className="bg-slate-50 border-b border-gray-100 grid grid-cols-9 gap-4 p-4">
        {[...Array(9)].map((_, i) => (
          <Skeleton key={i} className="h-4 w-full" />
        ))}
      </div>
      <div className="divide-y divide-gray-100">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="grid grid-cols-9 gap-4 p-4 items-center">
            <Skeleton className="h-4 w-4 mx-auto" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-4 w-32" />
            </div>
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-10 mx-auto" />
            <Skeleton className="h-4 w-24 mx-auto" />
            <Skeleton className="h-4 w-10 mx-auto" />
            <Skeleton className="h-4 w-8 mx-auto" />
            <Skeleton className="h-6 w-16 mx-auto rounded-full" />
            <Skeleton className="h-8 w-20 mx-auto rounded" />
          </div>
        ))}
      </div>
    </div>
  </div>
);

export const SubmissionsSkeleton = () => (
  <div className="space-y-6">
    <div className="flex items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-100">
      <div className="space-y-2">
        <Skeleton className="h-3 w-24" />
        <div className="flex gap-4">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-5 w-32" />
        </div>
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-6 w-16 rounded-full" />
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
    </div>
    <div className="space-y-4">
      <div className="flex items-center gap-2 px-1">
        <Skeleton className="h-5 w-5 rounded-md" />
        <Skeleton className="h-5 w-32" />
      </div>
      <div className="border border-slate-100 rounded-xl overflow-hidden bg-white">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center justify-between p-4 border-b border-slate-50 last:border-0">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-4 w-24" />
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default Skeleton;
