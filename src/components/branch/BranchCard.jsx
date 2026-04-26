import React from 'react';
import { Building2, MapPin, Phone, Mail, Eye, Edit, Trash2 } from 'lucide-react';

const BranchCard = ({ branch, onView, onEdit, onDelete }) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
      <div className="bg-linear-to-r from-blue-600 to-blue-700 p-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white">{branch.name}</h3>
            <p className="text-blue-100 text-sm">Code: {branch.code}</p>
          </div>
          <span
            className={`px-2 py-1 text-[10px] font-bold uppercase rounded-full ${branch.is_active
                ? 'bg-green-100 text-green-700'
                : 'bg-red-100 text-red-700'
              }`}
          >
            {branch.is_active ? 'Active' : 'Inactive'}
          </span>
        </div>
      </div>

      <div className="p-4 space-y-3">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <MapPin className="w-4 h-4 text-gray-400" />
          <span className="truncate">{branch.address?.city || branch.city || 'N/A'}</span>
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Phone className="w-4 h-4 text-gray-400" />
          <span className="truncate">{branch.contact?.phone || branch.phone || 'N/A'}</span>
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Mail className="w-4 h-4 text-gray-400" />
          <span className="truncate">{branch.contact?.email || branch.email || 'N/A'}</span>
        </div>

        <div className="pt-4 border-t border-dashed border-gray-200 grid grid-cols-3 gap-2">
          <div className="bg-blue-50 py-2 rounded-lg text-center">
            <p className="text-lg font-bold text-blue-700 leading-none">{branch.stats?.students || 0}</p>
            <p className="text-[10px] text-blue-600 font-medium uppercase mt-1">Students</p>
          </div>
          <div className="bg-green-50 py-2 rounded-lg text-center border-x border-gray-100">
            <p className="text-lg font-bold text-green-700 leading-none">{branch.stats?.teachers || 0}</p>
            <p className="text-[10px] text-green-600 font-medium uppercase mt-1">Teachers</p>
          </div>
          <div className="bg-purple-50 py-2 rounded-lg text-center">
            <p className="text-lg font-bold text-purple-700 leading-none">{branch.stats?.staff || 0}</p>
            <p className="text-[10px] text-purple-600 font-medium uppercase mt-1">Staff</p>
          </div>
        </div>

        <div className="pt-4 flex items-center gap-2">
          <button
            onClick={() => onView(branch)}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors border border-gray-200"
          >
            <Eye className="w-4 h-4" />
            View Details
          </button>
          <div className="flex gap-2">
            <button
              onClick={() => onEdit(branch)}
              className="p-2.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-100"
              title="Edit Branch"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(branch)}
              className="p-2.5 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors border border-red-100"
              title="Delete Branch"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BranchCard;
