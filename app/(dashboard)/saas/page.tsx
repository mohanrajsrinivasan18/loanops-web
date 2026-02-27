'use client';
import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Building, Plus, Users, TrendingUp, DollarSign, Activity, Loader2 } from 'lucide-react';

interface TenantStats {
  id: string;
  name: string;
  code: string;
  status: string;
  plan: string;
  createdAt: string;
  stats: {
    customers: number;
    agents: number;
    users: number;
    loans: {
      total: number;
      active: number;
    };
    financial: {
      totalDisbursed: number;
      totalOutstanding: number;
      totalCollected: number;
    };
  };
}

interface OverallStats {
  totalTenants: number;
  activeTenants: number;
  trialTenants: number;
  suspendedTenants: number;
  totalCustomers: number;
  totalAgents: number;
  totalUsers: number;
  totalLoans: number;
  activeLoans: number;
  totalDisbursed: number;
  totalOutstanding: number;
  totalCollected: number;
}

export default function SaasPage() {
  const [loading, setLoading] = useState(true);
  const [tenants, setTenants] = useState<TenantStats[]>([]);
  const [overallStats, setOverallStats] = useState<OverallStats | null>(null);

  useEffect(() => {
    fetchSuperAdminStats();
  }, []);

  const fetchSuperAdminStats = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/super-admin/stats');
      const result = await response.json();

      if (result.success) {
        setOverallStats(result.data.overall);
        setTenants(result.data.tenants);
      } else {
        console.error('Failed to fetch stats:', result.error);
      }
    } catch (error) {
      console.error('Error fetching super admin stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)}Cr`;
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)}L`;
    if (amount >= 1000) return `₹${(amount / 1000).toFixed(2)}K`;
    return `₹${amount.toFixed(0)}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">SaaS Administration</h1>
          <p className="text-gray-600 mt-1">Manage tenants and subscription plans</p>
        </div>
        <Button variant="primary">
          <Plus size={20} />
          Add Tenant
        </Button>
      </div>

      {/* Overall Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <Card>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary-100 rounded-lg">
              <Building className="text-primary-600" size={24} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">Total Tenants</p>
              <p className="text-2xl font-bold text-gray-900">{overallStats?.totalTenants || 0}</p>
              <p className="text-xs text-gray-500 mt-1">
                {overallStats?.activeTenants || 0} active, {overallStats?.trialTenants || 0} trial
              </p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <Users className="text-green-600" size={24} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">Total Customers</p>
              <p className="text-2xl font-bold text-gray-900">{overallStats?.totalCustomers || 0}</p>
              <p className="text-xs text-gray-500 mt-1">
                {overallStats?.totalAgents || 0} agents
              </p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Activity className="text-purple-600" size={24} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">Total Loans</p>
              <p className="text-2xl font-bold text-gray-900">{overallStats?.totalLoans || 0}</p>
              <p className="text-xs text-gray-500 mt-1">
                {overallStats?.activeLoans || 0} active
              </p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-100 rounded-lg">
              <DollarSign className="text-amber-600" size={24} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">Total Disbursed</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(overallStats?.totalDisbursed || 0)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {formatCurrency(overallStats?.totalOutstanding || 0)} outstanding
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Financial Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <div className="p-4">
            <p className="text-sm font-medium text-gray-600 mb-2">Total Disbursed</p>
            <p className="text-3xl font-bold text-gray-900 mb-1">
              {formatCurrency(overallStats?.totalDisbursed || 0)}
            </p>
            <p className="text-xs text-gray-500">Across all tenants</p>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <p className="text-sm font-medium text-gray-600 mb-2">Total Collected</p>
            <p className="text-3xl font-bold text-green-600 mb-1">
              {formatCurrency(overallStats?.totalCollected || 0)}
            </p>
            <p className="text-xs text-gray-500">
              {overallStats?.totalDisbursed
                ? ((overallStats.totalCollected / overallStats.totalDisbursed) * 100).toFixed(1)
                : 0}% collection rate
            </p>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <p className="text-sm font-medium text-gray-600 mb-2">Total Outstanding</p>
            <p className="text-3xl font-bold text-amber-600 mb-1">
              {formatCurrency(overallStats?.totalOutstanding || 0)}
            </p>
            <p className="text-xs text-gray-500">Pending collections</p>
          </div>
        </Card>
      </div>

      {/* Tenants Table */}
      <Card title="Tenant Details">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3.5 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Tenant</th>
                <th className="text-left py-3.5 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Plan</th>
                <th className="text-left py-3.5 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Customers</th>
                <th className="text-left py-3.5 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Agents</th>
                <th className="text-left py-3.5 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Loans</th>
                <th className="text-left py-3.5 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Disbursed</th>
                <th className="text-left py-3.5 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Outstanding</th>
                <th className="text-left py-3.5 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody>
              {tenants.map((tenant) => (
                <tr key={tenant.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="py-4 px-4">
                    <div>
                      <p className="font-medium text-sm text-gray-900">{tenant.name}</p>
                      <p className="text-xs text-gray-500">{tenant.code}</p>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <Badge variant="info">{tenant.plan}</Badge>
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-sm font-semibold text-gray-900">{tenant.stats.customers}</span>
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-sm font-semibold text-gray-900">{tenant.stats.agents}</span>
                  </td>
                  <td className="py-4 px-4">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{tenant.stats.loans.total}</p>
                      <p className="text-xs text-gray-500">{tenant.stats.loans.active} active</p>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-sm font-semibold text-gray-900">
                      {formatCurrency(tenant.stats.financial.totalDisbursed)}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-sm font-semibold text-amber-600">
                      {formatCurrency(tenant.stats.financial.totalOutstanding)}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <Badge variant={tenant.status === 'active' ? 'success' : tenant.status === 'trial' ? 'warning' : 'danger'}>
                      {tenant.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
