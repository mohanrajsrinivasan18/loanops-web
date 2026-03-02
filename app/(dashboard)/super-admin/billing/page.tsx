'use client';

import { useAuth } from '@/lib/AuthProvider';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { apiGet } from '@/lib/api-client';
import { DollarSign, TrendingUp, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

export default function BillingPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<any>(null);

  useEffect(() => {
    if (user?.role !== 'super_admin') {
      router.push('/dashboard');
      return;
    }
    loadBilling();
  }, [user, page, statusFilter]);

  const loadBilling = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(statusFilter !== 'all' && { status: statusFilter })
      });

      const response = await apiGet(`/api/super-admin/billing?${params}`);
      
      if (response.success) {
        setStats(response.stats);
        setInvoices(response.invoices);
        setPagination(response.pagination);
      }
    } catch (error) {
      console.error('Failed to load billing:', error);
    } finally {
      setLoading(false);
    }
  };

  if (user?.role !== 'super_admin') return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Billing & Revenue</h1>
          <p className="text-gray-600">Monitor revenue and manage invoices</p>
        </div>

        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              title="Total Revenue"
              value={`₹${(stats.totalRevenue / 1000).toFixed(1)}K`}
              icon={<DollarSign className="w-6 h-6" />}
              color="green"
            />
            <StatCard
              title="This Month"
              value={`₹${(stats.monthlyRevenue / 1000).toFixed(1)}K`}
              icon={<TrendingUp className="w-6 h-6" />}
              color="blue"
            />
            <StatCard
              title="Pending"
              value={`₹${(stats.pendingAmount / 1000).toFixed(1)}K`}
              subtitle={`${stats.pendingInvoices} invoices`}
              icon={<Clock className="w-6 h-6" />}
              color="orange"
            />
            <StatCard
              title="Paid Invoices"
              value={stats.paidInvoices}
              subtitle={`${stats.failedInvoices} failed`}
              icon={<CheckCircle className="w-6 h-6" />}
              color="purple"
            />
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow mb-6 p-4">
          <div className="flex gap-2">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-4 py-2 rounded-lg ${
                statusFilter === 'all'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setStatusFilter('pending')}
              className={`px-4 py-2 rounded-lg ${
                statusFilter === 'pending'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => setStatusFilter('paid')}
              className={`px-4 py-2 rounded-lg ${
                statusFilter === 'paid'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Paid
            </button>
            <button
              onClick={() => setStatusFilter('failed')}
              className={`px-4 py-2 rounded-lg ${
                statusFilter === 'failed'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Failed
            </button>
          </div>
        </div>

        {/* Invoices Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-primary-600 mx-auto"></div>
              <p className="text-gray-600 mt-4">Loading invoices...</p>
            </div>
          ) : invoices.length === 0 ? (
            <div className="p-12 text-center">
              <DollarSign className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">No invoices found</p>
            </div>
          ) : (
            <>
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Invoice
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Tenant
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Plan
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {invoices.map((invoice) => (
                    <tr key={invoice.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {invoice.invoiceNumber}
                        </div>
                        {invoice.paymentMethod && (
                          <div className="text-xs text-gray-500">{invoice.paymentMethod}</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{invoice.Tenant.name}</div>
                        <div className="text-xs text-gray-500">{invoice.Tenant.code}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {invoice.Subscription?.Plan?.name || 'N/A'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          ₹{invoice.totalAmount.toLocaleString()}
                        </div>
                        {invoice.tax > 0 && (
                          <div className="text-xs text-gray-500">
                            +₹{invoice.tax} tax
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <InvoiceStatusBadge status={invoice.status} />
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {invoice.status === 'paid' && invoice.paidDate
                          ? new Date(invoice.paidDate).toLocaleDateString()
                          : new Date(invoice.dueDate).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination */}
              {pagination && pagination.pages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Showing {((page - 1) * pagination.limit) + 1} to {Math.min(page * pagination.limit, pagination.total)} of {pagination.total} invoices
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="px-3 py-1 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
                      disabled={page === pagination.pages}
                      className="px-3 py-1 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, subtitle, icon, color }: any) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600'
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className={`inline-flex p-3 rounded-lg mb-4 ${colors[color] || colors.blue}`}>
        {icon}
      </div>
      <h3 className="text-gray-600 text-sm font-medium mb-1">{title}</h3>
      <p className="text-3xl font-bold text-gray-900 mb-1">{value}</p>
      {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
    </div>
  );
}

function InvoiceStatusBadge({ status }: { status: string }) {
  const styles: Record<string, { bg: string; text: string; icon: any }> = {
    paid: { bg: 'bg-green-100', text: 'text-green-700', icon: CheckCircle },
    pending: { bg: 'bg-orange-100', text: 'text-orange-700', icon: Clock },
    failed: { bg: 'bg-red-100', text: 'text-red-700', icon: XCircle },
    cancelled: { bg: 'bg-gray-100', text: 'text-gray-700', icon: AlertCircle }
  };

  const style = styles[status] || styles.pending;
  const Icon = style.icon;

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
      <Icon className="w-3 h-3" />
      {status}
    </span>
  );
}
