'use client';
import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

export default function MapPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const mapRef = useRef<any>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    const res = await fetch('/api/customers');
    const result = await res.json();
    const data = result.data || result;
    setCustomers(data);
    initMap(data);
  };

  const initMap = async (customerData: any[]) => {
    if (mapRef.current || !mapContainerRef.current) return;

    try {
      const mapboxgl = (await import('mapbox-gl')).default;
      (mapboxgl as any).accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

      mapRef.current = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [80.27, 13.07],
        zoom: 11
      });

      const colorMap: any = { active: '#10b981', risk: '#f59e0b', default: '#ef4444' };

      customerData.forEach(c => {
        const el = document.createElement('div');
        el.style.background = colorMap[c.status];
        el.style.width = '16px';
        el.style.height = '16px';
        el.style.borderRadius = '50%';
        el.style.border = '2px solid white';
        el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
        el.style.cursor = 'pointer';

        new mapboxgl.Marker(el)
          .setLngLat([c.lng, c.lat])
          .setPopup(
            new mapboxgl.Popup({ offset: 25 }).setHTML(
              `<div style="padding: 8px;">
                <strong style="font-size: 14px;">${c.name}</strong><br/>
                <span style="color: #666; font-size: 12px;">${c.address}</span><br/>
                <span style="color: #666; font-size: 12px;">Status: ${c.status}</span><br/>
                <span style="color: #666; font-size: 12px;">Agent: ${c.agent}</span>
              </div>`
            )
          )
          .addTo(mapRef.current);
      });
    } catch (error) {
      console.error('Map initialization error:', error);
    }
  };

  const statusCounts = {
    active: customers.filter(c => c.status === 'active').length,
    risk: customers.filter(c => c.status === 'risk').length,
    default: customers.filter(c => c.status === 'default').length
  };

  return (
    <div className="p-4 md:p-6">
      {/* Page Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-100">Customer Map</h1>
            <p className="text-sm text-gray-600 dark:text-slate-400 mt-1">Geographic distribution of customers</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-gray-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600 dark:text-slate-400 mb-1">Active</div>
              <div className="text-2xl font-bold text-green-600">{statusCounts.active}</div>
            </div>
            <div className="w-4 h-4 rounded-full bg-green-500"></div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-gray-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600 dark:text-slate-400 mb-1">At Risk</div>
              <div className="text-2xl font-bold text-yellow-600">{statusCounts.risk}</div>
            </div>
            <div className="w-4 h-4 rounded-full bg-yellow-500"></div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-gray-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600 dark:text-slate-400 mb-1">Default</div>
              <div className="text-2xl font-bold text-red-600">{statusCounts.default}</div>
            </div>
            <div className="w-4 h-4 rounded-full bg-red-500"></div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden p-6">
        <div
          ref={mapContainerRef}
          className="w-full h-[600px] rounded-lg overflow-hidden"
          style={{ background: '#f3f4f6' }}
        >
          {!process.env.NEXT_PUBLIC_MAPBOX_TOKEN && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <p className="text-gray-600 dark:text-slate-400 mb-2">Map requires Mapbox token</p>
                <p className="text-sm text-gray-500 dark:text-slate-500">Add NEXT_PUBLIC_MAPBOX_TOKEN to .env.local</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
