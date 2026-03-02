'use client';

import { useAuth } from '@/lib/AuthProvider';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { apiGet, apiPost } from '@/lib/api-client';
import { Sliders, Search, ToggleLeft, ToggleRight } from 'lucide-react';

const AVAILABLE_FEATURES = [
  { name: 'sms', label: 'SMS Notifications', description: 'Send SMS to customers' },
  { name: 'whatsapp', label: 'WhatsApp Integration', description: 'WhatsApp messaging' },
  { name: 'mapAnalytics', label: 'Map Analytics', description: 'Geographic insights' },
  { name: 'advancedReports', label: 'Advanced Reports', description: 'Detailed reporting' },
  { name: 'customBranding', label: 'Custom Branding', description: 'White-label options' },
  { name: 'apiAccess', label: 'API Access', description: 'REST API integration' },
  { name: 'prioritySupport', label: 'Priority Support', description: '24/7 support' },
  { name: 'exportData', label: 'Data Export', description: 'Export to CSV/Excel' },
  { name: 'bulkOperations', label: 'Bulk Operations', description: 'Batch processing' },
  { name: 'automatedReminders', label: 'Automated Reminders', description: 'Auto notifications' }
];

export default function FeaturesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [tenants, setTenants] = useState<any[]>([]);
  const [selectedTenant, setSelectedTenant] = useState<string>('');
  const [features, setFeatures] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (user?.role !== 'super_admin') {
      router.push('/dashboard');
      return;
    }
    loadTenants();
  }, [user]);

  useEffect(() => {
    if (selectedTenant) {
      loadFeatures();
    }
  }, [selectedTenant]);

  const loadTenants = async () => {
    try {
      const response = await apiGet('/api/super-admin/tenants?limit=1000');
      if (response.success) {
        setTenants(response.tenants);
      }
    } catch (error) {
      console.error('Failed to load tenants:', error);
    }
  };

  const loadFeatures = async () => {
    try {
      setLoading(true);
      const response = await apiGet(`/api/super-admin/tenants/${selectedTenant}/features`);
      
      if (response.success) {
        const featureMap: Record<string, boolean> = {};
        response.features.forEach((f: any) => {
          featureMap[f.featureName] = f.enabled;
        });
        setFeatures(featureMap);
      }
    } catch (error) {
      console.error('Failed to load features:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFeature = async (featureName: string) => {
    if (!selectedTenant) return;

    const newValue = !features[featureName];
    
    try {
      const response = await apiPost(`/api/super-admin/tenants/${selectedTenant}/features`, {
        featureName,
        enabled: newValue
      });

      if (response.success) {
        setFeatures({ ...features, [featureName]: newValue });
      }
    } catch (error) {
      console.error('Failed to toggle feature:', error);
    }
  };

  if (user?.role !== 'super_admin') return null;

  const filteredTenants = tenants.filter(t => 
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Feature Flags</h1>
          <p className="text-gray-600">Enable or disable features for tenants</p>
        </div>

        {/* Tenant Selection */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Tenant
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search tenants..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 mb-2"
            />
          </div>
          <select
            value={selectedTenant}
            onChange={(e) => setSelectedTenant(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Choose a tenant...</option>
            {filteredTenants.map((tenant) => (
              <option key={tenant.id} value={tenant.id}>
                {tenant.name} ({tenant.code})
              </option>
            ))}
          </select>
        </div>

        {/* Features Grid */}
        {selectedTenant && (
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Available Features</h2>
            </div>
            {loading ? (
              <div className="p-12 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-primary-600 mx-auto"></div>
              </div>
            ) : (
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {AVAILABLE_FEATURES.map((feature) => (
                    <div
                      key={feature.name}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-primary-300 transition-colors"
                    >
                      <div className="flex-1">
                        <h3 className="text-sm font-medium text-gray-900">{feature.label}</h3>
                        <p className="text-xs text-gray-500">{feature.description}</p>
                      </div>
                      <button
                        onClick={() => toggleFeature(feature.name)}
                        className={`ml-4 relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          features[feature.name]
                            ? 'bg-primary-600'
                            : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            features[feature.name] ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {!selectedTenant && (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <Sliders className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">Select a tenant to manage their features</p>
          </div>
        )}
      </div>
    </div>
  );
}
