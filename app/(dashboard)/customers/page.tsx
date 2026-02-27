'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthProvider';
import { useTenant } from '@/lib/contexts/TenantContext';
import {
  Search, Plus, Download, Phone, Mail, MapPin, X, Edit, Trash2, Users,
  AlertTriangle, UserCheck, UserX, Eye, GitBranch, DollarSign, Calendar,
  FileText, CreditCard, ArrowRight, RefreshCw,
} from 'lucide-react';

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount || 0);

interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  address: string;
  aadhaar: string | null;
  pan: string | null;
  lat: number | null;
  lng: number | null;
  status: string;
  agentId: string | null;
  lineId?: string | null;
  tenantId: string;
  createdAt: string;
  agent?: any;
  Agent?: any;
  Line?: any;
  loans?: any[];
  Loan?: any[];
}

export default function CustomersPage() {
  const { user } = useAuth();
  const { selectedTenant } = useTenant();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState<Partial<Customer>>({});
  const [defaultTenantId, setDefaultTenantId] = useState<string>('');

  // Customer detail state
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailCustomer, setDetailCustomer] = useState<any>(null);
  const [detailTab, setDetailTab] = useState<'overview' | 'loans' | 'payments'>('overview');
  const [availableLines, setAvailableLines] = useState<any[]>([]);
  const [showLinePicker, setShowLinePicker] = useState(false);
  const [changingLine, setChangingLine] = useState(false);
  // Loan override
  const [showLoanOverride, setShowLoanOverride] = useState(false);
  const [overrideMode, setOverrideMode] = useState<'bulk_payment' | 'edit_balance' | 'close' | null>(null);
  const [overrideAmount, setOverrideAmount] = useState('');
  const [overrideSaving, setOverrideSaving] = useState(false);

  const tenantId = selectedTenant?.id || user?.tenantId;
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

  useEffect(() => { loadDefaultTenant(); loadCustomers(); }, [user, tenantId]);

  const loadDefaultTenant = async () => {
    try {
      const res = await fetch('/api/tenants/default');
      if (res.ok) { const t = await res.json(); setDefaultTenantId(t.id); }
    } catch (e) { console.error('Error loading default tenant:', e); }
  };

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (tenantId) params.append('tenantId', tenantId);
      params.append('limit', '500');
      const res = await fetch(`/api/customers?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch customers');
      const result = await res.json();
      setCustomers(result.data || result);
    } catch (e) { console.error('Error loading customers:', e); }
    finally { setLoading(false); }
  };

  const loadCustomerDetails = async (customer: Customer) => {
    setSelectedCustomer(customer);
    setDetailTab('overview');
    setShowDetailModal(true);
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/customers?id=${customer.id}`);
      const data = await res.json();
      const c = data.data || data;
      const apiLoans = Array.isArray(c?.Loan) ? c.Loan : Array.isArray(c?.loans) ? c.loans : [];
      const activeLoans = apiLoans.filter((l: any) => l.status === 'active');
      const totalBorrowed = apiLoans.reduce((s: number, l: any) => s + (Number(l.amount) || 0), 0);
      const totalOutstanding = apiLoans.reduce((s: number, l: any) => s + (Number(l.outstanding) || 0), 0);

      setDetailCustomer({
        ...c,
        line: c?.Line?.name || 'Not assigned',
        lineId: c?.lineId || c?.Line?.id || '',
        agent: c?.Agent?.name || c?.Line?.Agent?.name || 'Not assigned',
        joinedDate: c.createdAt ? new Date(c.createdAt).toLocaleDateString('en-IN') : '',
        currentLoan: activeLoans[0] ? {
          id: activeLoans[0].id,
          amount: Number(activeLoans[0].amount) || 0,
          outstanding: Number(activeLoans[0].outstanding) || 0,
          paid: Math.max((Number(activeLoans[0].amount) || 0) - (Number(activeLoans[0].outstanding) || 0), 0),
          type: activeLoans[0].loanType || 'daily',
          emi: Number(activeLoans[0].emi) || 0,
          status: activeLoans[0].status,
          startDate: activeLoans[0].startDate,
          endDate: activeLoans[0].endDate,
          tenure: activeLoans[0].tenure || 0,
        } : null,
        loanHistory: apiLoans.map((l: any) => ({
          id: l.id, amount: Number(l.amount) || 0, outstanding: Number(l.outstanding) || 0,
          paid: Math.max((Number(l.amount) || 0) - (Number(l.outstanding) || 0), 0),
          type: l.loanType || 'daily', emi: Number(l.emi) || 0,
          startDate: l.startDate, endDate: l.endDate, status: l.status || 'inactive',
        })),
        stats: {
          totalBorrowed, totalOutstanding,
          totalPaid: Math.max(totalBorrowed - totalOutstanding, 0),
          activeLoans: activeLoans.length,
          completedLoans: apiLoans.filter((l: any) => l.status === 'completed').length,
        },
      });
    } catch (e) { console.error('Error loading customer details:', e); }
    finally { setDetailLoading(false); }
  };

  // Line change
  const openLinePicker = async () => {
    try {
      const params = new URLSearchParams();
      if (tenantId) params.append('tenantId', tenantId);
      const res = await fetch(`/api/lines?${params.toString()}`);
      const data = await res.json();
      setAvailableLines(data.data || data || []);
      setShowLinePicker(true);
    } catch (e) { console.error('Failed to load lines:', e); }
  };

  const handleChangeLine = async (lineId: string | null) => {
    if (!detailCustomer) return;
    setChangingLine(true);
    try {
      await fetch('/api/customers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: detailCustomer.id, lineId }),
      });
      setShowLinePicker(false);
      loadCustomerDetails(detailCustomer);
      loadCustomers();
    } catch (e: any) { alert(e.message || 'Failed to change line'); }
    finally { setChangingLine(false); }
  };

  // Loan overrides
  const handleCloseLoan = async () => {
    if (!detailCustomer?.currentLoan) return;
    if (!confirm(`Close this loan for "${detailCustomer.name}"? Outstanding will be set to ₹0.`)) return;
    setOverrideSaving(true);
    try {
      await fetch('/api/loans', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: detailCustomer.currentLoan.id, status: 'completed', outstanding: 0, endDate: new Date().toISOString() }),
      });
      alert('Loan closed successfully');
      loadCustomerDetails(detailCustomer);
      loadCustomers();
    } catch (e: any) { alert(e.message || 'Failed to close loan'); }
    finally { setOverrideSaving(false); setShowLoanOverride(false); setOverrideMode(null); }
  };

  const handleBulkPayment = async () => {
    if (!detailCustomer?.currentLoan) return;
    const amount = parseFloat(overrideAmount);
    if (isNaN(amount) || amount <= 0) { alert('Enter a valid amount'); return; }
    if (amount > detailCustomer.currentLoan.outstanding) { alert(`Amount cannot exceed outstanding ${formatCurrency(detailCustomer.currentLoan.outstanding)}`); return; }
    const newOutstanding = Math.max(detailCustomer.currentLoan.outstanding - amount, 0);
    const isFullyPaid = newOutstanding <= 0;
    if (!confirm(`Record bulk payment of ${formatCurrency(amount)}? ${isFullyPaid ? 'This will fully pay off the loan.' : `New outstanding: ${formatCurrency(newOutstanding)}`}`)) return;
    setOverrideSaving(true);
    try {
      const updateData: any = { id: detailCustomer.currentLoan.id, outstanding: newOutstanding };
      if (isFullyPaid) { updateData.status = 'completed'; updateData.endDate = new Date().toISOString(); }
      await fetch('/api/loans', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updateData) });
      alert(isFullyPaid ? 'Loan fully paid off' : `Bulk payment of ${formatCurrency(amount)} recorded`);
      loadCustomerDetails(detailCustomer);
      loadCustomers();
    } catch (e: any) { alert(e.message || 'Failed to record payment'); }
    finally { setOverrideSaving(false); setShowLoanOverride(false); setOverrideMode(null); setOverrideAmount(''); }
  };

  const handleEditBalance = async () => {
    if (!detailCustomer?.currentLoan) return;
    const newBalance = parseFloat(overrideAmount);
    if (isNaN(newBalance) || newBalance < 0) { alert('Enter a valid amount (0 or more)'); return; }
    const isFullyPaid = newBalance <= 0;
    if (!confirm(`Set remaining balance to ${formatCurrency(newBalance)}? ${isFullyPaid ? 'This will close the loan.' : ''}`)) return;
    setOverrideSaving(true);
    try {
      const updateData: any = { id: detailCustomer.currentLoan.id, outstanding: newBalance };
      if (isFullyPaid) { updateData.status = 'completed'; updateData.endDate = new Date().toISOString(); }
      await fetch('/api/loans', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updateData) });
      alert(isFullyPaid ? 'Loan closed' : `Balance updated to ${formatCurrency(newBalance)}`);
      loadCustomerDetails(detailCustomer);
      loadCustomers();
    } catch (e: any) { alert(e.message || 'Failed to update balance'); }
    finally { setOverrideSaving(false); setShowLoanOverride(false); setOverrideMode(null); setOverrideAmount(''); }
  };

  // CRUD
  const handleAddCustomer = () => {
    const tid = defaultTenantId || (customers.length > 0 ? customers[0].tenantId : '') || tenantId;
    if (!tid) { alert('Unable to determine tenant. Please refresh.'); return; }
    setFormData({ name: '', phone: '', email: '', address: '', aadhaar: '', pan: '', status: 'active', tenantId: tid });
    setShowAddModal(true);
  };

  const handleEditCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setFormData({ ...customer, email: customer.email || '', aadhaar: customer.aadhaar || '', pan: customer.pan || '' });
    setShowEditModal(true);
  };

  const handleSaveCustomer = async () => {
    try {
      if (!formData.name || !formData.phone || !formData.address) { alert('Please fill Name, Phone, Address'); return; }
      if (!formData.tenantId) { alert('Tenant ID missing'); return; }
      const cleanData = { ...formData, email: formData.email?.trim() || null, aadhaar: formData.aadhaar?.trim() || null, pan: formData.pan?.trim() || null, agentId: formData.agentId || null };
      if (showEditModal && selectedCustomer) {
        const res = await fetch('/api/customers', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: selectedCustomer.id, ...cleanData }) });
        if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Failed to update'); }
        setShowEditModal(false);
      } else {
        const res = await fetch('/api/customers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(cleanData) });
        if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Failed to create'); }
        setShowAddModal(false);
      }
      setFormData({}); setSelectedCustomer(null); loadCustomers();
    } catch (e: any) { alert(`Failed: ${e.message}`); }
  };

  const handleDeleteCustomer = async (id: string) => {
    if (!confirm('Delete this customer?')) return;
    try {
      const res = await fetch(`/api/customers?id=${id}`, { method: 'DELETE' });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Failed to delete'); }
      loadCustomers();
    } catch (e: any) { alert(e.message || 'Failed to delete customer'); }
  };

  const filteredCustomers = customers.filter(c => {
    const matchSearch = c.name?.toLowerCase().includes(searchQuery.toLowerCase()) || c.phone?.includes(searchQuery) || (c.email && c.email.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchStatus = filterStatus === 'all' || c.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const stats = {
    total: customers.length,
    active: customers.filter(c => c.status === 'active').length,
    risk: customers.filter(c => c.status === 'risk').length,
    defaultCount: customers.filter(c => c.status === 'default').length,
  };

  const statusConfig: Record<string, { color: string; bg: string; border: string; icon: any }> = {
    active: { color: 'text-success-700', bg: 'bg-success-50', border: 'border-l-success-500', icon: UserCheck },
    risk: { color: 'text-warning-700', bg: 'bg-warning-50', border: 'border-l-warning-500', icon: AlertTriangle },
    default: { color: 'text-danger-700', bg: 'bg-danger-50', border: 'border-l-danger-500', icon: UserX },
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return { bg: 'bg-success-50', color: 'text-success-600' };
      case 'completed': return { bg: 'bg-primary-50', color: 'text-primary-600' };
      case 'overdue': return { bg: 'bg-danger-50', color: 'text-danger-600' };
      default: return { bg: 'bg-neutral-100', color: 'text-neutral-500' };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4" />
          <p className="text-neutral-500">Loading customers...</p>
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
              <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">Customers</h1>
              <p className="text-sm text-neutral-500 mt-1">Manage your customer base and KYC</p>
            </div>
            <div className="flex items-center gap-3">
              <button className="btn-outline flex items-center gap-2 text-sm"><Download className="w-4 h-4" /> Export</button>
              <button className="btn-primary flex items-center gap-2" onClick={handleAddCustomer}><Plus className="w-4 h-4" /><span>Add Customer</span></button>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Customers', value: stats.total, icon: Users, iconBg: 'bg-primary-50', iconColor: 'text-primary-600', valueColor: 'text-neutral-900' },
              { label: 'Active', value: stats.active, icon: UserCheck, iconBg: 'bg-success-50', iconColor: 'text-success-600', valueColor: 'text-success-600' },
              { label: 'At Risk', value: stats.risk, icon: AlertTriangle, iconBg: 'bg-warning-50', iconColor: 'text-warning-600', valueColor: 'text-warning-600' },
              { label: 'Default', value: stats.defaultCount, icon: UserX, iconBg: 'bg-danger-50', iconColor: 'text-danger-600', valueColor: 'text-danger-600' },
            ].map((stat, i) => (
              <div key={stat.label} className="stat-card animate-slide-up" style={{ animationDelay: `${i * 0.05}s` }}>
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-2.5 ${stat.iconBg} rounded-xl`}><stat.icon className={`w-4 h-4 ${stat.iconColor}`} /></div>
                </div>
                <p className="text-sm text-neutral-500 mb-0.5">{stat.label}</p>
                <p className={`text-2xl font-bold ${stat.valueColor}`}>{stat.value}</p>
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
              <input type="text" placeholder="Search by name, phone, or email..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all" />
            </div>
            <div className="bg-neutral-100 rounded-xl p-1 flex gap-1">
              {['all', 'active', 'risk', 'default'].map(status => (
                <button key={status} onClick={() => setFilterStatus(status)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filterStatus === status ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'}`}>
                  {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Customers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCustomers.map((customer, index) => {
            const config = statusConfig[customer.status] || statusConfig.active;
            return (
              <div key={customer.id} className={`card-modern overflow-hidden border-l-4 ${config.border} hover:shadow-card-hover transition-all animate-slide-up`} style={{ animationDelay: `${index * 0.03}s` }}>
                <div className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-white font-bold text-base flex-shrink-0">
                        {customer.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-neutral-900 truncate">{customer.name}</h3>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold ${config.bg} ${config.color}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${customer.status === 'active' ? 'bg-success-500' : customer.status === 'risk' ? 'bg-warning-500' : 'bg-danger-500'}`} />
                          {customer.status.charAt(0).toUpperCase() + customer.status.slice(1)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2 mb-4 pb-4 border-b border-neutral-100">
                    <div className="flex items-center gap-2 text-sm text-neutral-600"><Phone className="w-3.5 h-3.5 text-neutral-400" /><span>{customer.phone}</span></div>
                    {customer.email && <div className="flex items-center gap-2 text-sm text-neutral-600"><Mail className="w-3.5 h-3.5 text-neutral-400" /><span className="truncate">{customer.email}</span></div>}
                    <div className="flex items-center gap-2 text-sm text-neutral-600"><MapPin className="w-3.5 h-3.5 text-neutral-400" /><span className="truncate">{customer.address}</span></div>
                  </div>
                  {(customer.agent || customer.Agent) && (
                    <div className="mb-4 p-2.5 bg-primary-50/50 rounded-lg border border-primary-100">
                      <p className="text-xs text-neutral-500 mb-0.5">Assigned Agent</p>
                      <p className="font-semibold text-sm text-neutral-900">{customer.agent?.name || customer.Agent?.name}</p>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <button onClick={() => loadCustomerDetails(customer)}
                      className="flex-1 py-2 px-3 bg-secondary-50 text-secondary-600 rounded-lg hover:bg-secondary-100 transition-all font-semibold text-sm flex items-center justify-center gap-1.5 active:scale-[0.98]">
                      <Eye className="w-3.5 h-3.5" /> View
                    </button>
                    <button onClick={() => handleEditCustomer(customer)}
                      className="flex-1 py-2 px-3 bg-primary-50 text-primary-600 rounded-lg hover:bg-primary-100 transition-all font-semibold text-sm flex items-center justify-center gap-1.5 active:scale-[0.98]">
                      <Edit className="w-3.5 h-3.5" /> Edit
                    </button>
                    <button onClick={() => handleDeleteCustomer(customer.id)}
                      className="py-2 px-3 bg-danger-50 text-danger-600 rounded-lg hover:bg-danger-100 transition-all active:scale-[0.98]">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredCustomers.length === 0 && (
          <div className="card-modern p-16 text-center animate-fade-in">
            <div className="w-16 h-16 bg-neutral-100 rounded-2xl flex items-center justify-center mx-auto mb-4"><Users className="w-8 h-8 text-neutral-400" /></div>
            <h3 className="text-lg font-bold text-neutral-900 mb-2">No Customers Found</h3>
            <p className="text-neutral-500">Try adjusting your search or add a new customer</p>
          </div>
        )}
      </div>

      {/* Customer Details Modal */}
      {showDetailModal && (
        <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-scale-in">
            {detailLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
              </div>
            ) : detailCustomer ? (
              <>
                {/* Profile Header */}
                <div className="bg-gradient-to-br from-violet-600 to-purple-700 p-6 rounded-t-2xl text-white relative">
                  <button onClick={() => setShowDetailModal(false)}
                    className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center hover:bg-white/30 transition-all">
                    <X className="w-5 h-5" />
                  </button>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center text-2xl font-bold">
                      {detailCustomer.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold">{detailCustomer.name}</h3>
                      <div className="flex items-center gap-3 text-white/80 text-sm mt-1">
                        <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {detailCustomer.phone}</span>
                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {detailCustomer.area || detailCustomer.address}</span>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-lg text-xs font-bold ${detailCustomer.stats?.activeLoans > 0 ? 'bg-success-500/90' : 'bg-white/20'}`}>
                      {detailCustomer.stats?.activeLoans > 0 ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-sm">
                    <div><span className="text-white/60">Line:</span> {detailCustomer.line}</div>
                    <div><span className="text-white/60">Agent:</span> {detailCustomer.agent}</div>
                    <div><span className="text-white/60">Joined:</span> {detailCustomer.joinedDate}</div>
                  </div>
                  {/* Change Line Button */}
                  <button onClick={openLinePicker}
                    className="mt-3 px-4 py-2 bg-white/20 rounded-lg text-sm font-medium hover:bg-white/30 transition-all flex items-center gap-2">
                    <GitBranch className="w-4 h-4" /> {detailCustomer.lineId ? 'Change Line' : 'Assign to Line'}
                  </button>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-4 gap-3 p-6 pb-0">
                  {[
                    { label: 'Total Borrowed', value: formatCurrency(detailCustomer.stats?.totalBorrowed || 0), color: 'text-neutral-900' },
                    { label: 'Total Paid', value: formatCurrency(detailCustomer.stats?.totalPaid || 0), color: 'text-success-600' },
                    { label: 'Outstanding', value: formatCurrency(detailCustomer.stats?.totalOutstanding || 0), color: 'text-warning-600' },
                    { label: 'Completed', value: detailCustomer.stats?.completedLoans || 0, color: 'text-primary-600' },
                  ].map(s => (
                    <div key={s.label} className="text-center p-3 bg-neutral-50 rounded-xl">
                      <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
                      <p className="text-xs text-neutral-500">{s.label}</p>
                    </div>
                  ))}
                </div>

                {/* Current Loan Card */}
                {detailCustomer.currentLoan && (
                  <div className="mx-6 mt-4 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl p-5 text-white">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-xs font-bold tracking-wider opacity-80">CURRENT LOAN</p>
                        <p className="text-2xl font-bold">{formatCurrency(detailCustomer.currentLoan.amount)}</p>
                      </div>
                      <span className="px-3 py-1 bg-white/20 rounded-lg text-xs font-bold uppercase">{detailCustomer.currentLoan.type}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="text-center p-2 bg-white/10 rounded-lg">
                        <p className="text-xs opacity-80">Paid</p>
                        <p className="font-bold">{formatCurrency(detailCustomer.currentLoan.paid)}</p>
                      </div>
                      <div className="text-center p-2 bg-white/10 rounded-lg">
                        <p className="text-xs opacity-80">Outstanding</p>
                        <p className="font-bold">{formatCurrency(detailCustomer.currentLoan.outstanding)}</p>
                      </div>
                      <div className="text-center p-2 bg-white/10 rounded-lg">
                        <p className="text-xs opacity-80">EMI</p>
                        <p className="font-bold">{formatCurrency(detailCustomer.currentLoan.emi)}</p>
                      </div>
                    </div>
                    {/* Progress bar */}
                    <div className="mt-3">
                      <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                        <div className="h-full bg-white/80 rounded-full transition-all"
                          style={{ width: `${detailCustomer.currentLoan.amount > 0 ? ((detailCustomer.currentLoan.paid / detailCustomer.currentLoan.amount) * 100) : 0}%` }} />
                      </div>
                      <p className="text-xs text-white/70 mt-1 text-right">
                        {detailCustomer.currentLoan.amount > 0 ? ((detailCustomer.currentLoan.paid / detailCustomer.currentLoan.amount) * 100).toFixed(0) : 0}% paid
                      </p>
                    </div>

                    {/* Admin Loan Management */}
                    {isAdmin && (
                      <div className="mt-4 pt-3 border-t border-white/20">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-xs font-bold bg-warning-500/80 px-2 py-0.5 rounded">ADMIN</span>
                          <span className="text-xs font-medium opacity-80">Loan Management</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <button onClick={() => { setOverrideMode('bulk_payment'); setOverrideAmount(''); setShowLoanOverride(true); }}
                            className="p-2 bg-white/15 rounded-lg text-center hover:bg-white/25 transition-all">
                            <DollarSign className="w-4 h-4 mx-auto mb-1" />
                            <p className="text-[10px] font-medium">Bulk Payment</p>
                          </button>
                          <button onClick={() => { setOverrideMode('edit_balance'); setOverrideAmount(String(detailCustomer.currentLoan.outstanding)); setShowLoanOverride(true); }}
                            className="p-2 bg-white/15 rounded-lg text-center hover:bg-white/25 transition-all">
                            <Edit className="w-4 h-4 mx-auto mb-1" />
                            <p className="text-[10px] font-medium">Edit Balance</p>
                          </button>
                          <button onClick={handleCloseLoan}
                            className="p-2 bg-white/15 rounded-lg text-center hover:bg-white/25 transition-all">
                            <X className="w-4 h-4 mx-auto mb-1" />
                            <p className="text-[10px] font-medium">Close Loan</p>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Tabs */}
                <div className="px-6 pt-4">
                  <div className="bg-neutral-100 rounded-xl p-1 flex gap-1">
                    {(['overview', 'loans', 'payments'] as const).map(tab => (
                      <button key={tab} onClick={() => setDetailTab(tab)}
                        className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${detailTab === tab ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'}`}>
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-6">
                  {detailTab === 'overview' && (
                    <div className="space-y-3">
                      {[
                        { label: 'Total Loans Taken', value: detailCustomer.loanHistory?.length || 0 },
                        { label: 'Completed Loans', value: detailCustomer.stats?.completedLoans || 0, color: 'text-success-600' },
                        { label: 'Active Loans', value: detailCustomer.stats?.activeLoans || 0, color: 'text-primary-600' },
                        { label: 'Email', value: detailCustomer.email || '-' },
                        { label: 'Address', value: detailCustomer.address || '-' },
                        { label: 'Aadhaar', value: detailCustomer.aadhaar || '-' },
                        { label: 'PAN', value: detailCustomer.pan || '-' },
                      ].map(row => (
                        <div key={row.label} className="flex items-center justify-between py-2 border-b border-neutral-100 last:border-0">
                          <span className="text-sm text-neutral-500">{row.label}</span>
                          <span className={`text-sm font-medium ${row.color || 'text-neutral-900'}`}>{row.value}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {detailTab === 'loans' && (
                    <div className="space-y-3">
                      {(!detailCustomer.loanHistory || detailCustomer.loanHistory.length === 0) ? (
                        <p className="text-center text-neutral-500 py-6">No loan history</p>
                      ) : detailCustomer.loanHistory.map((loan: any) => {
                        const sc = getStatusColor(loan.status);
                        return (
                          <div key={loan.id} className="p-4 border border-neutral-200 rounded-xl">
                            <div className="flex items-center justify-between mb-3">
                              <div>
                                <p className="font-bold text-neutral-900">{formatCurrency(loan.amount)}</p>
                                <p className="text-xs text-neutral-500">
                                  {loan.startDate ? new Date(loan.startDate).toLocaleDateString('en-IN') : ''} - {loan.endDate ? new Date(loan.endDate).toLocaleDateString('en-IN') : 'Present'}
                                </p>
                              </div>
                              <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${sc.bg} ${sc.color}`}>
                                {loan.status}
                              </span>
                            </div>
                            <div className="grid grid-cols-4 gap-2">
                              {[
                                { label: 'Type', value: loan.type },
                                { label: 'EMI', value: formatCurrency(loan.emi) },
                                { label: 'Paid', value: formatCurrency(loan.paid), color: 'text-success-600' },
                                { label: 'Outstanding', value: formatCurrency(loan.outstanding), color: loan.outstanding > 0 ? 'text-warning-600' : 'text-neutral-500' },
                              ].map(s => (
                                <div key={s.label} className="text-center">
                                  <p className="text-[10px] text-neutral-500 uppercase">{s.label}</p>
                                  <p className={`text-sm font-semibold ${s.color || 'text-neutral-900'}`}>{s.value}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {detailTab === 'payments' && (
                    <div className="text-center py-10">
                      <FileText className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
                      <p className="text-neutral-500">Payment history is available in the Collections page</p>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="p-16 text-center">
                <p className="text-neutral-500">Customer not found</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Line Picker Modal */}
      {showLinePicker && (
        <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[70vh] overflow-y-auto shadow-2xl animate-scale-in">
            <div className="p-5 border-b border-neutral-100 sticky top-0 bg-white rounded-t-2xl flex items-center justify-between">
              <h3 className="text-lg font-bold text-neutral-900">{detailCustomer?.lineId ? 'Change Line' : 'Assign Line'}</h3>
              <button onClick={() => setShowLinePicker(false)} className="w-8 h-8 rounded-lg hover:bg-neutral-100 flex items-center justify-center text-neutral-400"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-4 space-y-2">
              {detailCustomer?.lineId && (
                <button onClick={() => handleChangeLine(null)} disabled={changingLine}
                  className="w-full flex items-center gap-3 p-3 rounded-xl border-2 border-danger-200 bg-danger-50 hover:bg-danger-100 transition-all text-left">
                  <X className="w-5 h-5 text-danger-500" />
                  <span className="text-sm font-medium text-danger-600">Remove from current line</span>
                </button>
              )}
              {availableLines.length === 0 ? (
                <p className="text-center text-neutral-500 py-6">No lines available</p>
              ) : availableLines.map((line: any) => {
                const isCurrent = line.id === detailCustomer?.lineId;
                return (
                  <button key={line.id} onClick={() => !isCurrent && handleChangeLine(line.id)} disabled={changingLine}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${isCurrent ? 'border-primary-500 bg-primary-50' : 'border-neutral-200 hover:border-primary-300'}`}>
                    <GitBranch className={`w-5 h-5 ${isCurrent ? 'text-primary-600' : 'text-neutral-400'}`} />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-neutral-900">{line.name}</p>
                      <p className="text-xs text-neutral-500">{line.area} • {line.type || 'daily'} • {line.customersCount || 0} customers</p>
                    </div>
                    {isCurrent && <span className="text-xs font-bold text-primary-600 bg-primary-100 px-2 py-0.5 rounded">CURRENT</span>}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Loan Override Modal */}
      {showLoanOverride && (
        <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl animate-scale-in">
            <div className="p-5 border-b border-neutral-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-neutral-900">
                {overrideMode === 'bulk_payment' ? 'Record Bulk Payment' : 'Edit Remaining Balance'}
              </h3>
              <button onClick={() => { setShowLoanOverride(false); setOverrideMode(null); }}
                className="w-8 h-8 rounded-lg hover:bg-neutral-100 flex items-center justify-center text-neutral-400"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5">
              <p className="text-sm text-neutral-500 mb-4">
                {overrideMode === 'bulk_payment'
                  ? `Current outstanding: ${formatCurrency(detailCustomer?.currentLoan?.outstanding || 0)}`
                  : 'Set the new remaining balance for this loan'}
              </p>
              <div className="mb-4">
                <label className="block text-sm font-semibold text-neutral-700 mb-1.5">Amount (₹)</label>
                <input type="number" value={overrideAmount} onChange={e => setOverrideAmount(e.target.value)}
                  className="w-full px-4 py-3 border border-neutral-200 rounded-xl text-lg font-bold focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                  placeholder="0" />
              </div>
              <button onClick={overrideMode === 'bulk_payment' ? handleBulkPayment : handleEditBalance}
                disabled={overrideSaving}
                className="w-full btn-primary py-3">
                {overrideSaving ? 'Processing...' : overrideMode === 'bulk_payment' ? 'Record Payment' : 'Update Balance'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-scale-in">
            <div className="p-6 border-b border-neutral-100 sticky top-0 bg-white rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-neutral-900 tracking-tight">{showEditModal ? 'Edit Customer' : 'Add New Customer'}</h3>
                  <p className="text-sm text-neutral-500 mt-0.5">{showEditModal ? 'Update customer information' : 'Enter customer details below'}</p>
                </div>
                <button onClick={() => { setShowAddModal(false); setShowEditModal(false); setFormData({}); }}
                  className="w-8 h-8 rounded-lg hover:bg-neutral-100 flex items-center justify-center text-neutral-400 hover:text-neutral-600 transition-colors"><X className="w-5 h-5" /></button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-1.5">Full Name <span className="text-danger-500">*</span></label>
                  <input type="text" value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2.5 border border-neutral-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all placeholder-neutral-400" placeholder="Enter name" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-1.5">Phone <span className="text-danger-500">*</span></label>
                  <input type="tel" value={formData.phone || ''} onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-2.5 border border-neutral-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all placeholder-neutral-400" placeholder="+91 98765 43210" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-1.5">Email</label>
                  <input type="email" value={formData.email || ''} onChange={e => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2.5 border border-neutral-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all placeholder-neutral-400" placeholder="customer@email.com" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-1.5">Status</label>
                  <select value={formData.status || 'active'} onChange={e => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-4 py-2.5 border border-neutral-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all appearance-none cursor-pointer">
                    <option value="active">Active</option><option value="risk">Risk</option><option value="default">Default</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-neutral-700 mb-1.5">Address <span className="text-danger-500">*</span></label>
                  <input type="text" value={formData.address || ''} onChange={e => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-4 py-2.5 border border-neutral-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all placeholder-neutral-400" placeholder="Full address with area" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-1.5">Aadhaar</label>
                  <input type="text" value={formData.aadhaar || ''} onChange={e => setFormData({ ...formData, aadhaar: e.target.value })}
                    className="w-full px-4 py-2.5 border border-neutral-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all placeholder-neutral-400" placeholder="1234-5678-9012" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-1.5">PAN</label>
                  <input type="text" value={formData.pan || ''} onChange={e => setFormData({ ...formData, pan: e.target.value })}
                    className="w-full px-4 py-2.5 border border-neutral-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all placeholder-neutral-400" placeholder="ABCDE1234F" />
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-neutral-100 flex gap-3 bg-neutral-50/50 rounded-b-2xl">
              <button onClick={() => { setShowAddModal(false); setShowEditModal(false); setFormData({}); }} className="flex-1 btn-ghost py-3">Cancel</button>
              <button onClick={handleSaveCustomer} className="flex-1 btn-primary py-3">{showEditModal ? 'Update Customer' : 'Add Customer'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
