'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthProvider';
import { useTenant } from '@/lib/contexts/TenantContext';
import {
  TrendingUp,
  Users,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  Search,
  Building2,
  ChevronRight,
  Wallet,
  Target,
} from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { selectedTenant, isSuperAdmin } = useTenant();
  const [timeRange, setTimeRange] = useState('7d');
  const [searchQuery, setSearchQuery] = useState('');
  const [collectionView, setCollectionView] = useState('daily');
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [topAgentsData, setTopAgentsData] = useState<any[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, [selectedTenant, timeRange]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedTenant?.id) params.append('tenantId', selectedTenant.id);
      params.append('period', timeRange);

      const [dashboardRes, activityRes, agentsRes] = await Promise.all([
        fetch(`/api/dashboard?${params.toString()}`),
        fetch(`/api/activity?${params.toString()}`),
        fetch(`/api/agents/top?${params.toString()}`),
      ]);

      const [dashboard, activity, agents] = await Promise.all([
        dashboardRes.json(),
        activityRes.json(),
        agentsRes.json(),
      ]);

      if (dashboard.success || dashboard.data || dashboard.customers) {
        setDashboardData(dashboard.data || dashboard);
      }
      
      if (activity.success !== false && activity.data) {
        setRecentActivity(activity.data);
      }
      
      if (agents.success !== false && agents.data) {
        setTopAgentsData(agents.data);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    const csvData = [
      ['Metric', 'Value', 'Change'],
      ['Total Customers', '3,926', '+12.5%'],
      ['Active Loans', '2,847', '+8.2%'],
      ['Total Outstanding', '₹24.8L', '-3.1%'],
      ['Collection Rate', '94.2%', '+2.4%'],
    ];

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dashboard-report-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const stats = [
    {
      label: 'Total Customers',
      value: dashboardData?.customers?.total || '0',
      change: '+12.5%',
      trend: 'up' as const,
      icon: Users,
      color: 'text-primary-600',
      bgColor: 'bg-primary-50',
      borderColor: 'border-primary-100',
    },
    {
      label: 'Active Loans',
      value: dashboardData?.loans?.active || '0',
      change: '+8.2%',
      trend: 'up' as const,
      icon: Activity,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-100',
    },
    {
      label: 'Total Outstanding',
      value: dashboardData?.financial?.totalOutstanding
        ? `₹${(dashboardData.financial.totalOutstanding / 100000).toFixed(1)}L`
        : '₹0',
      change: '-3.1%',
      trend: 'down' as const,
      icon: Wallet,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-100',
    },
    {
      label: 'Collection Rate',
      value: dashboardData?.financial?.totalDisbursed
        ? `${((dashboardData.financial.totalCollected / dashboardData.financial.totalDisbursed) * 100).toFixed(1)}%`
        : '0%',
      change: '+2.4%',
      trend: 'up' as const,
      icon: Target,
      color: 'text-primary-600',
      bgColor: 'bg-primary-50',
      borderColor: 'border-primary-100',
    },
  ];

  const filteredActivity = useMemo(() => {
    if (!searchQuery) return recentActivity;
    return recentActivity.filter(activity =>
      activity.customer?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      activity.action?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, recentActivity]);

  const collectionData = useMemo(() => {
    if (!dashboardData?.collections) {
      return {
        daily: { expected: 0, collected: 0, pending: 0, rate: 0 },
        weekly: { expected: 0, collected: 0, pending: 0, rate: 0 },
        monthly: { expected: 0, collected: 0, pending: 0, rate: 0 },
      };
    }

    const today = dashboardData.collections.today || { target: 0, collected: 0, pending: 0 };
    const period = dashboardData.collections.period || { target: 0, collected: 0, pending: 0 };
    const monthly = dashboardData.collections.monthly || { collected: 0 };

    return {
      daily: {
        expected: today.target,
        collected: today.collected,
        pending: today.pending,
        rate: today.target > 0 ? ((today.collected / today.target) * 100).toFixed(1) : 0,
      },
      weekly: {
        expected: period.target,
        collected: period.collected,
        pending: period.pending,
        rate: period.target > 0 ? ((period.collected / period.target) * 100).toFixed(1) : 0,
      },
      monthly: {
        expected: period.target,
        collected: monthly.collected,
        pending: period.target - monthly.collected,
        rate: period.target > 0 ? ((monthly.collected / period.target) * 100).toFixed(1) : 0,
      },
    };
  }, [dashboardData]);

  const getChartData = useMemo(() => {
    // Generate chart data based on view and time range
    // This is visualization data - in production, you'd fetch historical data from API
    if (collectionView === 'daily') {
      const numDays = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
      if (numDays === 7) {
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        return days.map((day, i) => ({
          label: day,
          collected: Math.floor(Math.random() * 15) + 85,
          expected: 100,
          details: {
            date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toLocaleDateString(),
            transactions: Math.floor(Math.random() * 50) + 20,
            amount: Math.floor(Math.random() * 50000) + 80000,
          },
        }));
      } else {
        const today = new Date();
        const step = numDays === 30 ? 3 : 7;
        const dates = [];
        for (let i = numDays - 1; i >= 0; i -= step) {
          const date = new Date(today);
          date.setDate(date.getDate() - i);
          dates.push({
            label: `${date.getDate()}/${date.getMonth() + 1}`,
            collected: Math.floor(Math.random() * 15) + 85,
            expected: 100,
            details: {
              date: date.toLocaleDateString(),
              transactions: Math.floor(Math.random() * 50) + 20,
              amount: Math.floor(Math.random() * 50000) + 80000,
            },
          });
        }
        return dates;
      }
    } else if (collectionView === 'weekly') {
      const numWeeks = timeRange === '7d' ? 1 : timeRange === '30d' ? 4 : 12;
      return Array.from({ length: numWeeks }, (_, i) => ({
        label: `W${i + 1}`,
        collected: Math.floor(Math.random() * 15) + 85,
        expected: 100,
        details: {
          date: `Week ${i + 1}`,
          transactions: Math.floor(Math.random() * 200) + 100,
          amount: Math.floor(Math.random() * 200000) + 400000,
        },
      }));
    } else {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const numMonths = timeRange === '7d' ? 1 : timeRange === '30d' ? 1 : timeRange === '90d' ? 3 : 6;
      return months.slice(0, numMonths).map((month) => ({
        label: month,
        collected: Math.floor(Math.random() * 15) + 85,
        expected: 100,
        details: {
          date: month,
          transactions: Math.floor(Math.random() * 500) + 300,
          amount: Math.floor(Math.random() * 1000000) + 2000000,
        },
      }));
    }
  }, [timeRange, collectionView]);

  const currentCollection = useMemo(() => {
    const baseData = collectionData[collectionView as keyof typeof collectionData];
    const multiplier = timeRange === '7d' ? 1 : timeRange === '30d' ? 4 : 12;
    return {
      expected: baseData.expected * multiplier,
      collected: baseData.collected * multiplier,
      pending: baseData.pending * multiplier,
      rate: baseData.rate,
    };
  }, [timeRange, collectionView]);

  const activityTypeColors: Record<string, { bg: string; text: string; dot: string }> = {
    success: { bg: 'bg-success-50', text: 'text-success-700', dot: 'bg-success-500' },
    info: { bg: 'bg-primary-50', text: 'text-primary-700', dot: 'bg-primary-500' },
    warning: { bg: 'bg-warning-50', text: 'text-warning-700', dot: 'bg-warning-500' },
  };

  const [selectedBar, setSelectedBar] = useState<number | null>(null);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-neutral-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="bg-white border-b border-neutral-100">
        <div className="px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">Dashboard</h1>
                {isSuperAdmin && selectedTenant && (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-primary-50 border border-primary-100 rounded-xl">
                    <Building2 className="w-3.5 h-3.5 text-primary-600" />
                    <span className="text-xs font-bold text-primary-700">{selectedTenant.name}</span>
                  </div>
                )}
              </div>
              <p className="text-sm text-neutral-500">
                {isSuperAdmin
                  ? `Viewing data for ${selectedTenant?.name || 'selected tenant'}`
                  : "Welcome back! Here's your overview."}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 bg-neutral-100 rounded-xl p-1">
                {['24h', '7d', '30d', '90d'].map((range) => (
                  <button
                    key={range}
                    onClick={() => setTimeRange(range)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200 ${
                      timeRange === range
                        ? 'bg-white text-neutral-900 shadow-sm'
                        : 'text-neutral-500 hover:text-neutral-700'
                    }`}
                  >
                    {range}
                  </button>
                ))}
              </div>
              <button
                onClick={handleExport}
                className="btn-secondary text-sm flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span>Export</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="p-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="stat-card group animate-slide-up"
              style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'both' }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-xl ${stat.bgColor} border ${stat.borderColor} group-hover:scale-110 transition-transform duration-300`}>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <div className={`flex items-center gap-1 px-2 py-1 rounded-lg ${
                  stat.trend === 'up' ? 'bg-success-50' : 'bg-danger-50'
                }`}>
                  {stat.trend === 'up' ? (
                    <ArrowUpRight className="w-3.5 h-3.5 text-success-600" />
                  ) : (
                    <ArrowDownRight className="w-3.5 h-3.5 text-danger-600" />
                  )}
                  <span className={`text-xs font-bold ${
                    stat.trend === 'up' ? 'text-success-700' : 'text-danger-700'
                  }`}>
                    {stat.change}
                  </span>
                </div>
              </div>
              <div>
                <p className="text-sm text-neutral-500 font-medium mb-1">{stat.label}</p>
                <p className="text-2xl font-bold text-neutral-900 tracking-tight">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8 animate-slide-up" style={{ animationDelay: '150ms', animationFillMode: 'both' }}>
          {[
            { label: 'New Customer', icon: Users, href: '/customers', color: 'bg-primary-600', desc: 'Add customer' },
            { label: 'Disburse Loan', icon: Wallet, href: '/loans', color: 'bg-emerald-600', desc: 'Create loan' },
            { label: 'Lines', icon: Activity, href: '/lines', color: 'bg-primary-600', desc: 'Collections & finance' },
            { label: 'Reports', icon: Download, href: '/reports', color: 'bg-neutral-800', desc: 'Generate reports' },
          ].map((action) => (
            <button
              key={action.label}
              onClick={() => router.push(action.href)}
              className="flex items-center gap-3 p-4 bg-white rounded-xl border border-neutral-200 hover:border-neutral-300 hover:shadow-sm transition-all text-left group active:scale-[0.98]"
            >
              <div className={`w-10 h-10 ${action.color} rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform`}>
                <action.icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-neutral-900">{action.label}</p>
                <p className="text-[11px] text-neutral-400">{action.desc}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Collection Overview */}
        <div className="mb-8 card-modern p-6 animate-slide-up" style={{ animationDelay: '200ms', animationFillMode: 'both' }}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-neutral-900 tracking-tight">Collection Overview</h2>
              <p className="text-sm text-neutral-500 mt-0.5">Track your collection performance</p>
            </div>
            <div className="flex items-center gap-1 bg-neutral-100 rounded-xl p-1">
              {['daily', 'weekly', 'monthly'].map((view) => (
                <button
                  key={view}
                  onClick={() => setCollectionView(view)}
                  className={`px-4 py-1.5 text-sm rounded-lg font-semibold transition-all duration-200 capitalize ${
                    collectionView === view
                      ? 'bg-white text-neutral-900 shadow-sm'
                      : 'text-neutral-500 hover:text-neutral-700'
                  }`}
                >
                  {view}
                </button>
              ))}
            </div>
          </div>

          {/* Collection Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="p-4 bg-gradient-to-br from-primary-50 to-primary-100 rounded-2xl border border-primary-100">
              <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">Expected</p>
              <p className="text-2xl font-bold text-neutral-900 tracking-tight">
                ₹{(currentCollection.expected / 1000).toFixed(0)}K
              </p>
            </div>
            <div className="p-4 bg-gradient-to-br from-success-50 to-emerald-50 rounded-2xl border border-success-100">
              <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">Collected</p>
              <p className="text-2xl font-bold text-success-600 tracking-tight">
                ₹{(currentCollection.collected / 1000).toFixed(0)}K
              </p>
            </div>
            <div className="p-4 bg-gradient-to-br from-warning-50 to-amber-50 rounded-2xl border border-warning-100">
              <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">Pending</p>
              <p className="text-2xl font-bold text-warning-600 tracking-tight">
                ₹{(currentCollection.pending / 1000).toFixed(0)}K
              </p>
            </div>
            <div className="p-4 bg-gradient-to-br from-secondary-50 to-primary-50 rounded-2xl border border-secondary-100">
              <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">Success Rate</p>
              <p className="text-2xl font-bold text-primary-600 tracking-tight">{currentCollection.rate}%</p>
            </div>
          </div>

          <div className="bg-neutral-50 rounded-2xl p-6 border border-neutral-100">
            {/* Bar Chart */}
            <div className="h-56 flex items-end justify-between gap-2 mb-4">
              {getChartData.map((item, index) => {
                const isSelected = selectedBar === index;
                const barColor = collectionView === 'daily'
                  ? 'bg-gradient-to-t from-emerald-500 to-emerald-400'
                  : collectionView === 'weekly'
                  ? 'bg-gradient-to-t from-primary-500 to-primary-400'
                  : 'bg-gradient-to-t from-primary-600 to-primary-500';

                return (
                  <div
                    key={index}
                    className="flex-1 flex flex-col items-center gap-1.5 cursor-pointer group"
                    onClick={() => setSelectedBar(isSelected ? null : index)}
                  >
                    <span className={`text-[10px] font-bold transition-colors ${
                      isSelected ? 'text-neutral-900' : 'text-neutral-400 group-hover:text-neutral-600'
                    }`}>
                      {item.collected}%
                    </span>
                    <div className="w-full bg-neutral-200/50 rounded-lg overflow-hidden relative" style={{ height: '180px' }}>
                      <div
                        className={`absolute bottom-0 w-full ${barColor} rounded-lg transition-all duration-500 ${
                          isSelected ? 'opacity-100 shadow-lg' : 'opacity-75 group-hover:opacity-100'
                        }`}
                        style={{ height: `${item.collected}%` }}
                      />
                    </div>
                    <span className={`text-[10px] font-semibold ${
                      isSelected ? 'text-neutral-900' : 'text-neutral-500'
                    }`}>
                      {item.label}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Selected Bar Details */}
            {selectedBar !== null && getChartData[selectedBar] && (
              <div className="mb-4 p-4 bg-white rounded-xl border border-neutral-100 shadow-sm animate-scale-in">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-neutral-900 mb-1">
                      {getChartData[selectedBar].details.date}
                    </p>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-neutral-500">
                        Txns: <span className="font-bold text-neutral-900">{getChartData[selectedBar].details.transactions}</span>
                      </span>
                      <span className="text-neutral-500">
                        Amount: <span className="font-bold text-neutral-900">₹{(getChartData[selectedBar].details.amount / 1000).toFixed(0)}K</span>
                      </span>
                      <span className="text-neutral-500">
                        Rate: <span className="font-bold text-success-600">{getChartData[selectedBar].collected}%</span>
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); setSelectedBar(null); }}
                    className="w-7 h-7 flex items-center justify-center rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 transition-colors"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}

            {/* Legend */}
            <div className="flex items-center justify-center gap-6 pt-3 border-t border-neutral-100">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded ${
                  collectionView === 'daily' ? 'bg-emerald-500' : collectionView === 'weekly' ? 'bg-primary-500' : 'bg-primary-600'
                }`} />
                <span className="text-xs text-neutral-500 font-medium">Collection Rate</span>
              </div>
              <span className="text-xs text-neutral-400">
                {timeRange === '7d' ? 'Last 7 days' : timeRange === '30d' ? 'Last 30 days' : 'Last 90 days'}
              </span>
              <span className="text-xs text-neutral-400 italic">Click bars for details</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Activity */}
          <div className={`card-modern p-6 animate-slide-up ${user?.role === 'agent' ? 'lg:col-span-3' : 'lg:col-span-2'}`} style={{ animationDelay: '300ms', animationFillMode: 'both' }}>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold text-neutral-900 tracking-tight">Recent Activity</h2>
                <p className="text-sm text-neutral-500 mt-0.5">Latest transactions and events</p>
              </div>
              <button
                onClick={() => router.push('/collections')}
                className="text-sm text-primary-600 hover:text-primary-700 font-semibold flex items-center gap-1 hover:gap-2 transition-all"
              >
                View all
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Search */}
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Search activity..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input-modern pl-10 text-sm"
                />
              </div>
            </div>

            <div className="space-y-2">
              {filteredActivity.length === 0 ? (
                <div className="text-center py-8 text-neutral-500">
                  <p>No recent activity</p>
                </div>
              ) : (
                filteredActivity.map((activity) => {
                  const typeColor = activityTypeColors[activity.type] || activityTypeColors.info;
                  return (
                    <div key={activity.id} className="flex items-center justify-between p-3.5 rounded-xl hover:bg-neutral-50 transition-all duration-150 group cursor-pointer">
                      <div className="flex items-center gap-3.5">
                        <div className={`w-10 h-10 rounded-xl ${typeColor.bg} flex items-center justify-center`}>
                          <span className={`text-xs font-bold ${typeColor.text}`}>
                            {activity.customer?.split(' ').map((n: string) => n[0]).join('') || '??'}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-neutral-900">{activity.customer || 'Unknown'}</p>
                          <div className="flex items-center gap-2">
                            <span className={`w-1.5 h-1.5 rounded-full ${typeColor.dot}`} />
                            <p className="text-xs text-neutral-500">{activity.action}</p>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-neutral-900">{activity.amount}</p>
                        <p className="text-[11px] text-neutral-400">{activity.time}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Top Agents */}
          {user?.role !== 'agent' && user?.role !== 'customer' && (
            <div className="card-modern p-6 animate-slide-up" style={{ animationDelay: '400ms', animationFillMode: 'both' }}>
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-lg font-bold text-neutral-900 tracking-tight">Top Agents</h2>
                  <p className="text-sm text-neutral-500 mt-0.5">Best performers this period</p>
                </div>
                <button
                  onClick={() => router.push('/agents')}
                  className="text-sm text-primary-600 hover:text-primary-700 font-semibold flex items-center gap-1 hover:gap-2 transition-all"
                >
                  All
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-4">
                {topAgentsData.length === 0 ? (
                  <div className="text-center py-8 text-neutral-500">
                    <p>No agent data available</p>
                  </div>
                ) : (
                  topAgentsData.map((agent, index) => (
                    <div key={agent.id || index} className="p-4 rounded-2xl border border-neutral-100 hover:border-neutral-200 hover:shadow-sm transition-all duration-200 cursor-pointer group">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-sm">
                          <span className="text-xs font-bold text-white">{agent.avatar || agent.name?.split(' ').map((n: string) => n[0]).join('') || '??'}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-neutral-900 truncate">{agent.name}</p>
                          <p className="text-xs text-neutral-500">{agent.customers || 0} customers</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-neutral-900">{agent.collections}</p>
                          <span className="text-[10px] font-bold text-primary-600 bg-primary-50 px-2 py-0.5 rounded-md">
                            #{index + 1}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-neutral-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-success-500 to-success-400 rounded-full transition-all duration-700"
                            style={{ width: `${agent.efficiency || 0}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold text-neutral-600 min-w-[32px] text-right">{agent.efficiency || 0}%</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
