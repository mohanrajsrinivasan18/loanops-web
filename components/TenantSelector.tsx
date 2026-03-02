'use client';
import { useTenant } from '@/lib/contexts/TenantContext';

export default function TenantSelector() {
  const { isSuperAdmin } = useTenant();

  // Super admin doesn't need tenant selector — they manage tenants through their own pages
  // Regular users are already scoped to their tenant
  if (isSuperAdmin) return null;

  // Regular users don't need a selector either — they belong to one tenant
  return null;
}
