'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthProvider';
import { useTenant } from '@/lib/contexts/TenantContext';
import {
  BarChart3, Users, Wallet, TrendingUp, Layers, RefreshCw,
  IndianRupee, Target, Activity, ArrowUpRight, ArrowDownRight,
} from 'lucide-react';

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount || 0);

export default function AnalyticsPage() {
  const { user } = useAuth();
  const { selectedTenant } = useTenant();
  const [timeRange, setTimeRange] = useState('30d');
  const [lineTypeFilter, setLineTypeFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState<any>(null);
  const [agents, setAgents] = useState<any[]>([]);
  const [lines, setLines] = useState<any[]>([]);

  const tenantId = selectedTenant?.id || user?.tenantId;

  useEffect(() => { loadData(); }, [timeRange, tenantId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (tenantId) params.append('tenantId', tenantId);
      params.append('period', timeRange);

      const [dashRes, agentsRes, linesRes] = await Promise.all([
        fetch(`/api/dashboard?${params.toString()}`),
        fetch(`/api/agents/top?${params.toString()}`),
        fetch(`/api/lines?tenantId=${tenantId}`),
      ]);
      const [dashData, agentsData, linesData] = await Promise.all([dashRes.json(), agentsRes.json(), linesRes.json()]);
      setDashboard(dashData.data || dashData);
      setAgents(Array.isArray(agentsData.data) ? agentsData.data : Array.isArray(agentsData) ? agentsData : []);
      setLines(Array.isArray(linesData.data) ? linesData.data : []);
    } catch (e) { console.error('Analytics load error:', e); }
    finally { setLoading(false); }
  };

  // Compute line type counts
  const lineTypeCounts = {
    all: lines.length,
    daily: lines.filter((l: any) => l.type === 'daily').length,
    weekly: lines.filter((l: any) => l.type === 'weekly').length,
    monthly: lines.filter((l: any) => l.type === 'monthly').length,
  };

  // Filter lines by type
  const filteredLines = lineTypeFilter === 'all' ? lines : lines.filter((l: any) => l.type === lineTypeFilter);
  const filteredLineIds = new Set(filteredLines.map((l: any) => l.id));

  // Compute filtered metrics from lines data
  const filteredCustomers = filteredLines.reduce((s: number, l: any) => s + (l.customersCount || 0), 0);
  const filteredOutstanding = filteredLines.reduce((s: number, l: any) => s + (l.outstanding || 0), 0);
  const filteredTotalAmount = filteredLines.reduce((s: number, l: any) => s + (l.totalAmount || 0), 0);

  const totalCustomers = lineTypeFilter !== 'all' ? filteredCustomers : (dashboard?.customers?.total || 0);
  const activeLoans = lineTypeFilter !== 'all' ? filteredLines.length : ((dashboard?.loans?.active || 0));
  const totalLoans = lineTypeFilter !== 'all' ? filteredLines.length : ((dashboard?.loans?.active || 0) + (dashboard?.loans?.completed || 0));
  const totalOutstanding = lineTypeFilter !== 'all' ? filteredOutstanding : (dashboard?.financial?.totalOutstanding || 0);
  const totalCollected = lineTypeFilter !== 'all' ? (filteredTotalAmount - filteredOutstanding) : (dashboard?.financial?.totalCollected || 0);
  const totalDisbursed = lineTypeFilter !== 'all' ? filteredTotalAmount : (dashboard?.financial?.totalDisbursed || 0);
  const collectionRate = lineTypeFilter !== 'all'
    ? (filteredTotalAmount > 0 ? Math.round(((filteredTotalAmount - filteredOutstanding) / filteredTotalAmount) * 100) : 0)
    : (dashboard?.collections?.today?.target > 0
      ? Math.round((dashboard.collections.today.collected / dashboard.collections.today.target) * 100) : 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4" />
          <p className="text-neutral-500">Loading analytics...</p>
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
              <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">Analytics</h1>
              <p className="text-sm text-neutral-500 mt-1">Business insights and performance metrics</p>
            </div>
            <button onClick={loadData} className="btn-outline flex items-center gap-2 text-sm">
              <RefreshCw className="w-4 h-4" /> Refresh
            </button>
          </div>

          {/* Time Range */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="bg-neutral-100 rounded-xl p-1 inline-flex gap-1">
              {['7d', '30d', '90d'].map(range => (
                <button key={range} onClick={() => setTimeRange(range)}
                  className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${timeRange === range ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'}`}>
                  {range.toUpperCase()}
                </button>
              ))}
            </div>
            <div className="bg-neutral-100 rounded-xl p-1 inline-flex gap-1">
              {(['all', 'daily', 'weekly', 'monthly'] as const).map(type => (
                <button key={type} onClick={() => setLineTypeFilter(type)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${lineTypeFilter === type ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'}`}>
                  {type.charAt(0).toUpperCase() + type.slice(1)} ({lineTypeCounts[type]})
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="p-8 space-y-8">
        {/* Key Metrics */}
        <div>
          <h2 className="text-lg font-bold text-neutral-900 mb-4">Key Metrics</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Customers', value: totalCustomers.toString(), icon: Users, iconBg: 'bg-primary-50', iconColor: 'text-primary-600' },
              { label: 'Active Loans', value: activeLoans.toString(), icon: Wallet, iconBg: 'bg-primary-50', iconColor: 'text-primary-600' },
              { label: 'Collection Rate', value: `${collectionRate}%`, icon: TrendingUp, iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600' },
              { label: 'Total Loans', value: totalLoans.toString(), icon: Layers, iconBg: 'bg-amber-50', iconColor: 'text-amber-600' },
            ].map((m, i) => (
              <div key={m.label} className="card-modern p-5 animate-slide-up" style={{ animationDelay: `${i * 0.05}s` }}>
                <div className={`p-2.5 ${m.iconBg} rounded-xl w-fit mb-3`}><m.icon className={`w-5 h-5 ${m.iconColor}`} /></div>
                <p className="text-3xl font-bold text-neutral-900">{m.value}</p>
                <p className="text-sm text-neutral-500 mt-1">{m.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Financial Overview */}
        <div>
          <h2 className="text-lg font-bold text-neutral-900 mb-4">Financial Overview</h2>
          <div className="card-modern p-6">
            <div className="space-y-5">
              {[
                { label: 'Total Disbursed', value: formatCurrency(totalDisbursed), color: 'text-primary-600', bg: 'bg-primary-50', icon: ArrowUpRight },
                { label: 'Total Collected', value: formatCurrency(totalCollected), color: 'text-emerald-600', bg: 'bg-emerald-50', icon: ArrowDownRight },
                { label: 'Outstanding', value: formatCurrency(totalOutstanding), color: 'text-amber-600', bg: 'bg-amber-50', icon: Target },
              ].map((item, i) => (
                <div key={item.label}>
                  {i > 0 && <div className="h-px bg-neutral-100 mb-5" />}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 ${item.bg} rounded-lg`}><item.icon className={`w-4 h-4 ${item.color}`} /></div>
                      <span className="text-sm font-medium text-neutral-600">{item.label}</span>
                    </div>
                    <span className={`text-xl font-bold ${item.color}`}>{item.value}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Filtered Lines Breakdown */}
        {lineTypeFilter !== 'all' && filteredLines.length > 0 && (
          <div>
            <h2 className="text-lg font-bold text-neutral-900 mb-4">
              {lineTypeFilter.charAt(0).toUpperCase() + lineTypeFilter.slice(1)} Lines ({filteredLines.length})
            </h2>
            <div className="card-modern p-6">
              <div className="space-y-4">
                {filteredLines.map((line: any, i: number) => {
                  const collected = (line.totalAmount || 0) - (line.outstanding || 0);
                  const rate = line.totalAmount > 0 ? Math.round((collected / line.totalAmount) * 100) : 0;
                  const barColor = rate >= 80 ? 'from-emerald-500 to-emerald-600' : rate >= 50 ? 'from-amber-500 to-amber-600' : 'from-red-500 to-red-600';
                  return (
                    <div key={line.id}>
                      {i > 0 && <div className="h-px bg-neutral-100 mb-4" />}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-bold text-xs">
                            {(line.name || 'L').charAt(0)}
                          </div>
                          <div>
                            <p className="font-semibold text-neutral-900 text-sm">{line.name}</p>
                            <p className="text-xs text-neutral-500">
                              {line.area} • {line.customersCount || 0} customers
                              {line.type === 'weekly' && line.weeklyDay ? ` • ${line.weeklyDay}` : ''}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-bold text-neutral-900">{formatCurrency(collected)}</span>
                          <p className="text-xs text-neutral-500">of {formatCurrency(line.totalAmount || 0)}</p>
                        </div>
                      </div>
                      <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                        <div className={`h-full bg-gradient-to-r ${barColor} rounded-full transition-all`} style={{ width: `${Math.min(rate, 100)}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Agent Performance */}
        {agents.length > 0 && (
          <div>
            <h2 className="text-lg font-bold text-neutral-900 mb-4">Agent Performance</h2>
            <div className="card-modern p-6">
              <div className="space-y-5">
                {agents.map((agent: any, i: number) => {
                  const efficiency = agent.collectionRate || agent.efficiency || 0;
                  const barColor = efficiency >= 80 ? 'from-emerald-500 to-emerald-600' : efficiency >= 50 ? 'from-amber-500 to-amber-600' : 'from-red-500 to-red-600';
                  const textColor = efficiency >= 80 ? 'text-emerald-600' : efficiency >= 50 ? 'text-amber-600' : 'text-red-600';
                  return (
                    <div key={agent.id || i}>
                      {i > 0 && <div className="h-px bg-neutral-100 mb-5" />}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-bold text-xs">
                            {(agent.name || 'A').charAt(0)}
                          </div>
                          <div>
                            <p className="font-semibold text-neutral-900 text-sm">{agent.name}</p>
                            <p className="text-xs text-neutral-500">{agent.customersCount || 0} customers • {formatCurrency(agent.totalCollected || 0)}</p>
                          </div>
                        </div>
                        <span className={`text-lg font-bold ${textColor}`}>{Math.round(efficiency)}%</span>
                      </div>
                      <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                        <div className={`h-full bg-gradient-to-r ${barColor} rounded-full transition-all`} style={{ width: `${Math.min(efficiency, 100)}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Portfolio Summary */}
        <div>
          <h2 className="text-lg font-bold text-neutral-900 mb-4">Portfolio Summary</h2>
          <div className="card-modern p-6">
            <div className="space-y-4">
              {[
                { label: 'Active Loans', value: activeLoans, color: 'text-neutral-900' },
                { label: 'Completed Loans', value: dashboard?.loans?.completed || 0, color: 'text-emerald-600' },
                { label: 'Total Agents', value: dashboard?.agents?.total || 0, color: 'text-neutral-900' },
              ].map((item, i) => (
                <div key={item.label}>
                  {i > 0 && <div className="h-px bg-neutral-100 mb-4" />}
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-neutral-600">{item.label}</span>
                    <span className={`text-lg font-bold ${item.color}`}>{item.value}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
