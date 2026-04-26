import React from 'react';
import Modal from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Building2, GraduationCap, UserCheck, Users, MapPin, Phone, Mail, Edit } from 'lucide-react';
import { format } from 'date-fns';
import dynamic from 'next/dynamic';

const BranchMap = dynamic(() => import('@/components/branch/BranchMap'), { 
  ssr: false,
  loading: () => <div className="h-[200px] w-full bg-gray-100 animate-pulse rounded-lg flex items-center justify-center text-gray-400">Loading Map...</div>
});

const BranchViewModal = ({ open, onClose, branch, onEdit }) => {
  if (!branch) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={
        <div className="flex items-center gap-3">
          <Building2 className="w-5 h-5 text-blue-600" />
          <span>{branch.name} Details</span>
        </div>
      }
      size="2xl"
      footer={(
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>Close</Button>
          <Button onClick={() => { onClose(); onEdit(branch); }}>
            <Edit className="w-4 h-4 mr-2" />
            Edit Branch
          </Button>
        </div>
      )}
    >
      <div className="p-6 space-y-8">
        {/* Quick Stats Summary */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg text-center">
            <GraduationCap className="w-6 h-6 text-blue-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{branch.stats?.students || 0}</p>
            <p className="text-xs text-blue-600 uppercase font-medium">Students</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg text-center">
            <UserCheck className="w-6 h-6 text-green-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{branch.stats?.teachers || 0}</p>
            <p className="text-xs text-green-600 uppercase font-medium">Teachers</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg text-center">
            <Users className="w-6 h-6 text-purple-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{branch.stats?.staff || 0}</p>
            <p className="text-xs text-purple-600 uppercase font-medium">Staff</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h4 className="text-sm font-semibold text-gray-800 mb-3 border-b pb-2">Basic Info</h4>
            <div className="space-y-2 text-sm">
              <p><span className="font-medium text-gray-500 w-24 inline-block">Name:</span> {branch.name}</p>
              <p><span className="font-medium text-gray-500 w-24 inline-block">Code:</span> {branch.code}</p>
              <p><span className="font-medium text-gray-500 w-24 inline-block">Status:</span> 
                <span className={`px-2 py-0.5 rounded-full text-xs ml-1 ${branch.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {branch.is_active ? 'Active' : 'Inactive'}
                </span>
              </p>
              {branch.settings?.establishedDate && (
                <p><span className="font-medium text-gray-500 w-24 inline-block">Founded:</span> {format(new Date(branch.settings.establishedDate), 'PPP')}</p>
              )}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-800 mb-3 border-b pb-2">Contact Details</h4>
            <div className="space-y-2 text-sm">
              <p className="flex items-center gap-2"><Mail className="w-4 h-4 text-gray-400" /> {branch.contact?.email || branch.email || 'N/A'}</p>
              <p className="flex items-center gap-2"><Phone className="w-4 h-4 text-gray-400" /> {branch.contact?.phone || branch.phone || 'N/A'}</p>
              <p className="flex items-center gap-2"><MapPin className="w-4 h-4 text-gray-400" /> {branch.address?.city || branch.city || 'N/A'}</p>
            </div>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-gray-800 mb-2">Physical Address</h4>
          <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-100 italic">
            {branch.address?.street || 'No street address provided.'}
          </p>
        </div>

        {branch.bankAccounts && branch.bankAccounts.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-gray-800 mb-3 border-b pb-2">Bank Accounts</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {branch.bankAccounts.map((acc, idx) => (
                <div key={idx} className="bg-white border border-gray-200 p-4 rounded-lg text-sm relative">
                  {acc.isDefault && <span className="absolute top-2 right-2 text-[10px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full font-bold">PRIMARY</span>}
                  <p className="font-bold text-gray-900">{acc.accountTitle || 'Unnamed Account'}</p>
                  <p className="text-blue-600 font-medium text-xs">{acc.serviceName || 'Unknown Bank'}</p>
                  <div className="mt-2 pt-2 border-t border-gray-50 text-[11px] text-gray-500 space-y-1">
                    <p>A/C: <span className="text-gray-700 font-mono font-medium">{acc.accountNo || 'N/A'}</span></p>
                    {acc.iban && <p>IBAN: <span className="text-gray-700 font-mono font-medium block truncate">{acc.iban}</span></p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {branch.location?.latitude && (
           <div className="pt-2">
              <h4 className="text-sm font-semibold text-gray-800 mb-3 border-b pb-2">Location Map</h4>
              <div className="h-[200px] rounded-lg overflow-hidden shadow-inner ring-1 ring-gray-100 pointer-events-none">
                <BranchMap latitude={branch.location.latitude} longitude={branch.location.longitude} onLocationChange={() => {}} />
              </div>
           </div>
        )}
      </div>
    </Modal>
  );
};

export default BranchViewModal;
