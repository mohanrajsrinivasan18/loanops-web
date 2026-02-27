'use client';
import { useState } from 'react';
import { Settings, DollarSign, Clock, AlertCircle, Save, Bell, Shield, Database, Users } from 'lucide-react';

export default function ConfigPage() {
  const [config, setConfig] = useState({
    interestRate: '2.0',
    gracePeriod: '3',
    lateFee: '100',
    defaultThreshold: '30',
    processingFee: '5.0',
    minLoanAmount: '10000',
    maxLoanAmount: '500000',
    smsNotifications: true,
    emailNotifications: true,
    autoReminders: true,
    companyName: 'LoanOps',
    currency: 'INR',
    timezone: 'Asia/Kolkata',
    language: 'en',
    dateFormat: 'DD/MM/YYYY',
    workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  });

  const handleSave = () => {
    // Save to localStorage or API
    localStorage.setItem('loanops-config', JSON.stringify(config));
    alert('Configuration saved successfully!');
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200">
        <div className="px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-neutral-900">System Configuration</h1>
              <p className="text-sm text-neutral-500 mt-1">Manage system settings and parameters</p>
            </div>
            <button onClick={handleSave} className="btn-primary flex items-center gap-2">
              <Save className="w-4 h-4" />
              <span>Save All Changes</span>
            </button>
          </div>
        </div>
      </div>

      <div className="p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Loan Parameters */}
          <div className="lg:col-span-2 space-y-6">
            {/* Interest & Fees */}
            <div className="card-modern p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-indigo-50 rounded-xl">
                  <DollarSign className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-neutral-900">Interest & Fees</h3>
                  <p className="text-sm text-neutral-500">Configure loan interest rates and processing fees</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Default Interest Rate (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    className="input-modern text-sm"
                    value={config.interestRate}
                    onChange={(e) => setConfig({ ...config, interestRate: e.target.value })}
                  />
                  <p className="text-xs text-neutral-500 mt-1">Applied to all new loans</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Processing Fee (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    className="input-modern text-sm"
                    value={config.processingFee}
                    onChange={(e) => setConfig({ ...config, processingFee: e.target.value })}
                  />
                  <p className="text-xs text-neutral-500 mt-1">Deducted from disbursement</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Late Payment Fee (₹)
                  </label>
                  <input
                    type="number"
                    className="input-modern text-sm"
                    value={config.lateFee}
                    onChange={(e) => setConfig({ ...config, lateFee: e.target.value })}
                  />
                  <p className="text-xs text-neutral-500 mt-1">Charged per overdue payment</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Grace Period (days)
                  </label>
                  <input
                    type="number"
                    className="input-modern text-sm"
                    value={config.gracePeriod}
                    onChange={(e) => setConfig({ ...config, gracePeriod: e.target.value })}
                  />
                  <p className="text-xs text-neutral-500 mt-1">Before late fee applies</p>
                </div>
              </div>
            </div>

            {/* Loan Limits */}
            <div className="card-modern p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-emerald-50 rounded-xl">
                  <Database className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-neutral-900">Loan Limits</h3>
                  <p className="text-sm text-neutral-500">Set minimum and maximum loan amounts</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Minimum Loan Amount (₹)
                  </label>
                  <input
                    type="number"
                    className="input-modern text-sm"
                    value={config.minLoanAmount}
                    onChange={(e) => setConfig({ ...config, minLoanAmount: e.target.value })}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Maximum Loan Amount (₹)
                  </label>
                  <input
                    type="number"
                    className="input-modern text-sm"
                    value={config.maxLoanAmount}
                    onChange={(e) => setConfig({ ...config, maxLoanAmount: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Risk Management */}
            <div className="card-modern p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-amber-50 rounded-xl">
                  <AlertCircle className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-neutral-900">Risk Management</h3>
                  <p className="text-sm text-neutral-500">Configure default thresholds and alerts</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Default Threshold (days)
                  </label>
                  <input
                    type="number"
                    className="input-modern text-sm"
                    value={config.defaultThreshold}
                    onChange={(e) => setConfig({ ...config, defaultThreshold: e.target.value })}
                  />
                  <p className="text-xs text-neutral-500 mt-1">Mark loan as defaulted after</p>
                </div>
              </div>
            </div>

            {/* Notifications */}
            <div className="card-modern p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-violet-50 rounded-xl">
                  <Bell className="w-5 h-5 text-violet-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-neutral-900">Notifications</h3>
                  <p className="text-sm text-neutral-500">Configure notification preferences</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <label className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg cursor-pointer hover:bg-neutral-100 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
                      <Bell className="w-5 h-5 text-primary-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-neutral-900">SMS Notifications</p>
                      <p className="text-xs text-neutral-500">Send SMS alerts to customers</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.smsNotifications}
                    onChange={(e) => setConfig({ ...config, smsNotifications: e.target.checked })}
                    className="w-5 h-5 text-indigo-600 border-neutral-300 rounded focus:ring-2 focus:ring-indigo-500"
                  />
                </label>

                <label className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg cursor-pointer hover:bg-neutral-100 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                      <Bell className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-neutral-900">Email Notifications</p>
                      <p className="text-xs text-neutral-500">Send email alerts to customers</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.emailNotifications}
                    onChange={(e) => setConfig({ ...config, emailNotifications: e.target.checked })}
                    className="w-5 h-5 text-indigo-600 border-neutral-300 rounded focus:ring-2 focus:ring-indigo-500"
                  />
                </label>

                <label className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg cursor-pointer hover:bg-neutral-100 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center">
                      <Clock className="w-5 h-5 text-violet-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-neutral-900">Auto Reminders</p>
                      <p className="text-xs text-neutral-500">Automatic payment reminders</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.autoReminders}
                    onChange={(e) => setConfig({ ...config, autoReminders: e.target.checked })}
                    className="w-5 h-5 text-indigo-600 border-neutral-300 rounded focus:ring-2 focus:ring-indigo-500"
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Current Settings Summary */}
          <div className="space-y-6">
            <div className="card-modern p-6 sticky top-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-neutral-100 rounded-xl">
                  <Settings className="w-5 h-5 text-neutral-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-neutral-900">Current Settings</h3>
                  <p className="text-sm text-neutral-500">Active configuration</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="p-4 bg-indigo-50 rounded-lg">
                  <p className="text-xs text-indigo-600 font-medium mb-1">Interest Rate</p>
                  <p className="text-2xl font-bold text-indigo-900">{config.interestRate}%</p>
                </div>

                <div className="p-4 bg-emerald-50 rounded-lg">
                  <p className="text-xs text-emerald-600 font-medium mb-1">Processing Fee</p>
                  <p className="text-2xl font-bold text-emerald-900">{config.processingFee}%</p>
                </div>

                <div className="space-y-3 pt-4 border-t border-neutral-200">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-neutral-600">Grace Period</span>
                    <span className="text-sm font-semibold text-neutral-900">{config.gracePeriod} days</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-neutral-600">Late Fee</span>
                    <span className="text-sm font-semibold text-neutral-900">₹{config.lateFee}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-neutral-600">Default Threshold</span>
                    <span className="text-sm font-semibold text-neutral-900">{config.defaultThreshold} days</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-neutral-600">Min Loan</span>
                    <span className="text-sm font-semibold text-neutral-900">₹{parseInt(config.minLoanAmount).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-neutral-600">Max Loan</span>
                    <span className="text-sm font-semibold text-neutral-900">₹{parseInt(config.maxLoanAmount).toLocaleString()}</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-neutral-200">
                  <p className="text-xs font-medium text-neutral-600 mb-3">Notifications</p>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-neutral-600">SMS</span>
                      <span className={`text-xs font-semibold px-2 py-1 rounded ${config.smsNotifications ? 'bg-emerald-100 text-emerald-700' : 'bg-neutral-100 text-neutral-600'}`}>
                        {config.smsNotifications ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-neutral-600">Email</span>
                      <span className={`text-xs font-semibold px-2 py-1 rounded ${config.emailNotifications ? 'bg-emerald-100 text-emerald-700' : 'bg-neutral-100 text-neutral-600'}`}>
                        {config.emailNotifications ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-neutral-600">Auto Reminders</span>
                      <span className={`text-xs font-semibold px-2 py-1 rounded ${config.autoReminders ? 'bg-emerald-100 text-emerald-700' : 'bg-neutral-100 text-neutral-600'}`}>
                        {config.autoReminders ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
