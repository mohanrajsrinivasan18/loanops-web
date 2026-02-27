'use client';
import { useState, useEffect, useMemo, useRef } from 'react';
import { useAuth } from '@/lib/AuthProvider';
import { useTenant } from '@/lib/contexts/TenantContext';
import { Sliders, Save, Eye, IndianRupee, RefreshCw } from 'lucide-react';

const DEFAULT_VISIBILITY = {
  showLoanSummary: true,
  showActiveLoans: true,
  showDocuments: false,
  showLocationMap: false,
  showPreviousLoans: false,
  showQuickActions: true,
};

export default function SettingsPage() {
  const { user } = useAuth();
  const { selectedTenant } = useTenant();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [interestRates, setInterestRates] = useState({ daily: '2.5', weekly: '10', monthly: '20' });
  const [agentVisibility, setAgentVisibility] = useState(DEFAULT_VISIBILITY);
  const savedSnapshot = useRef('');

  const tenantId = selectedTenant?.id || user?.tenantId;
  const currentSnapshot = useMemo(() => JSON.stringify({ interestRates, agentVisibility }), [interestRates, agentVisibility]);
  const hasChanges = savedSnapshot.current !== '' && currentSnapshot !== savedSnapshot.current;

  useEffect(() => { if (tenantId) loadSettings(); }, [tenantId]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/settings?tenantId=${tenantId}`);
      const result = await res.json();
      const data = result.data || result;
      if (data?.interestRates) {
        setInterestRates({
          daily: String(data.interestRates.daily || 2.5),
          weekly: String(data.interestRates.weekly || 10),
          monthly: String(data.interestRates.monthly || 20),
        });
      }
      if (data?.agentVisibility) {
        setAgentVisibility({ ...DEFAULT_VISIBILITY, ...data.agentVisibility });
      }
      const loadedRates = { daily: String(data?.interestRates?.daily || 2.5), weekly: String(data?.interestRates?.weekly || 10), monthly: String(data?.interestRates?.monthly || 20) };
      const loadedVis = { ...DEFAULT_VISIBILITY, ...(data?.agentVisibility || {}) };
      savedSnapshot.current = JSON.stringify({ interestRates: loadedRates, agentVisibility: loadedVis });
    } catch (e) { console.error('Failed to load settings:', e); }
    finally { setLoading(false); }
  };

  const handleSave = async () => {
    if (!interestRates.daily || !interestRates.weekly || !interestRates.monthly) { alert('Please fill all cutting amounts'); return; }
    try {
      setSaving(true);
      await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          interestRates: { daily: parseFloat(interestRates.daily), weekly: parseFloat(interestRates.weekly), monthly: parseFloat(interestRates.monthly) },
          agentVisibility,
        }),
      });
      savedSnapshot.current = currentSnapshot;
      alert('Settings saved successfully!');
    } catch (e: any) { alert(e.message || 'Failed to save settings'); }
    finally { setSaving(false); }
  };

  const visibilityItems = [
    { key: 'showLoanSummary', label: 'Loan Summary', desc: 'Show loan summary card on customer details' },
    { key: 'showActiveLoans', label: 'Active Loans', desc: 'Show active loans section' },
    { key: 'showDocuments', label: 'Documents', desc: 'Show documents section' },
    { key: 'showLocationMap', label: 'Location Map', desc: 'Show customer location on map' },
    { key: 'showPreviousLoans', label: 'Previous Loans', desc: 'Show previous/completed loans' },
    { key: 'showQuickActions', label: 'Quick Actions', desc: 'Show quick action buttons' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4" />
          <p className="text-neutral-500">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="bg-white border-b border-neutral-100">
        <div className="px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">Settings</h1>
              <p className="text-sm text-neutral-500 mt-1">Configure cutting amounts and agent visibility</p>
            </div>
            <button onClick={handleSave} disabled={saving || !hasChanges}
              className={`btn-primary flex items-center gap-2 ${(!hasChanges || saving) ? 'opacity-50 cursor-not-allowed' : ''}`}>
              <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
          {hasChanges && <p className="text-xs text-amber-600 font-medium mt-2">You have unsaved changes</p>}
        </div>
      </div>

      <div className="p-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Cutting Amounts / Interest Rates */}
          <div className="card-modern p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-indigo-50 rounded-xl"><IndianRupee className="w-5 h-5 text-indigo-600" /></div>
              <div>
                <h3 className="text-lg font-semibold text-neutral-900">Default Cutting Amounts</h3>
                <p className="text-sm text-neutral-500">Interest rates applied when creating new loans</p>
              </div>
            </div>
            <div className="space-y-4">
              {[
                { key: 'daily', label: 'Daily Cutting (%)', desc: 'Applied to daily collection loans' },
                { key: 'weekly', label: 'Weekly Cutting (%)', desc: 'Applied to weekly collection loans' },
                { key: 'monthly', label: 'Monthly Cutting (%)', desc: 'Applied to monthly collection loans' },
              ].map(item => (
                <div key={item.key}>
                  <label className="block text-sm font-semibold text-neutral-700 mb-1.5">{item.label}</label>
                  <input type="number" step="0.1"
                    value={(interestRates as any)[item.key]}
                    onChange={e => setInterestRates({ ...interestRates, [item.key]: e.target.value })}
                    className="w-full px-4 py-2.5 border border-neutral-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all" />
                  <p className="text-xs text-neutral-500 mt-1">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Agent Visibility */}
          <div className="card-modern p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-violet-50 rounded-xl"><Eye className="w-5 h-5 text-violet-600" /></div>
              <div>
                <h3 className="text-lg font-semibold text-neutral-900">Agent Visibility</h3>
                <p className="text-sm text-neutral-500">Control what agents can see in customer details</p>
              </div>
            </div>
            <div className="space-y-3">
              {visibilityItems.map(item => (
                <label key={item.key} className="flex items-center justify-between p-4 bg-neutral-50 rounded-xl cursor-pointer hover:bg-neutral-100 transition-colors">
                  <div>
                    <p className="text-sm font-medium text-neutral-900">{item.label}</p>
                    <p className="text-xs text-neutral-500 mt-0.5">{item.desc}</p>
                  </div>
                  <div className="relative">
                    <input type="checkbox"
                      checked={(agentVisibility as any)[item.key]}
                      onChange={e => setAgentVisibility({ ...agentVisibility, [item.key]: e.target.checked })}
                      className="sr-only peer" />
                    <div className="w-11 h-6 bg-neutral-300 peer-checked:bg-primary-600 rounded-full transition-colors" />
                    <div className="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow-sm peer-checked:translate-x-5 transition-transform" />
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
