'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
      <Button
        variant="ghost"
        onClick={() => router.back()}
        className="mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back
      </Button>

      <Card className="p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Create Chit Fund</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="chitName">Chit Name *</Label>
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
              <Label htmlFor="chitValue">Total Chit Value *</Label>
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
              <Label htmlFor="duration">Duration (Months) *</Label>
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
              <Label htmlFor="memberCount">Number of Members *</Label>
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
              <Label htmlFor="monthlyAmount">Monthly Amount per Member *</Label>
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
            <Label htmlFor="startDate">Start Date *</Label>
            <Input
              id="startDate"
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              required
            />
          </div>

          <div className="flex gap-4">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? 'Creating...' : 'Create Chit Fund'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={loading}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
