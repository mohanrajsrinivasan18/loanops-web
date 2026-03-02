'use client';

import { useAuth } from '@/lib/AuthProvider';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { apiGet } from '@/lib/api-client';
import { 
  Building2, 
  DollarSign, 
  Users, 
  TrendingUp,
  CreditCard,
  BarChart3,
  AlertCircle,
  CheckCircle,
  ArrowUpRight
} from 'lucide-react';

interface PlatformStats {
  totalTenants: number;
  activeTenants: number;
  trialTenants: number;
  expiredTenants: number;
  suspendedTenants: number;
  totalRevenue: number;
  mrr: number;
  arr: number;
  totalUsers: number;
  totalCustomers: number;
  totalLoans: number;
  totalCollections: number;
  growthRate: number;
  churnRate: number;
  recentTenants: any[];
  recentPayments: any[];
  limitAlerts: any[];
}

export default function SuperAdminDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.role !== 'super_admin') {
      router.push('/dashboard');
      return;
    }
    loadStats();
  }, [user]);

  const loadStats = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Check if token exists
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No authentication token found. Please login again.');
        return;
      }

      console.log('Loading stats with token:', token.substring(0, 20) + '...');
      
      const response = await apiGet('/api/super-admin/stats');
      
      console.log('Stats response:', response);
      
      if (response.success) {
        setStats(response.stats);
      } else {
        setError(response.error || 'Failed to load stats');
      }
    } catch (error: any) {
      console.error('Failed to load stats:', error);
      setError(error.message || 'Failed to load platform statistics');
    } finally {
      setLoading(false);
    }
  };

  if (user?.role !== 'super_admin') return null;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading platform data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Authentication Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={loadStats}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              Retry
            </button>
            <button
              onClick={() => {
                localStorage.clear();
                window.location.href = '/login';
              }}
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              Logout & Login Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Platform Overview
          </h1>
          <p className="text-gray-600">
            Monitor and manage your SaaS platform
          </p>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="Total Tenants"
            value={stats?.totalTenants || 0}
            subtitle={`${stats?.activeTenants || 0} active, ${stats?.trialTenants || 0} trial`}
            icon={<Building2 className="w-6 h-6" />}
            color="blue"
            trend={stats?.growthRate ? `+${stats.growthRate}%` : null}
            trendUp={true}
          />
          <MetricCard
            title="Monthly Revenue"
            value={`₹${((stats?.mrr || 0) / 1000).toFixed(1)}K`}
            subtitle={`ARR: ₹${((stats?.arr || 0) / 100000).toFixed(1)}L`}
            icon={<DollarSign className="w-6 h-6" />}
            color="green"
            trend="+12%"
            trendUp={true}
          />
          <MetricCard
            title="Total Users"
            value={stats?.totalUsers || 0}
            subtitle="Across all tenants"
            icon={<Users className="w-6 h-6" />}
            color="purple"
          />
          <MetricCard
            title="Platform Loans"
            value={stats?.totalLoans || 0}
            subtitle={`${stats?.totalCustomers || 0} customers`}
            icon={<TrendingUp className="w-6 h-6" />}
            color="orange"
          />
        </div>

        {/* Secondary Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <SecondaryMetric
            label="Collections"
            value={`₹${((stats?.totalCollections || 0) / 100000).toFixed(2)}L`}
            icon={<CheckCircle className="w-5 h-5 text-green-600" />}
          />
          <SecondaryMetric
            label="Churn Rate"
            value={`${stats?.churnRate || 0}%`}
            icon={<AlertCircle className="w-5 h-5 text-orange-600" />}
          />
          <SecondaryMetric
            label="Avg Revenue/Tenant"
            value={`₹${stats?.totalTenants ? Math.round((stats.mrr || 0) / stats.totalTenants) : 0}`}
            icon={<BarChart3 className="w-5 h-5 text-blue-600" />}
          />
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <QuickActionCard
              title="Manage Tenants"
              description="View and manage all businesses on the platform"
              href="/super-admin/tenants"
              icon={<Building2 className="w-8 h-8" />}
              color="blue"
              count={stats?.totalTenants}
            />
            <QuickActionCard
              title="Plans & Pricing"
              description="Configure subscription plans and pricing"
              href="/super-admin/plans"
              icon={<CreditCard className="w-8 h-8" />}
              color="green"
              count={4}
            />
            <QuickActionCard
              title="Billing & Revenue"
              description="Monitor revenue and manage invoices"
              href="/super-admin/billing"
              icon={<DollarSign className="w-8 h-8" />}
              color="purple"
              count={`₹${((stats?.mrr || 0) / 1000).toFixed(0)}K`}
            />
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Tenants */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  Recent Tenants
                </h2>
                <a
                  href="/super-admin/tenants"
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  View all →
                </a>
              </div>
            </div>
            <div className="p-6">
              {stats?.recentTenants && stats.recentTenants.length > 0 ? (
                <div className="space-y-4">
                  {stats.recentTenants.map((tenant: any) => (
                    <div key={tenant.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                          <span className="text-primary-600 font-semibold text-sm">
                            {tenant.name.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{tenant.name}</p>
                          <p className="text-xs text-gray-500">{tenant.plan || 'No plan'}</p>
                        </div>
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        tenant.status === 'active' 
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {tenant.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No recent tenants</p>
              )}
            </div>
          </div>

          {/* Limit Alerts */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  Limit Alerts
                </h2>
                <a
                  href="/super-admin/usage"
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  View all →
                </a>
              </div>
            </div>
            <div className="p-6">
              {stats?.limitAlerts && stats.limitAlerts.length > 0 ? (
                <div className="space-y-4">
                  {stats.limitAlerts.map((alert: any, index: number) => (
                    <div key={index} className="flex items-start space-x-3">
                      <AlertCircle className="w-5 h-5 text-orange-500 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{alert.tenantName}</p>
                        <p className="text-xs text-gray-600">{alert.message}</p>
                      </div>
                      <span className="text-xs text-orange-600 font-medium">
                        {alert.percentage}%
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No limit alerts</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, subtitle, icon, color, trend, trendUp }: any) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600',
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${colors[color] || colors.blue}`}>
          {icon}
        </div>
        {trend && (
          <span className={`text-sm font-medium flex items-center ${
            trendUp ? 'text-green-600' : 'text-red-600'
          }`}>
            {trend}
            <ArrowUpRight className="w-4 h-4 ml-1" />
          </span>
        )}
      </div>
      <h3 className="text-gray-600 text-sm font-medium mb-1">{title}</h3>
      <p className="text-3xl font-bold text-gray-900 mb-1">{value}</p>
      <p className="text-sm text-gray-500">{subtitle}</p>
    </div>
  );
}

function SecondaryMetric({ label, value, icon }: any) {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{label}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        {icon}
      </div>
    </div>
  );
}

function QuickActionCard({ title, description, href, icon, color, count }: any) {
  const colors: Record<string, string> = {
    blue: 'text-blue-600 bg-blue-50 hover:bg-blue-100',
    green: 'text-green-600 bg-green-50 hover:bg-green-100',
    purple: 'text-purple-600 bg-purple-50 hover:bg-purple-100',
  };

  return (
    <a
      href={href}
      className="bg-white rounded-lg shadow p-6 hover:shadow-xl transition-all hover:-translate-y-1 group"
    >
      <div className={`inline-flex p-3 rounded-lg mb-4 ${colors[color] || colors.blue} transition-colors`}>
        {icon}
      </div>
      {count && (
        <div className="text-2xl font-bold text-gray-900 mb-2">{count}</div>
      )}
      <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors">
        {title}
      </h3>
      <p className="text-sm text-gray-600">{description}</p>
    </a>
  );
}
