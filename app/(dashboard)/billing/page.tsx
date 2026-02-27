'use client';
import { useAuth } from '@/lib/AuthProvider';
import { useRouter } from 'next/navigation';
import { 
  DollarSign, 
  Clock, 
  FileText, 
  Download, 
  Eye, 
  CreditCard,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Calendar,
  Building2,
  Check,
  X
} from 'lucide-react';

interface Invoice {
  id: string;
  tenant: string;
  plan: string;
  amount: number;
  status: 'paid' | 'pending' | 'overdue';
  date: string;
  dueDate: string;
}

const mockInvoices: Invoice[] = [
  {
    id: 'INV-001',
    tenant: 'Mumbai Branch',
    plan: 'Enterprise',
    amount: 19999,
    status: 'paid',
    date: '2024-11-01',
    dueDate: '2024-11-15',
  },
  {
    id: 'INV-002',
    tenant: 'Delhi Branch',
    plan: 'Professional',
    amount: 7999,
    status: 'paid',
    date: '2024-11-01',
    dueDate: '2024-11-15',
  },
  {
    id: 'INV-003',
    tenant: 'Bangalore Branch',
    plan: 'Enterprise',
    amount: 19999,
    status: 'pending',
    date: '2024-11-01',
    dueDate: '2024-11-15',
  },
  {
    id: 'INV-004',
    tenant: 'Chennai Branch',
    plan: 'Professional',
    amount: 7999,
    status: 'paid',
    date: '2024-10-01',
    dueDate: '2024-10-15',
  },
  {
    id: 'INV-005',
    tenant: 'Kolkata Branch',
    plan: 'Professional',
    amount: 7999,
    status: 'overdue',
    date: '2024-10-01',
    dueDate: '2024-10-15',
  },
];

