'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Users, Calendar, TrendingUp } from 'lucide-react';

interface Chit {
  id: string;
  chitName: string;
  chitValue: number;
  duration: number;
  memberCount: number;
  monthlyAmount: number;
  status: string;
  startDate: string;
  _count?: {
    ChitMembers: number;
    ChitAuctions: number;
  };
}

export default function ChitsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [chits, setChits] = useState<Chit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChits();
  }, [user?.tenantId]);

  const loadChits = async () => {
    if (!user?.tenantId) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/chits?tenantId=${user.tenantId}`);
      const data = await response.json();
      setChits(data.data || []);
    } catch (error) {
      console.error('Error loading chits:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Chit Funds</h1>
          <p className="text-gray-600 mt-1">Manage chit fund groups and auctions</p>
        </div>
        <Button onClick={() => router.push('/chits/create')}>
          <Plus className="w-4 h-4 mr-2" />
          Create Chit Fund
        </Button>
      </div>

      {chits.length === 0 ? (
        <Card className="p-12 text-center">
          <Users className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Chit Funds</h3>
          <p className="text-gray-600 mb-6">Create your first chit fund to get started</p>
          <Button onClick={() => router.push('/chits/create')}>
            <Plus className="w-4 h-4 mr-2" />
            Create Chit Fund
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {chits.map((chit) => (
            <Card
              key={chit.id}
              className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => router.push(`/chits/${chit.id}`)}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {chit.chitName}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {chit.duration} months • {chit.memberCount} members
                  </p>
                </div>
                <Badge variant={chit.status === 'active' ? 'success' : 'secondary'}>
                  {chit.status}
                </Badge>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Chit Value</span>
                  <span className="text-lg font-bold text-blue-600">
                    {formatCurrency(chit.chitValue)}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Monthly Amount</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {formatCurrency(chit.monthlyAmount)}
                  </span>
                </div>

                <div className="pt-3 border-t border-gray-200">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center text-gray-600">
                      <Users className="w-4 h-4 mr-1" />
                      {chit._count?.ChitMembers || 0} enrolled
                    </div>
                    <div className="flex items-center text-gray-600">
                      <TrendingUp className="w-4 h-4 mr-1" />
                      {chit._count?.ChitAuctions || 0}/{chit.duration} auctions
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
