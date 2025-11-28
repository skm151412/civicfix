import React, { useEffect, useMemo, useState } from 'react';
import L from 'leaflet';
import 'leaflet.heat';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import Card from '../components/Card';
import MainLayout from '../components/MainLayout';
import { IssueRecord, listenToAllIssues } from '../services/issueService';
import { IssueStatus } from '../types';
import { mapTileConfig } from '../config/map';

interface HeatLayerProps {
  points: [number, number, number][];
}

const HeatLayer: React.FC<HeatLayerProps> = ({ points }) => {
  const map = useMap();

  useEffect(() => {
    if (!points.length) return undefined;
    const layer = (L as any).heatLayer(points, {
      radius: 35,
      blur: 25,
      maxZoom: 18,
      minOpacity: 0.3,
      gradient: {
        0.2: '#38bdf8',
        0.4: '#60a5fa',
        0.6: '#fb923c',
        0.8: '#f97316',
        1.0: '#ef4444',
      },
    });
    layer.addTo(map);
    return () => {
      map.removeLayer(layer);
    };
  }, [map, points]);

  return null;
};

const AdminHeatmap: React.FC = () => {
  const [issues, setIssues] = useState<IssueRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'all' | '7' | '30'>('7');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | IssueStatus>('All');

  useEffect(() => {
    setLoading(true);
    const unsubscribe = listenToAllIssues((records) => {
      setIssues(records);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const categories = useMemo(() => {
    const unique = Array.from(new Set(issues.map((issue) => issue.category))).filter(Boolean);
    return ['All', ...unique];
  }, [issues]);

  const filteredIssues = useMemo(() => {
    const now = Date.now();
    const daysLimit = timeRange === 'all' ? null : Number(timeRange);
    return issues.filter((issue) => {
      const timestamp = issue.createdAt?.getTime?.() ?? new Date(issue.createdAt).getTime();
      const withinRange = !daysLimit || now - timestamp <= daysLimit * 24 * 60 * 60 * 1000;
      const matchesCategory = categoryFilter === 'All' || issue.category === categoryFilter;
      const matchesStatus = statusFilter === 'All' || issue.status === statusFilter;
      return withinRange && matchesCategory && matchesStatus;
    });
  }, [issues, timeRange, categoryFilter, statusFilter]);

  const heatPoints = useMemo(() => {
    return filteredIssues
      .filter((issue) => typeof issue.lat === 'number' && typeof issue.lng === 'number')
      .map((issue) => {
        const weight = 1 + (issue.upvotes || 0) * 0.5;
        return [issue.lat as number, issue.lng as number, weight] as [number, number, number];
      });
  }, [filteredIssues]);

  const mapCenter = useMemo(() => {
    if (heatPoints.length) {
      return [heatPoints[0][0], heatPoints[0][1]] as [number, number];
    }
    return [37.7749, -122.4194] as [number, number];
  }, [heatPoints]);

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <p className="text-sm text-slate-400">Authority intel</p>
          <h1 className="text-3xl font-semibold text-white">City heatmap</h1>
          <p className="text-slate-400 mt-1">
            Spot hotspots faster by overlaying citizen reports weighted by upvotes.
          </p>
        </div>

        <Card className="bg-slate-900/40 border-white/10">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Time range</p>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: '7 days', value: '7' },
                  { label: '30 days', value: '30' },
                  { label: 'All', value: 'all' },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setTimeRange(option.value as '7' | '30' | 'all')}
                    className={`px-3 py-1.5 rounded-2xl text-sm border transition-all ${
                      timeRange === option.value
                        ? 'border-blue-400/60 text-white bg-blue-400/10'
                        : 'border-white/10 text-slate-300 hover:border-white/30'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Category</p>
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setCategoryFilter(category)}
                    className={`px-3 py-1.5 rounded-2xl text-sm border transition-all ${
                      categoryFilter === category
                        ? 'border-emerald-300/60 text-white bg-emerald-400/10'
                        : 'border-white/10 text-slate-300 hover:border-white/30'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Status</p>
              <div className="flex flex-wrap gap-2">
                {['All', IssueStatus.SUBMITTED, IssueStatus.IN_PROGRESS, IssueStatus.RESOLVED].map((status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status as 'All' | IssueStatus)}
                    className={`px-3 py-1.5 rounded-2xl text-sm border transition-all ${
                      statusFilter === status
                        ? 'border-amber-300/60 text-white bg-amber-400/10'
                        : 'border-white/10 text-slate-300 hover:border-white/30'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Card>

        <Card className="bg-slate-900/60 border-white/10">
          {loading ? (
            <div className="p-10 text-center text-slate-400">Loading heatmap data…</div>
          ) : !heatPoints.length ? (
            <div className="p-10 text-center text-slate-400">
              No geo-tagged issues match the selected filters yet.
            </div>
          ) : (
            <div className="rounded-3xl overflow-hidden border border-white/5">
              <MapContainer center={mapCenter} zoom={12} style={{ height: 520, width: '100%' }} scrollWheelZoom>
                <TileLayer
                  url={mapTileConfig.url}
                  attribution={mapTileConfig.attribution}
                  maxZoom={mapTileConfig.maxZoom}
                  tileSize={mapTileConfig.tileSize}
                  zoomOffset={mapTileConfig.zoomOffset}
                />
                <HeatLayer points={heatPoints} />
              </MapContainer>
            </div>
          )}
        </Card>
      </div>
    </MainLayout>
  );
};

export default AdminHeatmap;
