'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthProvider';
import { useTenant } from '@/lib/contexts/TenantContext';
import {
  Search, Plus, Download, Eye, Calendar, X, DollarSign, TrendingUp,
  AlertCircle, FileText, IndianRupee, Clock, Edit,
} from 'lucide-react';

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount || 0);

export default function LoansPage() {
  const { user } = useAuth();
  const { selectedTenant } = useTenant();
  const [loans, setLoans] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<any>(null);
  const [addForm, setAddForm] = useState({ customerId: '', loanType: 'daily', amount: '', interestRate: '2.5', processingFee: '5' });
  const [saving, setSaving] = useState(false);

  const tenantId = selectedTenant?.id || user?.tenantId;

  useEffect(() => { if (tenantId) { loadLoans(); loadCustomers(); } }, [tenantId]);

  const loadLoans = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (tenantId) params.append('tenantId', tenantId);
      params.append('limit', '200');
      const res = await fetch(`/api/loans?${params.toString()}`);
      const result = await res.json();
      setLoans(result.data || result || []);
    } catch (e) { console.error('Error loading loans:', e); }
    finally { setLoading(false); }
  };

  const loadCustomers = async () => {
    try {
      const params = new URLSearchParams();
      if (tenantId) params.append('tenantId', tenantId);
      const res = await fetch(`/api/customers?${params.toString()}`);
      const result = await res.json();
      setCustomers(result.data || result || []);
    } catch (e) { console.error('Error loading customers:', e); }
  };

  const handleDisburse = async () => {
    if (!addForm.customerId || !addForm.amount) { alert('Customer and amount are required'); return; }
    try {
      setSaving(true);
      const amount = parseFloat(addForm.amount);
      const interestRate = parseFloat(addForm.interestRate) || 2.5;
      const processingFee = parseFloat(addForm.processingFee) || 5;
      const cutting = amount * (processingFee / 100);
      const disbursed = amount - cutting;
      const tenure = addForm.loanType === 'daily' ? 30 : addForm.loanType === 'weekly' ? 12 : 6;
      const emi = Math.round(amount / tenure);

      const res = await fetch('/api/loans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: addForm.customerId,
          tenantId,
          amount,
          loanType: addForm.loanType,
          interestRate,
          processingFee,
          tenure,
          emi,
          disbursedAmount: disbursed,
          outstanding: amount,
          status: 'active',
        }),
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'Failed'); }
      setShowAddModal(false);
      setAddForm({ customerId: '', loanType: 'daily', amount: '', interestRate: '2.5', processingFee: '5' });
      loadLoans();
    } catch (e: any) { alert(e.message || 'Failed to create loan'); }
    finally { setSaving(false); }
  };

  const handleExport = () => {
    const csvData = [
      ['Loan ID', 'Customer', 'Amount', 'Type', 'Outstanding', 'Status', 'EMI'],
      ...loans.map((l: any) => [l.loanId || l.id, l.Customer?.name || l.customer?.name || '-', l.amount, l.loanType, l.outstanding, l.status, l.emi]),
    ];
    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `loans-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const filtered = loans.filter((loan: any) => {
    const name = loan.Customer?.name || loan.customer?.name || '';
    const loanId = loan.loanId || loan.id || '';
    const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase()) || loanId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || (loan.loanType || '').toLowerCase() === filterType;
    const matchesStatus = filterStatus === 'all' || loan.status === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  const stats = {
    total: loans.length,
    active: loans.filter((l: any) => l.status === 'active').length,
    overdue: loans.filter((l: any) => l.status === 'overdue').length,
    completed: loans.filter((l: any) => l.status === 'completed').length,
  };

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { label: string; bg: string; color: string; dot: string; border: string }> = {
      active: { label: 'Active', bg: 'bg-success-50', color: 'text-success-700', dot: 'bg-success-500', border: 'border-success-200' },
      overdue: { label: 'Overdue', bg: 'bg-danger-50', color: 'text-danger-700', dot: 'bg-danger-500', border: 'border-danger-200' },
      completed: { label: 'Completed', bg: 'bg-neutral-100', color: 'text-neutral-700', dot: 'bg-neutral-400', border: 'border-neutral-200' },
    };
    return configs[status] || configs.active;
  };

  const getTypeConfig = (type: string) => {
    const configs: Record<string, { bg: string; color: string; border: string }> = {
      daily: { bg: 'bg-primary-50', color: 'text-primary-700', border: 'border-primary-200' },
      weekly: { bg: 'bg-secondary-50', color: 'text-secondary-700', border: 'border-secondary-200' },
      monthly: { bg: 'bg-warning-50', color: 'text-warning-700', border: 'border-warning-200' },
    };
    return configs[(type || '').toLowerCase()] || configs.daily;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4" />
          <p className="text-neutral-500">Loading loans...</p>
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
              <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">Loans</h1>
              <p className="text-sm text-neutral-500 mt-1">Track and manage all loan accounts</p>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={handleExport} className="btn-outline flex items-center gap-2 text-sm"><Download className="w-4 h-4" /> Export</button>
              <button className="btn-primary flex items-center gap-2" onClick={() => setShowAddModal(true)}><Plus className="w-4 h-4" /><span>New Loan</span></button>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Loans', value: stats.total, icon: FileText, iconBg: 'bg-primary-50', iconColor: 'text-primary-600' },
              { label: 'Active', value: stats.active, icon: TrendingUp, iconBg: 'bg-success-50', iconColor: 'text-success-600' },
              { label: 'Overdue', value: stats.overdue, icon: AlertCircle, iconBg: 'bg-danger-50', iconColor: 'text-danger-600' },
              { label: 'Completed', value: stats.completed, icon: Clock, iconBg: 'bg-neutral-100', iconColor: 'text-neutral-600' },
            ].map((stat, i) => (
              <div key={stat.label} className="stat-card animate-slide-up" style={{ animationDelay: `${i * 0.05}s` }}>
                <div className="flex items-center justify-between mb-3"><div className={`p-2.5 ${stat.iconBg} rounded-xl`}><stat.icon className={`w-4 h-4 ${stat.iconColor}`} /></div></div>
                <p className="text-sm text-neutral-500 mb-0.5">{stat.label}</p>
                <p className="text-2xl font-bold text-neutral-900">{stat.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="p-8">
        {/* Filters */}
        <div className="card-modern p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input type="text" placeholder="Search by loan ID or customer name..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all" />
            </div>
            <div className="bg-neutral-100 rounded-xl p-1 flex gap-1">
              {['all', 'daily', 'weekly', 'monthly'].map(type => (
                <button key={type} onClick={() => setFilterType(type)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${filterType === type ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'}`}>
                  {type === 'all' ? 'All Types' : type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
            <div className="bg-neutral-100 rounded-xl p-1 flex gap-1">
              {['all', 'active', 'overdue', 'completed'].map(status => (
                <button key={status} onClick={() => setFilterStatus(status)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${filterStatus === status ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'}`}>
                  {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Loans Table */}
        <div className="card-modern overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-neutral-50 border-b border-neutral-100">
                  <th className="text-left px-6 py-3.5 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Loan ID</th>
                  <th className="text-left px-6 py-3.5 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Customer</th>
                  <th className="text-left px-6 py-3.5 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Amount</th>
                  <th className="text-left px-6 py-3.5 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Type</th>
                  <th className="text-left px-6 py-3.5 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Outstanding</th>
                  <th className="text-left px-6 py-3.5 text-xs font-semibold text-neutral-500 uppercase tracking-wider">EMI</th>
                  <th className="text-left px-6 py-3.5 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Progress</th>
                  <th className="text-left px-6 py-3.5 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Status</th>
                  <th className="text-left px-6 py-3.5 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filtered.map((loan: any, i: number) => {
                  const statusCfg = getStatusConfig(loan.status);
                  const typeCfg = getTypeConfig(loan.loanType);
                  const progress = loan.amount > 0 ? Math.round(((loan.amount - (loan.outstanding || 0)) / loan.amount) * 100) : 0;
                  const progressColor = progress >= 75 ? 'from-success-500 to-success-600' : progress >= 40 ? 'from-primary-500 to-primary-600' : progress >= 20 ? 'from-warning-500 to-warning-600' : 'from-danger-500 to-danger-600';
                  const customerName = loan.Customer?.name || loan.customer?.name || '-';
                  return (
                    <tr key={loan.id} className="hover:bg-primary-50/30 transition-colors animate-slide-up" style={{ animationDelay: `${i * 0.02}s` }}>
                      <td className="px-6 py-4"><span className="font-mono text-sm font-semibold text-primary-600">{loan.loanId || loan.id?.slice(0, 12)}</span></td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center">
                            <span className="text-xs font-bold text-white">{customerName.charAt(0)}</span>
                          </div>
                          <span className="font-medium text-neutral-900 text-sm">{customerName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div><div className="font-semibold text-neutral-900 text-sm">{formatCurrency(loan.amount)}</div>
                        <div className="text-xs text-neutral-500">Disbursed: {formatCurrency(loan.disbursedAmount || loan.amount)}</div></div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold ${typeCfg.bg} ${typeCfg.color} border ${typeCfg.border}`}>
                          {(loan.loanType || 'daily').charAt(0).toUpperCase() + (loan.loanType || 'daily').slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4"><span className="font-semibold text-neutral-900 text-sm">{formatCurrency(loan.outstanding)}</span></td>
                      <td className="px-6 py-4"><span className="text-sm text-neutral-600">{formatCurrency(loan.emi || 0)}</span></td>
                      <td className="px-6 py-4">
                        <div className="w-28">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                              <div className={`h-full bg-gradient-to-r ${progressColor} rounded-full transition-all`} style={{ width: `${progress}%` }} />
                            </div>
                            <span className="text-xs font-semibold text-neutral-600 w-8 text-right">{progress}%</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${statusCfg.bg} ${statusCfg.color} border ${statusCfg.border}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />{statusCfg.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button onClick={() => { setSelectedLoan(loan); setShowViewModal(true); }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-50 text-primary-600 rounded-lg hover:bg-primary-100 transition-all text-sm font-medium active:scale-[0.98]">
                          <Eye className="w-3.5 h-3.5" /> View
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
              <div className="w-16 h-16 bg-neutral-100 rounded-2xl flex items-center justify-center mx-auto mb-4"><FileText className="w-8 h-8 text-neutral-400" /></div>
              <h3 className="text-lg font-bold text-neutral-900 mb-2">No Loans Found</h3>
              <p className="text-neutral-500">Try adjusting your filters or create a new loan</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Loan Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-scale-in">
            <div className="sticky top-0 bg-white border-b border-neutral-100 px-6 py-5 flex items-center justify-between rounded-t-2xl">
              <div>
                <h2 className="text-xl font-bold text-neutral-900 tracking-tight">Create New Loan</h2>
                <p className="text-sm text-neutral-500 mt-0.5">Fill in loan details to disburse a new loan</p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="w-8 h-8 rounded-lg hover:bg-neutral-100 flex items-center justify-center text-neutral-400 hover:text-neutral-600 transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <h3 className="text-sm font-bold text-neutral-900 uppercase tracking-wider mb-3">Customer Details</h3>
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-1.5">Select Customer <span className="text-danger-500">*</span></label>
                  <select value={addForm.customerId} onChange={e => setAddForm({ ...addForm, customerId: e.target.value })}
                    className="w-full px-4 py-2.5 border border-neutral-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all appearance-none cursor-pointer">
                    <option value="">Choose a customer</option>
                    {customers.map((c: any) => <option key={c.id} value={c.id}>{c.name} — {c.phone}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-bold text-neutral-900 uppercase tracking-wider mb-3">Loan Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 mb-1.5">Loan Type <span className="text-danger-500">*</span></label>
                    <select value={addForm.loanType} onChange={e => setAddForm({ ...addForm, loanType: e.target.value })}
                      className="w-full px-4 py-2.5 border border-neutral-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all appearance-none cursor-pointer">
                      <option value="daily">Daily (30 days)</option>
                      <option value="weekly">Weekly (12 weeks)</option>
                      <option value="monthly">Monthly (6 months)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 mb-1.5">Loan Amount <span className="text-danger-500">*</span></label>
                    <input type="number" placeholder="50000" value={addForm.amount} onChange={e => setAddForm({ ...addForm, amount: e.target.value })}
                      className="w-full px-4 py-2.5 border border-neutral-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all placeholder-neutral-400" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 mb-1.5">Interest Rate (%)</label>
                    <input type="number" step="0.1" value={addForm.interestRate} onChange={e => setAddForm({ ...addForm, interestRate: e.target.value })}
                      className="w-full px-4 py-2.5 border border-neutral-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all placeholder-neutral-400" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 mb-1.5">Processing Fee (%)</label>
                    <input type="number" step="0.1" value={addForm.processingFee} onChange={e => setAddForm({ ...addForm, processingFee: e.target.value })}
                      className="w-full px-4 py-2.5 border border-neutral-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all placeholder-neutral-400" />
                  </div>
                </div>
              </div>
              {/* Loan Summary */}
              {addForm.amount && (
                <div className="bg-gradient-to-br from-primary-50 to-secondary-50 rounded-2xl p-5 border border-primary-100">
                  <h3 className="text-sm font-bold text-neutral-900 uppercase tracking-wider mb-4">Loan Summary</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-neutral-600">Principal Amount</span>
                      <span className="text-sm font-semibold text-neutral-900">{formatCurrency(parseFloat(addForm.amount) || 0)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-neutral-600">Processing Fee ({addForm.processingFee}%)</span>
                      <span className="text-sm font-semibold text-neutral-900">- {formatCurrency((parseFloat(addForm.amount) || 0) * (parseFloat(addForm.processingFee) || 0) / 100)}</span>
                    </div>
                    <div className="flex justify-between items-center pt-3 border-t border-primary-200">
                      <span className="text-sm font-medium text-neutral-900">Amount to Disburse</span>
                      <span className="text-lg font-bold text-success-600">{formatCurrency((parseFloat(addForm.amount) || 0) * (1 - (parseFloat(addForm.processingFee) || 0) / 100))}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-neutral-900">EMI ({addForm.loanType === 'daily' ? '30 days' : addForm.loanType === 'weekly' ? '12 weeks' : '6 months'})</span>
                      <span className="text-lg font-bold text-neutral-900">{formatCurrency(Math.round((parseFloat(addForm.amount) || 0) / (addForm.loanType === 'daily' ? 30 : addForm.loanType === 'weekly' ? 12 : 6)))}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="sticky bottom-0 bg-neutral-50/80 backdrop-blur-sm border-t border-neutral-100 px-6 py-4 flex items-center justify-end gap-3 rounded-b-2xl">
              <button onClick={() => setShowAddModal(false)} className="btn-ghost text-sm px-6">Cancel</button>
              <button onClick={handleDisburse} disabled={saving} className={`btn-primary text-sm px-6 ${saving ? 'opacity-50' : ''}`}>{saving ? 'Disbursing...' : 'Disburse Loan'}</button>
            </div>
          </div>
        </div>
      )}

      {/* View Loan Modal */}
      {showViewModal && selectedLoan && (
        <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-scale-in">
            <div className="sticky top-0 bg-white border-b border-neutral-100 px-6 py-5 flex items-center justify-between rounded-t-2xl">
              <div>
                <h2 className="text-xl font-bold text-neutral-900 tracking-tight">Loan Details</h2>
                <p className="text-sm font-mono text-primary-600 mt-0.5">{selectedLoan.loanId || selectedLoan.id}</p>
              </div>
              <button onClick={() => { setShowViewModal(false); setSelectedLoan(null); }} className="w-8 h-8 rounded-lg hover:bg-neutral-100 flex items-center justify-center text-neutral-400 hover:text-neutral-600 transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-6">
              <div className="flex items-center gap-3">
                {(() => { const s = getStatusConfig(selectedLoan.status); return <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold ${s.bg} ${s.color} border ${s.border}`}><span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />{s.label}</span>; })()}
                {(() => { const t = getTypeConfig(selectedLoan.loanType); return <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-semibold ${t.bg} ${t.color} border ${t.border}`}>{(selectedLoan.loanType || 'daily').charAt(0).toUpperCase() + (selectedLoan.loanType || 'daily').slice(1)} Loan</span>; })()}
              </div>
              <div className="bg-neutral-50 rounded-xl p-5 border border-neutral-100">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center">
                    <span className="text-white font-bold text-lg">{(selectedLoan.Customer?.name || selectedLoan.customer?.name || 'U').charAt(0)}</span>
                  </div>
                  <div>
                    <p className="font-bold text-neutral-900">{selectedLoan.Customer?.name || selectedLoan.customer?.name || '-'}</p>
                    <p className="text-sm text-neutral-500">{selectedLoan.Customer?.phone || selectedLoan.customer?.phone || '-'}</p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Loan Amount', value: formatCurrency(selectedLoan.amount), bg: 'from-primary-50 to-primary-100', border: 'border-primary-200', color: 'text-primary-900' },
                  { label: 'Disbursed', value: formatCurrency(selectedLoan.disbursedAmount || selectedLoan.amount), bg: 'from-success-50 to-success-100', border: 'border-success-200', color: 'text-success-900' },
                  { label: 'Outstanding', value: formatCurrency(selectedLoan.outstanding), bg: 'from-warning-50 to-warning-100', border: 'border-warning-200', color: 'text-warning-900' },
                  { label: 'EMI', value: formatCurrency(selectedLoan.emi || 0), bg: 'from-secondary-50 to-secondary-100', border: 'border-secondary-200', color: 'text-secondary-900' },
                ].map(card => (
                  <div key={card.label} className={`bg-gradient-to-br ${card.bg} rounded-xl p-4 border ${card.border}`}>
                    <p className="text-xs font-medium text-neutral-600 mb-1">{card.label}</p>
                    <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
                  </div>
                ))}
              </div>
              {/* Progress */}
              {(() => {
                const progress = selectedLoan.amount > 0 ? Math.round(((selectedLoan.amount - (selectedLoan.outstanding || 0)) / selectedLoan.amount) * 100) : 0;
                const progressColor = progress >= 75 ? 'from-success-500 to-success-600' : progress >= 40 ? 'from-primary-500 to-primary-600' : 'from-warning-500 to-warning-600';
                return (
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-semibold text-neutral-700">Repayment Progress</span>
                      <span className="text-sm font-bold text-primary-600">{progress}%</span>
                    </div>
                    <div className="w-full h-2.5 bg-neutral-100 rounded-full overflow-hidden">
                      <div className={`h-full bg-gradient-to-r ${progressColor} rounded-full transition-all`} style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                );
              })()}
              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white border border-neutral-200 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary-50 rounded-lg"><Calendar className="w-4 h-4 text-primary-600" /></div>
                    <div>
                      <p className="text-xs text-neutral-500">Start Date</p>
                      <p className="font-semibold text-neutral-900 text-sm">{selectedLoan.startDate ? new Date(selectedLoan.startDate).toLocaleDateString('en-IN') : selectedLoan.createdAt ? new Date(selectedLoan.createdAt).toLocaleDateString('en-IN') : '-'}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white border border-neutral-200 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-danger-50 rounded-lg"><Calendar className="w-4 h-4 text-danger-600" /></div>
                    <div>
                      <p className="text-xs text-neutral-500">Interest Rate</p>
                      <p className="font-semibold text-neutral-900 text-sm">{selectedLoan.interestRate || 0}%</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="sticky bottom-0 bg-neutral-50/80 backdrop-blur-sm border-t border-neutral-100 px-6 py-4 flex items-center justify-end gap-3 rounded-b-2xl">
              <button onClick={() => { setShowViewModal(false); setSelectedLoan(null); }} className="btn-ghost text-sm px-6">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
