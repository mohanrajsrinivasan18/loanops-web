'use client';

import { useAuth } from '@/lib/AuthProvider';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { apiGet, apiPatch, apiPost } from '@/lib/api-client';
import { 
  ArrowLeft, Users, DollarSign, TrendingUp, AlertCircle, 
  Edit, Ban, CheckCircle, CreditCard, BarChart3, Settings
} from 'lucide-react';

export default function TenantDetailPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const [tenant, setTenant] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editingLimits, setEditingLimits] = useState(false);
  const [limits, setLimits] = useState<any>({});
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [plans, setPlans] = useState<any[]>([]);
  const [selectedPlan, setSelectedPlan] = useState('');

  useEffect(() => {
    if (user?.role !== 'super_admin') {
      router.push('/dashboard');
      return;
    }
    loadTenant();
    loadPlans();
  }, [user, params.id]);

  const loadTenant = async () => {
    try {
      setLoading(true);
      const response = await apiGet(`/api/super-admin/tenants/${params.id}`);
      
      if (response.success) {
        setTenant(response.tenant);
        if (response.tenant.Limits) {
          setLimits(response.tenant.Limits);
        }
      }
    } catch (error) {
      console.error('Failed to load tenant:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateLimits = async () => {
    try {
      const response = await apiPatch(`/api/super-admin/tenants/${params.id}/limits`, limits);
      if (response.success) {
        setEditingLimits(false);
        loadTenant();
      }
    } catch (error) {
      console.error('Failed to update limits:', error);
    }
  };

  const loadPlans = async () => {
    try {
      const response = await apiGet('/api/super-admin/plans');
      if (response.success) {
        setPlans(response.plans);
      }
    } catch (error) {
      console.error('Failed to load plans:', error);
    }
  };

  const updateStatus = async (status: string) => {
    if (!confirm(`Are you sure you want to ${status} this tenant?`)) return;
    
    try {
      const response = await apiPatch(`/api/super-admin/tenants/${params.id}`, { status });
      if (response.success) {
        loadTenant();
      }
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const assignSubscription = async () => {
    if (!selectedPlan) return;

    try {
      const response = await apiPost(`/api/super-admin/tenants/${params.id}/subscription`, {
        planId: selectedPlan,
        status: 'active'
      });

      if (response.success) {
        setShowSubscriptionModal(false);
        loadTenant();
      }
    } catch (error) {
      console.error('Failed to assign subscription:', error);
    }
  };

  const toggleFeature = async (featureName: string, enabled: boolean) => {
    try {
      const response = await apiPost(`/api/super-admin/tenants/${params.id}/features`, {
        featureName,
        enabled
      });

      if (response.success) {
        loadTenant();
      }
    } catch (error) {
      console.error('Failed to toggle feature:', error);
    }
  };

  if (user?.role !== 'super_admin') return null;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-primary-600"></div>
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">Tenant not found</p>
        </div>
      </div>
    );
  }

  const activeSub = tenant.Subscription?.find((s: any) => s.status === 'active');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/super-admin/tenants')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Tenants
          </button>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center">
                <span className="text-primary-600 font-bold text-2xl">
                  {tenant.name.charAt(0)}
                </span>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{tenant.name}</h1>
                <p className="text-gray-600">{tenant.code}</p>
              </div>
            </div>
            
            <div className="flex gap-2">
              {tenant.status === 'active' ? (
                <button
                  onClick={() => updateStatus('suspended')}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  <Ban className="w-5 h-5" />
                  Suspend
                </button>
              ) : (
                <button
                  onClick={() => updateStatus('active')}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  <CheckCircle className="w-5 h-5" />
                  Activate
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <StatCard
            title="Users"
            value={tenant._count.User}
            limit={tenant.Limits?.maxUsers}
            icon={<Users className="w-6 h-6" />}
            color="blue"
          />
          <StatCard
            title="Customers"
            value={tenant._count.Customer}
            limit={tenant.Limits?.maxCustomers}
            icon={<Users className="w-6 h-6" />}
            color="green"
          />
          <StatCard
            title="Loans"
            value={tenant._count.Loan}
            icon={<DollarSign className="w-6 h-6" />}
            color="purple"
          />
          <StatCard
            title="Agents"
            value={tenant._count.Agent}
            icon={<Users className="w-6 h-6" />}
            color="orange"
          />
          <StatCard
            title="Lines"
            value={tenant._count.Line || 0}
            icon={<BarChart3 className="w-6 h-6" />}
            color="indigo"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tenant Info */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Tenant Information</h2>
              <div className="grid grid-cols-2 gap-4">
                <InfoRow label="Business Type" value={tenant.businessType} />
                <InfoRow label="Status" value={tenant.status} />
                <InfoRow label="Owner Name" value={tenant.ownerName || 'N/A'} />
                <InfoRow label="Owner Phone" value={tenant.ownerPhone || 'N/A'} />
                <InfoRow label="Owner Email" value={tenant.ownerEmail || 'N/A'} />
                <InfoRow label="Created" value={new Date(tenant.createdAt).toLocaleDateString()} />
              </div>
            </div>

            {/* Limits */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Usage Limits</h2>
                {!editingLimits ? (
                  <button
                    onClick={() => setEditingLimits(true)}
                    className="flex items-center gap-2 px-3 py-1 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditingLimits(false);
                        setLimits(tenant.Limits);
                      }}
                      className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={updateLimits}
                      className="px-3 py-1 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                    >
                      Save
                    </button>
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <LimitField
                  label="Max Users"
                  value={limits.maxUsers}
                  editing={editingLimits}
                  onChange={(v) => setLimits({ ...limits, maxUsers: parseInt(v) })}
                />
                <LimitField
                  label="Max Customers"
                  value={limits.maxCustomers}
                  editing={editingLimits}
                  onChange={(v) => setLimits({ ...limits, maxCustomers: parseInt(v) })}
                />
                <LimitField
                  label="Max Loans/Month"
                  value={limits.maxLoansPerMonth}
                  editing={editingLimits}
                  onChange={(v) => setLimits({ ...limits, maxLoansPerMonth: parseInt(v) })}
                />
                <LimitField
                  label="Storage (MB)"
                  value={limits.storageLimit}
                  editing={editingLimits}
                  onChange={(v) => setLimits({ ...limits, storageLimit: parseInt(v) })}
                />
                <LimitField
                  label="API Calls/Day"
                  value={limits.apiCallsPerDay}
                  editing={editingLimits}
                  onChange={(v) => setLimits({ ...limits, apiCallsPerDay: parseInt(v) })}
                />
                <LimitField
                  label="SMS Credits"
                  value={limits.smsCredits}
                  editing={editingLimits}
                  onChange={(v) => setLimits({ ...limits, smsCredits: parseInt(v) })}
                />
                <LimitField
                  label="WhatsApp Credits"
                  value={limits.whatsappCredits}
                  editing={editingLimits}
                  onChange={(v) => setLimits({ ...limits, whatsappCredits: parseInt(v) })}
                />
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Subscription */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Subscription</h2>
              {activeSub ? (
                <div>
                  <div className="text-2xl font-bold text-gray-900 mb-1">
                    {activeSub.Plan.name}
                  </div>
                  <div className="text-lg text-gray-600 mb-4">
                    ₹{activeSub.Plan.price}/month
                  </div>
                  <div className="text-sm text-gray-500">
                    Status: <span className="font-medium">{activeSub.status}</span>
                  </div>
                  <div className="text-sm text-gray-500">
                    Started: {new Date(activeSub.startDate).toLocaleDateString()}
                  </div>
                  {activeSub.endDate && (
                    <div className="text-sm text-gray-500">
                      Ends: {new Date(activeSub.endDate).toLocaleDateString()}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-gray-500">No active subscription</p>
              )}
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Subscription</h2>
                <button
                  onClick={() => setShowSubscriptionModal(true)}
                  className="px-3 py-1 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  {activeSub ? 'Change Plan' : 'Assign Plan'}
                </button>
              </div>
              {activeSub ? (
                <div>
                  <div className="text-2xl font-bold text-gray-900 mb-1">
                    {activeSub.Plan.name}
                  </div>
                  <div className="text-lg text-gray-600 mb-4">
                    ₹{activeSub.Plan.price}/month
                  </div>
                  <div className="text-sm text-gray-500">
                    Status: <span className="font-medium">{activeSub.status}</span>
                  </div>
                  <div className="text-sm text-gray-500">
                    Started: {new Date(activeSub.startDate).toLocaleDateString()}
                  </div>
                  {activeSub.endDate && (
                    <div className="text-sm text-gray-500">
                      Ends: {new Date(activeSub.endDate).toLocaleDateString()}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-gray-500">No active subscription</p>
              )}
            </div>

            {/* Features */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Features</h2>
              <div className="space-y-2">
                {tenant.Features?.map((feature: any) => (
                  <div key={feature.id} className="flex items-center justify-between py-2">
                    <span className="text-sm text-gray-700">{formatFeatureName(feature.featureName)}</span>
                    <button
                      onClick={() => toggleFeature(feature.featureName, !feature.enabled)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        feature.enabled ? 'bg-green-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          feature.enabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                ))}
                {(!tenant.Features || tenant.Features.length === 0) && (
                  <p className="text-sm text-gray-500">No features configured</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Subscription Modal */}
        {showSubscriptionModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {activeSub ? 'Change Subscription Plan' : 'Assign Subscription Plan'}
              </h3>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Plan
                </label>
                <select
                  value={selectedPlan}
                  onChange={(e) => setSelectedPlan(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Choose a plan...</option>
                  {plans.filter(p => p.isActive).map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.name} - ₹{plan.price}/{plan.billingCycle === 'monthly' ? 'mo' : 'yr'}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowSubscriptionModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={assignSubscription}
                  disabled={!selectedPlan}
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Assign
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function formatFeatureName(name: string): string {
  return name
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
}

function StatCard({ title, value, limit, icon, color }: { title: string; value: number; limit?: number; icon: React.ReactNode; color: string }) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600',
    indigo: 'bg-indigo-50 text-indigo-600'
  };

  const percentage = limit ? (value / limit) * 100 : 0;
  const isNearLimit = percentage >= 80;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className={`inline-flex p-3 rounded-lg mb-4 ${colors[color] || colors.blue}`}>
        {icon}
      </div>
      <h3 className="text-gray-600 text-sm font-medium mb-1">{title}</h3>
      <p className="text-3xl font-bold text-gray-900">
        {value}
        {limit && <span className="text-lg text-gray-500">/{limit}</span>}
      </p>
      {limit && (
        <div className="mt-2">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full ${isNearLimit ? 'bg-red-500' : 'bg-green-500'}`}
              style={{ width: `${Math.min(percentage, 100)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-sm text-gray-500">{label}</div>
      <div className="text-sm font-medium text-gray-900">{value}</div>
    </div>
  );
}

function LimitField({ label, value, editing, onChange }: { label: string; value: number; editing: boolean; onChange: (value: string) => void }) {
  return (
    <div>
      <label className="text-sm text-gray-500 block mb-1">{label}</label>
      {editing ? (
        <input
          type="number"
          value={value || 0}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
        />
      ) : (
        <div className="text-sm font-medium text-gray-900">{value || 0}</div>
      )}
    </div>
  );
}
