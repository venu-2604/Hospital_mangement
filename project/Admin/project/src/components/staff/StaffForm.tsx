import React, { useState, useEffect } from 'react';
import { User, UserRole, UserStatus } from '../../types';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { X } from 'lucide-react';

interface StaffFormProps {
  initialData?: User;
  onSubmit: (data: Omit<User, 'id'>) => void;
  onCancel: () => void;
  formType: 'create' | 'edit';
  staffType: 'doctor' | 'nurse';
}

export const StaffForm: React.FC<StaffFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  formType,
  staffType
}) => {
  const [formData, setFormData] = useState<Omit<User, 'id'>>({
    firstName: '',
    lastName: '',
    email: '',
    role: staffType === 'doctor' ? UserRole.DOCTOR : UserRole.NURSE,
    department: '',
    specialization: '',
    phoneNumber: '',
    joinDate: new Date().toISOString().split('T')[0],
    status: UserStatus.ACTIVE,
    imageUrl: ''
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load initial data when editing
  useEffect(() => {
    if (initialData && formType === 'edit') {
      setFormData({
        firstName: initialData.firstName,
        lastName: initialData.lastName,
        email: initialData.email,
        role: initialData.role,
        department: initialData.department || '',
        specialization: initialData.specialization || '',
        phoneNumber: initialData.phoneNumber || '',
        joinDate: initialData.joinDate.split('T')[0],
        status: initialData.status,
        imageUrl: initialData.imageUrl || ''
      });
    }
  }, [initialData, formType]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
    
    // Clear error for this field
    if (errors[id]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[id];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!formData.department.trim()) {
      newErrors.department = 'Department is required';
    }
    
    if (formData.role === UserRole.DOCTOR && !formData.specialization?.trim()) {
      newErrors.specialization = 'Specialization is required for doctors';
    }
    
    if (!formData.joinDate) {
      newErrors.joinDate = 'Join date is required';
    }
    
    return newErrors;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrors = validateForm();
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    onSubmit(formData);
  };

  const departmentOptions = [
    { value: 'Cardiology', label: 'Cardiology' },
    { value: 'Neurology', label: 'Neurology' },
    { value: 'Pediatrics', label: 'Pediatrics' },
    { value: 'Oncology', label: 'Oncology' },
    { value: 'Emergency', label: 'Emergency' },
    { value: 'Surgery', label: 'Surgery' },
    { value: 'Orthopedics', label: 'Orthopedics' },
    { value: 'Psychiatry', label: 'Psychiatry' },
    { value: 'Radiology', label: 'Radiology' },
  ];

  const specializationOptions = [
    { value: 'Cardiac Surgery', label: 'Cardiac Surgery' },
    { value: 'Neurosurgery', label: 'Neurosurgery' },
    { value: 'Pediatric Cardiology', label: 'Pediatric Cardiology' },
    { value: 'Oncologist', label: 'Oncologist' },
    { value: 'Emergency Medicine', label: 'Emergency Medicine' },
    { value: 'General Surgery', label: 'General Surgery' },
    { value: 'Orthopedic Surgery', label: 'Orthopedic Surgery' },
    { value: 'Clinical Psychiatry', label: 'Clinical Psychiatry' },
    { value: 'Diagnostic Radiology', label: 'Diagnostic Radiology' },
  ];

  const statusOptions = [
    { value: UserStatus.ACTIVE, label: 'Active' },
    { value: UserStatus.INACTIVE, label: 'Inactive' },
    { value: UserStatus.PENDING, label: 'Pending Approval' },
  ];

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800">
          {formType === 'create' ? `Add New ${staffType === 'doctor' ? 'Doctor' : 'Nurse'}` : `Edit ${staffType === 'doctor' ? 'Doctor' : 'Nurse'}`}
        </h2>
        <button 
          onClick={onCancel}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X size={24} />
        </button>
      </div>
      
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            id="firstName"
            label="First Name"
            value={formData.firstName}
            onChange={handleChange}
            error={errors.firstName}
            required
          />
          
          <Input
            id="lastName"
            label="Last Name"
            value={formData.lastName}
            onChange={handleChange}
            error={errors.lastName}
            required
          />
          
          <Input
            id="email"
            label="Email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            error={errors.email}
            required
          />
          
          <Input
            id="phoneNumber"
            label="Phone Number"
            value={formData.phoneNumber || ''}
            onChange={handleChange}
            error={errors.phoneNumber}
          />
          
          <Select
            id="department"
            label="Department"
            options={departmentOptions}
            value={formData.department || ''}
            onChange={handleChange}
            error={errors.department}
            required
          />
          
          {formData.role === UserRole.DOCTOR && (
            <Select
              id="specialization"
              label="Specialization"
              options={specializationOptions}
              value={formData.specialization || ''}
              onChange={handleChange}
              error={errors.specialization}
              required
            />
          )}
          
          <Input
            id="joinDate"
            label="Join Date"
            type="date"
            value={formData.joinDate.split('T')[0]}
            onChange={handleChange}
            error={errors.joinDate}
            required
          />
          
          <Select
            id="status"
            label="Status"
            options={statusOptions}
            value={formData.status}
            onChange={(e) => {
              setFormData((prev) => ({ 
                ...prev, 
                status: e.target.value as UserStatus 
              }));
            }}
            error={errors.status}
            required
          />
          
          <Input
            id="imageUrl"
            label="Profile Image URL"
            value={formData.imageUrl || ''}
            onChange={handleChange}
            error={errors.imageUrl}
            className="md:col-span-2"
          />
        </div>
        
        <div className="mt-6 flex justify-end space-x-4">
          <Button
            variant="outline"
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant={formType === 'create' ? 'success' : 'primary'}
          >
            {formType === 'create' ? 'Create' : 'Update'}
          </Button>
        </div>
      </form>
    </div>
  );
};