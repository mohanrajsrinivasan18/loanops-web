'use client';

import { useAuth } from '@/lib/AuthProvider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Activity } from 'lucide-react';

export default function UsagePage() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user?.role !== 'super_admin') {
      router.push('/dashboard');
    }
  }, [user]);

  if (user?.role !== 'super_admin') return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Usage & Limits</h1>
          <p className="text-gray-600">Monitor tenant usage and enforce limits</p>
        </div>

        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Activity className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Coming Soon</h2>
          <p className="text-gray-600">Usage tracking and limit monitoring will be available here.</p>
          <p className="text-sm text-gray-500 mt-2">For now, you can view and edit limits in the Tenant Details page.</p>
        </div>
      </div>
    </div>
  );
}
