'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthProvider';
import DateSelector from '@/components/DateSelector';
import CollectionCard from '@/components/CollectionCard';
import { CheckCircle, XCircle, Clock, DollarSign, TrendingUp, Target, Calendar, MapPin, Download } from 'lucide-react';

interface Collection {
  id: string;
  customerName: string;
  customerPhone: string;
  address: string;
  area: string;
  amount: number;
  dueDate: string;
  status: 'pending' | 'collected' | 'failed' | 'partial';
  distance?: string;
  tags?: string[];
  notes?: string;
  collectedAmount?: number;
}



export default function MyCollectionsPage() {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'collected' | 'failed' | 'partial'>('all');

  // Load collections when date changes
  useEffect(() => {
    const fetchCollections = async () => {
      try {
        const agentId = user?.id || 'agent-temp-id';
        const res = await fetch(`/api/my-collections?agentId=${agentId}&date=${selectedDate}`);
        if (res.ok) {
          const data = await res.json();
          const mapped = data.map((c: any) => ({
            id: c.id,
            customerName: c.Customer?.name || 'Unknown',
            customerPhone: c.Customer?.phone || 'Unknown',
            address: c.Customer?.address || '',
            area: c.Customer?.area || '',
            amount: c.amount,
            dueDate: selectedDate,
            status: c.status,
            collectedAmount: c.collectedAmount
          }));
          setCollections(mapped);
        } else {
          setCollections([]);
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchCollections();
  }, [selectedDate, user?.id]);

  const handleStatusChange = (id: string, status: 'collected' | 'failed' | 'partial', amount?: number) => {
    setCollections(prev => prev.map(collection => 
      collection.id === id 
        ? { 
            ...collection, 
            status,
            collectedAmount: status === 'partial' ? amount : status === 'collected' ? collection.amount : undefined
          }
        : collection
    ));
  };

  // Calculate stats
  const stats = {
    total: collections.length,
    collected: collections.filter(c => c.status === 'collected').length,
    pending: collections.filter(c => c.status === 'pending').length,
    failed: collections.filter(c => c.status === 'failed').length,
    partial: collections.filter(c => c.status === 'partial').length,
    totalAmount: collections.reduce((sum, c) => sum + c.amount, 0),
    collectedAmount: collections.reduce((sum, c) => 
      sum + (c.status === 'collected' ? c.amount : c.status === 'partial' ? (c.collectedAmount || 0) : 0), 0
    )
  };

  const filteredCollections = filter === 'all' 
    ? collections 
    : collections.filter(c => c.status === filter);

  const handleExport = () => {
    const csvData = [
      ['Customer', 'Phone', 'Area', 'Amount', 'Status', 'Date'],
      ...filteredCollections.map(c => [
        c.customerName,
        c.customerPhone,
        c.area,
        c.amount,
        c.status,
        selectedDate
      ])
    ];
    
    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `collections-${selectedDate}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200">
        <div className="px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-neutral-900">My Collections</h1>
              <p className="text-sm text-neutral-500 mt-1">Track and manage your daily collections</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-4 py-2 bg-primary-50 border border-primary-200 rounded-lg">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-violet-500 flex items-center justify-center text-white font-semibold text-sm">
                  {user?.name?.charAt(0) || 'A'}
                </div>
                <span className="text-sm font-semibold text-neutral-900">{user?.name || 'Agent'}</span>
              </div>
              <button 
                onClick={handleExport}
                className="btn-secondary text-sm flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span>Export</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="p-8 space-y-6">

        {/* Date Selector */}
        <DateSelector
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
        />

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <div className="stat-card">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 rounded-lg bg-primary-50">
                <Target className="w-5 h-5 text-primary-600" />
              </div>
            </div>
            <div>
              <p className="text-sm text-neutral-500 mb-1">Total</p>
              <p className="text-2xl font-bold text-neutral-900">{stats.total}</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 rounded-lg bg-emerald-50">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
            <div>
              <p className="text-sm text-neutral-500 mb-1">Collected</p>
              <p className="text-2xl font-bold text-emerald-600">{stats.collected}</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 rounded-lg bg-amber-50">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
            </div>
            <div>
              <p className="text-sm text-neutral-500 mb-1">Pending</p>
              <p className="text-2xl font-bold text-amber-600">{stats.pending}</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 rounded-lg bg-orange-50">
                <DollarSign className="w-5 h-5 text-orange-600" />
              </div>
            </div>
            <div>
              <p className="text-sm text-neutral-500 mb-1">Partial</p>
              <p className="text-2xl font-bold text-orange-600">{stats.partial}</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 rounded-lg bg-rose-50">
                <XCircle className="w-5 h-5 text-rose-600" />
              </div>
            </div>
            <div>
              <p className="text-sm text-neutral-500 mb-1">Failed</p>
              <p className="text-2xl font-bold text-rose-600">{stats.failed}</p>
            </div>
          </div>
        </div>

        {/* Amount Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card-modern p-6 bg-gradient-to-br from-primary-50 to-primary-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-600 mb-2">Target Amount</p>
                <p className="text-3xl font-bold text-neutral-900">₹{stats.totalAmount.toLocaleString()}</p>
              </div>
              <div className="p-4 bg-white rounded-xl shadow-sm">
                <Target className="w-8 h-8 text-primary-600" />
              </div>
            </div>
          </div>

          <div className="card-modern p-6 bg-gradient-to-br from-emerald-50 to-green-50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-600 mb-2">Collected Amount</p>
                <p className="text-3xl font-bold text-emerald-600">₹{stats.collectedAmount.toLocaleString()}</p>
                <div className="flex items-center gap-1 mt-2">
                  <TrendingUp size={16} className="text-emerald-600" />
                  <span className="text-sm text-emerald-700 font-semibold">
                    {stats.totalAmount > 0 ? Math.round((stats.collectedAmount / stats.totalAmount) * 100) : 0}% achieved
                  </span>
                </div>
              </div>
              <div className="p-4 bg-white rounded-xl shadow-sm">
                <CheckCircle className="w-8 h-8 text-emerald-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="card-modern p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-neutral-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-neutral-600" />
              {new Date(selectedDate).toLocaleDateString('en-US', { 
                weekday: 'long', 
                month: 'short', 
                day: 'numeric' 
              })}
            </h2>
            <span className="text-sm text-neutral-500">
              {filteredCollections.length} {filter !== 'all' ? filter : ''} collection{filteredCollections.length !== 1 ? 's' : ''}
            </span>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                filter === 'all'
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'bg-neutral-50 text-neutral-700 hover:bg-neutral-100'
              }`}
            >
              All ({stats.total})
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                filter === 'pending'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'bg-neutral-50 text-neutral-700 hover:bg-neutral-100'
              }`}
            >
              Pending ({stats.pending})
            </button>
            <button
              onClick={() => setFilter('collected')}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                filter === 'collected'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-neutral-50 text-neutral-700 hover:bg-neutral-100'
              }`}
            >
              Collected ({stats.collected})
            </button>
            <button
              onClick={() => setFilter('partial')}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                filter === 'partial'
                  ? 'bg-orange-600 text-white shadow-sm'
                  : 'bg-neutral-50 text-neutral-700 hover:bg-neutral-100'
              }`}
            >
              Partial ({stats.partial})
            </button>
            <button
              onClick={() => setFilter('failed')}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                filter === 'failed'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'bg-neutral-50 text-neutral-700 hover:bg-neutral-100'
              }`}
            >
              Failed ({stats.failed})
            </button>
          </div>
        </div>

        {/* Collections List */}
        {filteredCollections.length === 0 ? (
          <div className="card-modern p-12 text-center">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-neutral-100 rounded-full">
                <Clock size={48} className="text-neutral-400" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">No collections found</h3>
            <p className="text-neutral-500">
              {collections.length === 0 
                ? 'No collections scheduled for this date'
                : `No ${filter} collections for this date`
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredCollections.map((collection) => (
              <CollectionCard
                key={collection.id}
                collection={collection}
                onStatusChange={handleStatusChange}
                isAgent={true}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}