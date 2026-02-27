'use client';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthProvider';
import { useTenant } from '@/lib/contexts/TenantContext';
import {
  GitBranch, Plus, Search, X, Trash2, Edit, Users, MapPin,
  IndianRupee, UserCheck, ChevronRight, AlertTriangle,
  ArrowLeft, Calendar, ChevronLeft, Wallet, TrendingUp, Clock, XCircle,
  Lock, Unlock, Shield, Save, MessageSquare, CheckCircle, ShieldCheck,
} from 'lucide-react';

interface Line {
  id: string;
  name: string;
  area: string;
  type: string;
  weeklyDay?: string;
  interestRate: number;
  agentId?: string;
  agentName?: string;
  status: string;
  customersCount: number;
  totalAmount: number;
  outstanding: number;
  periodCollected: number;
}

interface Agent { id: string; name: string; phone: string; area?: string; status: string; }

interface LineAnalytics {
  totalCustomers: number;
  totalCollected: number;
  totalPending: number;
  notPaidCount: number;
  paidCount: number;
  expenses: number;
  collections: any[];
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount || 0);

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Snap a date to the nearest past (or today) occurrence of a given weekday
const snapToWeekday = (date: Date, weeklyDay: string): Date => {
  const targetDayIndex = DAY_NAMES.findIndex(d => d.toLowerCase() === weeklyDay.toLowerCase());
  if (targetDayIndex === -1) return date;
  const result = new Date(date);
  const currentDay = result.getDay();
  let diff = currentDay - targetDayIndex;
  if (diff < 0) diff += 7; // go back to the most recent occurrence
  result.setDate(result.getDate() - diff);
  return result;
};

// Snap to the nearest past (or today) occurrence of the same day-of-month
const snapToMonthDay = (date: Date, dayOfMonth: number): Date => {
  const result = new Date(date);
  if (result.getDate() < dayOfMonth) {
    // Go to previous month's occurrence
    result.setMonth(result.getMonth() - 1);
  }
  result.setDate(Math.min(dayOfMonth, new Date(result.getFullYear(), result.getMonth() + 1, 0).getDate()));
  return result;
};

