'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

interface Product {
  id: string;
  productType: string;
  enabled: boolean;
  settings?: any;
}

const PRODUCT_INFO = {
  LOAN: {
    name: 'Loans',
    description: 'Traditional loan products (daily, weekly, monthly)',
    icon: '💰',
    color: 'blue',
  },
  CHIT: {
    name: 'Chit Funds',
    description: 'Chit fund management with auctions and dividends',
    icon: '🎯',
    color: 'purple',
  },
  GOLD_LOAN: {
    name: 'Gold Loans',
    description: 'Loans against gold collateral',
    icon: '🏆',
    color: 'yellow',
  },
  PERSONAL_LOAN: {
    name: 'Personal Loans',
    description: 'Unsecured personal loans',
    icon: '👤',
    color: 'green',
  },
  INSURANCE: {
    name: 'Insurance',
    description: 'Insurance products and policies',
    icon: '🛡️',
    color: 'red',
  },
  SAVINGS: {
    name: 'Savings',
    description: 'Savings schemes and deposits',
    icon: '🏦',
    color: 'indigo',
  },
};

export default function TenantProductsPage() {
  const params = useParams();
  const router = useRouter();
  const tenantId = params.id as string;

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadProducts();
  }, [tenantId]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/super-admin/tenants/${tenantId}/products`);
      const data = await response.json();
      
      if (data.success) {
        setProducts(data.data);
      }
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleProduct = async (productType: string) => {
    try {
      setSaving(true);
      const response = await fetch(
        `/api/super-admin/tenants/${tenantId}/products/toggle`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productType }),
        }
      );

      const data = await response.json();

      if (data.success) {
        // Update local state
        setProducts((prev) =>
          prev.map((p) =>
            p.productType === productType ? { ...p, enabled: data.data.enabled } : p
          )
        );
      }
    } catch (error) {
      console.error('Error toggling product:', error);
      alert('Failed to toggle product');
    } finally {
      setSaving(false);
    }
  };

  const saveAllProducts = async () => {
    try {
      setSaving(true);
      const response = await fetch(`/api/super-admin/tenants/${tenantId}/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ products }),
      });

      const data = await response.json();

      if (data.success) {
        alert('Products updated successfully');
      }
    } catch (error) {
      console.error('Error saving products:', error);
      alert('Failed to save products');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-40 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Product Control</h1>
          <p className="text-gray-600 mt-1">
            Enable or disable products for this tenant
          </p>
        </div>
        <button
          onClick={() => router.back()}
          className="px-4 py-2 border rounded-lg hover:bg-gray-50"
        >
          Back
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.entries(PRODUCT_INFO).map(([type, info]) => {
          const product = products.find((p) => p.productType === type);
          const isEnabled = product?.enabled ?? false;

          return (
            <div
              key={type}
              className={`bg-white rounded-lg shadow-md p-6 border-2 transition ${
                isEnabled
                  ? `border-${info.color}-500`
                  : 'border-gray-200'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <span className="text-4xl mr-3">{info.icon}</span>
                  <div>
                    <h3 className="text-lg font-semibold">{info.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {info.description}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <span className="text-sm font-medium">
                  {isEnabled ? (
                    <span className="text-green-600">✓ Enabled</span>
                  ) : (
                    <span className="text-gray-400">Disabled</span>
                  )}
                </span>
                <button
                  onClick={() => toggleProduct(type)}
                  disabled={saving}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                    isEnabled ? 'bg-blue-600' : 'bg-gray-200'
                  } ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                      isEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {isEnabled && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-xs text-blue-700">
                    This product is active and visible to the tenant
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start">
          <span className="text-2xl mr-3">⚠️</span>
          <div>
            <h4 className="font-semibold text-yellow-800">Important Notes</h4>
            <ul className="mt-2 text-sm text-yellow-700 space-y-1">
              <li>• Disabling a product will hide it from the tenant's dashboard</li>
              <li>• Existing data for disabled products will be preserved</li>
              <li>• Re-enabling a product will restore access to all data</li>
              <li>• Changes take effect immediately</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
