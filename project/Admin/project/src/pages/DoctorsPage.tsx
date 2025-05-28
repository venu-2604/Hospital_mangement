import React, { useState } from 'react';
import { useStaff } from '../context/StaffContext';
import { User, UserRole } from '../types';
import { StaffList } from '../components/staff/StaffList';
import { StaffForm } from '../components/staff/StaffForm';
import { DeleteConfirmationModal } from '../components/modals/DeleteConfirmationModal';
import { Button } from '../components/ui/Button';
import { UserPlus } from 'lucide-react';

export const DoctorsPage: React.FC = () => {
  const { getDoctors, addStaffMember, updateStaffMember, deleteStaffMember, getStaffMemberById } = useStaff();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentDoctor, setCurrentDoctor] = useState<User | undefined>(undefined);
  const [formType, setFormType] = useState<'create' | 'edit'>('create');
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, doctorId: '' });

  const handleAddNew = () => {
    setFormType('create');
    setCurrentDoctor(undefined);
    setIsFormOpen(true);
  };

  const handleEdit = (id: string) => {
    const doctor = getStaffMemberById(id);
    if (doctor) {
      setCurrentDoctor(doctor);
      setFormType('edit');
      setIsFormOpen(true);
    }
  };

  const handleDelete = (id: string) => {
    setDeleteModal({ isOpen: true, doctorId: id });
  };

  const confirmDelete = () => {
    deleteStaffMember(deleteModal.doctorId);
    setDeleteModal({ isOpen: false, doctorId: '' });
  };

  const handleFormSubmit = (data: Omit<User, 'id'>) => {
    if (formType === 'create') {
      addStaffMember({ ...data, role: UserRole.DOCTOR });
    } else if (formType === 'edit' && currentDoctor) {
      updateStaffMember(currentDoctor.id, data);
    }
    setIsFormOpen(false);
  };

  return (
    <div>
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Doctors Management</h1>
          <p className="text-gray-600">Manage doctor profiles and credentials</p>
        </div>
        <Button 
          variant="primary"
          className="mt-4 sm:mt-0"
          onClick={handleAddNew}
        >
          <UserPlus size={18} className="mr-2" />
          Add New Doctor
        </Button>
      </div>

      {isFormOpen ? (
        <StaffForm
          initialData={currentDoctor}
          onSubmit={handleFormSubmit}
          onCancel={() => setIsFormOpen(false)}
          formType={formType}
          staffType="doctor"
        />
      ) : (
        <StaffList
          staff={getDoctors()}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}

      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, doctorId: '' })}
        onConfirm={confirmDelete}
        title="Delete Doctor"
        message="Are you sure you want to delete this doctor? This action cannot be undone."
      />
    </div>
  );
};