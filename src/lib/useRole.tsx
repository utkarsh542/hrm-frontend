'use client';
import { useMemo } from 'react';

export type Role = 'admin' | 'hr' | 'manager' | 'employee';

function getPayloadFromToken() {
  if (typeof window === 'undefined') return null;
  try {
    const token = localStorage.getItem('hrms_token');
    if (!token) return null;
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return null;
  }
}

export function useRole() {
  const payload = useMemo(() => getPayloadFromToken(), []);
  
  const rawRole = payload?.role ?? 'employee';
  const role = (typeof rawRole === 'string' ? rawRole.toLowerCase() : 'employee') as Role;
  const email = payload?.sub ?? '';
  const userId = payload?.user_id ?? null;

  const is = (...roles: Role[]) => roles.includes(role);
  const isAdmin = role === 'admin';
  const isHR = role === 'hr';
  const isManager = role === 'manager';
  const isEmployee = role === 'employee';
  const isAdminOrHR = role === 'admin' || role === 'hr';
  const isAdminHROrManager = role === 'admin' || role === 'hr' || role === 'manager';

  return { role, email, userId, is, isAdmin, isHR, isManager, isEmployee, isAdminOrHR, isAdminHROrManager };
}

/** Renders children only if current user has one of the allowed roles */
export function RoleGuard({ roles, children, fallback = null }: {
  roles: Role[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const { role } = useRole();
  return roles.includes(role) ? <>{children}</> : <>{fallback}</>;
}
