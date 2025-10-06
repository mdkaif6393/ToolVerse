import { useState, useEffect } from 'react';

interface UserRole {
  isAdmin: boolean;
  role: 'admin' | 'user' | 'moderator';
  permissions: string[];
}

export const useUserRole = (): UserRole => {
  const [userRole, setUserRole] = useState<UserRole>({
    isAdmin: true, // Default to admin for development
    role: 'admin',
    permissions: ['read', 'write', 'delete', 'admin']
  });

  useEffect(() => {
    // In a real app, this would fetch from your auth system
    // For now, we'll simulate an admin user
    const mockUserRole: UserRole = {
      isAdmin: true,
      role: 'admin',
      permissions: ['read', 'write', 'delete', 'admin']
    };
    
    setUserRole(mockUserRole);
  }, []);

  return userRole;
};

export default useUserRole;
