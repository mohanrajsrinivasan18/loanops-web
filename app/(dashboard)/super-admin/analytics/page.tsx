'use client';

import { useAuth } from '@/lib/AuthProvider';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { apiGet } from '@/lib/api-client';
import { TrendingUp, Users, DollarSign, Activity, PieChart, BarChart3 } from 'lucide-react';

export default function AnalyticsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30');

  useEffect(() => {
    if (user?.role !== 'super_admin') {
      router.push('/dashboard');
      return;
    }
    loadAnalytics();
  }, [user, period]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const response = await apiGet(`/api/super-admin/analytics?period=${period}`);
      
      if (response.success) {
        setAnalytics(response.analytics);
      }
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics Dashboard</h1>
            <p className="text-gray-600">Advanced platform insights and trends</p>
          </div>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
          </select>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="Churn Rate"
            value={`${analytics?.churnRate || 0}%`}
            icon={<Activity className="w-6 h-6" />}
            color="red"
          />
          <MetricCard
            title="Payment Success"
            value={`${analytics?.paymentStats?.successRate || 0}%`}
            subtitle={`${analytics?.paymentStats?.paid || 0}/${analytics?.paymentStats?.total || 0} paid`}
            icon={<DollarSign className="w-6 h-6" />}
            color="green"
          />
          <MetricCard
            title="Avg MRR"
            value={`₹${analytics?.mrrTrend?.length > 0 ? Math.round(analytics.mrrTrend[analytics.mrrTrend.length - 1].mrr) : 0}`}
            icon={<TrendingUp className="w-6 h-6" />}
            color="blue"
          />
          <MetricCard
            title="Top Tenants"
            value={analytics?.topTenants?.length || 0}
            subtitle="Active users"
            icon={<Users className="w-6 h-6" />}
            color="purple"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Plan Distribution */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-2 mb-4">
              <PieChart className="w-5 h-5 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-900">Plan Distribution</h2>
            </div>
            <div className="space-y-3">
              {analytics?.planDistribution?.map((plan: any, index: number) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-900">{plan.plan_name}</span>
                      <span className="text-sm text-gray-600">{plan.tenant_count} tenants</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-primary-600 h-2 rounded-full"
                        style={{
                          width: `${(plan.tenant_count / analytics.planDistribution.reduce((sum: number, p: any) => sum + parseInt(p.tenant_count), 0)) * 100}%`
                        }}
                      />
                    </div>
                  </div>
                  <span className="ml-4 text-sm font-medium text-gray-900">
                    ₹{Math.round(plan.total_revenue)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Feature Adoption */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-5 h-5 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-900">Feature Adoption</h2>
            </div>
            <div className="space-y-3">
              {analytics?.featureAdoption?.slice(0, 6).map((feature: any, index: number) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">{formatFeatureName(feature.featureName)}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900">
                      {Math.round(feature.adoption_rate)}%
                    </span>
                    <span className="text-xs text-gray-500">
                      ({feature.enabled_count})
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top Tenants */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Top Tenants by Usage</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tenant</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Plan</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Users</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customers</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Loans</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Collections</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {analytics?.topTenants?.map((tenant: any) => (
                  <tr key={tenant.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{tenant.name}</div>
                      <div className="text-xs text-gray-500">{tenant.code}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {tenant.Subscription?.[0]?.Plan?.name || 'No plan'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{tenant._count.User}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{tenant._count.Customer}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{tenant._count.Loan}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{tenant._count.Collection}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, subtitle, icon, color }: any) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    red: 'bg-red-50 text-red-600'
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className={`inline-flex p-3 rounded-lg mb-4 ${colors[color] || colors.blue}`}>
        {icon}
      </div>
      <h3 className="text-gray-600 text-sm font-medium mb-1">{title}</h3>
      <p className="text-3xl font-bold text-gray-900 mb-1">{value}</p>
      {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
    </div>
  );
}

function formatFeatureName(name: string): string {
  return name
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
}
