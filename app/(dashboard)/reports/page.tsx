'use client';
import { useState } from 'react';
import { useAuth } from '@/lib/AuthProvider';
import { useTenant } from '@/lib/contexts/TenantContext';
import {
  FileText, Download, Users, DollarSign,
  BarChart3, Loader2, Printer, Wallet, GitBranch,
} from 'lucide-react';

const fmt = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0);

const fmtDate = (d: Date) =>
  d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

export default function ReportsPage() {
  const { user } = useAuth();
  const { selectedTenant } = useTenant();
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [generating, setGenerating] = useState<string | null>(null);

  const tenantId = selectedTenant?.id || user?.tenantId;
  const tenantName = (user as any)?.tenant?.name || selectedTenant?.name || 'LoanOps';

  const reportTypes = [
    { id: 'collection', title: 'Collection Report', desc: 'Every collection row — paid, not paid, pending — for the period', icon: DollarSign, bg: 'bg-emerald-50', ic: 'text-emerald-600' },
    { id: 'line', title: 'Line-wise Report', desc: 'All lines with daily/weekly/monthly collection data per line', icon: GitBranch, bg: 'bg-primary-50', ic: 'text-primary-600' },
    { id: 'loan', title: 'Loan Portfolio', desc: 'All active loans with customer, amount, outstanding, status', icon: Wallet, bg: 'bg-primary-50', ic: 'text-primary-600' },
    { id: 'agent', title: 'Agent Performance', desc: 'Agent-wise collection totals and efficiency', icon: Users, bg: 'bg-amber-50', ic: 'text-amber-600' },
    { id: 'financial', title: 'Financial Summary', desc: 'Disbursed, collected, outstanding overview', icon: BarChart3, bg: 'bg-primary-50', ic: 'text-primary-600' },
  ];

  const getPeriodDays = () => {
    if (selectedPeriod === 'today') return 1;
    if (selectedPeriod === '7d') return 7;
    if (selectedPeriod === '30d') return 30;
    return 90;
  };

  const getPeriodLabel = () => {
    if (selectedPeriod === 'today') return 'Today';
    if (selectedPeriod === '7d') return 'Last 7 Days';
    if (selectedPeriod === '30d') return 'Last 30 Days';
    return 'Last 90 Days';
  };

  // Fetch all collections for a date range
  const fetchAllCollections = async (days: number) => {
    const allCollections: any[] = [];
    const today = new Date();
    // Fetch day by day for accuracy
    const batchSize = Math.min(days, 90);
    for (let i = 0; i < batchSize; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      try {
        const res = await fetch(`/api/collections?tenantId=${tenantId}&date=${dateStr}&limit=1000`);
        const data = await res.json();
        const cols = data.data || [];
        cols.forEach((c: any) => { c._date = dateStr; });
        allCollections.push(...cols);
      } catch { /* skip failed dates */ }
    }
    return allCollections;
  };

  const pdfStyles = `
    @page { margin: 12mm 10mm; size: A4 landscape; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Courier New', monospace; color: #000; background: #fff; font-size: 11px; line-height: 1.4; }
    .page { padding: 8px; }
    h1 { font-size: 16px; font-weight: bold; margin-bottom: 2px; }
    .meta { font-size: 10px; color: #555; margin-bottom: 12px; }
    .summary { margin-bottom: 12px; }
    .summary span { margin-right: 20px; font-weight: bold; }
    table { width: 100%; border-collapse: collapse; font-size: 10px; }
    th { background: #f0f0f0; border: 1px solid #ccc; padding: 4px 6px; text-align: left; font-weight: bold; font-size: 9px; text-transform: uppercase; }
    td { border: 1px solid #ddd; padding: 3px 6px; }
    tr:nth-child(even) { background: #fafafa; }
    .paid { color: #059669; font-weight: bold; }
    .not-paid { color: #dc2626; font-weight: bold; }
    .pending { color: #d97706; font-weight: bold; }
    .right { text-align: right; }
    .footer { margin-top: 12px; font-size: 9px; color: #999; text-align: center; border-top: 1px solid #ddd; padding-top: 6px; }
    .section { margin-top: 16px; font-size: 13px; font-weight: bold; border-bottom: 2px solid #000; padding-bottom: 2px; margin-bottom: 6px; }
    @media print { body { font-size: 10px; } }
  `;

  const openPdf = (title: string, html: string) => {
    const w = window.open('', '_blank');
    if (w) {
      w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${tenantName} - ${title}</title><style>${pdfStyles}</style></head><body><div class="page">${html}</div></body></html>`);
      w.document.close();
      setTimeout(() => w.print(), 400);
    }
  };

  const makeHeader = (title: string) => `
    <h1>${tenantName} — ${title}</h1>
    <div class="meta">Generated: ${fmtDate(new Date())} | Period: ${getPeriodLabel()} | Printed by: ${user?.name || 'Admin'}</div>
  `;

  const generateReport = async (type: string) => {
    try {
      setGenerating(type);
      const params = new URLSearchParams();
      if (tenantId) params.append('tenantId', tenantId);
      params.append('period', selectedPeriod);

      if (type === 'collection') {
        // Fetch ALL collections for the period — every single row
        const collections = await fetchAllCollections(getPeriodDays());
        const paid = collections.filter(c => c.status === 'collected' || c.status === 'paid');
        const notPaid = collections.filter(c => c.status === 'not_paid');
        const pending = collections.filter(c => c.status === 'pending');
        const totalCollected = paid.reduce((s, c) => s + (c.collectedAmount || c.amount || 0), 0);
        const totalDue = collections.reduce((s, c) => s + (c.amount || 0), 0);

        // Sort by date desc, then customer name
        collections.sort((a, b) => (b._date || '').localeCompare(a._date || '') || (a.Customer?.name || '').localeCompare(b.Customer?.name || ''));

        let rows = collections.map((c, i) => {
          const st = (c.status === 'collected' || c.status === 'paid') ? 'paid' : c.status === 'not_paid' ? 'not-paid' : 'pending';
          const stLabel = st === 'paid' ? 'PAID' : st === 'not-paid' ? 'NOT PAID' : 'PENDING';
          return `<tr>
            <td>${i + 1}</td>
            <td>${c._date}</td>
            <td>${c.Customer?.name || '-'}</td>
            <td>${c.Customer?.phone || '-'}</td>
            <td>${c.Customer?.Line?.name || '-'}</td>
            <td class="right">${fmt(c.amount)}</td>
            <td class="right">${c.collectedAmount ? fmt(c.collectedAmount) : '-'}</td>
            <td>${c.method && c.method !== 'pending' ? c.method.toUpperCase() : '-'}</td>
            <td class="${st}">${stLabel}</td>
            <td>${c.notes || ''}</td>
          </tr>`;
        }).join('');

        const html = `${makeHeader('Collection Report')}
          <div class="summary">
            <span>Total: ${collections.length} records</span>
            <span>Paid: ${paid.length}</span>
            <span>Not Paid: ${notPaid.length}</span>
            <span>Pending: ${pending.length}</span>
            <span>Collected: ${fmt(totalCollected)}</span>
            <span>Total Due: ${fmt(totalDue)}</span>
          </div>
          <table>
            <thead><tr><th>#</th><th>Date</th><th>Customer</th><th>Phone</th><th>Line</th><th>Due</th><th>Collected</th><th>Method</th><th>Status</th><th>Notes</th></tr></thead>
            <tbody>${rows || '<tr><td colspan="10" style="text-align:center;padding:12px;">No data</td></tr>'}</tbody>
          </table>
          <div class="footer">${tenantName} — Collection Report — ${fmtDate(new Date())} — Confidential</div>`;
        openPdf('Collection Report', html);

      } else if (type === 'line') {
        // Fetch lines + collections per line
        const [linesRes, ...rest] = await Promise.all([fetch(`/api/lines?tenantId=${tenantId}`)]);
        const linesData = await linesRes.json();
        const lines = linesData.data || [];
        const collections = await fetchAllCollections(getPeriodDays());

        let lineHtml = '';
        for (const line of lines) {
          const lineCols = collections.filter(c => (c.Customer?.lineId || c.Customer?.Line?.id) === line.id);
          const linePaid = lineCols.filter(c => c.status === 'collected' || c.status === 'paid');
          const lineNotPaid = lineCols.filter(c => c.status === 'not_paid');
          const lineCollected = linePaid.reduce((s: number, c: any) => s + (c.collectedAmount || c.amount || 0), 0);
          const typeLabel = line.type === 'weekly' && line.weeklyDay ? `Weekly (${line.weeklyDay})` : line.type;

          lineCols.sort((a: any, b: any) => (b._date || '').localeCompare(a._date || ''));

          let rows = lineCols.map((c: any, i: number) => {
            const st = (c.status === 'collected' || c.status === 'paid') ? 'paid' : c.status === 'not_paid' ? 'not-paid' : 'pending';
            return `<tr><td>${c._date}</td><td>${c.Customer?.name || '-'}</td><td class="right">${fmt(c.amount)}</td><td class="right">${c.collectedAmount ? fmt(c.collectedAmount) : '-'}</td><td class="${st}">${st === 'paid' ? 'PAID' : st === 'not-paid' ? 'NOT PAID' : 'PENDING'}</td></tr>`;
          }).join('');

          lineHtml += `
            <div class="section">${line.name} — ${line.area} — ${typeLabel} (${lineCols.length} records, Collected: ${fmt(lineCollected)}, Not Paid: ${lineNotPaid.length})</div>
            <table><thead><tr><th>Date</th><th>Customer</th><th>Due</th><th>Collected</th><th>Status</th></tr></thead>
            <tbody>${rows || '<tr><td colspan="5" style="text-align:center;">No collections</td></tr>'}</tbody></table>`;
        }

        const html = `${makeHeader('Line-wise Report')}
          <div class="summary"><span>Lines: ${lines.length}</span><span>Total Collections: ${collections.length}</span></div>
          ${lineHtml}
          <div class="footer">${tenantName} — Line Report — ${fmtDate(new Date())} — Confidential</div>`;
        openPdf('Line Report', html);

      } else if (type === 'loan') {
        const loansRes = await fetch(`/api/loans?tenantId=${tenantId}&limit=1000`);
        const loansRaw = await loansRes.json();
        const loans = loansRaw.data || [];

        let rows = loans.map((l: any, i: number) => {
          const st = l.status === 'active' ? 'paid' : l.status === 'completed' ? 'pending' : 'not-paid';
          return `<tr>
            <td>${i + 1}</td>
            <td>${l.customer?.name || l.Customer?.name || '-'}</td>
            <td>${l.customer?.phone || l.Customer?.phone || '-'}</td>
            <td>${l.customer?.Line?.name || l.Customer?.Line?.name || '-'}</td>
            <td>${(l.loanType || '-').toUpperCase()}</td>
            <td class="right">${fmt(l.amount)}</td>
            <td class="right">${fmt(l.outstanding)}</td>
            <td class="right">${fmt((l.amount || 0) - (l.outstanding || 0))}</td>
            <td class="${st}">${(l.status || '-').toUpperCase()}</td>
            <td>${l.createdAt ? l.createdAt.split('T')[0] : '-'}</td>
          </tr>`;
        }).join('');

        const totalAmt = loans.reduce((s: number, l: any) => s + (l.amount || 0), 0);
        const totalOut = loans.reduce((s: number, l: any) => s + (l.outstanding || 0), 0);

        const html = `${makeHeader('Loan Portfolio')}
          <div class="summary"><span>Total Loans: ${loans.length}</span><span>Disbursed: ${fmt(totalAmt)}</span><span>Outstanding: ${fmt(totalOut)}</span><span>Collected: ${fmt(totalAmt - totalOut)}</span></div>
          <table><thead><tr><th>#</th><th>Customer</th><th>Phone</th><th>Line</th><th>Type</th><th>Amount</th><th>Outstanding</th><th>Collected</th><th>Status</th><th>Date</th></tr></thead>
          <tbody>${rows || '<tr><td colspan="10" style="text-align:center;">No loans</td></tr>'}</tbody></table>
          <div class="footer">${tenantName} — Loan Portfolio — ${fmtDate(new Date())} — Confidential</div>`;
        openPdf('Loan Portfolio', html);

      } else if (type === 'agent') {
        const agentsRes = await fetch(`/api/agents/top?${params.toString()}`);
        const agentsRaw = await agentsRes.json();
        const agents = Array.isArray(agentsRaw.data) ? agentsRaw.data : Array.isArray(agentsRaw) ? agentsRaw : [];

        let rows = agents.map((a: any, i: number) =>
          `<tr><td>${i + 1}</td><td>${a.name || '-'}</td><td>${a.phone || '-'}</td><td>${a.customersCount || 0}</td><td class="right">${fmt(a.totalCollected || 0)}</td><td class="${(a.collectionRate || 0) >= 80 ? 'paid' : (a.collectionRate || 0) >= 50 ? 'pending' : 'not-paid'}">${Math.round(a.collectionRate || 0)}%</td></tr>`
        ).join('');

        const html = `${makeHeader('Agent Performance')}
          <div class="summary"><span>Agents: ${agents.length}</span><span>Total Collected: ${fmt(agents.reduce((s: number, a: any) => s + (a.totalCollected || 0), 0))}</span></div>
          <table><thead><tr><th>#</th><th>Agent</th><th>Phone</th><th>Customers</th><th>Collected</th><th>Rate</th></tr></thead>
          <tbody>${rows || '<tr><td colspan="6" style="text-align:center;">No agents</td></tr>'}</tbody></table>
          <div class="footer">${tenantName} — Agent Report — ${fmtDate(new Date())} — Confidential</div>`;
        openPdf('Agent Performance', html);

      } else {
        // Financial summary
        const dashRes = await fetch(`/api/dashboard?${params.toString()}`);
        const dashRaw = await dashRes.json();
        const d = dashRaw.data || dashRaw;
        const fin = d?.financial || {};

        const html = `${makeHeader('Financial Summary')}
          <table><thead><tr><th>Metric</th><th>Value</th></tr></thead>
          <tbody>
            <tr><td>Total Customers</td><td class="right">${d?.customers?.total || 0}</td></tr>
            <tr><td>Active Loans</td><td class="right">${d?.loans?.active || 0}</td></tr>
            <tr><td>Completed Loans</td><td class="right">${d?.loans?.completed || 0}</td></tr>
            <tr><td>Total Disbursed</td><td class="right">${fmt(fin.totalDisbursed || 0)}</td></tr>
            <tr><td>Total Collected</td><td class="right paid">${fmt(fin.totalCollected || 0)}</td></tr>
            <tr><td>Total Outstanding</td><td class="right not-paid">${fmt(fin.totalOutstanding || 0)}</td></tr>
            <tr><td>Recovery Rate</td><td class="right">${fin.totalDisbursed > 0 ? Math.round(((fin.totalCollected || 0) / fin.totalDisbursed) * 100) : 0}%</td></tr>
            <tr><td>Total Agents</td><td class="right">${d?.agents?.total || 0}</td></tr>
          </tbody></table>
          <div class="footer">${tenantName} — Financial Summary — ${fmtDate(new Date())} — Confidential</div>`;
        openPdf('Financial Summary', html);
      }
    } catch (e: any) {
      console.error('Report error:', e);
      alert('Failed to generate report');
    } finally {
      setGenerating(null);
    }
  };

  // CSV export with actual collection data
  const exportCSV = async () => {
    try {
      setGenerating('csv');
      const collections = await fetchAllCollections(getPeriodDays());
      collections.sort((a, b) => (b._date || '').localeCompare(a._date || ''));
      const csvRows = [
        ['Date', 'Customer', 'Phone', 'Line', 'Due Amount', 'Collected', 'Method', 'Status', 'Notes'].join(','),
        ...collections.map(c => [
          c._date,
          `"${(c.Customer?.name || '-').replace(/"/g, '""')}"`,
          c.Customer?.phone || '-',
          `"${(c.Customer?.Line?.name || '-').replace(/"/g, '""')}"`,
          c.amount || 0,
          c.collectedAmount || 0,
          c.method || '-',
          c.status || '-',
          `"${(c.notes || '').replace(/"/g, '""')}"`,
        ].join(','))
      ];
      const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `collections-${selectedPeriod}-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (e) { alert('Failed to export CSV'); }
    finally { setGenerating(null); }
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="bg-white border-b border-neutral-100">
        <div className="px-8 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">Reports</h1>
              <p className="text-sm text-neutral-500 mt-1">Generate data reports with every row of collection data</p>
            </div>
            <button onClick={exportCSV} disabled={generating === 'csv'} className="btn-outline flex items-center gap-2 text-sm">
              {generating === 'csv' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} Export CSV
            </button>
          </div>
          <div className="bg-neutral-100 rounded-xl p-1 inline-flex gap-1">
            {[
              { key: 'today', label: 'Today' },
              { key: '7d', label: '7 Days' },
              { key: '30d', label: '30 Days' },
              { key: '90d', label: '90 Days' },
            ].map(p => (
              <button key={p.key} onClick={() => setSelectedPeriod(p.key)}
                className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${selectedPeriod === p.key ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'}`}>
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="p-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {reportTypes.map((r, i) => (
            <button key={r.id} onClick={() => generateReport(r.id)} disabled={generating !== null}
              className={`card-modern p-6 text-left hover:shadow-card-hover transition-all animate-slide-up ${generating !== null ? 'opacity-60' : ''}`}
              style={{ animationDelay: `${i * 0.05}s` }}>
              <div className="flex items-start gap-4">
                <div className={`p-3 ${r.bg} rounded-xl`}>
                  <r.icon className={`w-6 h-6 ${r.ic}`} />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-neutral-900 mb-1">{r.title}</h3>
                  <p className="text-sm text-neutral-500">{r.desc}</p>
                </div>
                {generating === r.id ? (
                  <Loader2 className="w-5 h-5 text-primary-600 animate-spin" />
                ) : (
                  <div className="p-2 bg-neutral-100 rounded-lg"><Printer className="w-4 h-4 text-neutral-600" /></div>
                )}
              </div>
            </button>
          ))}
        </div>

        <div className="bg-primary-50 border border-primary-200 rounded-xl p-4 flex items-start gap-3">
          <FileText className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-primary-700">Reports use monospace font and plain table layout for clean PDF printing. Every collection record is included as a row — no summaries only. Use Ctrl+P / Cmd+P to save as PDF from the print dialog.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
