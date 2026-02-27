'use client';
import { useState } from 'react';
import PageHeader from '@/components/PageHeader';
import { Card } from '@/components/ui/Card';
import Input from '@/components/ui/Input';

export default function SystemConfigPage() {
  const [config, setConfig] = useState({
    systemName: 'VattiOps',
    supportEmail: 'support@vattiops.com',
    maxTenantsPerPlan: {
      starter: 1,
      professional: 5,
      enterprise: 999,
    },
    defaultCurrency: 'INR',
    maintenanceMode: false,
    allowSignups: true,
    emailNotifications: true,
    smsNotifications: true,
  });

  const handleSave = () => {
    alert('Configuration saved successfully!');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="System Configuration"
        description="Global system settings and preferences"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* General Settings */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">General Settings</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                System Name
              </label>
              <Input
                value={config.systemName}
                onChange={(e) => setConfig({ ...config, systemName: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Support Email
              </label>
              <Input
                type="email"
                value={config.supportEmail}
                onChange={(e) => setConfig({ ...config, supportEmail: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Default Currency
              </label>
              <select
                value={config.defaultCurrency}
                onChange={(e) => setConfig({ ...config, defaultCurrency: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="INR">INR (₹)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Plan Limits */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Plan Limits</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Starter Plan - Max Tenants
              </label>
              <Input
                type="number"
                value={config.maxTenantsPerPlan.starter}
                onChange={(e) => setConfig({
                  ...config,
                  maxTenantsPerPlan: { ...config.maxTenantsPerPlan, starter: parseInt(e.target.value) }
                })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Professional Plan - Max Tenants
              </label>
              <Input
                type="number"
                value={config.maxTenantsPerPlan.professional}
                onChange={(e) => setConfig({
                  ...config,
                  maxTenantsPerPlan: { ...config.maxTenantsPerPlan, professional: parseInt(e.target.value) }
                })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enterprise Plan - Max Tenants
              </label>
              <Input
                type="number"
                value={config.maxTenantsPerPlan.enterprise}
                onChange={(e) => setConfig({
                  ...config,
                  maxTenantsPerPlan: { ...config.maxTenantsPerPlan, enterprise: parseInt(e.target.value) }
                })}
              />
            </div>
          </div>
        </Card>

        {/* System Toggles */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">System Toggles</h3>
          <div className="space-y-4">
            <label className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Maintenance Mode</span>
              <input
                type="checkbox"
                checked={config.maintenanceMode}
                onChange={(e) => setConfig({ ...config, maintenanceMode: e.target.checked })}
                className="w-5 h-5 text-primary-600 rounded focus:ring-2 focus:ring-primary-500"
              />
            </label>
            <label className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Allow New Signups</span>
              <input
                type="checkbox"
                checked={config.allowSignups}
                onChange={(e) => setConfig({ ...config, allowSignups: e.target.checked })}
                className="w-5 h-5 text-primary-600 rounded focus:ring-2 focus:ring-primary-500"
              />
            </label>
            <label className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Email Notifications</span>
              <input
                type="checkbox"
                checked={config.emailNotifications}
                onChange={(e) => setConfig({ ...config, emailNotifications: e.target.checked })}
                className="w-5 h-5 text-primary-600 rounded focus:ring-2 focus:ring-primary-500"
              />
            </label>
            <label className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">SMS Notifications</span>
              <input
                type="checkbox"
                checked={config.smsNotifications}
                onChange={(e) => setConfig({ ...config, smsNotifications: e.target.checked })}
                className="w-5 h-5 text-primary-600 rounded focus:ring-2 focus:ring-primary-500"
              />
            </label>
          </div>
        </Card>

        {/* Security Settings */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Security Settings</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Session Timeout (minutes)
              </label>
              <Input type="number" defaultValue="30" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password Min Length
              </label>
              <Input type="number" defaultValue="8" />
            </div>
            <label className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Require 2FA</span>
              <input
                type="checkbox"
                className="w-5 h-5 text-primary-600 rounded focus:ring-2 focus:ring-primary-500"
              />
            </label>
            <label className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">IP Whitelist</span>
              <input
                type="checkbox"
                className="w-5 h-5 text-primary-600 rounded focus:ring-2 focus:ring-primary-500"
              />
            </label>
          </div>
        </Card>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          className="px-8 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition font-medium"
        >
          Save Configuration
        </button>
      </div>
    </div>
  );
}
