import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, UserRole, UserStatus } from '../types';
import {
  createDoctor,
  createNurse,
  fetchAllNurses,
  fetchDoctorSummaries,
  type DoctorSummaryResponse,
  type NurseResponse
} from '../services/adminApi';
import { updateDoctorStatus } from '../../services/api';

function normalizeDbStatus(status: string | null | undefined): UserStatus {
  if (!status) return UserStatus.INACTIVE;
  const u = status.toLowerCase();
  if (u === 'active') return UserStatus.ACTIVE;
  if (u === 'pending') return UserStatus.PENDING;
  return UserStatus.INACTIVE;
}

function splitName(name: string | null | undefined): { firstName: string; lastName: string } {
  const n = (name || '').trim();
  if (!n) return { firstName: 'Unknown', lastName: '' };
  const i = n.indexOf(' ');
  if (i === -1) return { firstName: n, lastName: '' };
  return { firstName: n.slice(0, i), lastName: n.slice(i + 1).trim() || '' };
}

function mapDoctorToUser(d: DoctorSummaryResponse): User {
  const { firstName, lastName } = splitName(d.name);
  const joinDate = d.createdAt ? d.createdAt.slice(0, 10) : '';
  return {
    id: d.doctorId,
    firstName,
    lastName,
    email: d.email || '',
    role: UserRole.DOCTOR,
    department: d.department || undefined,
    joinDate,
    status: normalizeDbStatus(d.status),
  };
}

function mapNurseToUser(n: NurseResponse): User {
  const { firstName, lastName } = splitName(n.name);
  return {
    id: n.nurseId,
    firstName,
    lastName,
    email: n.email || '',
    role: UserRole.NURSE,
    joinDate: '',
    status: normalizeDbStatus(n.status),
  };
}

function userStatusToBackend(status: UserStatus): string {
  switch (status) {
    case UserStatus.ACTIVE:
      return 'Active';
    case UserStatus.PENDING:
      return 'Pending';
    default:
      return 'Inactive';
  }
}

function userRoleToBackend(role: UserRole): string {
  return role.toUpperCase();
}

function toFullName(user: Omit<User, 'id'>): string {
  return `${user.firstName} ${user.lastName || ''}`.trim();
}

interface StaffContextType {
  staff: User[];
  loading: boolean;
  error: string | null;
  refreshStaff: () => Promise<void>;
  addStaffMember: (staffMember: Omit<User, 'id'>) => Promise<void>;
  updateStaffMember: (id: string, updates: Partial<User>) => Promise<void>;
  deleteStaffMember: (id: string) => void;
  getStaffMemberById: (id: string) => User | undefined;
  getDoctors: () => User[];
  getNurses: () => User[];
}

const StaffContext = createContext<StaffContextType>({
  staff: [],
  loading: true,
  error: null,
  refreshStaff: async () => {},
  addStaffMember: async () => {},
  updateStaffMember: async () => {},
  deleteStaffMember: () => {},
  getStaffMemberById: () => undefined,
  getDoctors: () => [],
  getNurses: () => []
});

export const useStaff = () => useContext(StaffContext);

export const StaffProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [staff, setStaff] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshStaff = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [doctors, nurses] = await Promise.all([fetchDoctorSummaries(), fetchAllNurses()]);
      const mapped: User[] = [
        ...doctors.map(mapDoctorToUser),
        ...nurses.map(mapNurseToUser)
      ];
      setStaff(mapped);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to load staff';
      setError(message);
      setStaff([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshStaff();
  }, [refreshStaff]);

  const addStaffMember = async (staffMember: Omit<User, 'id'>) => {
    if (staffMember.role === UserRole.DOCTOR) {
      await createDoctor({
        name: toFullName(staffMember),
        email: staffMember.email,
        password: staffMember.password || '',
        role: userRoleToBackend(staffMember.role),
        status: userStatusToBackend(staffMember.status),
        department: staffMember.department || undefined,
      });
      await refreshStaff();
      return;
    }

    if (staffMember.role === UserRole.NURSE) {
      await createNurse({
        name: toFullName(staffMember),
        email: staffMember.email,
        password: staffMember.password || '',
        role: userRoleToBackend(staffMember.role),
        status: userStatusToBackend(staffMember.status),
      });
      await refreshStaff();
      return;
    }
  };

  const updateStaffMember = async (id: string, updates: Partial<User>) => {
    const member = staff.find(m => m.id === id);
    if (member?.role === UserRole.DOCTOR && updates.status !== undefined) {
      const ok = await updateDoctorStatus(id, userStatusToBackend(updates.status));
      if (ok) {
        await refreshStaff();
        return;
      }
    }
    setStaff(prev =>
      prev.map(m => (m.id === id ? { ...m, ...updates } : m))
    );
  };

  const deleteStaffMember = (id: string) => {
    setStaff(prev => prev.filter(member => member.id !== id));
  };

  const getStaffMemberById = (id: string) => staff.find(member => member.id === id);

  const getDoctors = () => staff.filter(member => member.role === UserRole.DOCTOR);

  const getNurses = () => staff.filter(member => member.role === UserRole.NURSE);

  return (
    <StaffContext.Provider
      value={{
        staff,
        loading,
        error,
        refreshStaff,
        addStaffMember,
        updateStaffMember,
        deleteStaffMember,
        getStaffMemberById,
        getDoctors,
        getNurses
      }}
    >
      {children}
    </StaffContext.Provider>
  );
};
