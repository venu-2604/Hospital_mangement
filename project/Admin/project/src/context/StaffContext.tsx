import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole, UserStatus } from '../types';

// Sample data for initial staff members
const initialStaff: User[] = [
  {
    id: 'd1',
    firstName: 'John',
    lastName: 'Smith',
    email: 'john.smith@hospital.com',
    role: UserRole.DOCTOR,
    department: 'Cardiology',
    specialization: 'Cardiac Surgery',
    phoneNumber: '555-123-4567',
    joinDate: '2022-01-15',
    status: UserStatus.ACTIVE,
    imageUrl: 'https://images.pexels.com/photos/5452293/pexels-photo-5452293.jpeg?auto=compress&cs=tinysrgb&w=150'
  },
  {
    id: 'd2',
    firstName: 'Sarah',
    lastName: 'Johnson',
    email: 'sarah.johnson@hospital.com',
    role: UserRole.DOCTOR,
    department: 'Neurology',
    specialization: 'Neurosurgery',
    phoneNumber: '555-234-5678',
    joinDate: '2021-05-20',
    status: UserStatus.ACTIVE,
    imageUrl: 'https://images.pexels.com/photos/5214958/pexels-photo-5214958.jpeg?auto=compress&cs=tinysrgb&w=150'
  },
  {
    id: 'n1',
    firstName: 'Emily',
    lastName: 'Davis',
    email: 'emily.davis@hospital.com',
    role: UserRole.NURSE,
    department: 'Emergency',
    phoneNumber: '555-345-6789',
    joinDate: '2022-03-10',
    status: UserStatus.ACTIVE,
    imageUrl: 'https://images.pexels.com/photos/5407206/pexels-photo-5407206.jpeg?auto=compress&cs=tinysrgb&w=150'
  },
  {
    id: 'n2',
    firstName: 'Michael',
    lastName: 'Wilson',
    email: 'michael.wilson@hospital.com',
    role: UserRole.NURSE,
    department: 'Pediatrics',
    phoneNumber: '555-456-7890',
    joinDate: '2023-01-05',
    status: UserStatus.PENDING,
    imageUrl: 'https://images.pexels.com/photos/6749773/pexels-photo-6749773.jpeg?auto=compress&cs=tinysrgb&w=150'
  }
];

interface StaffContextType {
  staff: User[];
  addStaffMember: (staffMember: Omit<User, 'id'>) => void;
  updateStaffMember: (id: string, updates: Partial<User>) => void;
  deleteStaffMember: (id: string) => void;
  getStaffMemberById: (id: string) => User | undefined;
  getDoctors: () => User[];
  getNurses: () => User[];
}

const StaffContext = createContext<StaffContextType>({
  staff: [],
  addStaffMember: () => {},
  updateStaffMember: () => {},
  deleteStaffMember: () => {},
  getStaffMemberById: () => undefined,
  getDoctors: () => [],
  getNurses: () => []
});

export const useStaff = () => useContext(StaffContext);

export const StaffProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [staff, setStaff] = useState<User[]>(() => {
    const savedStaff = localStorage.getItem('hospital_staff');
    return savedStaff ? JSON.parse(savedStaff) : initialStaff;
  });

  // Save staff to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('hospital_staff', JSON.stringify(staff));
  }, [staff]);

  const addStaffMember = (staffMember: Omit<User, 'id'>) => {
    const newStaffMember = {
      ...staffMember,
      id: `${staffMember.role[0]}${Date.now()}`
    };
    setStaff(prev => [...prev, newStaffMember]);
  };

  const updateStaffMember = (id: string, updates: Partial<User>) => {
    setStaff(prev => 
      prev.map(member => 
        member.id === id ? { ...member, ...updates } : member
      )
    );
  };

  const deleteStaffMember = (id: string) => {
    setStaff(prev => prev.filter(member => member.id !== id));
  };

  const getStaffMemberById = (id: string) => {
    return staff.find(member => member.id === id);
  };

  const getDoctors = () => {
    return staff.filter(member => member.role === UserRole.DOCTOR);
  };

  const getNurses = () => {
    return staff.filter(member => member.role === UserRole.NURSE);
  };

  return (
    <StaffContext.Provider value={{
      staff,
      addStaffMember,
      updateStaffMember,
      deleteStaffMember,
      getStaffMemberById,
      getDoctors,
      getNurses
    }}>
      {children}
    </StaffContext.Provider>
  );
};