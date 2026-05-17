'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from './types';

interface AuthContextType {
  user: User | null;
  role: UserRole | null;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const MOCK_USERS: Record<string, User> = {
  'emp-001': {
    id: 'emp-001',
    name: 'Alex Johnson',
    email: 'employee@company.com',
    password: 'password123',
    role: 'employee',
    department: 'Engineering',
    avatar: '👨‍💼',
    managerId: 'mgr-001',
  },
  'mgr-001': {
    id: 'mgr-001',
    name: 'Sarah Chen',
    email: 'manager@company.com',
    password: 'password123',
    role: 'manager',
    department: 'Engineering',
    avatar: '👩‍💼',
  },
  'admin-001': {
    id: 'admin-001',
    name: 'Michael Roberts',
    email: 'admin@company.com',
    password: 'password123',
    role: 'admin',
    department: 'HR',
    avatar: '👨‍💻',
  },
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check localStorage on mount
    const savedUserId = localStorage.getItem('auth_user_id');
    if (savedUserId) {
      const foundUser = Object.values(MOCK_USERS).find((u) => u.id === savedUserId);
      if (foundUser) setUser(foundUser);
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, pass: string) => {
    // Mock network delay
    await new Promise((resolve) => setTimeout(resolve, 800));
    
    const foundUser = Object.values(MOCK_USERS).find(
      (u) => u.email === email && u.password === pass
    );

    if (foundUser) {
      setUser(foundUser);
      localStorage.setItem('auth_user_id', foundUser.id);
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('auth_user_id');
  };

  return (
    <AuthContext.Provider value={{ user, role: user?.role ?? null, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