export default function LinesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { selectedTenant } = useTenant();
  const [lines, setLines] = useState<Line[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingLine, setEditingLine] = useState<Line | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assigningLineId, setAssigningLineId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', area: '', type: 'daily', weeklyDay: '', interestRate: '', agentId: '' });

  // Line detail view state
  const [selectedLine, setSelectedLine] = useState<Line | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [lineAnalytics, setLineAnalytics] = useState<LineAnalytics | null>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  // Finance + lock state
  const [finance, setFinance] = useState({ collection: 0, investment: 0, expense: 0 });
  const [adminNotes, setAdminNotes] = useState('');
  const [agentNotes, setAgentNotes] = useState('');
  const [dayLocked, setDayLocked] = useState(false);
  const [editingFinance, setEditingFinance] = useState(false);
  const [savingFinance, setSavingFinance] = useState(false);
  const [saveToast, setSaveToast] = useState<string | null>(null);
  // Collection filter
  const [collectionFilter, setCollectionFilter] = useState<string | null>(null);
  // Customers accordion
  const [customersExpanded, setCustomersExpanded] = useState(false);
  const [lineCustomers, setLineCustomers] = useState<any[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);

  const tenantId = selectedTenant?.id || user?.tenantId;

  useEffect(() => { if (tenantId) { loadLines(); loadAgents(); } }, [tenantId]);

  const loadLines = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/lines?tenantId=${tenantId}`);
      const result = await res.json();
      setLines(result.data || []);
    } catch (e) { console.error('Error loading lines:', e); }
    finally { setLoading(false); }
  };

  const loadAgents = async () => {
    try {
      const res = await fetch(`/api/agents?tenantId=${tenantId}`);
      const result = await res.json();
      setAgents(result.data || result || []);
    } catch (e) { console.error('Error loading agents:', e); }
  };

  // Load analytics for a line on a specific date
  const loadLineAnalytics = async (line: Line, date: Date) => {
    setLoadingAnalytics(true);
    try {
      const dateStr = date.toISOString().split('T')[0];
      const [collectionsRes, customersRes] = await Promise.all([
        fetch(`/api/collections?tenantId=${tenantId}&date=${dateStr}&limit=500`),
        fetch(`/api/customers?tenantId=${tenantId}&lineId=${line.id}&limit=500`),
      ]);
      const [collectionsData, customersData] = await Promise.all([collectionsRes.json(), customersRes.json()]);

      const allCollections = collectionsData.data || [];
      // Filter collections for this line
      const lineCollections = allCollections.filter((c: any) => {
        const custLineId = c.Customer?.lineId || c.Customer?.Line?.id;
        return custLineId === line.id;
      });

      const paidCollections = lineCollections.filter((c: any) => c.status === 'collected' || c.status === 'paid');
      const pendingCollections = lineCollections.filter((c: any) => c.status === 'pending');
      const notPaidCollections = lineCollections.filter((c: any) => c.status === 'not_paid');

      const totalCollected = paidCollections.reduce((sum: number, c: any) => sum + (c.collectedAmount || c.amount || 0), 0);
      const totalPending = pendingCollections.reduce((sum: number, c: any) => sum + (c.amount || 0), 0);
      const totalCustomers = (customersData.data || customersData || []).length;

      setLineAnalytics({
        totalCustomers,
        totalCollected,
        totalPending,
        notPaidCount: notPaidCollections.length,
        paidCount: paidCollections.length,
        expenses: 0,
        collections: lineCollections,
      });

      // Load finance + lock data
      try {
        const finRes = await fetch(`/api/lines/daily-finance?lineId=${line.id}&tenantId=${tenantId}&date=${dateStr}`);
        const finData = await finRes.json();
        const f = finData.data || {};
        setFinance({ collection: Number(f.collectionAmount) || 0, investment: Number(f.investmentAmount) || 0, expense: Number(f.expenseAmount) || 0 });
        setAdminNotes(f.adminNotes || '');
        setAgentNotes(f.agentNotes || '');
        setDayLocked(f.isLocked || false);
      } catch { setFinance({ collection: 0, investment: 0, expense: 0 }); setAdminNotes(''); setAgentNotes(''); setDayLocked(false); }
      setEditingFinance(false);
    } catch (e) { console.error('Error loading line analytics:', e); }
    finally { setLoadingAnalytics(false); }
  };

  // Get the correct starting date for a line based on its type
  const getSnappedDate = (line: Line, baseDate?: Date): Date => {
    const base = baseDate || new Date();
    if (line.type === 'weekly' && line.weeklyDay) {
      return snapToWeekday(base, line.weeklyDay);
    }
    // For monthly/daily, just use the base date
    return new Date(base);
  };

  // Date navigation based on line type
  const changeDate = (direction: number) => {
    if (!selectedLine) return;
    const newDate = new Date(selectedDate);

    if (selectedLine.type === 'daily') {
      newDate.setDate(newDate.getDate() + direction);
    } else if (selectedLine.type === 'weekly') {
      newDate.setDate(newDate.getDate() + (direction * 7));
    } else if (selectedLine.type === 'monthly') {
      newDate.setMonth(newDate.getMonth() + direction);
    }

    const today = new Date();
    today.setHours(23, 59, 59, 999);
    if (newDate <= today) {
      setSelectedDate(newDate);
      loadLineAnalytics(selectedLine, newDate);
    }
  };

  const goToToday = () => {
    if (!selectedLine) return;
    const snapped = getSnappedDate(selectedLine);
    setSelectedDate(snapped);
    loadLineAnalytics(selectedLine, snapped);
  };

  const openLineDetail = (line: Line) => {
    setSelectedLine(line);
    setCollectionFilter(null);
    setCustomersExpanded(false);
    setLineCustomers([]);
    const snapped = getSnappedDate(line);
    setSelectedDate(snapped);
    loadLineAnalytics(line, snapped);
  };

  const loadLineCustomers = async () => {
    if (!selectedLine || !tenantId) return;
    setLoadingCustomers(true);
    try {
      const res = await fetch(`/api/customers?tenantId=${tenantId}&lineId=${selectedLine.id}&limit=500`);
      const data = await res.json();
      setLineCustomers(data.data || []);
    } catch { setLineCustomers([]); }
    finally { setLoadingCustomers(false); }
  };

  const toggleCustomersAccordion = () => {
    const next = !customersExpanded;
    setCustomersExpanded(next);
    if (next && lineCustomers.length === 0) loadLineCustomers();
  };

  const filteredCollections = useMemo(() => {
    if (!lineAnalytics) return [];
    if (!collectionFilter) return lineAnalytics.collections;
    if (collectionFilter === 'paid') return lineAnalytics.collections.filter((c: any) => c.status === 'collected' || c.status === 'paid');
    if (collectionFilter === 'not_paid') return lineAnalytics.collections.filter((c: any) => c.status === 'not_paid');
    if (collectionFilter === 'pending') return lineAnalytics.collections.filter((c: any) => c.status === 'pending');
    return lineAnalytics.collections;
  }, [lineAnalytics, collectionFilter]);

  const saveFinanceData = async () => {
    if (!selectedLine || !tenantId) return;
    try {
      setSavingFinance(true);
      const res = await fetch('/api/lines/daily-finance', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lineId: selectedLine.id, tenantId,
          date: selectedDate.toISOString().split('T')[0],
          collectionAmount: finance.collection,
          investmentAmount: finance.investment,
          expenseAmount: finance.expense,
          adminNotes, agentNotes,
          updatedByRole: 'admin',
          updatedByUserId: (user as any)?.id,
        }),
      });
      const result = await res.json();
      if (!res.ok || !result.success) {
        setSaveToast('❌ ' + (result.error || 'Failed to save'));
        setTimeout(() => setSaveToast(null), 4000);
        return;
      }
      setEditingFinance(false);
      setSaveToast('✓ Saved successfully');
      setTimeout(() => setSaveToast(null), 3000);
      loadLineAnalytics(selectedLine, selectedDate);
    } catch (e: any) {
      setSaveToast('❌ ' + (e.message || 'Failed to save'));
      setTimeout(() => setSaveToast(null), 4000);
    }
    finally { setSavingFinance(false); }
  };

  const toggleLock = async () => {
    if (!selectedLine || !tenantId) return;
    const newLocked = !dayLocked;
    try {
      await fetch('/api/lines/daily-finance', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lineId: selectedLine.id, tenantId,
          date: selectedDate.toISOString().split('T')[0],
          collectionAmount: finance.collection,
          investmentAmount: finance.investment,
          expenseAmount: finance.expense,
          isLocked: newLocked,
          updatedByRole: 'admin',
          updatedByUserId: (user as any)?.id,
          lockedByUserId: (user as any)?.id,
        }),
      });
      setDayLocked(newLocked);
    } catch (e: any) { alert(e.message || 'Failed'); }
  };

  const handleSave = async () => {
    if (!form.name || !form.area) { alert('Name and Area are required'); return; }
    if (form.type === 'weekly' && !form.weeklyDay) { alert('Select weekly collection day'); return; }
    try {
      const payload: any = {
        name: form.name, area: form.area, type: form.type,
        weeklyDay: form.type === 'weekly' ? form.weeklyDay : null,
        interestRate: parseFloat(form.interestRate) || 2.5,
        agentId: form.agentId || null,
      };
      if (editingLine) {
        payload.id = editingLine.id;
        await fetch('/api/lines', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      } else {
        payload.tenantId = tenantId;
        await fetch('/api/lines', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      }
      setShowModal(false); setEditingLine(null);
      setForm({ name: '', area: '', type: 'daily', weeklyDay: '', interestRate: '', agentId: '' });
      loadLines();
    } catch (e: any) { alert(e.message || 'Failed to save line'); }
  };

  const handleDelete = async (line: Line) => {
    if (line.customersCount > 0) { alert(`Cannot delete "${line.name}" — it has ${line.customersCount} customers. Reassign them first.`); return; }
    if (!confirm(`Delete line "${line.name}"? This cannot be undone.`)) return;
    try {
      await fetch(`/api/lines?lineId=${line.id}`, { method: 'DELETE' });
      loadLines();
    } catch (e: any) { alert(e.message || 'Failed to delete'); }
  };

  const handleAssignAgent = async (agentId: string) => {
    if (!assigningLineId) return;
    try {
      await fetch('/api/lines', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: assigningLineId, agentId }) });
      setShowAssignModal(false); setAssigningLineId(null); loadLines();
    } catch (e: any) { alert(e.message || 'Failed to assign'); }
  };

  const handleUnassignAgent = async (lineId: string) => {
    if (!confirm('Unassign agent from this line?')) return;
    try {
      await fetch('/api/lines', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: lineId, agentId: null }) });
      loadLines();
    } catch (e: any) { alert(e.message || 'Failed to unassign'); }
  };

  const openEdit = (line: Line) => {
    setEditingLine(line);
    setForm({ name: line.name, area: line.area, type: line.type, weeklyDay: line.weeklyDay || '', interestRate: String(line.interestRate || ''), agentId: line.agentId || '' });
    setShowModal(true);
  };

  const filtered = lines.filter(l =>
    l.name.toLowerCase().includes(search.toLowerCase()) || l.area.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total: lines.length,
    customers: lines.reduce((s, l) => s + (l.customersCount || 0), 0),
    totalAmount: lines.reduce((s, l) => s + (l.totalAmount || 0), 0),
    outstanding: lines.reduce((s, l) => s + (l.outstanding || 0), 0),
  };

  const typeConfig: Record<string, { bg: string; color: string; border: string }> = {
    daily: { bg: 'bg-emerald-50', color: 'text-emerald-700', border: 'border-emerald-200' },
    weekly: { bg: 'bg-primary-50', color: 'text-primary-700', border: 'border-primary-200' },
    monthly: { bg: 'bg-primary-50', color: 'text-primary-700', border: 'border-primary-200' },
  };

  const getTypeLabel = (line: Line) => {
    if (line.type === 'weekly' && line.weeklyDay) return `Weekly (${line.weeklyDay.slice(0, 3)})`;
    return line.type.charAt(0).toUpperCase() + line.type.slice(1);
  };

  const getDateLabel = () => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const selStr = selectedDate.toISOString().split('T')[0];
    if (todayStr === selStr) return 'Today';
    if (selectedLine?.type === 'weekly') {
      return selectedDate.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
    }
    return selectedDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const getDateStepLabel = () => {
    if (!selectedLine) return '';
    if (selectedLine.type === 'daily') return 'Day';
    if (selectedLine.type === 'weekly') return 'Week';
    return 'Month';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4" />
          <p className="text-neutral-500">Loading lines...</p>
        </div>
      </div>
    );
  }

  // ─── LINE DETAIL VIEW ───
  if (selectedLine) {
    const tc = typeConfig[selectedLine.type] || typeConfig.daily;
    const isToday = selectedDate.toISOString().split('T')[0] === new Date().toISOString().split('T')[0];
    // Disable forward if next step would go past today
    const canGoForward = (() => {
      if (isToday) return false;
      const nextDate = new Date(selectedDate);
      if (selectedLine.type === 'daily') nextDate.setDate(nextDate.getDate() + 1);
      else if (selectedLine.type === 'weekly') nextDate.setDate(nextDate.getDate() + 7);
      else if (selectedLine.type === 'monthly') nextDate.setMonth(nextDate.getMonth() + 1);
      const today = new Date(); today.setHours(23, 59, 59, 999);
      return nextDate <= today;
    })();
    return (
      <div className="min-h-screen bg-neutral-50">
        {/* Header */}
        <div className="bg-white border-b border-neutral-100">
          <div className="px-8 py-5">
            <div className="flex items-center gap-4 mb-4">
              <button onClick={() => { setSelectedLine(null); setLineAnalytics(null); }}
                className="w-10 h-10 rounded-xl bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center transition-all">
                <ArrowLeft className="w-5 h-5 text-neutral-600" />
              </button>
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-neutral-900">{selectedLine.name}</h1>
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold ${tc.bg} ${tc.color} border ${tc.border}`}>
                    {getTypeLabel(selectedLine)}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-neutral-500 mt-1">
                  <MapPin className="w-3.5 h-3.5" /> {selectedLine.area}
                  {selectedLine.agentName && <><span>•</span><UserCheck className="w-3.5 h-3.5" /> {selectedLine.agentName}</>}
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => openEdit(selectedLine)} className="btn-outline text-sm flex items-center gap-1.5">
                  <Edit className="w-3.5 h-3.5" /> Edit
                </button>
              </div>
            </div>

            {/* Date Navigation */}
            <div className="flex items-center justify-center gap-4">
              <button onClick={() => changeDate(-1)} className="w-9 h-9 rounded-lg bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center transition-all">
                <ChevronLeft className="w-4 h-4 text-neutral-600" />
              </button>
              <button onClick={goToToday} className="flex items-center gap-2 px-5 py-2 bg-primary-50 rounded-xl hover:bg-primary-100 transition-all">
                <Calendar className="w-4 h-4 text-primary-600" />
                <span className="text-sm font-semibold text-primary-700">{getDateLabel()}</span>
                <span className="text-xs text-primary-500">({getDateStepLabel()})</span>
              </button>
              <button onClick={() => changeDate(1)} disabled={!canGoForward}
                className={`w-9 h-9 rounded-lg bg-neutral-100 flex items-center justify-center transition-all ${!canGoForward ? 'opacity-30 cursor-not-allowed' : 'hover:bg-neutral-200'}`}>
                <ChevronRight className="w-4 h-4 text-neutral-600" />
              </button>
            </div>
          </div>
        </div>

        <div className="p-8">
          {loadingAnalytics ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
            </div>
          ) : lineAnalytics ? (
            <>
              {/* Analytics Cards */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                {[
                  { label: 'Total Customers', value: lineAnalytics.totalCustomers, icon: Users, iconBg: 'bg-primary-50', iconColor: 'text-primary-600', filter: null as string | null },
                  { label: 'Collected', value: formatCurrency(lineAnalytics.totalCollected), icon: Wallet, iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600', filter: null as string | null },
                  { label: 'Pending', value: formatCurrency(lineAnalytics.totalPending), icon: Clock, iconBg: 'bg-amber-50', iconColor: 'text-amber-600', filter: 'pending' },
                  { label: 'Paid', value: lineAnalytics.paidCount, icon: TrendingUp, iconBg: 'bg-green-50', iconColor: 'text-green-600', filter: 'paid' },
                  { label: 'Not Paid', value: lineAnalytics.notPaidCount, icon: XCircle, iconBg: 'bg-red-50', iconColor: 'text-red-600', filter: 'not_paid' },
                ].map((stat) => {
                  const isActive = stat.filter !== null && collectionFilter === stat.filter;
                  return (
                    <button
                      key={stat.label}
                      onClick={() => { if (stat.filter) setCollectionFilter(collectionFilter === stat.filter ? null : stat.filter); }}
                      className={`card-modern p-4 text-left transition-all ${stat.filter ? 'cursor-pointer hover:shadow-md' : 'cursor-default'} ${isActive ? 'ring-2 ring-primary-400 shadow-md' : ''}`}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`p-2 ${stat.iconBg} rounded-lg`}><stat.icon className={`w-4 h-4 ${stat.iconColor}`} /></div>
                      </div>
                      <p className="text-xs text-neutral-500">{stat.label}</p>
                      <p className="text-xl font-bold text-neutral-900 mt-0.5">{stat.value}</p>
                      {isActive && <div className="w-8 h-0.5 bg-primary-500 rounded mt-1" />}
                    </button>
                  );
                })}
              </div>

              {/* Toast Notification */}
              {saveToast && (
                <div className={`fixed top-20 right-6 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-semibold animate-slide-down ${saveToast.startsWith('✓') ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}>
                  {saveToast}
                </div>
              )}

              {/* Day Summary Card */}
              <div className="card-modern p-5 mb-6">
                {/* Header row */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-neutral-900">Day Summary</h3>
                    {dayLocked && <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md font-bold border border-emerald-200">✓ Verified</span>}
                  </div>
                  {selectedLine.agentId && (
                    <button onClick={toggleLock} className={`text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-semibold transition-all ${dayLocked ? 'bg-neutral-100 border-neutral-200 text-neutral-600 hover:bg-neutral-200' : 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'}`}>
                      {dayLocked ? <ShieldCheck className="w-3.5 h-3.5" /> : <CheckCircle className="w-3.5 h-3.5" />}
                      {dayLocked ? 'Unverify' : 'Verify Day'}
                    </button>
                  )}
                </div>

                {/* Finance row — 3 inputs inline */}
                <div className="grid grid-cols-3 gap-3 mb-3">
                  {[
                    { key: 'collection', label: 'Collection', color: 'text-emerald-600' },
                    { key: 'investment', label: 'Investment', color: 'text-red-600' },
                    { key: 'expense', label: 'Expenses', color: 'text-amber-600' },
                  ].map(item => (
                    <div key={item.key}>
                      <label className="block text-[10px] font-semibold text-neutral-400 uppercase tracking-wide mb-1">{item.label}</label>
                      <input
                        type="number"
                        value={(finance as any)[item.key] || ''}
                        onChange={e => { setFinance(p => ({ ...p, [item.key]: Number(e.target.value) || 0 })); if (!editingFinance) setEditingFinance(true); }}
                        disabled={dayLocked}
                        placeholder="₹ 0"
                        className={`w-full px-3 py-2 text-sm font-bold rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-400 transition-all ${dayLocked ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed border-neutral-100' : `bg-neutral-50 border-neutral-200 ${item.color}`}`}
                      />
                    </div>
                  ))}
                </div>

                {/* Balance */}
                <div className="flex items-center justify-between px-3 py-2 bg-primary-50 rounded-lg mb-3">
                  <span className="text-xs font-semibold text-primary-600">Balance (Irupu)</span>
                  <span className="text-sm font-bold text-primary-700">{formatCurrency(finance.collection - finance.investment - finance.expense)}</span>
                </div>

                {/* Notes — admin always editable, agent read-only */}
                <div className={selectedLine.agentId ? 'grid grid-cols-2 gap-3 mb-3' : 'mb-3'}>
                  <div>
                    <label className="block text-[10px] font-semibold text-neutral-400 uppercase tracking-wide mb-1">Admin Notes</label>
                    <textarea
                      value={adminNotes}
                      onChange={e => { setAdminNotes(e.target.value); if (!editingFinance) setEditingFinance(true); }}
                      disabled={dayLocked}
                      rows={2}
                      placeholder="Notes for this day..."
                      className={`w-full text-sm rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-200 resize-none transition-all ${dayLocked ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed border-neutral-100' : 'bg-neutral-50 border-neutral-200 text-neutral-800'}`}
                    />
                  </div>
                  {selectedLine.agentId && (
                    <div>
                      <label className="block text-[10px] font-semibold text-neutral-400 uppercase tracking-wide mb-1">Agent Notes</label>
                      <div className={`text-sm rounded-lg border px-3 py-2 min-h-[60px] ${agentNotes ? 'bg-emerald-50/50 border-emerald-100 text-neutral-700' : 'bg-neutral-50 border-neutral-100 text-neutral-400 italic'}`}>
                        {agentNotes || 'No agent notes'}
                      </div>
                    </div>
                  )}
                </div>

                {/* Save */}
                {editingFinance && !dayLocked && (
                  <button
                    onClick={saveFinanceData}
                    disabled={savingFinance}
                    className="w-full py-2.5 rounded-lg font-semibold text-sm bg-neutral-900 text-white hover:bg-neutral-800 active:scale-[0.99] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {savingFinance ? (
                      <><div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white" /> Saving...</>
                    ) : (
                      <><Save className="w-4 h-4" /> Save</>
                    )}
                  </button>
                )}
              </div>

              {/* Collections Table */}
              {filteredCollections.length > 0 ? (
                <div className="card-modern overflow-hidden mb-6">
                  <div className="p-5 border-b border-neutral-100 flex items-center justify-between">
                    <h3 className="font-bold text-neutral-900">
                      Collections ({filteredCollections.length})
                      {collectionFilter && <span className="text-sm font-medium text-primary-600 ml-2">• {collectionFilter === 'paid' ? 'Paid' : collectionFilter === 'not_paid' ? 'Not Paid' : 'Pending'}</span>}
                    </h3>
                    {collectionFilter && (
                      <button onClick={() => setCollectionFilter(null)} className="text-xs flex items-center gap-1 px-2.5 py-1 bg-primary-50 text-primary-600 rounded-lg hover:bg-primary-100 transition-all font-semibold">
                        <X className="w-3 h-3" /> Clear filter
                      </button>
                    )}
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-neutral-50">
                          <th className="text-left px-5 py-3 font-semibold text-neutral-600">Customer</th>
                          <th className="text-left px-5 py-3 font-semibold text-neutral-600">Due</th>
                          <th className="text-left px-5 py-3 font-semibold text-neutral-600">Collected</th>
                          <th className="text-left px-5 py-3 font-semibold text-neutral-600">Method</th>
                          <th className="text-left px-5 py-3 font-semibold text-neutral-600">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredCollections.map((c: any) => {
                          const statusColors: Record<string, string> = {
                            collected: 'bg-emerald-50 text-emerald-700',
                            paid: 'bg-emerald-50 text-emerald-700',
                            pending: 'bg-amber-50 text-amber-700',
                            not_paid: 'bg-red-50 text-red-700',
                          };
                          const custId = c.customerId || c.Customer?.id;
                          return (
                            <tr key={c.id}
                              onClick={() => { if (custId) router.push(`/customers?id=${custId}`); }}
                              className={`border-t border-neutral-100 hover:bg-primary-50/30 transition-all ${custId ? 'cursor-pointer' : ''}`}>
                              <td className="px-5 py-3">
                                <p className="font-medium text-neutral-900">{c.Customer?.name || 'Unknown'}</p>
                                <p className="text-xs text-neutral-500">{c.Customer?.phone || ''}</p>
                              </td>
                              <td className="px-5 py-3 font-semibold text-neutral-900">{formatCurrency(c.amount)}</td>
                              <td className="px-5 py-3 font-semibold text-emerald-600">{c.collectedAmount ? formatCurrency(c.collectedAmount) : '—'}</td>
                              <td className="px-5 py-3 text-neutral-600 capitalize">{c.method !== 'pending' ? c.method : '—'}</td>
                              <td className="px-5 py-3">
                                <span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-semibold ${statusColors[c.status] || 'bg-neutral-100 text-neutral-600'}`}>
                                  {c.status === 'collected' || c.status === 'paid' ? 'Paid' : c.status === 'pending' ? 'Pending' : 'Not Paid'}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="card-modern p-12 text-center mb-6">
                  <Wallet className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
                  <p className="text-neutral-500 font-medium">
                    {collectionFilter ? `No ${collectionFilter === 'paid' ? 'paid' : collectionFilter === 'not_paid' ? 'not paid' : 'pending'} collections` : 'No collections for this date'}
                  </p>
                  {!collectionFilter && <p className="text-xs text-neutral-400 mt-1">Try navigating to a different {getDateStepLabel().toLowerCase()}</p>}
                  {collectionFilter && (
                    <button onClick={() => setCollectionFilter(null)} className="mt-3 text-xs text-primary-600 font-semibold hover:underline">Clear filter</button>
                  )}
                </div>
              )}

              {/* Customers Accordion */}
              <div className="card-modern overflow-hidden">
                <button
                  onClick={toggleCustomersAccordion}
                  className="w-full flex items-center justify-between p-5 hover:bg-neutral-50/50 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary-50 rounded-lg"><Users className="w-4 h-4 text-primary-600" /></div>
                    <div className="text-left">
                      <h3 className="font-bold text-neutral-900 text-sm">All Customers</h3>
                      <p className="text-xs text-neutral-500">{selectedLine.customersCount || 0} customers in this line</p>
                    </div>
                  </div>
                  <ChevronRight className={`w-4 h-4 text-neutral-400 transition-transform ${customersExpanded ? 'rotate-90' : ''}`} />
                </button>
                {customersExpanded && (
                  <div className="border-t border-neutral-100">
                    {loadingCustomers ? (
                      <div className="p-8 text-center"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600 mx-auto" /></div>
                    ) : lineCustomers.length === 0 ? (
                      <div className="p-8 text-center text-neutral-500 text-sm">No customers in this line</div>
                    ) : (
                      <div className="divide-y divide-neutral-100">
                        {lineCustomers.map((cust: any) => (
                          <button
                            key={cust.id}
                            onClick={() => router.push(`/customers?id=${cust.id}`)}
                            className="w-full flex items-center gap-3 px-5 py-3 hover:bg-primary-50/30 transition-all text-left"
                          >
                            <div className="w-8 h-8 rounded-full bg-primary-50 flex items-center justify-center text-xs font-bold text-primary-600 flex-shrink-0">
                              {(cust.name || '?').charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-neutral-900 truncate">{cust.name || 'Unknown'}</p>
                              <p className="text-xs text-neutral-500">{cust.phone || ''}{cust.area ? ` • ${cust.area}` : ''}</p>
                            </div>
                            <ChevronRight className="w-4 h-4 text-neutral-300 flex-shrink-0" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                </div>
            </>
          ) : null}
        </div>
      </div>
    );
  }

  // ─── LINES LIST VIEW ───
  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="bg-white border-b border-neutral-100">
        <div className="px-8 py-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">Lines</h1>
              <p className="text-sm text-neutral-500 mt-1">{lines.length} lines • Click a line to view collections</p>
            </div>
            <button onClick={() => { setEditingLine(null); setForm({ name: '', area: '', type: 'daily', weeklyDay: '', interestRate: '', agentId: '' }); setShowModal(true); }} className="btn-primary flex items-center gap-2">
              <Plus size={16} /> <span>Create Line</span>
            </button>
          </div>

          {/* Search inline */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input type="text" placeholder="Search lines..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all" />
          </div>
        </div>
      </div>

      <div className="p-8">
        {/* Lines List */}
        <div className="space-y-2">
          {filtered.map((line, i) => {
            const tc = typeConfig[line.type] || typeConfig.daily;
            return (
              <div key={line.id}
                className="bg-white rounded-xl border border-neutral-200 hover:border-neutral-300 hover:shadow-sm transition-all cursor-pointer active:scale-[0.995] animate-slide-up"
                style={{ animationDelay: `${i * 0.02}s` }}
                onClick={() => openLineDetail(line)}>
                <div className="flex items-center gap-4 px-5 py-4">
                  {/* Icon */}
                  <div className="w-10 h-10 rounded-lg bg-neutral-900 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    {line.name.charAt(0)}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-neutral-900 truncate">{line.name}</h3>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold ${tc.bg} ${tc.color}`}>
                        {getTypeLabel(line)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-xs text-neutral-500 flex items-center gap-1"><MapPin className="w-3 h-3" />{line.area}</span>
                      <span className="text-xs text-neutral-400">•</span>
                      <span className="text-xs text-neutral-500">{line.customersCount || 0} customers</span>
                      {line.agentName && (
                        <><span className="text-xs text-neutral-400">•</span><span className="text-xs text-neutral-500 flex items-center gap-1"><UserCheck className="w-3 h-3" />{line.agentName}</span></>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {!line.agentName && (
                      <button onClick={(e) => { e.stopPropagation(); setAssigningLineId(line.id); setShowAssignModal(true); }}
                        className="text-[10px] font-semibold px-2.5 py-1.5 bg-primary-50 text-primary-600 rounded-lg hover:bg-primary-100 transition-all">
                        Assign
                      </button>
                    )}
                    <button onClick={(e) => { e.stopPropagation(); openEdit(line); }}
                      className="w-8 h-8 rounded-lg hover:bg-neutral-100 flex items-center justify-center text-neutral-400 hover:text-neutral-600 transition-all">
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); handleDelete(line); }}
                      className="w-8 h-8 rounded-lg hover:bg-red-50 flex items-center justify-center text-neutral-400 hover:text-red-500 transition-all">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <ChevronRight className="w-4 h-4 text-neutral-300" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="card-modern p-16 text-center animate-fade-in">
            <div className="w-16 h-16 bg-neutral-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <GitBranch className="w-8 h-8 text-neutral-400" />
            </div>
            <h3 className="text-lg font-bold text-neutral-900 mb-2">No Lines Found</h3>
            <p className="text-neutral-500">Create your first collection line to get started</p>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-scale-in">
            <div className="p-6 border-b border-neutral-100 sticky top-0 bg-white rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-neutral-900">{editingLine ? 'Edit Line' : 'Create New Line'}</h3>
                  <p className="text-sm text-neutral-500 mt-0.5">{editingLine ? 'Update line details' : 'Set up a new collection line'}</p>
                </div>
                <button onClick={() => { setShowModal(false); setEditingLine(null); }} className="w-8 h-8 rounded-lg hover:bg-neutral-100 flex items-center justify-center text-neutral-400 hover:text-neutral-600 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-1.5">Line Name <span className="text-danger-500">*</span></label>
                <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g., T Nagar Daily Line"
                  className="w-full px-4 py-2.5 border border-neutral-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all placeholder-neutral-400" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-1.5">Area <span className="text-danger-500">*</span></label>
                <input type="text" value={form.area} onChange={e => setForm({ ...form, area: e.target.value })} placeholder="e.g., T Nagar"
                  className="w-full px-4 py-2.5 border border-neutral-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all placeholder-neutral-400" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-1.5">Collection Type <span className="text-danger-500">*</span></label>
                <div className="bg-neutral-100 rounded-xl p-1 flex gap-1">
                  {['daily', 'weekly', 'monthly'].map(t => (
                    <button key={t} onClick={() => setForm({ ...form, type: t })}
                      className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${form.type === t ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'}`}>
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              {form.type === 'weekly' && (
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-1.5">Weekly Day <span className="text-danger-500">*</span></label>
                  <div className="flex flex-wrap gap-2">
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                      <button key={day} onClick={() => setForm({ ...form, weeklyDay: day })}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${form.weeklyDay === day ? 'bg-primary-600 text-white' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'}`}>
                        {day.slice(0, 3)}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-1.5">Interest Rate (%)</label>
                <input type="number" step="0.1" value={form.interestRate} onChange={e => setForm({ ...form, interestRate: e.target.value })} placeholder="e.g., 2.5"
                  className="w-full px-4 py-2.5 border border-neutral-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all placeholder-neutral-400" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-1.5">Assign Agent (Optional)</label>
                <select value={form.agentId} onChange={e => setForm({ ...form, agentId: e.target.value })}
                  className="w-full px-4 py-2.5 border border-neutral-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all appearance-none cursor-pointer">
                  <option value="">No agent</option>
                  {agents.map(a => <option key={a.id} value={a.id}>{a.name} — {a.phone}</option>)}
                </select>
              </div>
            </div>
            <div className="p-6 border-t border-neutral-100 flex gap-3 bg-neutral-50/50 rounded-b-2xl">
              <button onClick={() => { setShowModal(false); setEditingLine(null); }} className="flex-1 btn-ghost py-3">Cancel</button>
              <button onClick={handleSave} className="flex-1 btn-primary py-3">{editingLine ? 'Update Line' : 'Create Line'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Agent Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[70vh] overflow-y-auto shadow-2xl animate-scale-in">
            <div className="p-6 border-b border-neutral-100 sticky top-0 bg-white rounded-t-2xl">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-neutral-900">Assign Agent</h3>
                <button onClick={() => { setShowAssignModal(false); setAssigningLineId(null); }} className="w-8 h-8 rounded-lg hover:bg-neutral-100 flex items-center justify-center text-neutral-400">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-4 space-y-2">
              {agents.map(agent => (
                <button key={agent.id} onClick={() => handleAssignAgent(agent.id)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-primary-50 transition-all text-left">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-bold text-sm">{agent.name.charAt(0)}</div>
                  <div className="flex-1">
                    <p className="font-semibold text-neutral-900 text-sm">{agent.name}</p>
                    <p className="text-xs text-neutral-500">{agent.phone} • {agent.area || 'No area'}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-neutral-400" />
                </button>
              ))}
              {agents.length === 0 && <p className="text-center text-neutral-500 py-8">No agents available</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
