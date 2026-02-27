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
  const [loading, setLoading] = useState(true);

  // Fetch tenants from API
  useEffect(() => {
    const fetchTenants = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/tenants');
        const result = await response.json();
        
        if (result.success && result.data) {
          setTenants(result.data);
        }
      } catch (error) {
        console.error('Error fetching tenants:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchTenants();
    }
  }, [user]);

  useEffect(() => {
    if (loading || tenants.length === 0) return;

    // For super admin, load last selected tenant or default to first
    if (isSuperAdmin) {
      const savedTenantId = localStorage.getItem('selectedTenantId');
      if (savedTenantId) {
        const tenant = tenants.find(t => t.id === savedTenantId);
        if (tenant) {
          setSelectedTenant(tenant);
        } else {
          setSelectedTenant(tenants[0]);
        }
      } else {
        setSelectedTenant(tenants[0]);
      }
    } else if (user?.tenantId) {
      // For regular users, set their tenant
      const userTenant = tenants.find(t => t.id === user.tenantId);
      if (userTenant) {
        setSelectedTenant(userTenant);
      }
    }
  }, [user, isSuperAdmin, tenants, loading]);

  const handleSetSelectedTenant = (tenant: Tenant | null) => {
    setSelectedTenant(tenant);
    if (tenant) {
      localStorage.setItem('selectedTenantId', tenant.id);
    }
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
