import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, Loader2, User, X, ChevronDown, Check } from 'lucide-react';
import apiClient from '@/lib/api-client';
import { API_ENDPOINTS } from '@/constants/api-endpoints';

export default function SearchableStudentSelect({ 
  value, 
  onChange, 
  branchId, 
  placeholder = 'Search by Name, Phone or GR No...',
  label = 'Select Student',
  disabled = false,
  required = false,
  isMulti = false
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [studentCache, setStudentCache] = useState({}); // Cache for student objects by ID
  const dropdownRef = useRef(null);
  const searchTimeout = useRef(null);

  // Normalize current value to array of IDs
  const currentIds = useMemo(() => {
    if (!value) return [];
    return Array.isArray(value) ? value : [value];
  }, [value]);

  // Derived selected students from cache + currentIds
  const selectedStudents = useMemo(() => {
    return currentIds.map(id => studentCache[id]).filter(Boolean);
  }, [currentIds, studentCache]);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch missing students from cache
  useEffect(() => {
    const fetchMissing = async () => {
      const missingIds = currentIds.filter(id => !studentCache[id]);
      if (missingIds.length === 0) return;

      try {
        setLoading(true);
        const fetched = await Promise.all(
          missingIds.map(id => apiClient.get(`${API_ENDPOINTS.SUPER_ADMIN.STUDENTS.LIST}/${id}`))
        );
        
        const newCacheEntries = {};
        fetched.forEach(st => {
          if (st) {
            newCacheEntries[st.id || st._id] = st;
          }
        });

        if (Object.keys(newCacheEntries).length > 0) {
          setStudentCache(prev => ({ ...prev, ...newCacheEntries }));
        }
      } catch (err) {
        console.error('Error fetching students:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMissing();
  }, [currentIds]);

  const handleSearch = async (term) => {
    if (!term || term.trim().length < 2) {
      setStudents([]);
      return;
    }

    setLoading(true);
    try {
      const params = { q: term };
      if (branchId) params.branch_id = branchId;
      
      const response = await apiClient.get(API_ENDPOINTS.SUPER_ADMIN.STUDENTS.SEARCH, params);
      const data = Array.isArray(response) ? response : (response.data || []);
      
      // Update cache with search results
      const newCacheEntries = {};
      data.forEach(st => {
        newCacheEntries[st.id || st._id] = st;
      });
      setStudentCache(prev => ({ ...prev, ...newCacheEntries }));
      
      setStudents(data);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    
    if (searchTerm) {
      searchTimeout.current = setTimeout(() => {
        handleSearch(searchTerm);
      }, 500);
    } else {
      setStudents([]);
    }

    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
    };
  }, [searchTerm]);

  const handleSelect = (student) => {
    const studentId = student.id || student._id;
    
    // Ensure it's in cache
    if (!studentCache[studentId]) {
      setStudentCache(prev => ({ ...prev, [studentId]: student }));
    }

    if (isMulti) {
      const isAlreadySelected = currentIds.includes(studentId);
      let newIds;
      if (isAlreadySelected) {
        newIds = currentIds.filter(id => id !== studentId);
      } else {
        newIds = [...currentIds, studentId];
      }
      onChange({ target: { value: newIds } });
    } else {
      setIsOpen(false);
      setSearchTerm('');
      onChange({ target: { value: studentId } });
    }
  };

  const handleRemove = (e, studentId) => {
    e.stopPropagation();
    if (isMulti) {
      const newIds = currentIds.filter(id => id !== studentId);
      onChange({ target: { value: newIds } });
    } else {
      onChange({ target: { value: '' } });
    }
  };

  const getStudentName = (st) => `${st.first_name || ''} ${st.last_name || ''}`.trim();
  const getGRNo = (st) => st.details?.academic_info?.roll_no || st.registration_no || 'N/A';

  return (
    <div className="w-full relative" ref={dropdownRef}>
      {label && (
        <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      <div 
        className={`group relative flex items-center min-h-[44px] bg-white border rounded-xl transition-all duration-200 cursor-pointer shadow-sm
          ${disabled ? 'bg-gray-50 cursor-not-allowed border-gray-200 opacity-70' : 'border-gray-200 hover:border-blue-400 hover:shadow-md focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500'}
          ${isOpen ? 'border-blue-500 ring-2 ring-blue-500/20' : ''}
        `}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <div className="flex-1 flex flex-wrap items-center px-4 py-1.5 gap-2 overflow-hidden">
          {selectedStudents.length === 0 && (
            <div className="flex items-center gap-3">
              <User size={18} className="text-gray-400" />
              <span className="text-sm text-gray-400">{placeholder}</span>
            </div>
          )}

          {isMulti ? (
            selectedStudents.map(st => (
              <span key={st.id || st._id} className="bg-blue-50 text-blue-700 text-xs font-bold px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 border border-blue-100 shadow-sm animate-in zoom-in-95 duration-100">
                {getStudentName(st)}
                <button 
                  type="button"
                  onClick={(e) => handleRemove(e, st.id || st._id)}
                  className="hover:text-red-500 transition-colors"
                >
                  <X size={12} strokeWidth={3} />
                </button>
              </span>
            ))
          ) : (
            selectedStudents[0] && (
              <div className="flex items-center gap-3 overflow-hidden">
                <User size={18} className="text-blue-500" />
                <div className="flex flex-col truncate">
                  <span className="text-sm font-bold text-gray-900 leading-tight">
                    {getStudentName(selectedStudents[0])}
                  </span>
                  <span className="text-[10px] text-gray-500 font-medium uppercase tracking-tight">
                    GR: {getGRNo(selectedStudents[0])} • {selectedStudents[0].branch?.name || ''}
                  </span>
                </div>
              </div>
            )
          )}
        </div>

        <div className="flex items-center pr-3 gap-2 border-l border-gray-100 ml-2 py-1 h-full">
          {selectedStudents.length > 0 && !disabled && (
            <button
              type="button"
              className="p-1 hover:bg-gray-100 rounded-full text-gray-400 hover:text-red-500 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                onChange({ target: { value: isMulti ? [] : '' } });
              }}
            >
              <X size={14} strokeWidth={3} />
            </button>
          )}
          <ChevronDown 
            size={16} 
            className={`text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180 text-blue-500' : ''}`} 
          />
        </div>
      </div>

      {isOpen && !disabled && (
        <div className="absolute z-[100] w-full mt-2 bg-white border border-gray-100 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="p-3 border-b bg-gray-50/50 sticky top-0">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={16} />
              <input
                type="text"
                autoFocus
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all placeholder:text-gray-400"
                placeholder="Type name, phone or GR number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onClick={(e) => e.stopPropagation()}
              />
              {loading && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Loader2 className="animate-spin text-blue-500" size={16} />
                </div>
              )}
            </div>
          </div>

          <div className="max-h-72 overflow-y-auto p-2 space-y-1 custom-scrollbar">
            {/* Selected Students Section (Only in Multi Mode) */}
            {isMulti && selectedStudents.length > 0 && !searchTerm && (
              <div className="mb-4">
                <div className="flex items-center justify-between px-3 py-1 mb-1">
                  <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Selected ({selectedStudents.length})</span>
                  <button 
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onChange({ target: { value: [] } });
                    }}
                    className="text-[10px] font-bold text-red-500 hover:text-red-700 uppercase tracking-widest"
                  >
                    Clear All
                  </button>
                </div>
                <div className="space-y-1">
                  {selectedStudents.map((st) => (
                    <div
                      key={`selected-${st.id || st._id}`}
                      className="flex items-center gap-3 px-3 py-2 rounded-xl bg-blue-50 border border-blue-100 text-blue-700 cursor-pointer hover:bg-blue-100 transition-colors"
                      onClick={() => handleSelect(st)}
                    >
                      <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                        {(st.first_name?.[0] || 'S').toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold truncate">{getStudentName(st)}</span>
                          <Check size={14} strokeWidth={3} />
                        </div>
                        <span className="text-[10px] font-medium opacity-80">GR: {getGRNo(st)}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="h-px bg-gray-100 my-3 mx-2" />
                <span className="px-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Search Results</span>
              </div>
            )}

            {students.length > 0 ? (
              students.map((st) => {
                const isSelected = currentIds.includes(st.id || st._id);
                return (
                  <div
                    key={st.id || st._id}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200
                      ${isSelected ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700'}
                    `}
                    onClick={() => handleSelect(st)}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold
                      ${isSelected ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-600'}
                    `}>
                      {(st.first_name?.[0] || 'S').toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`text-sm font-bold truncate ${isSelected ? 'text-white' : 'text-gray-900'}`}>
                          {getStudentName(st)}
                        </span>
                        {isSelected && <Check size={16} strokeWidth={3} className="shrink-0" />}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${isSelected ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>
                          GR: {getGRNo(st)}
                        </span>
                        <span className={`text-[10px] font-medium ${isSelected ? 'text-blue-100' : 'text-gray-400'}`}>
                          {st.branch?.name || 'Branch N/A'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : searchTerm.length >= 2 ? (
              <div className="py-10 flex flex-col items-center justify-center text-gray-400">
                <Search size={32} className="mb-2 opacity-20" />
                <p className="text-sm font-medium">No students found for "{searchTerm}"</p>
                <p className="text-xs">Try searching with a different keyword</p>
              </div>
            ) : !selectedStudents.length || searchTerm ? (
              <div className="py-8 flex flex-col items-center justify-center text-gray-400 italic">
                <p className="text-sm">Start typing to search students...</p>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
