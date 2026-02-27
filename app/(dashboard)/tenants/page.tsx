'use client';
import { useState } from 'react';
import { useAuth } from '@/lib/AuthProvider';
import { useTenant } from '@/lib/contexts/TenantContext';
import { useRouter } from 'next/navigation';
import { Building2, Plus, Search, Edit, Trash2, Users, DollarSign, TrendingUp, Eye, X } from 'lucide-react';

export default function TenantsPage() {
  const { user } = useAuth();
  const { tenants, setSelectedTenant } = useTenant();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // Redirect if not super admin
  if (user?.role !== 'super_admin') {
    router.push('/dashboard');
    return null;
  }

  const tenantStats = [
    { tenantId: 't1', customers: 1245, agents: 15, revenue: 2450000, collections: 94.2 },
    { tenantId: 't2', customers: 987, agents: 12, revenue: 1980000, collections: 92.5 },
    { tenantId: 't3', customers: 1532, agents: 18, revenue: 3120000, collections: 95.1 },
    { tenantId: 't4', customers: 876, agents: 10, revenue: 1750000, collections: 91.8 },
    { tenantId: 't5', customers: 654, agents: 8, revenue: 1320000, collections: 93.4 },
  ];

  const getStats = (tenantId: string) => {
    return tenantStats.find(s => s.tenantId === tenantId) || { customers: 0, agents: 0, revenue: 0, collections: 0 };
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200">
        <div className="px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-neutral-900">Tenant Management</h1>
              <p className="text-sm text-neutral-500 mt-1">Manage all branches and their operations</p>
            </div>
            <button 
              onClick={() => setShowAddModal(true)}
              className="btn-primary flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add Tenant</span>
            </button>
          </div>
        </div>
      </div>

      <div className="p-8">
        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="stat-card">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-indigo-50 rounded-xl">
                <Building2 className="w-5 h-5 text-indigo-600" />
              </div>
            </div>
            <p className="text-sm text-neutral-500 mb-1">Total Tenants</p>
            <p className="text-2xl font-bold text-neutral-900">{tenants.length}</p>
            <p className="text-xs text-emerald-600 mt-2">All active</p>
          </div>

          <div className="stat-card">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-emerald-50 rounded-xl">
                <Users className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
            <p className="text-sm text-neutral-500 mb-1">Total Customers</p>
            <p className="text-2xl font-bold text-neutral-900">
              {tenantStats.reduce((sum, s) => sum + s.customers, 0).toLocaleString()}
            </p>
            <p className="text-xs text-neutral-500 mt-2">Across all tenants</p>
          </div>

          <div className="stat-card">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-violet-50 rounded-xl">
                <DollarSign className="w-5 h-5 text-violet-600" />
              </div>
            </div>
            <p className="text-sm text-neutral-500 mb-1">Total Revenue</p>
            <p className="text-2xl font-bold text-neutral-900">
              ₹{(tenantStats.reduce((sum, s) => sum + s.revenue, 0) / 1000000).toFixed(1)}M
            </p>
            <p className="text-xs text-neutral-500 mt-2">Combined revenue</p>
          </div>

          <div className="stat-card">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-amber-50 rounded-xl">
                <TrendingUp className="w-5 h-5 text-amber-600" />
              </div>
            </div>
            <p className="text-sm text-neutral-500 mb-1">Avg Collection Rate</p>
            <p className="text-2xl font-bold text-neutral-900">
              {(tenantStats.reduce((sum, s) => sum + s.collections, 0) / tenantStats.length).toFixed(1)}%
            </p>
            <p className="text-xs text-neutral-500 mt-2">Across all tenants</p>
          </div>
        </div>

        {/* Search */}
        <div className="card-modern p-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
            <input
              type="text"
              placeholder="Search tenants by name or code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-modern pl-10"
            />
          </div>
        </div>

        {/* Tenants Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tenants.map((tenant) => {
            const stats = getStats(tenant.id);
            return (
              <div key={tenant.id} className="card-modern overflow-hidden hover:shadow-xl transition-all group">
                {/* Header */}
                <div className="bg-gradient-to-br from-indigo-500 to-violet-600 p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      <span className="text-2xl font-bold text-white">{tenant.code}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="p-2 rounded-lg bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-colors">
                        <Edit className="w-4 h-4 text-white" />
                      </button>
                      <button className="p-2 rounded-lg bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-colors">
                        <Trash2 className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-1">{tenant.name}</h3>
                  <p className="text-sm text-white/80">ID: {tenant.id}</p>
                </div>

                {/* Stats */}
                <div className="p-6">
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-neutral-500 mb-1">Customers</p>
                      <p className="text-lg font-bold text-neutral-900">{stats.customers.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-neutral-500 mb-1">Agents</p>
                      <p className="text-lg font-bold text-neutral-900">{stats.agents}</p>
                    </div>
                    <div>
                      <p className="text-xs text-neutral-500 mb-1">Revenue</p>
                      <p className="text-lg font-bold text-neutral-900">₹{(stats.revenue / 100000).toFixed(1)}L</p>
                    </div>
                    <div>
                      <p className="text-xs text-neutral-500 mb-1">Collection</p>
                      <p className="text-lg font-bold text-emerald-600">{stats.collections}%</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <button
                    onClick={() => {
                      setSelectedTenant(tenant);
                      router.push('/dashboard');
                    }}
                    className="w-full btn-primary flex items-center justify-center gap-2 text-sm"
                  >
                    <Eye className="w-4 h-4" />
                    <span>View Dashboard</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add Tenant Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white border-b border-neutral-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <div>
                <h2 className="text-xl font-bold text-neutral-900">Add New Tenant</h2>
                <p className="text-sm text-neutral-500 mt-1">Create a new branch/tenant</p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="w-8 h-8 rounded-lg hover:bg-neutral-100 flex items-center justify-center text-neutral-400 hover:text-neutral-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Tenant Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Mumbai Branch"
                    className="input-modern text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Tenant Code <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., MUM"
                    className="input-modern text-sm"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Address
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Branch address..."
                    className="input-modern text-sm resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Contact Email
                  </label>
                  <input
                    type="email"
                    placeholder="branch@example.com"
                    className="input-modern text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Contact Phone
                  </label>
                  <input
                    type="tel"
                    placeholder="+91 98765 43210"
                    className="input-modern text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-neutral-50 border-t border-neutral-200 px-6 py-4 flex items-center justify-end gap-3 rounded-b-2xl">
              <button
                onClick={() => setShowAddModal(false)}
                className="btn-secondary text-sm px-6"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  alert('Tenant created successfully!');
                  setShowAddModal(false);
                }}
                className="btn-primary text-sm px-6"
              >
                Create Tenant
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
