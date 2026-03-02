import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  role: string;
  tenantId: string | null;
}

export interface AuthResult {
  user: AuthUser | null;
  error?: string;
}

/**
 * Verify authentication from request
 * Checks for Authorization header token and validates user
 */
export async function verifyAuth(request: NextRequest): Promise<AuthResult> {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader) {
      return { user: null, error: 'No authorization header' };
    }

    // Extract token (format: "Bearer <token>" or just "<token>")
    const token = authHeader.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : authHeader;

    if (!token) {
      return { user: null, error: 'No token provided' };
    }

    // Decode token (base64 encoded JSON)
    let tokenData;
    try {
      const decoded = Buffer.from(token, 'base64').toString('utf-8');
      tokenData = JSON.parse(decoded);
    } catch (error) {
      return { user: null, error: 'Invalid token format' };
    }

    if (!tokenData.userId) {
      return { user: null, error: 'Invalid token data' };
    }

    // Fetch user from database
    const user = await prisma.user.findUnique({
      where: { id: tokenData.userId },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        tenantId: true,
        status: true
      }
    });

    if (!user) {
      return { user: null, error: 'User not found' };
    }

    if (user.status !== 'active') {
      return { user: null, error: 'User account is not active' };
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role,
        tenantId: user.tenantId
      }
    };

  } catch (error) {
    console.error('Auth verification error:', error);
    return { user: null, error: 'Authentication failed' };
  }
}

/**
 * Check if user has required role
 */
export function hasRole(user: AuthUser | null, roles: string[]): boolean {
  if (!user) return false;
  return roles.includes(user.role);
}

/**
 * Check if user is super admin
 */
export function isSuperAdmin(user: AuthUser | null): boolean {
  return user?.role === 'super_admin';
}

/**
 * Check if user belongs to tenant
 */
export function belongsToTenant(user: AuthUser | null, tenantId: string): boolean {
  if (!user) return false;
  if (user.role === 'super_admin') return true; // Super admin can access all tenants
  return user.tenantId === tenantId;
}
