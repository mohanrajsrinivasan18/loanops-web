'use client';
import { useTenant } from '@/lib/contexts/TenantContext';
import { Building2, ChevronDown } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

export default function TenantSelector() {
  const { selectedTenant, setSelectedTenant, tenants, isSuperAdmin } = useTenant();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Don't show selector if not super admin
  if (!isSuperAdmin) return null;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-4 py-2.5 bg-white border border-neutral-200 rounded-xl hover:border-primary-300 hover:shadow-md transition-all"
      >
        <div className="p-2 bg-primary-50 rounded-lg">
          <Building2 className="w-4 h-4 text-primary-600" />
        </div>
        <div className="text-left">
          <p className="text-xs text-neutral-500">Current Tenant</p>
          <p className="text-sm font-semibold text-neutral-900">
            {selectedTenant?.name || 'Select Tenant'}
          </p>
        </div>
        <ChevronDown className={`w-4 h-4 text-neutral-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full mt-2 right-0 w-72 bg-white border border-neutral-200 rounded-xl shadow-xl z-50 overflow-hidden">
          <div className="p-3 border-b border-neutral-100 bg-neutral-50">
            <p className="text-xs font-semibold text-neutral-600 uppercase tracking-wider">
              Select Tenant
            </p>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {tenants.map((tenant) => (
              <button
                key={tenant.id}
                onClick={() => {
                  setSelectedTenant(tenant);
                  setIsOpen(false);
                }}
                className={`w-full px-4 py-3 text-left hover:bg-neutral-50 transition-colors flex items-center justify-between ${
                  selectedTenant?.id === tenant.id ? 'bg-primary-50' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    selectedTenant?.id === tenant.id 
                      ? 'bg-primary-100' 
                      : 'bg-neutral-100'
                  }`}>
                    <span className={`text-sm font-bold ${
                      selectedTenant?.id === tenant.id 
                        ? 'text-primary-600' 
                        : 'text-neutral-600'
                    }`}>
                      {tenant.code}
                    </span>
                  </div>
                  <div>
                    <p className={`text-sm font-medium ${
                      selectedTenant?.id === tenant.id 
                        ? 'text-primary-900' 
                        : 'text-neutral-900'
                    }`}>
                      {tenant.name}
                    </p>
                    <p className="text-xs text-neutral-500">ID: {tenant.id}</p>
                  </div>
                </div>
                {selectedTenant?.id === tenant.id && (
                  <div className="w-2 h-2 rounded-full bg-primary-600" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