export default function BillingPage() {
  const { user } = useAuth();
  const router = useRouter();

  // Redirect if not super admin
  if (user?.role !== 'super_admin') {
    router.push('/dashboard');
    return null;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'badge-success';
      case 'pending': return 'bg-amber-50 text-amber-700 border border-amber-200';
      case 'overdue': return 'badge-danger';
      default: return 'bg-neutral-100 text-neutral-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid': return <CheckCircle className="w-4 h-4" />;
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'overdue': return <AlertCircle className="w-4 h-4" />;
      default: return null;
    }
  };

  const totalRevenue = mockInvoices
    .filter(i => i.status === 'paid')
    .reduce((sum, i) => sum + i.amount, 0);
  
  const pendingRevenue = mockInvoices
    .filter(i => i.status === 'pending')
    .reduce((sum, i) => sum + i.amount, 0);

  const overdueRevenue = mockInvoices
    .filter(i => i.status === 'overdue')
    .reduce((sum, i) => sum + i.amount, 0);

  const plans = [
    {
      name: 'Starter',
      price: 2999,
      color: 'amber',
      popular: false,
      features: [
        'Up to 5 users',
        '500 customers',
        'Basic reports',
        'Email support',
        '10 GB storage',
      ],
      notIncluded: [
        'API access',
        'White-label',
        'Dedicated server',
      ]
    },
    {
      name: 'Professional',
      price: 7999,
      color: 'indigo',
      popular: true,
      features: [
        'Up to 20 users',
        '2,000 customers',
        'Advanced reports',
        'Priority support',
        'API access',
        '50 GB storage',
        'Custom branding',
      ],
      notIncluded: [
        'Dedicated server',
      ]
    },
    {
      name: 'Enterprise',
      price: 19999,
      color: 'violet',
      popular: false,
      features: [
        'Unlimited users',
        'Unlimited customers',
        'Custom reports',
        '24/7 support',
        'Full API access',
        'White-label',
        'Dedicated server',
        'Unlimited storage',
        'Custom integrations',
      ],
      notIncluded: []
    },
  ];

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200">
        <div className="px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-neutral-900">Billing & Invoices</h1>
              <p className="text-sm text-neutral-500 mt-1">Manage subscriptions and billing across all tenants</p>
            </div>
            <button className="btn-primary flex items-center gap-2">
              <Download className="w-4 h-4" />
              <span>Export All</span>
            </button>
          </div>
        </div>
      </div>

      <div className="p-8">
        {/* Revenue Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="stat-card">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-emerald-50 rounded-xl">
                <DollarSign className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
            <p className="text-sm text-neutral-500 mb-1">Total Revenue</p>
            <p className="text-2xl font-bold text-neutral-900">₹{totalRevenue.toLocaleString()}</p>
            <p className="text-xs text-emerald-600 mt-2">This month</p>
          </div>

          <div className="stat-card">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-amber-50 rounded-xl">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
            </div>
            <p className="text-sm text-neutral-500 mb-1">Pending Payments</p>
            <p className="text-2xl font-bold text-amber-600">₹{pendingRevenue.toLocaleString()}</p>
            <p className="text-xs text-neutral-500 mt-2">Awaiting payment</p>
          </div>

          <div className="stat-card">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-rose-50 rounded-xl">
                <AlertCircle className="w-5 h-5 text-rose-600" />
              </div>
            </div>
            <p className="text-sm text-neutral-500 mb-1">Overdue</p>
            <p className="text-2xl font-bold text-rose-600">₹{overdueRevenue.toLocaleString()}</p>
            <p className="text-xs text-neutral-500 mt-2">Requires action</p>
          </div>

          <div className="stat-card">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-primary-50 rounded-xl">
                <FileText className="w-5 h-5 text-primary-600" />
              </div>
            </div>
            <p className="text-sm text-neutral-500 mb-1">Total Invoices</p>
            <p className="text-2xl font-bold text-neutral-900">{mockInvoices.length}</p>
            <p className="text-xs text-neutral-500 mt-2">All time</p>
          </div>
        </div>

        {/* Pricing Plans */}
        <div className="mb-8">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-neutral-900">Pricing Plans</h2>
            <p className="text-sm text-neutral-500 mt-1">Choose the right plan for your branch</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan, index) => (
              <div 
                key={index}
                className={`card-modern overflow-hidden hover:shadow-xl transition-all ${
                  plan.popular ? 'ring-2 ring-primary-500' : ''
                }`}
              >
                {plan.popular && (
                  <div className="bg-gradient-to-r from-primary-500 to-primary-600 text-white text-center py-2 text-sm font-semibold">
                    Most Popular
                  </div>
                )}
                <div className="p-6">
                  <div className="text-center mb-6">
                    <h4 className="text-xl font-bold text-neutral-900 mb-2">{plan.name}</h4>
                    <div className="flex items-baseline justify-center gap-1 mb-1">
                      <span className="text-4xl font-bold text-neutral-900">₹{plan.price.toLocaleString()}</span>
                    </div>
                    <p className="text-sm text-neutral-500">per month</p>
                  </div>
                  
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Check className="w-3 h-3 text-emerald-600" />
                        </div>
                        <span className="text-sm text-neutral-700">{feature}</span>
                      </li>
                    ))}
                    {plan.notIncluded.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-3 opacity-40">
                        <div className="w-5 h-5 rounded-full bg-neutral-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <X className="w-3 h-3 text-neutral-400" />
                        </div>
                        <span className="text-sm text-neutral-500">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <button className={`w-full ${plan.popular ? 'btn-primary' : 'btn-secondary'} text-sm`}>
                    Select Plan
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Invoices Table */}
        <div className="card-modern overflow-hidden">
          <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-neutral-900">Recent Invoices</h3>
              <p className="text-sm text-neutral-500">All billing transactions</p>
            </div>
            <div className="flex items-center gap-3">
              <select className="input-modern text-sm">
                <option>All Status</option>
                <option>Paid</option>
                <option>Pending</option>
                <option>Overdue</option>
              </select>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="table-modern">
              <thead>
                <tr>
                  <th>Invoice ID</th>
                  <th>Tenant</th>
                  <th>Plan</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Due Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {mockInvoices.map((invoice) => (
                  <tr key={invoice.id}>
                    <td>
                      <span className="font-mono text-sm font-medium text-neutral-900">
                        {invoice.id}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
                          <Building2 className="w-4 h-4 text-white" />
                        </div>
                        <span className="font-medium text-neutral-900">{invoice.tenant}</span>
                      </div>
                    </td>
                    <td>
                      <span className="text-sm text-neutral-600">{invoice.plan}</span>
                    </td>
                    <td>
                      <span className="font-semibold text-neutral-900">₹{invoice.amount.toLocaleString()}</span>
                    </td>
                    <td>
                      <span className={`badge-modern ${getStatusColor(invoice.status)} flex items-center gap-1 w-fit`}>
                        {getStatusIcon(invoice.status)}
                        {invoice.status}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-2 text-sm text-neutral-600">
                        <Calendar className="w-4 h-4" />
                        {new Date(invoice.date).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric', 
                          year: 'numeric' 
                        })}
                      </div>
                    </td>
                    <td>
                      <div className="text-sm text-neutral-600">
                        {new Date(invoice.dueDate).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric', 
                          year: 'numeric' 
                        })}
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <button className="p-2 rounded-lg hover:bg-neutral-100 transition-colors">
                          <Eye className="w-4 h-4 text-neutral-600" />
                        </button>
                        <button className="p-2 rounded-lg hover:bg-neutral-100 transition-colors">
                          <Download className="w-4 h-4 text-neutral-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
