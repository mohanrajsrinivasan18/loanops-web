'use client';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Bell, AlertCircle, CheckCircle } from 'lucide-react';

export default function AlertsPage() {
  const alerts = [
    { id: 1, type: 'payment_due', customer: 'Ravi Kumar', message: 'Payment overdue by 3 days', severity: 'high', date: '2024-01-28' },
    { id: 2, type: 'risk', customer: 'Suresh Babu', message: 'Customer marked as high risk', severity: 'medium', date: '2024-01-27' },
    { id: 3, type: 'collection', customer: 'Mani Ratnam', message: 'Failed collection attempt', severity: 'high', date: '2024-01-26' },
  ];

  return (
    <div className="p-4 md:p-6">
      {/* Page Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-100">Alerts & Notifications</h1>
            <p className="text-sm text-gray-600 dark:text-slate-400 mt-1">Monitor important events and escalations</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-gray-200 dark:border-slate-700">
          <div className="text-sm text-gray-600 dark:text-slate-400 mb-1">High Priority</div>
          <div className="text-2xl font-bold text-red-600">2</div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-gray-200 dark:border-slate-700">
          <div className="text-sm text-gray-600 dark:text-slate-400 mb-1">Medium Priority</div>
          <div className="text-2xl font-bold text-yellow-600">1</div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-gray-200 dark:border-slate-700">
          <div className="text-sm text-gray-600 dark:text-slate-400 mb-1">Resolved Today</div>
          <div className="text-2xl font-bold text-green-600">5</div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-gray-200 dark:border-slate-700">
          <div className="text-sm text-gray-600 dark:text-slate-400 mb-1">Total Alerts</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-slate-100">{alerts.length}</div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">Recent Alerts</h3>
        </div>
        <div className="p-6 space-y-4">
          {alerts.map((alert) => (
            <div key={alert.id} className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
              <div className={`p-2 rounded-lg ${alert.severity === 'high' ? 'bg-red-100' : 'bg-yellow-100'}`}>
                <AlertCircle className={alert.severity === 'high' ? 'text-red-600' : 'text-yellow-600'} size={20} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold text-gray-900 dark:text-slate-100">{alert.customer}</h4>
                  <Badge variant={alert.severity === 'high' ? 'danger' : 'warning'}>
                    {alert.severity}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 dark:text-slate-400">{alert.message}</p>
                <p className="text-xs text-gray-500 dark:text-slate-500 mt-1">{alert.date}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
