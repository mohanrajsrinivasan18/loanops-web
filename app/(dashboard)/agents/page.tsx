'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthProvider';
import { useTenant } from '@/lib/contexts/TenantContext';
import {
  Users, Phone, Mail, MapPin, Edit, Trash2, Plus, X, Save,
  Activity, Search, Wallet, Eye, GitBranch, RefreshCw, UserPlus,
} from 'lucide-react';

interface Agent {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  area: string | null;
  targetCollection: number;
  status: string;
  createdAt: string;
  tenantId: string;
  customers?: any[];
  collections?: any[];
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount || 0);

export default function AgentsPage() {
  const { user } = useAuth();
  const { selectedTenant } = useTenant();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [formData, setFormData] = useState<Partial<Agent>>({});
  const [defaultTenantId, setDefaultTenantId] = useState<string>('');
  // Agent details state
  const [detailTab, setDetailTab] = useState<'overview' | 'lines'>('overview');
  const [agentCustomers, setAgentCustomers] = useState<any[]>([]);
  const [agentLines, setAgentLines] = useState<any[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  // Assign customers state
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [allCustomers, setAllCustomers] = useState<any[]>([]);
  const [selectedCustomerIds, setSelectedCustomerIds] = useState<Set<string>>(new Set());
  const [assignAgent, setAssignAgent] = useState<Agent | null>(null);
  const [assigning, setAssigning] = useState(false);

  const tenantId = selectedTenant?.id || user?.tenantId;

  useEffect(() => {
    loadDefaultTenant();
    loadAgents();
  }, [user, tenantId]);

  const loadDefaultTenant = async () => {
    try {
      const response = await fetch('/api/tenants/default');
      if (response.ok) {
        const tenant = await response.json();
        setDefaultTenantId(tenant.id);
      }
    } catch (error) { console.error('Error loading default tenant:', error); }
  };

  const loadAgents = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (tenantId) params.append('tenantId', tenantId);
      const response = await fetch(`/api/agents?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch agents');
      const result = await response.json();
      setAgents(result.data || result);
    } catch (error) { console.error('Error loading agents:', error); }
    finally { setLoading(false); }
  };

  const loadAgentDetails = async (agent: Agent) => {
    setSelectedAgent(agent);
    setDetailTab('overview');
    setShowDetailModal(true);
    setDetailLoading(true);
    try {
      const params = new URLSearchParams();
      if (tenantId) params.append('tenantId', tenantId);
      params.append('agentId', agent.id);

      const [custRes, linesRes] = await Promise.all([
        fetch(`/api/customers?${params.toString()}&limit=200`),
        fetch(`/api/agents/lines?agentId=${agent.id}&tenantId=${tenantId || ''}`),
      ]);
      const custData = await custRes.json();
      const linesData = await linesRes.json();
      setAgentCustomers(custData.data || custData || []);
      setAgentLines(linesData.data || linesData || []);
    } catch (e) { console.error('Error loading agent details:', e); }
    finally { setDetailLoading(false); }
  };

  const handleUnassignLine = async (lineId: string) => {
    if (!confirm('Unassign this line from the agent?')) return;
    try {
      await fetch('/api/lines/assign-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lineId, agentId: null }),
      });
      if (selectedAgent) loadAgentDetails(selectedAgent);
    } catch (e) { alert('Failed to unassign line'); }
  };

  const handleDeleteAgent = async (id: string) => {
    const agent = agents.find(a => a.id === id);
    if (!confirm(`Are you sure you want to delete "${agent?.name}"?`)) return;
    try {
      const response = await fetch(`/api/agents?id=${id}`, { method: 'DELETE' });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete agent');
      }
      loadAgents();
    } catch (error: any) {
      alert(error.message || 'Failed to delete agent');
    }
  };

  // Assign customers flow
  const openAssignCustomers = async (agent: Agent) => {
    setAssignAgent(agent);
    setSelectedCustomerIds(new Set());
    setShowAssignModal(true);
    try {
      const params = new URLSearchParams();
      if (tenantId) params.append('tenantId', tenantId);
      params.append('limit', '500');
      const res = await fetch(`/api/customers?${params.toString()}`);
      const data = await res.json();
      setAllCustomers(data.data || data || []);
    } catch (e) { console.error('Error loading customers:', e); }
  };

  const handleAssignCustomers = async () => {
    if (!assignAgent || selectedCustomerIds.size === 0) return;
    setAssigning(true);
    try {
      const promises = Array.from(selectedCustomerIds).map(custId =>
        fetch('/api/customers', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: custId, agentId: assignAgent.id }),
        })
      );
      await Promise.all(promises);
      alert(`Assigned ${selectedCustomerIds.size} customers to ${assignAgent.name}`);
      setShowAssignModal(false);
      setSelectedCustomerIds(new Set());
      loadAgents();
    } catch (e: any) { alert(e.message || 'Failed to assign customers'); }
    finally { setAssigning(false); }
  };

  const toggleCustomer = (id: string) => {
    const next = new Set(selectedCustomerIds);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelectedCustomerIds(next);
  };

  const unassignedCustomers = allCustomers.filter(c => !c.agentId);

  const filteredAgents = agents.filter(
    (agent) =>
      agent.name.toLowerCase().includes(search.toLowerCase()) ||
      (agent.email && agent.email.toLowerCase().includes(search.toLowerCase())) ||
      agent.phone.includes(search) ||
      (agent.area && agent.area.toLowerCase().includes(search.toLowerCase()))
  );

  const agentsWithStats = filteredAgents.map(agent => {
    const activeCustomers = agent.customers?.length || 0;
    const collectedThisMonth = agent.collections?.reduce((sum, c) => sum + (c.collectedAmount || 0), 0) || 0;
    const efficiency = agent.targetCollection > 0 ? Math.round((collectedThisMonth / agent.targetCollection) * 100) : 0;
    return { ...agent, activeCustomers, collectedThisMonth, efficiency, monthlyTarget: agent.targetCollection };
  });

  const handleAddAgent = () => {
    const tid = defaultTenantId || (agents.length > 0 ? agents[0].tenantId : '') || tenantId;
    setFormData({ name: '', email: '', phone: '', area: '', targetCollection: 400000, status: 'active', tenantId: tid });
    setShowAddModal(true);
  };

  const handleEditAgent = (agent: Agent) => {
    setSelectedAgent(agent);
    setFormData(agent);
    setShowEditModal(true);
  };

  const handleSaveAgent = async () => {
    try {
      if (!formData.name || !formData.phone) { alert('Please fill in Name and Phone'); return; }
      if (!formData.tenantId) { alert('Tenant ID is missing'); return; }
      const cleanData = { ...formData, email: formData.email?.trim() || null, area: formData.area?.trim() || null, targetCollection: formData.targetCollection || 0 };

      if (showEditModal && selectedAgent) {
        const response = await fetch('/api/agents', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: selectedAgent.id, ...cleanData }) });
        const data = await response.json();
        if (!response.ok) throw new Error(data.details || data.error || 'Failed to update agent');
        setShowEditModal(false);
      } else {
        const response = await fetch('/api/agents', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(cleanData) });
        const data = await response.json();
        if (!response.ok) throw new Error(data.details || data.error || 'Failed to create agent');
        setShowAddModal(false);
      }
      setFormData({});
      setSelectedAgent(null);
      loadAgents();
    } catch (error: any) { alert(`Failed to save agent: ${error.message}`); }
  };

  const stats = {
    total: agentsWithStats.length,
    active: agentsWithStats.filter(a => a.status === 'active').length,
    totalCustomers: agentsWithStats.reduce((sum, a) => sum + a.activeCustomers, 0),
    totalCollected: agentsWithStats.reduce((sum, a) => sum + a.collectedThisMonth, 0),
  };

  // Agent detail stats
  const detailStats = {
    totalCustomers: agentCustomers.length,
    activeCustomers: agentCustomers.filter(c => c.status === 'active').length,
    linesCount: agentLines.length,
    totalOutstanding: agentCustomers.reduce((sum, c) => {
      const loans = c?.Loan || c?.loans || [];
      return sum + loans.reduce((s: number, l: any) => s + (Number(l.outstanding) || 0), 0);
    }, 0),
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4" />
          <p className="text-neutral-500">Loading agents...</p>
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
              <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">Agents</h1>
              <p className="text-sm text-neutral-500 mt-1">Manage field agents and track performance</p>
            </div>
            <button onClick={handleAddAgent} className="btn-primary flex items-center gap-2">
              <Plus size={16} /> <span>Add Agent</span>
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Agents', value: stats.total, icon: Users, iconBg: 'bg-primary-50', iconColor: 'text-primary-600' },
              { label: 'Active', value: stats.active, icon: Activity, iconBg: 'bg-success-50', iconColor: 'text-success-600' },
              { label: 'Total Customers', value: stats.totalCustomers, icon: Users, iconBg: 'bg-secondary-50', iconColor: 'text-secondary-600' },
              { label: 'Collected', value: formatCurrency(stats.totalCollected), icon: Wallet, iconBg: 'bg-warning-50', iconColor: 'text-warning-600' },
            ].map((stat, i) => (
              <div key={stat.label} className="stat-card animate-slide-up" style={{ animationDelay: `${i * 0.05}s` }}>
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-2.5 ${stat.iconBg} rounded-xl`}><stat.icon className={`w-4 h-4 ${stat.iconColor}`} /></div>
                </div>
                <p className="text-sm text-neutral-500 mb-0.5">{stat.label}</p>
                <p className="text-2xl font-bold text-neutral-900">{stat.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="p-8">
        <div className="card-modern p-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input type="text" placeholder="Search agents by name, email, phone, or area..." value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all" />
          </div>
        </div>

        {/* Agents Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {agentsWithStats.map((agent, index) => (
            <div key={agent.id} className="card-modern overflow-hidden hover:shadow-card-hover transition-all animate-slide-up" style={{ animationDelay: `${index * 0.03}s` }}>
              <div className="bg-gradient-to-br from-primary-500 to-secondary-600 p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-12 h-12 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center text-white font-bold text-lg border border-white/20 flex-shrink-0">
                      {agent.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-white text-base mb-0.5 truncate">{agent.name}</h3>
                      <div className="flex items-center gap-1.5 text-white/80 text-sm">
                        <MapPin className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{agent.area || 'No area'}</span>
                      </div>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-bold flex-shrink-0 ml-2 ${agent.status === 'active' ? 'bg-success-500/90 text-white' : 'bg-white/20 text-white'}`}>
                    {agent.status.toUpperCase()}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: agent.activeCustomers, label: 'Customers' },
                    { value: `${agent.efficiency}%`, label: 'Efficiency' },
                    { value: `₹${(agent.collectedThisMonth / 1000).toFixed(0)}K`, label: 'Collected' },
                  ].map(item => (
                    <div key={item.label} className="bg-white/10 backdrop-blur-sm rounded-lg p-2.5 text-center">
                      <div className="text-lg font-bold text-white mb-0.5">{item.value}</div>
                      <div className="text-xs text-white/70 leading-tight">{item.label}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-5">
                <div className="space-y-2 mb-4 pb-4 border-b border-neutral-100">
                  <div className="flex items-center gap-2 text-sm text-neutral-600">
                    <Mail className="w-3.5 h-3.5 text-neutral-400" />
                    <span className="truncate">{agent.email || 'No email'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-neutral-600">
                    <Phone className="w-3.5 h-3.5 text-neutral-400" /> {agent.phone}
                  </div>
                </div>
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-neutral-700">Monthly Target</span>
                    <span className="text-sm font-bold text-primary-600">
                      {agent.monthlyTarget > 0 ? `${((agent.collectedThisMonth / agent.monthlyTarget) * 100).toFixed(0)}%` : '0%'}
                    </span>
                  </div>
                  <div className="w-full bg-neutral-100 rounded-full h-1.5">
                    <div className="bg-gradient-to-r from-primary-500 to-secondary-500 h-1.5 rounded-full transition-all"
                      style={{ width: `${Math.min(agent.monthlyTarget > 0 ? (agent.collectedThisMonth / agent.monthlyTarget) * 100 : 0, 100)}%` }} />
                  </div>
                  <div className="flex justify-between mt-1.5 text-xs text-neutral-500">
                    <span>{formatCurrency(agent.collectedThisMonth)}</span>
                    <span>{formatCurrency(agent.monthlyTarget)}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => loadAgentDetails(agent)}
                    className="flex-1 py-2 px-3 bg-secondary-50 text-secondary-600 rounded-lg hover:bg-secondary-100 transition-all font-semibold text-sm flex items-center justify-center gap-1.5 active:scale-[0.98]">
                    <Eye className="w-3.5 h-3.5" /> View
                  </button>
                  <button onClick={() => handleEditAgent(agent)}
                    className="flex-1 py-2 px-3 bg-primary-50 text-primary-600 rounded-lg hover:bg-primary-100 transition-all font-semibold text-sm flex items-center justify-center gap-1.5 active:scale-[0.98]">
                    <Edit className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button onClick={() => openAssignCustomers(agent)}
                    className="py-2 px-3 bg-success-50 text-success-600 rounded-lg hover:bg-success-100 transition-all active:scale-[0.98]" title="Assign Customers">
                    <UserPlus className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleDeleteAgent(agent.id)}
                    className="py-2 px-3 bg-danger-50 text-danger-600 rounded-lg hover:bg-danger-100 transition-all active:scale-[0.98]">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {agentsWithStats.length === 0 && (
          <div className="card-modern p-16 text-center animate-fade-in">
            <div className="w-16 h-16 bg-neutral-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-neutral-400" />
            </div>
            <h3 className="text-lg font-bold text-neutral-900 mb-2">No Agents Found</h3>
            <p className="text-neutral-500">Try adjusting your search or add a new agent</p>
          </div>
        )}
      </div>

      {/* Agent Details Modal */}
      {showDetailModal && selectedAgent && (
        <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-scale-in">
            {/* Profile Header */}
            <div className="bg-gradient-to-br from-primary-600 to-secondary-700 p-6 rounded-t-2xl text-white relative">
              <button onClick={() => setShowDetailModal(false)}
                className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center hover:bg-white/30 transition-all">
                <X className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center text-2xl font-bold">
                  {selectedAgent.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-xl font-bold">{selectedAgent.name}</h3>
                  <p className="text-white/80">{selectedAgent.area || 'No area assigned'}</p>
                </div>
              </div>
              <div className="flex gap-2">
                {selectedAgent.phone && (
                  <a href={`tel:${selectedAgent.phone}`} className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-all">
                    <Phone className="w-4 h-4" />
                  </a>
                )}
                {selectedAgent.email && (
                  <a href={`mailto:${selectedAgent.email}`} className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-all">
                    <Mail className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-4 gap-3 p-6 pb-0">
              {[
                { value: detailStats.totalCustomers, label: 'Customers' },
                { value: detailStats.linesCount, label: 'Lines' },
                { value: detailStats.activeCustomers, label: 'Active' },
                { value: formatCurrency(detailStats.totalOutstanding), label: 'Outstanding' },
              ].map(s => (
                <div key={s.label} className="text-center p-3 bg-neutral-50 rounded-xl">
                  <p className="text-lg font-bold text-neutral-900">{s.value}</p>
                  <p className="text-xs text-neutral-500">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Tabs */}
            <div className="px-6 pt-4">
              <div className="bg-neutral-100 rounded-xl p-1 flex gap-1">
                {(['overview', 'lines'] as const).map(tab => (
                  <button key={tab} onClick={() => setDetailTab(tab)}
                    className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${detailTab === tab ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'}`}>
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-6">
              {detailLoading ? (
                <div className="flex items-center justify-center py-10">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
                </div>
              ) : detailTab === 'overview' ? (
                <div className="space-y-3">
                  {[
                    { label: 'Phone', value: selectedAgent.phone || '-' },
                    { label: 'Email', value: selectedAgent.email || '-' },
                    { label: 'Status', value: selectedAgent.status || '-' },
                    { label: 'Area', value: selectedAgent.area || '-' },
                    { label: 'Monthly Target', value: formatCurrency(selectedAgent.targetCollection || 0) },
                  ].map(row => (
                    <div key={row.label} className="flex items-center justify-between py-2 border-b border-neutral-100 last:border-0">
                      <span className="text-sm text-neutral-500">{row.label}</span>
                      <span className="text-sm font-medium text-neutral-900">{row.value}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {agentLines.length === 0 ? (
                    <p className="text-center text-neutral-500 py-6">No lines assigned</p>
                  ) : agentLines.map((line: any) => (
                    <div key={line.id} className="flex items-center justify-between p-4 border border-neutral-200 rounded-xl hover:border-primary-300 transition-all">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary-50 rounded-lg">
                          <GitBranch className="w-4 h-4 text-primary-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-sm text-neutral-900">{line.name || line.area}</p>
                          <p className="text-xs text-neutral-500">{line.area} • {line.type || 'line'} • {line.customersCount || line.Customer?.length || 0} customers</p>
                        </div>
                      </div>
                      <button onClick={() => handleUnassignLine(line.id)}
                        className="px-3 py-1.5 bg-danger-50 text-danger-600 rounded-lg text-xs font-semibold hover:bg-danger-100 transition-all">
                        Unassign
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Assign Customers Modal */}
      {showAssignModal && assignAgent && (
        <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-scale-in">
            <div className="p-6 border-b border-neutral-100 sticky top-0 bg-white rounded-t-2xl z-10">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-neutral-900">Assign Customers</h3>
                  <p className="text-sm text-neutral-500 mt-0.5">
                    Assign unassigned customers to {assignAgent.name}
                  </p>
                </div>
                <button onClick={() => setShowAssignModal(false)}
                  className="w-8 h-8 rounded-lg hover:bg-neutral-100 flex items-center justify-center text-neutral-400 hover:text-neutral-600 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-6">
              {unassignedCustomers.length === 0 ? (
                <div className="text-center py-10">
                  <Users className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
                  <p className="text-neutral-500">All customers are already assigned</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-neutral-700 mb-3">
                    {selectedCustomerIds.size} of {unassignedCustomers.length} selected
                  </p>
                  {unassignedCustomers.map(c => (
                    <button key={c.id} onClick={() => toggleCustomer(c.id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                        selectedCustomerIds.has(c.id) ? 'border-success-500 bg-success-50' : 'border-neutral-200 hover:border-neutral-300'
                      }`}>
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                        selectedCustomerIds.has(c.id) ? 'border-success-500 bg-success-500' : 'border-neutral-300'
                      }`}>
                        {selectedCustomerIds.has(c.id) && (
                          <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-neutral-900">{c.name}</p>
                        <p className="text-xs text-neutral-500">{c.phone} {c.address ? `• ${c.address}` : ''}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {selectedCustomerIds.size > 0 && (
              <div className="p-6 border-t border-neutral-100 bg-neutral-50/50 rounded-b-2xl">
                <button onClick={handleAssignCustomers} disabled={assigning}
                  className="w-full btn-primary py-3 flex items-center justify-center gap-2">
                  <UserPlus className="w-4 h-4" />
                  {assigning ? 'Assigning...' : `Assign ${selectedCustomerIds.size} Customer${selectedCustomerIds.size > 1 ? 's' : ''} to ${assignAgent.name}`}
                </button>
              </div>
            )}
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
                  <h3 className="text-xl font-bold text-neutral-900 tracking-tight">
                    {showEditModal ? 'Edit Agent' : 'Add New Agent'}
                  </h3>
                  <p className="text-sm text-neutral-500 mt-0.5">
                    {showEditModal ? 'Update agent information' : 'Enter agent details below'}
                  </p>
                </div>
                <button onClick={() => { setShowAddModal(false); setShowEditModal(false); setFormData({}); }}
                  className="w-8 h-8 rounded-lg hover:bg-neutral-100 flex items-center justify-center text-neutral-400 hover:text-neutral-600 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <h4 className="text-sm font-bold text-neutral-900 uppercase tracking-wider mb-3">Personal Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 mb-1.5">Full Name <span className="text-danger-500">*</span></label>
                    <input type="text" value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-2.5 border border-neutral-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all placeholder-neutral-400" placeholder="Enter name" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 mb-1.5">Email</label>
                    <input type="email" value={formData.email || ''} onChange={e => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-2.5 border border-neutral-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all placeholder-neutral-400" placeholder="agent@email.com" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 mb-1.5">Phone <span className="text-danger-500">*</span></label>
                    <input type="tel" value={formData.phone || ''} onChange={e => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-2.5 border border-neutral-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all placeholder-neutral-400" placeholder="+91 98765 43210" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 mb-1.5">Area</label>
                    <input type="text" value={formData.area || ''} onChange={e => setFormData({ ...formData, area: e.target.value })}
                      className="w-full px-4 py-2.5 border border-neutral-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all placeholder-neutral-400" placeholder="e.g., MG Road, Zone A" />
                  </div>
                </div>
              </div>
              <div>
                <h4 className="text-sm font-bold text-neutral-900 uppercase tracking-wider mb-3">Performance Target</h4>
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-1.5">Monthly Target (₹)</label>
                  <input type="number" value={formData.targetCollection || ''} onChange={e => setFormData({ ...formData, targetCollection: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 border border-neutral-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all placeholder-neutral-400" placeholder="400000" />
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-neutral-100 flex gap-3 bg-neutral-50/50 rounded-b-2xl">
              <button onClick={() => { setShowAddModal(false); setShowEditModal(false); setFormData({}); }} className="flex-1 btn-ghost py-3">Cancel</button>
              <button onClick={handleSaveAgent} className="flex-1 btn-primary py-3 flex items-center justify-center gap-2">
                <Save className="w-4 h-4" /> {showEditModal ? 'Update Agent' : 'Add Agent'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
