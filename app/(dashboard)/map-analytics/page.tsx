'use client';
import { Card } from '@/components/ui/Card';
import { MapPin } from 'lucide-react';

export default function MapAnalyticsPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Map Analytics</h1>
        <p className="text-gray-600 mt-1">Heatmaps and geographic insights</p>
      </div>

      <div className="grid grid-cols-3 gap-6 mb-6">
        <Card>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary-100 rounded-lg">
              <MapPin className="text-primary-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">High Density Areas</p>
              <p className="text-2xl font-bold text-gray-900">5</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <MapPin className="text-green-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Coverage Zones</p>
              <p className="text-2xl font-bold text-gray-900">12</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <MapPin className="text-purple-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Risk Clusters</p>
              <p className="text-2xl font-bold text-gray-900">3</p>
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <div className="h-[600px] bg-gray-100 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <MapPin className="mx-auto text-gray-400 mb-4" size={48} />
            <p className="text-gray-600">Heatmap visualization</p>
            <p className="text-sm text-gray-500 mt-2">Requires Mapbox GL JS integration</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
