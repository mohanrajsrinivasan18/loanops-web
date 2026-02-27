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
    fetch('/api/branding')
      .then(r => r.json())
      .then(data => {
        const config = data[tenantId];
        if (config) {
          setBranding(config);
          document.documentElement.style.setProperty('--primary', config.primaryColor);
          document.documentElement.style.setProperty('--secondary', config.secondaryColor);
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
