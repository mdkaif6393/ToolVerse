import { useQuery } from "@tanstack/react-query";
import { useAuth } from "./useAuth";

export type UserRole = 'admin' | 'superadmin' | 'user';

export const useUserRole = () => {
  const { user } = useAuth();

  const { data: roles = ['admin'], isLoading } = useQuery({
    queryKey: ["user-roles", user?.id],
    queryFn: async () => {
      if (!user) return [];
      // Mock: return admin role for testing
      return ['admin'] as UserRole[];
    },
    enabled: !!user,
  });

  const isAdmin = roles.includes('admin') || roles.includes('superadmin');
  const isSuperAdmin = roles.includes('superadmin');
  const isUser = roles.length === 0 || roles.includes('user');

  return {
    roles,
    isAdmin,
    isSuperAdmin,
    isUser,
    isLoading,
  };
};