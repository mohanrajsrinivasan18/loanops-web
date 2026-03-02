'use client';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface BrandingConfig {
  primaryColor: string;
  secondaryColor: string;
  logo?: string;
  companyName: string;
}

const BrandingContext = createContext<BrandingConfig | null>(null);

export function BrandingProvider({ 
  tenantId, 
  children 
}: { 
  tenantId: string; 
  children: ReactNode;
}) {
  const [branding, setBranding] = useState<BrandingConfig>({
    primaryColor: '#3b82f6',
    secondaryColor: '#8b5cf6',
    companyName: 'LoanOps'
  });

  useEffect(() => {
    // Skip branding fetch if no tenantId (e.g., super admin)
    if (!tenantId || tenantId === 't1') {
      return;
    }

    fetch(`/api/branding?tenantId=${tenantId}`)
      .then(r => r.json())
      .then(data => {
        if (data && !data.error) {
          setBranding({
            primaryColor: data.primaryColor || '#3b82f6',
            secondaryColor: data.secondaryColor || '#8b5cf6',
            companyName: data.companyName || 'LoanOps',
            logo: data.logo
          });
          document.documentElement.style.setProperty('--primary', data.primaryColor || '#3b82f6');
          document.documentElement.style.setProperty('--secondary', data.secondaryColor || '#8b5cf6');
        }
      })
      .catch(() => {
        // Use defaults on error
      });
  }, [tenantId]);

  return (
    <BrandingContext.Provider value={branding}>
      {children}
    </BrandingContext.Provider>
  );
}

export function useBranding() {
  const context = useContext(BrandingContext);
  if (!context) {
    throw new Error('useBranding must be used within BrandingProvider');
  }
  return context;
}
