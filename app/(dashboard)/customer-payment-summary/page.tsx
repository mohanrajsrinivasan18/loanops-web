'use client';
import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/lib/AuthProvider';
import { useTenant } from '@/lib/contexts/TenantContext';
import {
  Search, Download, Loader2, Users, CheckCircle2, 
  AlertCircle, PieChart, X, Filter
} from 'lucide-react';

const fmt = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0);

const fmtDate = (d: Date) =>
  d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string;
  totalDue: number;
  totalPaid: number;
  lineId?: string;
  Line?: { id: string; name: string };
  agentId?: string;
  Agent?: { id: string; name: string };
}

export default function CustomerPaymentSummaryPage() {
  const { user } = useAuth();
  const { selectedTenant } = useTenant();
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [lines, setLines] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [selectedCustomers, setSelectedCustomers] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  
  const [filters, setFilters] = useState({
    status: 'all',
    lineId: 'all',
    agentId: 'all',
  });

  const tenantId = selectedTenant?.id || user?.tenantId;
  const tenantName = (user as any)?.tenant?.name || selectedTenant?.name || 'LoanOps';

  useEffect(() => {
    loadData();
  }, [tenantId]);

  const loadData = async () => {
    if (!tenantId) return;
    
    try {
      setLoading(true);
      
      // Load customers, lines, and agents in parallel
      const [customersRes, linesRes, agentsRes] = await Promise.all([
        fetch(`/api/customers?tenantId=${tenantId}&limit=1000`),
        fetch(`/api/lines?tenantId=${tenantId}`),
        fetch(`/api/agents?tenantId=${tenantId}`),
      ]);
      
      const customersData = await customersRes.json();
      const linesData = await linesRes.json();
      const agentsData = await agentsRes.json();
      
      setCustomers(Array.isArray(customersData.data) ? customersData.data : []);
      setLines(Array.isArray(linesData.data) ? linesData.data : []);
      setAgents(Array.isArray(agentsData.data) ? agentsData.data : []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = useMemo(() => {
    return customers.filter((customer) => {
      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const name = (customer.name || '').toLowerCase();
        const phone = (customer.phone || '').toLowerCase();
        const address = (customer.address || '').toLowerCase();
        
        if (!name.includes(query) && !phone.includes(query) && !address.includes(query)) {
          return false;
        }
      }
      
      // Line filter
      if (filters.lineId !== 'all') {
        const custLineId = customer.lineId || customer.Line?.id;
        if (custLineId !== filters.lineId) return false;
      }
      
      // Agent filter
      if (filters.agentId !== 'all') {
        if (customer.agentId !== filters.agentId) return false;
      }
      
      // Status filter
      if (filters.status !== 'all') {
        const totalPaid = customer.totalPaid || 0;
        const totalDue = customer.totalDue || 0;
        const outstanding = totalDue - totalPaid;
        const status = outstanding <= 0 ? 'paid' : outstanding < totalDue && totalPaid > 0 ? 'partial' : 'pending';
        if (status !== filters.status) return false;
      }
      
      return true;
    });
  }, [customers, filters, searchQuery]);

  const selectedCustomersList = useMemo(() => {
    return filteredCustomers.filter(c => selectedCustomers.has(c.id));
  }, [filteredCustomers, selectedCustomers]);

  const stats = useMemo(() => {
    const dataSet = selectedCustomers.size > 0 ? selectedCustomersList : filteredCustomers;
    
    const totalDue = dataSet.reduce((sum, c) => sum + (c.totalDue || 0), 0);
    const totalPaid = dataSet.reduce((sum, c) => sum + (c.totalPaid || 0), 0);
    const totalOutstanding = totalDue - totalPaid;
    
    const paidCount = dataSet.filter((c) => {
      const outstanding = (c.totalDue || 0) - (c.totalPaid || 0);
      return outstanding <= 0;
    }).length;
    
    const partialCount = dataSet.filter((c) => {
      const paid = c.totalPaid || 0;
      const due = c.totalDue || 0;
      const outstanding = due - paid;
      return paid > 0 && outstanding > 0;
    }).length;
    
    const pendingCount = dataSet.filter((c) => {
      const paid = c.totalPaid || 0;
      return paid === 0;
    }).length;

    return {
      totalDue,
      totalPaid,
      totalOutstanding,
      paidCount,
      partialCount,
      pendingCount,
      totalCustomers: dataSet.length,
    };
  }, [filteredCustomers, selectedCustomersList, selectedCustomers]);

  const toggleCustomer = (customerId: string) => {
    const newSelected = new Set(selectedCustomers);
    if (newSelected.has(customerId)) {
      newSelected.delete(customerId);
    } else {
      newSelected.add(customerId);
    }
    setSelectedCustomers(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedCustomers.size === filteredCustomers.length && filteredCustomers.length > 0) {
      setSelectedCustomers(new Set());
    } else {
      const allIds = new Set(filteredCustomers.map(c => c.id));
      setSelectedCustomers(allIds);
    }
  };

  const downloadPDF = () => {
    if (selectedCustomers.size === 0) {
      alert('Please select at least one customer');
      return;
    }

    try {
      setDownloading(true);

      const today = fmtDate(new Date());
      const userName = user?.name || 'Admin';

      let customerRows = selectedCustomersList.map((c, i) => {
        const totalPaid = c.totalPaid || 0;
        const totalDue = c.totalDue || 0;
        const outstanding = totalDue - totalPaid;
        const status = outstanding <= 0 ? 'Paid' : outstanding < totalDue && totalPaid > 0 ? 'Partial' : 'Pending';
        const statusColor = status === 'Paid' ? '#10B981' : status === 'Partial' ? '#F59E0B' : '#EF4444';
        
        return `<tr>
          <td>${i + 1}</td>
          <td>${c.name || '-'}</td>
          <td>${c.phone || '-'}</td>
          <td>${c.address || '-'}</td>
          <td>${c.Line?.name || '-'}</td>
          <td>${c.Agent?.name || '-'}</td>
          <td class="right">${fmt(totalDue)}</td>
          <td class="right">${fmt(totalPaid)}</td>
          <td class="right">${fmt(outstanding)}</td>
          <td><span style="color:${statusColor};font-weight:600;">${status}</span></td>
        </tr>`;
      }).join('');

      const pdfStyles = `
        @page { margin: 12mm 10mm; size: A4 landscape; }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Courier New', monospace; color: #000; background: #fff; font-size: 11px; line-height: 1.4; }
        .page { padding: 8px; }
        h1 { font-size: 16px; font-weight: bold; margin-bottom: 2px; }
        .meta { font-size: 10px; color: #555; margin-bottom: 12px; }
        .summary { margin-bottom: 12px; display: flex; gap: 20px; flex-wrap: wrap; }
        .summary-item { background: #f0f0f0; padding: 8px 12px; border-radius: 4px; }
        .summary-label { font-size: 9px; color: #666; text-transform: uppercase; }
        .summary-value { font-size: 14px; font-weight: bold; margin-top: 2px; }
        table { width: 100%; border-collapse: collapse; font-size: 10px; margin-top: 12px; }
        th { background: #f0f0f0; border: 1px solid #ccc; padding: 4px 6px; text-align: left; font-weight: bold; font-size: 9px; text-transform: uppercase; }
        td { border: 1px solid #ddd; padding: 3px 6px; }
        tr:nth-child(even) { background: #fafafa; }
        .right { text-align: right; }
        .footer { margin-top: 12px; font-size: 9px; color: #999; text-align: center; border-top: 1px solid #ddd; padding-top: 6px; }
      `;

      const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${tenantName} - Customer Payment Summary</title><style>${pdfStyles}</style></head><body><div class="page">
        <h1>${tenantName} — Customer Payment Summary</h1>
        <div class="meta">Generated: ${today} | By: ${userName}</div>
        
        <div class="summary">
          <div class="summary-item">
            <div class="summary-label">Total Due</div>
            <div class="summary-value" style="color: #1E40AF;">${fmt(stats.totalDue)}</div>
          </div>
          <div class="summary-item">
            <div class="summary-label">Total Paid</div>
            <div class="summary-value" style="color: #10B981;">${fmt(stats.totalPaid)}</div>
          </div>
          <div class="summary-item">
            <div class="summary-label">Outstanding</div>
            <div class="summary-value" style="color: #F59E0B;">${fmt(stats.totalOutstanding)}</div>
          </div>
        </div>
        
        <p style="font-size: 11px; color: #666; margin-bottom: 8px;">
          Showing ${stats.totalCustomers} customers | Paid: ${stats.paidCount} | Partial: ${stats.partialCount} | Pending: ${stats.pendingCount}
        </p>
        
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Customer</th>
              <th>Phone</th>
              <th>Address</th>
              <th>Line</th>
              <th>Agent</th>
              <th>Total Due</th>
              <th>Paid</th>
              <th>Outstanding</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>${customerRows}</tbody>
        </table>
        
        <div class="footer">${tenantName} — Customer Payment Summary — ${today} — Confidential</div>
      </div></body></html>`;

      const w = window.open('', '_blank');
      if (w) {
        w.document.write(html);
        w.document.close();
        setTimeout(() => w.print(), 400);
      }
    } catch (error) {
      console.error('PDF generation error:', error);
      alert('Failed to generate PDF');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600 mx-auto mb-3" />
          <p className="text-neutral-600">Loading customers...</p>
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
              <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">Customer Payment Summary</h1>
              <p className="text-sm text-neutral-500 mt-1">Select customers and download payment reports</p>
            </div>
            <button 
              onClick={downloadPDF} 
              disabled={downloading || selectedCustomers.size === 0}
              className="btn-primary flex items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              Download PDF ({selectedCustomers.size})
            </button>
          </div>
        </div>
      </div>

      <div className="p-8 space-y-6">
        {/* Selection Info */}
        <div className="card-modern p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-primary-600" />
              <div>
                <h3 className="font-semibold text-neutral-900">
                  {selectedCustomers.size} Customer{selectedCustomers.size !== 1 ? 's' : ''} Selected
                </h3>
                <p className="text-sm text-neutral-500">
                  {selectedCustomers.size === 0 
                    ? 'Select customers to download report' 
                    : 'Click download to generate PDF'}
                </p>
              </div>
            </div>
            <button 
              onClick={toggleSelectAll}
              className="btn-outline text-sm"
            >
              {selectedCustomers.size === filteredCustomers.length && filteredCustomers.length > 0 ? 'Deselect All' : 'Select All'}
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
              <input
                type="text"
                placeholder="Search by name, phone, or address..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-modern pl-10 pr-10 w-full"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>

          {/* Line Filter */}
          <div>
            <select
              value={filters.lineId}
              onChange={(e) => setFilters({ ...filters, lineId: e.target.value })}
              className="input-modern w-full"
            >
              <option value="all">All Lines</option>
              {lines.map(line => (
                <option key={line.id} value={line.id}>{line.name}</option>
              ))}
            </select>
          </div>

          {/* Agent Filter */}
          <div>
            <select
              value={filters.agentId}
              onChange={(e) => setFilters({ ...filters, agentId: e.target.value })}
              className="input-modern w-full"
            >
              <option value="all">All Agents</option>
              {agents.map(agent => (
                <option key={agent.id} value={agent.id}>{agent.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Status Filter */}
        <div className="flex gap-3">
          {[
            { id: 'all', label: 'All', icon: Filter, color: 'neutral' },
            { id: 'paid', label: 'Paid', icon: CheckCircle2, color: 'green' },
            { id: 'partial', label: 'Partial', icon: PieChart, color: 'amber' },
            { id: 'pending', label: 'Pending', icon: AlertCircle, color: 'red' },
          ].map((status) => {
            const Icon = status.icon;
            const isActive = filters.status === status.id;
            return (
              <button
                key={status.id}
                onClick={() => setFilters({ ...filters, status: status.id })}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? status.color === 'green' ? 'bg-emerald-100 text-emerald-700 border-2 border-emerald-300'
                    : status.color === 'amber' ? 'bg-amber-100 text-amber-700 border-2 border-amber-300'
                    : status.color === 'red' ? 'bg-red-100 text-red-700 border-2 border-red-300'
                    : 'bg-neutral-200 text-neutral-700 border-2 border-neutral-300'
                    : 'bg-white text-neutral-600 border border-neutral-200 hover:border-neutral-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                {status.label}
              </button>
            );
          })}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="card-modern p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-primary-100 rounded-lg">
                <Users className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-neutral-900">{stats.totalCustomers}</p>
                <p className="text-xs text-neutral-500">Customers</p>
              </div>
            </div>
          </div>

          <div className="card-modern p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-neutral-900">{stats.paidCount}</p>
                <p className="text-xs text-neutral-500">Paid</p>
              </div>
            </div>
          </div>

          <div className="card-modern p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <PieChart className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-neutral-900">{stats.partialCount}</p>
                <p className="text-xs text-neutral-500">Partial</p>
              </div>
            </div>
          </div>

          <div className="card-modern p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-neutral-900">{stats.pendingCount}</p>
                <p className="text-xs text-neutral-500">Pending</p>
              </div>
            </div>
          </div>
        </div>

        {/* Financial Summary */}
        <div className="card-modern p-6">
          <h3 className="font-semibold text-neutral-900 mb-4">Financial Summary</h3>
          <div className="grid grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-neutral-500 mb-1">Total Due</p>
              <p className="text-2xl font-bold text-primary-600">{fmt(stats.totalDue)}</p>
            </div>
            <div>
              <p className="text-sm text-neutral-500 mb-1">Total Paid</p>
              <p className="text-2xl font-bold text-emerald-600">{fmt(stats.totalPaid)}</p>
            </div>
            <div>
              <p className="text-sm text-neutral-500 mb-1">Outstanding</p>
              <p className="text-2xl font-bold text-amber-600">{fmt(stats.totalOutstanding)}</p>
            </div>
          </div>
        </div>

        {/* Customer List */}
        <div className="card-modern">
          <div className="p-5 border-b border-neutral-100">
            <h3 className="font-semibold text-neutral-900">
              Select Customers ({filteredCustomers.length})
            </h3>
          </div>
          <div className="divide-y divide-neutral-100">
            {filteredCustomers.length === 0 ? (
              <div className="p-12 text-center">
                <Users className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
                <p className="text-neutral-500">No customers found</p>
              </div>
            ) : (
              filteredCustomers.map((customer) => {
                const totalPaid = customer.totalPaid || 0;
                const totalDue = customer.totalDue || 0;
                const outstanding = totalDue - totalPaid;
                const status = outstanding <= 0 ? 'paid' : outstanding < totalDue && totalPaid > 0 ? 'partial' : 'pending';
                const isSelected = selectedCustomers.has(customer.id);

                return (
                  <div
                    key={customer.id}
                    onClick={() => toggleCustomer(customer.id)}
                    className={`p-5 cursor-pointer transition-all hover:bg-neutral-50 ${
                      isSelected ? 'bg-primary-50 border-l-4 border-primary-600' : ''
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 mt-1">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          className="w-5 h-5 text-primary-600 rounded border-neutral-300 focus:ring-primary-500"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <div>
                            <h4 className="font-semibold text-neutral-900">{customer.name}</h4>
                            <p className="text-sm text-neutral-500">{customer.phone}</p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            status === 'paid' ? 'bg-emerald-100 text-emerald-700'
                            : status === 'partial' ? 'bg-amber-100 text-amber-700'
                            : 'bg-red-100 text-red-700'
                          }`}>
                            {status.toUpperCase()}
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-neutral-500">Due</p>
                            <p className="font-semibold text-neutral-900">{fmt(totalDue)}</p>
                          </div>
                          <div>
                            <p className="text-neutral-500">Paid</p>
                            <p className="font-semibold text-emerald-600">{fmt(totalPaid)}</p>
                          </div>
                          <div>
                            <p className="text-neutral-500">Outstanding</p>
                            <p className="font-semibold text-amber-600">{fmt(outstanding)}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
