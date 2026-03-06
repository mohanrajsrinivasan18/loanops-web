'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/lib/AuthProvider';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Users, Calendar, TrendingUp, Trophy } from 'lucide-react';

interface Chit {
  id: string;
  chitName: string;
  chitValue: number;
  duration: number;
  memberCount: number;
  monthlyAmount: number;
  status: string;
  startDate: string;
  ChitMembers?: any[];
  ChitAuctions?: any[];
  ChitPayments?: any[];
}

export default function ChitDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const [chit, setChit] = useState<Chit | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id && user?.tenantId) {
      loadChit();
    }
  }, [params.id, user?.tenantId]);

  const loadChit = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/chits/${params.id}?tenantId=${user?.tenantId}`);
      const data = await response.json();
      setChit(data.data);
    } catch (error) {
      console.error('Error loading chit:', error);
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
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!chit) {
    return (
      <div className="p-6">
        <Card className="p-12 text-center">
          <p className="text-gray-600">Chit fund not found</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <Button variant="ghost" onClick={() => router.back()}>
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Chits
      </Button>

      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{chit.chitName}</h1>
          <p className="text-gray-600 mt-1">
            {chit.duration} months • {chit.memberCount} members
          </p>
        </div>
        <Badge variant={chit.status === 'active' ? 'success' : 'secondary'}>
          {chit.status}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            <span className="text-sm text-gray-600">Chit Value</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {formatCurrency(chit.chitValue)}
          </p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <Calendar className="w-5 h-5 text-green-600" />
            <span className="text-sm text-gray-600">Monthly Amount</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {formatCurrency(chit.monthlyAmount)}
          </p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-5 h-5 text-purple-600" />
            <span className="text-sm text-gray-600">Members</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {chit.ChitMembers?.length || 0} / {chit.memberCount}
          </p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <Trophy className="w-5 h-5 text-yellow-600" />
            <span className="text-sm text-gray-600">Auctions</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {chit.ChitAuctions?.length || 0} / {chit.duration}
          </p>
        </Card>
      </div>

      <Tabs defaultValue="members" className="w-full">
        <TabsList>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="auctions">Auctions</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
        </TabsList>

        <TabsContent value="members" className="space-y-4">
          {chit.ChitMembers?.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-gray-600">No members enrolled yet</p>
            </Card>
          ) : (
            chit.ChitMembers?.map((member: any) => (
              <Card key={member.id} className="p-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-lg font-bold text-blue-600">
                        {member.memberNumber}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        {member.Customer?.name || 'Unknown'}
                      </p>
                      <p className="text-sm text-gray-600">
                        {member.Customer?.phone || 'N/A'}
                      </p>
                    </div>
                  </div>
                  {member.hasWonAuction && (
                    <Badge variant="warning">
                      <Trophy className="w-3 h-3 mr-1" />
                      Won Auction
                    </Badge>
                  )}
                </div>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="auctions" className="space-y-4">
          {chit.ChitAuctions?.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-gray-600">No auctions conducted yet</p>
            </Card>
          ) : (
            chit.ChitAuctions?.map((auction: any) => (
              <Card key={auction.id} className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-gray-900 mb-2">
                      Month {auction.monthNumber}
                    </p>
                    {auction.bidAmount && (
                      <p className="text-sm text-gray-600">
                        Bid Amount: {formatCurrency(auction.bidAmount)}
                      </p>
                    )}
                    {auction.dividendAmount && (
                      <p className="text-sm text-gray-600">
                        Dividend: {formatCurrency(auction.dividendAmount)}
                      </p>
                    )}
                  </div>
                  <Badge variant={auction.status === 'completed' ? 'success' : 'warning'}>
                    {auction.status}
                  </Badge>
                </div>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="payments" className="space-y-4">
          <Card className="p-8 text-center">
            <p className="text-gray-600">Payment tracking coming soon</p>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
