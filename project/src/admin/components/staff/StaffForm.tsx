import React, { useState, useEffect } from 'react';
import { User, UserRole, UserStatus } from '../../types';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { X } from 'lucide-react';

interface StaffFormProps {
  initialData?: User;
  onSubmit: (data: Omit<User, 'id'>) => void | Promise<void>;
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
    password: '',
    role: staffType === 'doctor' ? UserRole.DOCTOR : UserRole.NURSE,
    department: '',
    status: UserStatus.ACTIVE,
    joinDate: ''
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load initial data when editing
  useEffect(() => {
    if (initialData && formType === 'edit') {
      setFormData({
        firstName: initialData.firstName,
        lastName: initialData.lastName,
        email: initialData.email,
        password: initialData.password || '',
        role: initialData.role,
        department: initialData.department || '',
        status: initialData.status,
        joinDate: initialData.joinDate || ''
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
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.password?.trim()) {
      newErrors.password = 'Password is required';
    }
    
    if (formData.role === UserRole.DOCTOR && !formData.department?.trim()) {
      newErrors.department = 'Department is required';
    }
    
    return newErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrors = validateForm();
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    await Promise.resolve(onSubmit(formData));
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

  const statusOptions = [
    { value: UserStatus.ACTIVE, label: 'Active' },
    { value: UserStatus.INACTIVE, label: 'Inactive' },
    { value: UserStatus.PENDING, label: 'Pending Approval' },
  ];

  const roleOptions = [
    { value: UserRole.DOCTOR, label: 'Doctor' },
    { value: UserRole.NURSE, label: 'Nurse' },
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
            label="Name"
            value={formData.firstName}
            onChange={handleChange}
            error={errors.firstName}
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
            id="password"
            label="Password"
            type="password"
            value={formData.password || ''}
            onChange={handleChange}
            error={errors.password}
            required
          />

          <Select
            id="role"
            label="Role"
            options={roleOptions}
            value={formData.role}
            onChange={(e) => {
              const role = e.target.value as UserRole;
              setFormData((prev) => ({
                ...prev,
                role,
                department: role === UserRole.DOCTOR ? prev.department : '',
              }));
            }}
            required
          />
          
          {formData.role === UserRole.DOCTOR && (
            <Select
              id="department"
              label="Department"
              options={departmentOptions}
              value={formData.department || ''}
              onChange={handleChange}
              error={errors.department}
              required
            />
          )}
          
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