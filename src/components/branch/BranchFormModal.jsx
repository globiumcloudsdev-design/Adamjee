import React from 'react';
import Modal from '@/components/ui/modal';
import Input from '@/components/ui/input';
import Dropdown from '@/components/ui/dropdown';
import { Button } from '@/components/ui/button';
import { Plus, X } from 'lucide-react';
import dynamic from 'next/dynamic';

const BranchMap = dynamic(() => import('@/components/branch/BranchMap'), { 
  ssr: false,
  loading: () => <div className="h-[300px] w-full bg-gray-100 animate-pulse rounded-lg flex items-center justify-center text-gray-400">Loading Map...</div>
});

const BranchFormModal = ({ open, onClose, editingBranch, formData, setFormData, onSubmit }) => {
  const addBankAccount = () => {
    setFormData({
      ...formData,
      bankAccounts: [
        ...formData.bankAccounts,
        { accountTitle: '', serviceName: '', accountNo: '', iban: '', isDefault: false },
      ],
    });
  };

  const removeBankAccount = (index) => {
    const newAccounts = formData.bankAccounts.filter((_, i) => i !== index);
    setFormData({ ...formData, bankAccounts: newAccounts });
  };

  const updateBankAccount = (index, field, value) => {
    const newAccounts = [...formData.bankAccounts];
    newAccounts[index][field] = value;
    setFormData({ ...formData, bankAccounts: newAccounts });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editingBranch ? 'Edit Branch' : 'Add New Branch'}
      size="xl"
      footer={(
        <div className="flex items-center justify-end gap-3">
          <Button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="branch-form"
          >
            {editingBranch ? 'Update Branch' : 'Create Branch'}
          </Button>
        </div>
      )}
    >
      <form id="branch-form" onSubmit={onSubmit} className="p-1">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Branch Name <span className="text-red-500">*</span>
            </label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Main Campus"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Branch Code <span className="text-red-500">*</span>
            </label>
            <Input
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              placeholder="MC001"
              disabled={editingBranch}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email <span className="text-red-500">*</span>
            </label>
            <Input
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="branch@example.com"
              type="email"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone <span className="text-red-500">*</span>
            </label>
            <Input
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+92-XXX-XXXXXXX"
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
          <textarea
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-hidden"
            rows="2"
            placeholder="Street address"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
            <Input
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              placeholder="Lahore"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">State/Province</label>
            <Input
              value={formData.state}
              onChange={(e) => setFormData({ ...formData, state: e.target.value })}
              placeholder="Punjab"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
            <Input
              value={formData.country}
              onChange={(e) => setFormData({ ...formData, country: e.target.value })}
              placeholder="Pakistan"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Postal Code</label>
            <Input
              value={formData.postalCode}
              onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
              placeholder="54000"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Established Date</label>
            <Input
              type="date"
              value={formData.establishedDate}
              onChange={(e) => setFormData({ ...formData, establishedDate: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <Dropdown
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              options={[{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }]}
              placeholder={null}
            />
          </div>
        </div>

        {/* Location Map */}
        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Branch Location (Drag Pin to Set)</label>
          <div className="rounded-xl overflow-hidden shadow-sm ring-1 ring-gray-200">
            <BranchMap 
              latitude={formData.location.latitude} 
              longitude={formData.location.longitude}
              onLocationChange={(pos) => setFormData({
                ...formData,
                location: { latitude: pos.lat, longitude: pos.lng }
              })}
            />
          </div>
        </div>

        {/* Bank Accounts */}
        <div className="mt-8 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-900 border-b-2 border-blue-500 pb-1">Bank Accounts</h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addBankAccount}
              className="flex items-center gap-2 border-blue-200 text-blue-600 hover:bg-blue-50"
            >
              <Plus className="w-4 h-4" />
              Add Account
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {formData.bankAccounts.map((account, index) => (
              <div key={index} className="p-5 border border-gray-200 rounded-2xl bg-gray-50/50 relative group transition-all hover:bg-white hover:shadow-md">
                {formData.bankAccounts.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeBankAccount(index)}
                    className="absolute top-4 right-4 text-gray-400 hover:text-red-500 p-2 hover:bg-red-50 rounded-full transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-tighter">Account Title</label>
                    <Input
                      value={account.accountTitle}
                      onChange={(e) => updateBankAccount(index, 'accountTitle', e.target.value)}
                      placeholder="Coaching Main Account"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-tighter">Bank / Service Name</label>
                    <Input
                      value={account.serviceName}
                      onChange={(e) => updateBankAccount(index, 'serviceName', e.target.value)}
                      placeholder="HBL / EasyPaisa"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-tighter">Account Number</label>
                    <Input
                      value={account.accountNo}
                      onChange={(e) => updateBankAccount(index, 'accountNo', e.target.value)}
                      placeholder="XXXX-XXXX-XXXX"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-tighter">IBAN</label>
                    <Input
                      value={account.iban}
                      onChange={(e) => updateBankAccount(index, 'iban', e.target.value)}
                      placeholder="PKXX XXXX XXXX XXXX"
                    />
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-3 bg-white p-2 rounded-lg border border-gray-100 w-max shadow-sm">
                  <input
                    type="checkbox"
                    id={`default-${index}`}
                    checked={account.isDefault}
                    onChange={(e) => {
                      const newAccounts = formData.bankAccounts.map((acc, i) => ({
                        ...acc,
                        isDefault: i === index ? e.target.checked : false
                      }));
                      setFormData({ ...formData, bankAccounts: newAccounts });
                    }}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor={`default-${index}`} className="text-xs font-bold text-gray-600 cursor-pointer uppercase tracking-tight">
                    Set as Primary Account
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default BranchFormModal;
