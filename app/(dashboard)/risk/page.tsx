'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthProvider';
import { useTenant } from '@/lib/contexts/TenantContext';
import {
  AlertTriangle, Shield, TrendingDown, Users, DollarSign,
  Search, Filter, ChevronDown, Eye, Phone, MapPin, RefreshCw,
} from 'lucide-react';

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount || 0);

export default function RiskPage() {
  const { user } = useAuth();
  const { selectedTenant } = useTenant();
  const [customers, setCustomers] = useState<any[]>([]);
  const [loans, setLoans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState<'all' | 'overdue' | 'high' | 'medium'>('all');
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);

  const tenantId = selectedTenant?.id || user?.tenantId;

  useEffect(() => { if (tenantId) fetchData(); }, [tenantId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (tenantId) params.append('tenantId', tenantId);
      params.append('limit', '500');

      const [customersRes, loansRes] = await Promise.all([
        fetch(`/api/customers?${params.toString()}`),
        fetch(`/api/loans?${params.toString()}`),
      ]);
      const customersResult = await customersRes.json();
      const loansResult = await loansRes.json();
      setCustomers(customersResult.data || customersResult || []);
      setLoans(loansResult.data || loansResult || []);
    } catch (e) { console.error('Error fetching risk data:', e); }
    finally { setLoading(false); }
  };

  // Calculate risk for each customer
  const customersWithRisk = customers.map(c => {
    const customerLoans = loans.filter((l: any) => l.customerId === c.id);
    const activeLoans = customerLoans.filter((l: any) => l.status === 'active');
    const totalOutstanding = customerLoans.reduce((s: number, l: any) => s + (Number(l.outstanding) || 0), 0);
    const totalAmount = customerLoans.reduce((s: number, l: any) => s + (Number(l.amount) || 0), 0);
    const overdueLoans = activeLoans.filter((l: any) => {
      if (!l.endDate) return false;
      return new Date(l.endDate) < new Date();
    });

    let riskLevel: 'low' | 'medium' | 'high' | 'overdue' = 'low';
    if (overdueLoans.length > 0) riskLevel = 'overdue';
    else if (totalOutstanding > totalAmount * 0.8) riskLevel = 'high';
    else if (totalOutstanding > totalAmount * 0.5) riskLevel = 'medium';

    return {
      ...c,
      totalOutstanding,
      totalAmount,
      activeLoansCount: activeLoans.length,
      overdueCount: overdueLoans.length,
      riskLevel,
      agentName: c.Agent?.name || c.agent?.name || '-',
      lineName: c.Line?.name || '-',
    };
  });

  const riskCustomers = customersWithRisk.filter(c =>
    c.riskLevel === 'overdue' || c.riskLevel === 'high' || c.riskLevel === 'medium'
  );

  const filtered = riskCustomers.filter(c => {
    const matchSearch = !search ||
      c.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.phone?.includes(search);
    const matchFilter = riskFilter === 'all' || c.riskLevel === riskFilter;
    return matchSearch && matchFilter;
  });

  const totalAtRisk = riskCustomers.reduce((s, c) => s + c.totalOutstanding, 0);
  const overdueCount = riskCustomers.filter(c => c.riskLevel === 'overdue').length;
  const highRiskCount = riskCustomers.filter(c => c.riskLevel === 'high').length;

  const riskConfig: Record<string, { bg: string; color: string; border: string; label: string }> = {
    overdue: { bg: 'bg-danger-50', color: 'text-danger-700', border: 'border-danger-200', label: 'Overdue' },
    high: { bg: 'bg-warning-50', color: 'text-warning-700', border: 'border-warning-200', label: 'High Risk' },
    medium: { bg: 'bg-secondary-50', color: 'text-secondary-700', border: 'border-secondary-200', label: 'Medium Risk' },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4" />
          <p className="text-neutral-500">Loading risk data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="bg-white border-b border-neutral-100">
        <div className="px-8 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">Risk Management</h1>
              <p className="text-sm text-neutral-500 mt-1">Monitor high-risk accounts and overdue loans</p>
            </div>
            <button onClick={fetchData} className="btn-outline flex items-center gap-2 text-sm">
              <RefreshCw className="w-4 h-4" /> Refresh
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'At Risk Customers', value: riskCustomers.length, icon: AlertTriangle, iconBg: 'bg-danger-50', iconColor: 'text-danger-600' },
              { label: 'Total at Risk', value: formatCurrency(totalAtRisk), icon: DollarSign, iconBg: 'bg-warning-50', iconColor: 'text-warning-600' },
              { label: 'Overdue Accounts', value: overdueCount, icon: TrendingDown, iconBg: 'bg-danger-50', iconColor: 'text-danger-600' },
              { label: 'Default Rate', value: `${customers.length > 0 ? ((riskCustomers.length / customers.length) * 100).toFixed(1) : 0}%`, icon: Shield, iconBg: 'bg-secondary-50', iconColor: 'text-secondary-600' },
            ].map((stat, i) => (
              <div key={stat.label} className="stat-card animate-slide-up" style={{ animationDelay: `${i * 0.05}s` }}>
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-2.5 ${stat.iconBg} rounded-xl`}>
                    <stat.icon className={`w-4 h-4 ${stat.iconColor}`} />
                  </div>
                </div>
                <p className="text-sm text-neutral-500 mb-0.5">{stat.label}</p>
                <p className="text-2xl font-bold text-neutral-900">{stat.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="p-8">
        {/* Search & Filters */}
        <div className="card-modern p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input type="text" placeholder="Search by name or phone..." value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all" />
            </div>
            <div className="bg-neutral-100 rounded-xl p-1 flex gap-1">
              {(['all', 'overdue', 'high', 'medium'] as const).map(f => (
                <button key={f} onClick={() => setRiskFilter(f)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${riskFilter === f ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'}`}>
                  {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Risk Table */}
        <div className="card-modern overflow-hidden">
          <div className="px-6 py-4 border-b border-neutral-100">
            <h3 className="text-lg font-semibold text-neutral-900">High Risk Accounts</h3>
            <p className="text-sm text-neutral-500">{filtered.length} accounts requiring attention</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-neutral-50 border-b border-neutral-100">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-neutral-500 uppercase">Customer</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-neutral-500 uppercase">Phone</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-neutral-500 uppercase">Risk Level</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-neutral-500 uppercase">Outstanding</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-neutral-500 uppercase">Active Loans</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-neutral-500 uppercase">Agent</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-neutral-500 uppercase">Line</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-neutral-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filtered.map(customer => {
                  const cfg = riskConfig[customer.riskLevel] || riskConfig.medium;
                  return (
                    <tr key={customer.id} className="hover:bg-neutral-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-white font-bold text-sm">
                            {customer.name?.charAt(0)?.toUpperCase()}
                          </div>
                          <span className="font-medium text-sm text-neutral-900">{customer.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-neutral-600">{customer.phone}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold ${cfg.bg} ${cfg.color}`}>
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-neutral-900">{formatCurrency(customer.totalOutstanding)}</td>
                      <td className="px-6 py-4 text-sm text-neutral-600">{customer.activeLoansCount}</td>
                      <td className="px-6 py-4 text-sm text-neutral-600">{customer.agentName}</td>
                      <td className="px-6 py-4 text-sm text-neutral-600">{customer.lineName}</td>
                      <td className="px-6 py-4">
                        <button onClick={() => setSelectedCustomer(customer)}
                          className="p-2 bg-primary-50 text-primary-600 rounded-lg hover:bg-primary-100 transition-all">
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <div className="p-16 text-center">
              <Shield className="w-12 h-12 text-success-400 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-neutral-900 mb-2">All Clear</h3>
              <p className="text-neutral-500">No high-risk accounts found</p>
            </div>
          )}
        </div>
      </div>

      {/* Customer Risk Detail Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in"
          onClick={() => setSelectedCustomer(null)}>
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-neutral-100">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-neutral-900">Risk Details</h3>
                <button onClick={() => setSelectedCustomer(null)}
                  className="w-8 h-8 rounded-lg hover:bg-neutral-100 flex items-center justify-center text-neutral-400">
                  ✕
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-white font-bold text-xl">
                  {selectedCustomer.name?.charAt(0)?.toUpperCase()}
                </div>
                <div>
                  <h4 className="font-bold text-neutral-900 text-lg">{selectedCustomer.name}</h4>
                  <p className="text-sm text-neutral-500">{selectedCustomer.phone}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-neutral-50 rounded-xl">
                  <p className="text-xs text-neutral-500">Outstanding</p>
                  <p className="text-lg font-bold text-danger-600">{formatCurrency(selectedCustomer.totalOutstanding)}</p>
                </div>
                <div className="p-3 bg-neutral-50 rounded-xl">
                  <p className="text-xs text-neutral-500">Total Borrowed</p>
                  <p className="text-lg font-bold text-neutral-900">{formatCurrency(selectedCustomer.totalAmount)}</p>
                </div>
                <div className="p-3 bg-neutral-50 rounded-xl">
                  <p className="text-xs text-neutral-500">Active Loans</p>
                  <p className="text-lg font-bold text-primary-600">{selectedCustomer.activeLoansCount}</p>
                </div>
                <div className="p-3 bg-neutral-50 rounded-xl">
                  <p className="text-xs text-neutral-500">Overdue</p>
                  <p className="text-lg font-bold text-danger-600">{selectedCustomer.overdueCount}</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-neutral-600">
                  <Users className="w-4 h-4 text-neutral-400" /> Agent: {selectedCustomer.agentName}
                </div>
                <div className="flex items-center gap-2 text-sm text-neutral-600">
                  <MapPin className="w-4 h-4 text-neutral-400" /> {selectedCustomer.address || 'No address'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
