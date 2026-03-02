'use client';

import { useAuth } from '@/lib/AuthProvider';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { apiGet } from '@/lib/api-client';
import { CreditCard, Plus, Edit, Trash2, Check, X } from 'lucide-react';

export default function PlansPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role !== 'super_admin') {
      router.push('/dashboard');
      return;
    }
    loadPlans();
  }, [user]);

  const loadPlans = async () => {
    try {
      setLoading(true);
      const response = await apiGet('/api/super-admin/plans');
      
      if (response.success) {
        setPlans(response.plans);
      }
    } catch (error) {
      console.error('Failed to load plans:', error);
    } finally {
      setLoading(false);
    }
  };

  if (user?.role !== 'super_admin') return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Subscription Plans</h1>
            <p className="text-gray-600">Manage pricing tiers and features</p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-primary-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {plans.map((plan) => (
              <PlanCard key={plan.id} plan={plan} onUpdate={loadPlans} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function PlanCard({ plan, onUpdate }: { plan: any; onUpdate: () => void }) {
  const features = plan.features as Record<string, boolean>;
  const limits = plan.limits as Record<string, number>;

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-2xl font-bold text-gray-900">{plan.name}</h3>
          {!plan.isActive && (
            <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
              Inactive
            </span>
          )}
        </div>
        <p className="text-gray-600 text-sm mb-4">{plan.description}</p>
        <div className="flex items-baseline">
          <span className="text-4xl font-bold text-gray-900">₹{plan.price}</span>
          <span className="text-gray-600 ml-2">/{plan.billingCycle === 'monthly' ? 'mo' : 'yr'}</span>
        </div>
        <div className="mt-2 text-sm text-gray-500">
          {plan._count.TenantSubscription} active subscriptions
        </div>
      </div>

      <div className="p-6">
        <h4 className="text-sm font-semibold text-gray-900 mb-3">Limits</h4>
        <ul className="space-y-2 mb-4">
          {limits.maxUsers && (
            <li className="text-sm text-gray-600">
              {limits.maxUsers === 999999 ? 'Unlimited' : limits.maxUsers} users
            </li>
          )}
          {limits.maxCustomers && (
            <li className="text-sm text-gray-600">
              {limits.maxCustomers === 999999 ? 'Unlimited' : limits.maxCustomers.toLocaleString()} customers
            </li>
          )}
          {limits.maxLoansPerMonth && (
            <li className="text-sm text-gray-600">
              {limits.maxLoansPerMonth === 999999 ? 'Unlimited' : limits.maxLoansPerMonth.toLocaleString()} loans/month
            </li>
          )}
        </ul>

        <h4 className="text-sm font-semibold text-gray-900 mb-3">Features</h4>
        <ul className="space-y-2">
          {Object.entries(features).map(([key, enabled]) => (
            <li key={key} className="flex items-center text-sm">
              {enabled ? (
                <Check className="w-4 h-4 text-green-500 mr-2" />
              ) : (
                <X className="w-4 h-4 text-gray-300 mr-2" />
              )}
              <span className={enabled ? 'text-gray-900' : 'text-gray-400'}>
                {formatFeatureName(key)}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function formatFeatureName(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
}
