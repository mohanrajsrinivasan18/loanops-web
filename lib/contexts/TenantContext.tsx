'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from '../AuthProvider';

interface Tenant {
  id: string;
  name: string;
  code: string;
  status: 'active' | 'inactive';
}

interface TenantContextType {
  selectedTenant: Tenant | null;
  setSelectedTenant: (tenant: Tenant | null) => void;
  tenants: Tenant[];
  isSuperAdmin: boolean;
  loading: boolean;
}

const TenantContext = createContext<TenantContextType | null>(null);

export function TenantProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'super_admin';
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Super admin doesn't need tenant context — they have their own pages
    if (!user || isSuperAdmin) {
      setLoading(false);
      return;
    }

    // For regular users, set their tenant directly from user data
    if (user.tenantId) {
      setSelectedTenant({
        id: user.tenantId,
        name: '',
        code: '',
        status: 'active',
      });
      setLoading(false);
    }
  }, [user, isSuperAdmin]);

  const handleSetSelectedTenant = (tenant: Tenant | null) => {
    setSelectedTenant(tenant);
  };

  return (
    <TenantContext.Provider
      value={{
        selectedTenant,
        setSelectedTenant: handleSetSelectedTenant,
        tenants,
        isSuperAdmin,
        loading,
      }}
    >
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant must be used within TenantProvider');
  }
  return context;
}
