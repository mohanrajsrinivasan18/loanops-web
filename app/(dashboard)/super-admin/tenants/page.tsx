'use client';

import { useAuth } from '@/lib/AuthProvider';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { apiGet } from '@/lib/api-client';
import { Building2, Search, Filter, Plus, Eye, Edit, Ban, CheckCircle, Clock, XCircle } from 'lucide-react';

export default function TenantsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [tenants, setTenants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<any>(null);

  useEffect(() => {
    if (user?.role !== 'super_admin') {
      router.push('/dashboard');
      return;
    }
    loadTenants();
  }, [user, page, statusFilter]);

  const loadTenants = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(search && { search })
      });

      const response = await apiGet(`/api/super-admin/tenants?${params}`);
      
      if (response.success) {
        setTenants(response.tenants);
        setPagination(response.pagination);
      }
    } catch (error) {
      console.error('Failed to load tenants:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    loadTenants();
  };

  if (user?.role !== 'super_admin') return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Tenants</h1>
            <p className="text-gray-600">Manage all businesses on the platform</p>
          </div>
          <button
            onClick={() => router.push('/super-admin/tenants/new')}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            <Plus className="w-5 h-5" />
            Add Tenant
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow mb-6 p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by name, code, owner..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="trial">Trial</option>
                <option value="suspended">Suspended</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tenants Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-primary-600 mx-auto"></div>
              <p className="text-gray-600 mt-4">Loading tenants...</p>
            </div>
          ) : tenants.length === 0 ? (
            <div className="p-12 text-center">
              <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">No tenants found</p>
            </div>
          ) : (
            <>
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tenant
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Plan
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Usage
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {tenants.map((tenant) => (
                    <tr key={tenant.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center mr-3">
                            <span className="text-primary-600 font-semibold">
                              {tenant.name.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{tenant.name}</div>
                            <div className="text-sm text-gray-500">{tenant.code}</div>
                            {tenant.ownerPhone && (
                              <div className="text-xs text-gray-400">{tenant.ownerPhone}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {tenant.Subscription?.[0] ? (
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {tenant.Subscription[0].Plan.name}
                            </div>
                            <div className="text-xs text-gray-500">
                              ₹{tenant.Subscription[0].Plan.price}/mo
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">No plan</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {tenant._count.User} users, {tenant._count.Customer} customers
                        </div>
                        <div className="text-xs text-gray-500">
                          {tenant._count.Loan} loans, {tenant._count.Agent} agents, {tenant._count.Line || 0} lines
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={tenant.status} />
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(tenant.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-medium">
                        <button
                          onClick={() => router.push(`/super-admin/tenants/${tenant.id}`)}
                          className="text-primary-600 hover:text-primary-900 mr-3"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination */}
              {pagination && pagination.pages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Showing {((page - 1) * pagination.limit) + 1} to {Math.min(page * pagination.limit, pagination.total)} of {pagination.total} tenants
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

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, { bg: string; text: string; icon: any }> = {
    active: { bg: 'bg-green-100', text: 'text-green-700', icon: CheckCircle },
    trial: { bg: 'bg-blue-100', text: 'text-blue-700', icon: Clock },
    suspended: { bg: 'bg-red-100', text: 'text-red-700', icon: Ban },
    inactive: { bg: 'bg-gray-100', text: 'text-gray-700', icon: XCircle }
  };

  const style = styles[status] || styles.inactive;
  const Icon = style.icon;

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
      <Icon className="w-3 h-3" />
      {status}
    </span>
  );
}
