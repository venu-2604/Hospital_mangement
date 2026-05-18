import React, { createContext, useContext, useState } from 'react';
import { AuthState, User, UserRole } from '../types';

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const defaultAuthState: AuthState = {
  isAuthenticated: false,
  user: null,
  loading: false,
  error: null
};

const AuthContext = createContext<AuthContextType>({
  ...defaultAuthState,
  login: async () => {},
  logout: () => {}
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>(() => {
    // Check if user is already logged in from localStorage
    const savedUser = localStorage.getItem('hospital_admin_user');
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        return {
          isAuthenticated: true,
          user,
          loading: false,
          error: null
        };
      } catch (error) {
        localStorage.removeItem('hospital_admin_user');
      }
    }
    return defaultAuthState;
  });

  const login = async (email: string, password: string) => {
    setAuthState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      // Mock authentication - in a real app, this would be an API call
      if (email === 'admin@hospital.com' && password === 'admin123') {
        const mockAdminUser: User = {
          id: '1',
          firstName: 'Admin',
          lastName: 'User',
          email: 'admin@hospital.com',
          role: UserRole.ADMIN,
          joinDate: new Date().toISOString(),
          status: 'active' as any,
          imageUrl: 'https://images.pexels.com/photos/5452268/pexels-photo-5452268.jpeg?auto=compress&cs=tinysrgb&w=150'
        };
        
        localStorage.setItem('hospital_admin_user', JSON.stringify(mockAdminUser));
        
        setAuthState({
          isAuthenticated: true,
          user: mockAdminUser,
          loading: false,
          error: null
        });
      } else {
        throw new Error('Invalid credentials');
      }
    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Authentication failed'
      }));
    }
  };

  const logout = () => {
    localStorage.removeItem('hospital_admin_user');
    setAuthState(defaultAuthState);
  };

  return (
    <AuthContext.Provider value={{ ...authState, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};