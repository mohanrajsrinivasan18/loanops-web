'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthProvider';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { ArrowLeft } from 'lucide-react';

export default function CreateChitPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    chitName: '',
    chitValue: '',
    duration: '',
    memberCount: '',
    monthlyAmount: '',
    startDate: new Date().toISOString().split('T')[0],
  });

  const calculateMonthlyAmount = () => {
    const value = parseFloat(formData.chitValue);
    const members = parseInt(formData.memberCount);
    if (value && members) {
      const monthly = value / members;
      setFormData({ ...formData, monthlyAmount: monthly.toFixed(2) });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.chitName || !formData.chitValue || !formData.duration || !formData.memberCount) {
      alert('Please fill all required fields');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/chits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chitName: formData.chitName,
          chitValue: parseFloat(formData.chitValue),
          duration: parseInt(formData.duration),
          memberCount: parseInt(formData.memberCount),
          monthlyAmount: parseFloat(formData.monthlyAmount),
          startDate: new Date(formData.startDate),
          tenantId: user?.tenantId,
        }),
      });

      if (!response.ok) throw new Error('Failed to create chit');

      router.push('/chits');
    } catch (error: any) {
      alert(error.message || 'Failed to create chit fund');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <Button
          variant="ghost"
          onClick={() => router.back()}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        
        {/* Fixed Save Button at Top */}
        <button
          type="submit"
          form="chit-form"
          disabled={loading}
          style={{
            display: 'block',
            visibility: 'visible',
            opacity: 1,
            zIndex: 1000,
          }}
          className="px-8 py-3 bg-blue-600 text-white text-base font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg"
        >
          {loading ? '⏳ Creating...' : '✓ Save Chit Fund'}
        </button>
      </div>

      <Card className="p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Create Chit Fund</h1>

        <form id="chit-form" onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Chit Name *</label>
            <Input
              id="chitName"
              placeholder="e.g., Chit Group A - March 2026"
              value={formData.chitName}
              onChange={(e) => setFormData({ ...formData, chitName: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Total Chit Value *</label>
              <Input
                id="chitValue"
                type="number"
                placeholder="100000"
                value={formData.chitValue}
                onChange={(e) => setFormData({ ...formData, chitValue: e.target.value })}
                onBlur={calculateMonthlyAmount}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Duration (Months) *</label>
              <Input
                id="duration"
                type="number"
                placeholder="20"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Number of Members *</label>
              <Input
                id="memberCount"
                type="number"
                placeholder="20"
                value={formData.memberCount}
                onChange={(e) => setFormData({ ...formData, memberCount: e.target.value })}
                onBlur={calculateMonthlyAmount}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Monthly Amount per Member *</label>
              <Input
                id="monthlyAmount"
                type="number"
                placeholder="5000"
                value={formData.monthlyAmount}
                onChange={(e) => setFormData({ ...formData, monthlyAmount: e.target.value })}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Start Date *</label>
            <Input
              id="startDate"
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              required
            />
          </div>

          {/* Bottom Save Button */}
          <div className="flex gap-4 pt-6 border-t-2 border-gray-200 mt-8" style={{ display: 'flex', visibility: 'visible', opacity: 1 }}>
            <button
              type="submit"
              disabled={loading}
              style={{
                display: 'block',
                visibility: 'visible',
                opacity: 1,
              }}
              className="flex-1 px-8 py-4 bg-green-600 text-white text-lg font-bold rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg hover:shadow-xl"
            >
              {loading ? '⏳ Creating...' : '✓ Save Chit Fund'}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              disabled={loading}
              className="px-8 py-4 border-2 border-gray-300 text-gray-700 text-lg font-semibold rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
}
