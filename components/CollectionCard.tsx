'use client';
import { useState } from 'react';
import { Phone, MapPin, CheckCircle, XCircle, Clock, DollarSign, User } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';

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
  loanType?: 'daily' | 'weekly' | 'monthly';
  cutting?: number;
  actualDisbursed?: number;
}

interface CollectionCardProps {
  collection: Collection;
  onStatusChange: (id: string, status: 'collected' | 'failed' | 'partial', amount?: number) => void;
  isAgent?: boolean;
}

export default function CollectionCard({ collection, onStatusChange, isAgent = false }: CollectionCardProps) {
  const [showActions, setShowActions] = useState(false);
  const [partialAmount, setPartialAmount] = useState('');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'collected': return 'success';
      case 'failed': return 'danger';
      case 'partial': return 'warning';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'collected': return <CheckCircle size={16} className="text-success-600" />;
      case 'failed': return <XCircle size={16} className="text-danger-600" />;
      case 'partial': return <Clock size={16} className="text-warning-600" />;
      default: return <Clock size={16} className="text-neutral-400" />;
    }
  };

  const handleCall = () => {
    window.open(`tel:${collection.customerPhone}`, '_self');
  };

  const handlePartialSubmit = () => {
    const amount = parseFloat(partialAmount);
    if (amount > 0 && amount <= collection.amount) {
      onStatusChange(collection.id, 'partial', amount);
      setShowActions(false);
      setPartialAmount('');
    }
  };

  return (
    <div className={`card-modern transition-all duration-200 hover:shadow-lg ${collection.status === 'collected' ? 'bg-emerald-50 border-emerald-200' :
        collection.status === 'failed' ? 'bg-danger-50 border-danger-200' :
          collection.status === 'partial' ? 'bg-amber-50 border-amber-200' :
            ''
      }`}>
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
                <User size={18} className="text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-neutral-900">{collection.customerName}</h3>
                {collection.loanType && (
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${collection.loanType === 'daily'
                      ? 'bg-primary-100 text-primary-700'
                      : collection.loanType === 'weekly'
                        ? 'bg-secondary-100 text-secondary-700'
                        : 'bg-primary-200 text-primary-800'
                    }`}>
                    {collection.loanType.toUpperCase()}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm text-neutral-600">
              <div className="flex items-center gap-1">
                <Phone size={14} />
                <span>{collection.customerPhone}</span>
              </div>
              {collection.distance && (
                <div className="flex items-center gap-1">
                  <MapPin size={14} />
                  <span>{collection.distance}</span>
                </div>
              )}
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1 mb-2">
              <DollarSign size={18} className="text-emerald-600" />
              <span className="font-bold text-xl text-neutral-900">₹{collection.amount.toLocaleString()}</span>
            </div>
            {collection.cutting && (
              <div className="text-xs text-danger-600 mb-2">
                Cutting: ₹{collection.cutting.toLocaleString()}
              </div>
            )}
            <Badge variant={getStatusColor(collection.status)} size="sm">
              {collection.status}
            </Badge>
          </div>
        </div>

        {/* Address */}
        <div className="flex items-start gap-2 mb-4 p-3 bg-neutral-50 rounded-lg">
          <MapPin size={16} className="text-neutral-400 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-neutral-700">
            <div className="font-medium">{collection.address}</div>
            <div className="text-xs text-neutral-500 mt-1">Area: {collection.area}</div>
          </div>
        </div>

        {/* Tags */}
        {collection.tags && collection.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {collection.tags.map((tag, index) => (
              <span key={index} className="px-2.5 py-1 bg-primary-50 text-primary-700 text-xs font-medium rounded-full border border-primary-200">
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Actions for Agent */}
        {isAgent && collection.status === 'pending' && (
          <div className="border-t border-neutral-200 pt-4 mt-4">
            {!showActions ? (
              <div className="flex gap-3">
                <button
                  onClick={handleCall}
                  className="flex-1 btn-primary text-sm flex items-center justify-center gap-2"
                >
                  <Phone size={16} />
                  Call
                </button>
                <button
                  onClick={() => setShowActions(true)}
                  className="flex-1 btn-secondary text-sm"
                >
                  Mark Status
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex gap-3">
                  <button
                    onClick={() => onStatusChange(collection.id, 'collected')}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium text-sm"
                  >
                    <CheckCircle size={16} />
                    Collected
                  </button>
                  <button
                    onClick={() => onStatusChange(collection.id, 'failed')}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-danger-600 text-white rounded-lg hover:bg-danger-700 transition-colors font-medium text-sm"
                  >
                    <XCircle size={16} />
                    Failed
                  </button>
                </div>

                {/* Partial Payment */}
                <div className="flex gap-3">
                  <input
                    type="number"
                    placeholder="Partial amount"
                    value={partialAmount}
                    onChange={(e) => setPartialAmount(e.target.value)}
                    className="flex-1 input-modern text-sm"
                    max={collection.amount}
                  />
                  <button
                    onClick={handlePartialSubmit}
                    disabled={!partialAmount || parseFloat(partialAmount) <= 0}
                    className="px-5 py-2.5 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm"
                  >
                    Partial
                  </button>
                </div>

                <button
                  onClick={() => setShowActions(false)}
                  className="w-full btn-secondary text-sm"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        )}

        {/* Notes */}
        {collection.notes && (
          <div className="mt-4 p-3 bg-primary-50 border border-primary-100 rounded-lg">
            <p className="text-xs text-primary-900 font-medium">{collection.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}