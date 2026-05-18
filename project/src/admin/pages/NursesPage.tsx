import React, { useState } from 'react';
import { useStaff } from '../context/StaffContext';
import { User } from '../types';
import { StaffList } from '../components/staff/StaffList';
import { StaffForm } from '../components/staff/StaffForm';
import { DeleteConfirmationModal } from '../components/modals/DeleteConfirmationModal';
import { Button } from '../components/ui/Button';
import { UserPlus } from 'lucide-react';

export const NursesPage: React.FC = () => {
  const { getNurses, addStaffMember, updateStaffMember, deleteStaffMember, getStaffMemberById, loading, error, refreshStaff } = useStaff();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentNurse, setCurrentNurse] = useState<User | undefined>(undefined);
  const [formType, setFormType] = useState<'create' | 'edit'>('create');
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, nurseId: '' });

  const handleAddNew = () => {
    setFormType('create');
    setCurrentNurse(undefined);
    setIsFormOpen(true);
  };

  const handleEdit = (id: string) => {
    const nurse = getStaffMemberById(id);
    if (nurse) {
      setCurrentNurse(nurse);
      setFormType('edit');
      setIsFormOpen(true);
    }
  };

  const handleDelete = (id: string) => {
    setDeleteModal({ isOpen: true, nurseId: id });
  };

  const confirmDelete = () => {
    deleteStaffMember(deleteModal.nurseId);
    setDeleteModal({ isOpen: false, nurseId: '' });
  };

  const handleFormSubmit = async (data: Omit<User, 'id'>) => {
    if (formType === 'create') {
      await addStaffMember(data);
    } else if (formType === 'edit' && currentNurse) {
      await updateStaffMember(currentNurse.id, data);
    }
    setIsFormOpen(false);
  };

  if (loading) {
    return (
      <div className="p-6">
        <p className="text-gray-600">Loading nurses…</p>
      </div>
    );
  }

  return (
    <div>
      {error && (
        <div className="mb-4 flex flex-wrap items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <span>{error}</span>
          <button type="button" className="font-medium text-amber-800 underline" onClick={() => void refreshStaff()}>
            Retry
          </button>
        </div>
      )}
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Nurses Management</h1>
          <p className="text-gray-600">Manage nurse profiles and credentials</p>
        </div>
        <Button 
          variant="secondary" 
          className="mt-4 sm:mt-0"
          onClick={handleAddNew}
        >
          <UserPlus size={18} className="mr-2" />
          Add New Nurse
        </Button>
      </div>

      {isFormOpen ? (
        <StaffForm
          initialData={currentNurse}
          onSubmit={handleFormSubmit}
          onCancel={() => setIsFormOpen(false)}
          formType={formType}
          staffType="nurse"
        />
      ) : (
        <StaffList
          staff={getNurses()}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}

      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, nurseId: '' })}
        onConfirm={confirmDelete}
        title="Delete Nurse"
        message="Are you sure you want to delete this nurse? This action cannot be undone."
      />
    </div>
  );
};