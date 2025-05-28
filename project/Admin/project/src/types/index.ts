// Define types for the hospital management system

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  department?: string;
  specialization?: string;
  phoneNumber?: string;
  joinDate: string;
  status: UserStatus;
  imageUrl?: string;
}

export enum UserRole {
  ADMIN = 'admin',
  DOCTOR = 'doctor',
  NURSE = 'nurse'
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PENDING = 'pending'
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  error: string | null;
}

export interface StaffStats {
  totalDoctors: number;
  totalNurses: number;
  activeStaff: number;
  pendingApprovals: number;
}