'use client';
import { useAuth } from '@/lib/AuthProvider';
import { useRouter } from 'next/navigation';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  Building2, 
  Activity,
  Server,
  Database,
  Zap,
  Clock,
  BarChart3,
  PieChart,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

export default function SystemAnalyticsPage() {
  const { user } = useAuth();
  const router = useRouter();

  // Redirect if not super admin
  if (user?.role !== 'super_admin') {
    router.push('/dashboard');
    return null;
  }

  const stats = {
    totalRevenue: 10620000,
    activeSubscriptions: 5,
    totalUsers: 63,
    totalCustomers: 5294,
    avgRevenuePerTenant: 2124000,
    churnRate: 2.5,
    growthRate: 15.3,
  };

  const recentActivity = [
    { tenant: 'Mumbai Branch', action: 'Added 15 new customers', time: '2 hours ago', type: 'success' },
    { tenant: 'Delhi Branch', action: 'Processed 45 collections', time: '4 hours ago', type: 'info' },
    { tenant: 'Bangalore Branch', action: 'Upgraded system capacity', time: '1 day ago', type: 'warning' },
    { tenant: 'Chennai Branch', action: 'Completed 120 loan disbursements', time: '1 day ago', type: 'success' },
  ];

  const tenantPerformance = [
    { name: 'Mumbai Branch', revenue: 3120000, growth: 18.5, customers: 1532, color: 'indigo' },
    { name: 'Bangalore Branch', revenue: 2450000, growth: 15.2, customers: 1245, color: 'violet' },
    { name: 'Delhi Branch', revenue: 1980000, growth: 12.8, customers: 987, color: 'blue' },
    { name: 'Chennai Branch', revenue: 1750000, growth: 14.1, customers: 876, color: 'emerald' },
    { name: 'Kolkata Branch', revenue: 1320000, growth: 11.5, customers: 654, color: 'amber' },
  ];

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200">
        <div className="px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-neutral-900">System Analytics</h1>
              <p className="text-sm text-neutral-500 mt-1">Cross-tenant analytics and performance insights</p>
            </div>
            <div className="flex items-center gap-3">
              <select className="input-modern text-sm">
                <option>Last 7 days</option>
                <option>Last 30 days</option>
                <option>Last 90 days</option>
                <option>This year</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="p-8">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="stat-card">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-emerald-50 rounded-xl">
                <DollarSign className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="flex items-center gap-1 text-emerald-600">
                <ArrowUpRight className="w-4 h-4" />
                <span className="text-sm font-semibold">+{stats.growthRate}%</span>
              </div>
            </div>
            <p className="text-sm text-neutral-500 mb-1">Total Revenue</p>
            <p className="text-2xl font-bold text-neutral-900">₹{(stats.totalRevenue / 1000000).toFixed(1)}M</p>
            <p className="text-xs text-neutral-500 mt-2">Across all tenants</p>
          </div>

          <div className="stat-card">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-indigo-50 rounded-xl">
                <Building2 className="w-5 h-5 text-indigo-600" />
              </div>
            </div>
            <p className="text-sm text-neutral-500 mb-1">Active Tenants</p>
            <p className="text-2xl font-bold text-neutral-900">{stats.activeSubscriptions}</p>
            <p className="text-xs text-neutral-500 mt-2">All operational</p>
          </div>

          <div className="stat-card">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-violet-50 rounded-xl">
                <Users className="w-5 h-5 text-violet-600" />
              </div>
            </div>
            <p className="text-sm text-neutral-500 mb-1">Total Users</p>
            <p className="text-2xl font-bold text-neutral-900">{stats.totalUsers}</p>
            <p className="text-xs text-neutral-500 mt-2">Agents & admins</p>
          </div>

          <div className="stat-card">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-primary-50 rounded-xl">
                <Activity className="w-5 h-5 text-primary-600" />
              </div>
            </div>
            <p className="text-sm text-neutral-500 mb-1">Total Customers</p>
            <p className="text-2xl font-bold text-neutral-900">{stats.totalCustomers.toLocaleString()}</p>
            <p className="text-xs text-neutral-500 mt-2">End customers</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Tenant Performance */}
          <div className="lg:col-span-2 card-modern p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-neutral-900">Tenant Performance</h3>
                <p className="text-sm text-neutral-500">Revenue and growth by branch</p>
              </div>
              <button className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                View Details
              </button>
            </div>
            <div className="space-y-4">
              {tenantPerformance.map((tenant, index) => (
                <div key={index} className="p-4 bg-neutral-50 rounded-xl hover:bg-neutral-100 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg bg-${tenant.color}-100 flex items-center justify-center`}>
                        <Building2 className={`w-5 h-5 text-${tenant.color}-600`} />
                      </div>
                      <div>
                        <p className="font-semibold text-neutral-900">{tenant.name}</p>
                        <p className="text-xs text-neutral-500">{tenant.customers.toLocaleString()} customers</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-neutral-900">₹{(tenant.revenue / 100000).toFixed(1)}L</p>
                      <div className="flex items-center gap-1 text-emerald-600">
                        <TrendingUp className="w-3 h-3" />
                        <span className="text-xs font-semibold">+{tenant.growth}%</span>
                      </div>
                    </div>
                  </div>
                  <div className="w-full h-2 bg-neutral-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full bg-gradient-to-r from-${tenant.color}-500 to-${tenant.color}-600 rounded-full`}
                      style={{ width: `${(tenant.revenue / 3120000) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="card-modern p-6">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-neutral-900">Key Metrics</h3>
              <p className="text-sm text-neutral-500">System-wide performance</p>
            </div>
            <div className="space-y-4">
              <div className="p-4 bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl">
                <p className="text-xs text-emerald-600 font-medium mb-1">Avg Revenue/Tenant</p>
                <p className="text-2xl font-bold text-emerald-900">₹{(stats.avgRevenuePerTenant / 100000).toFixed(1)}L</p>
              </div>
              <div className="p-4 bg-gradient-to-br from-danger-50 to-danger-100 rounded-xl">
                <p className="text-xs text-danger-600 font-medium mb-1">Churn Rate</p>
                <p className="text-2xl font-bold text-danger-900">{stats.churnRate}%</p>
              </div>
              <div className="p-4 bg-gradient-to-br from-primary-50 to-primary-100 rounded-xl">
                <p className="text-xs text-primary-600 font-medium mb-1">Growth Rate</p>
                <p className="text-2xl font-bold text-primary-900">+{stats.growthRate}%</p>
              </div>
              <div className="p-4 bg-gradient-to-br from-primary-50 to-primary-100 rounded-xl">
                <p className="text-xs text-primary-600 font-medium mb-1">Avg Users/Tenant</p>
                <p className="text-2xl font-bold text-primary-900">{Math.round(stats.totalUsers / stats.activeSubscriptions)}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* System Usage */}
          <div className="card-modern p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-neutral-900">System Usage</h3>
                <p className="text-sm text-neutral-500">Infrastructure metrics</p>
              </div>
              <Server className="w-5 h-5 text-neutral-400" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-neutral-50 rounded-xl text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Zap className="w-4 h-4 text-amber-600" />
                  <p className="text-xs text-neutral-500">API Calls/min</p>
                </div>
                <p className="text-2xl font-bold text-neutral-900">1,250</p>
              </div>
              <div className="p-4 bg-neutral-50 rounded-xl text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Database className="w-4 h-4 text-primary-600" />
                  <p className="text-xs text-neutral-500">Storage Used</p>
                </div>
                <p className="text-2xl font-bold text-neutral-900">45 GB</p>
              </div>
              <div className="p-4 bg-neutral-50 rounded-xl text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Activity className="w-4 h-4 text-emerald-600" />
                  <p className="text-xs text-neutral-500">Uptime</p>
                </div>
                <p className="text-2xl font-bold text-emerald-600">99.9%</p>
              </div>
              <div className="p-4 bg-neutral-50 rounded-xl text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-violet-600" />
                  <p className="text-xs text-neutral-500">Avg Response</p>
                </div>
                <p className="text-2xl font-bold text-neutral-900">125ms</p>
              </div>
            </div>
          </div>

          {/* Revenue Breakdown */}
          <div className="card-modern p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-neutral-900">Revenue Distribution</h3>
                <p className="text-sm text-neutral-500">By tenant contribution</p>
              </div>
              <PieChart className="w-5 h-5 text-neutral-400" />
            </div>
            <div className="space-y-4">
              {tenantPerformance.slice(0, 3).map((tenant, index) => (
                <div key={index}>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium text-neutral-700">{tenant.name}</span>
                    <span className="text-sm font-bold text-neutral-900">
                      {((tenant.revenue / stats.totalRevenue) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-neutral-200 rounded-full h-2">
                    <div 
                      className={`bg-gradient-to-r from-${tenant.color}-500 to-${tenant.color}-600 h-2 rounded-full transition-all`}
                      style={{ width: `${(tenant.revenue / stats.totalRevenue) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
              <div className="pt-3 border-t border-neutral-200">
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-neutral-500">Others</span>
                  <span className="text-sm font-bold text-neutral-900">
                    {(((stats.totalRevenue - tenantPerformance.slice(0, 3).reduce((sum, t) => sum + t.revenue, 0)) / stats.totalRevenue) * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card-modern p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-neutral-900">Recent Activity</h3>
              <p className="text-sm text-neutral-500">Latest updates across all tenants</p>
            </div>
            <button className="text-sm text-primary-600 hover:text-primary-700 font-medium">
              View All
            </button>
          </div>
          <div className="space-y-4">
            {recentActivity.map((activity, index) => (
              <div key={index} className="flex items-start gap-4 p-4 rounded-lg hover:bg-neutral-50 transition-colors">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-semibold text-sm">
                    {activity.tenant.split(' ')[0].charAt(0)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-neutral-900">{activity.tenant}</p>
                  <p className="text-sm text-neutral-600">{activity.action}</p>
                </div>
                <div className="text-xs text-neutral-500 whitespace-nowrap">{activity.time}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
