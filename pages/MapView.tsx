import React, { useEffect, useMemo, useState } from 'react';
import L from 'leaflet';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import { useNavigate } from 'react-router-dom';
import Card from '../components/Card';
import MainLayout from '../components/MainLayout';
import Button from '../components/Button';
import { useAuth } from '../context/AuthContext';
import { IssueRecord, listenToAllIssues, listenToAssignedIssues } from '../services/issueService';
import { getMarkerColor } from '../utils/mapColors';
import type { Unsubscribe } from 'firebase/firestore';
import StatusBadge from '../components/StatusBadge';
import { IssueStatus } from '../types';
import { mapTileConfig } from '../config/map';
import { buildClusterIcon } from '../utils/mapCluster';

interface MapViewProps {
  mode: 'staff' | 'admin';
}

const createMarkerIcon = (color: string) =>
  L.divIcon({
    className: '',
    html: `<span style="display:inline-block;width:18px;height:18px;border-radius:50%;background:${color};border:2px solid white;box-shadow:0_8px_18px_rgba(15,23,42,0.35);"></span>`,
    iconSize: [18, 18],
    iconAnchor: [9, 18],
  });

const MapView: React.FC<MapViewProps> = ({ mode }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [issues, setIssues] = useState<IssueRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'resolved'>('all');

  useEffect(() => {
    let unsubscribe: Unsubscribe | undefined;
    setLoading(true);
    setError(null);

    if (mode === 'staff') {
      if (!user) {
        setError('Sign in with a staff account to view map assignments.');
        setIssues([]);
        setLoading(false);
        return;
      }

      unsubscribe = listenToAssignedIssues(user.uid, (records) => {
        const assigned = records.filter((issue) => issue.staffId === user.uid);
        setIssues(assigned);
        setLoading(false);
      });
    } else {
      unsubscribe = listenToAllIssues((records) => {
        setIssues(records);
        setLoading(false);
      });
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [mode, user]);

  const issuesWithCoords = useMemo(
    () => issues.filter((issue) => typeof issue.lat === 'number' && typeof issue.lng === 'number'),
    [issues]
  );

  const categories = useMemo(() => {
    const unique = Array.from(new Set(issues.map((issue) => issue.category))).filter(Boolean);
    return ['All', ...unique];
  }, [issues]);

  const filteredIssues = useMemo(() => {
    return issuesWithCoords.filter((issue) => {
      const matchesCategory = categoryFilter === 'All' || issue.category === categoryFilter;
      const isResolved = issue.status === IssueStatus.RESOLVED;
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && !isResolved) ||
        (statusFilter === 'resolved' && isResolved);
      return matchesCategory && matchesStatus;
    });
  }, [issuesWithCoords, categoryFilter, statusFilter]);

  const mapCenter = useMemo(() => {
    if (issuesWithCoords.length) {
      return [issuesWithCoords[0].lat as number, issuesWithCoords[0].lng as number] as [number, number];
    }
    return [37.7749, -122.4194] as [number, number];
  }, [issuesWithCoords]);

  const description = mode === 'staff'
    ? 'Live map of issues currently assigned to you. Use it to plan site visits and upload resolution proof faster.'
    : 'City-wide issue overview so admins can monitor hotspots and make resourcing decisions in real time.';

  const formatDate = (date: Date) => date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <p className="text-sm text-slate-400">Geospatial view</p>
          <h1 className="text-3xl font-semibold text-white">{mode === 'staff' ? 'Assigned issues map' : 'City map view'}</h1>
          <p className="text-slate-400 mt-1">{description}</p>
        </div>

        <div className="flex flex-col gap-4 md:flex-row">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs uppercase tracking-[0.2em] text-slate-500">Category</span>
            <div className="flex gap-2 flex-wrap">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setCategoryFilter(category)}
                  className={`px-3 py-1.5 rounded-2xl text-sm border transition-all ${
                    categoryFilter === category
                      ? 'border-emerald-400/60 text-white bg-emerald-400/10'
                      : 'border-white/10 text-slate-300 hover:border-white/30'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs uppercase tracking-[0.2em] text-slate-500">Status</span>
            {[
              { label: 'All', value: 'all' },
              { label: 'Active', value: 'active' },
              { label: 'Resolved', value: 'resolved' },
            ].map((status) => (
              <button
                key={status.value}
                onClick={() => setStatusFilter(status.value as 'all' | 'active' | 'resolved')}
                className={`px-3 py-1.5 rounded-2xl text-sm border transition-all ${
                  statusFilter === status.value
                    ? 'border-blue-400/60 text-white bg-blue-400/10'
                    : 'border-white/10 text-slate-300 hover:border-white/30'
                }`}
              >
                {status.label}
              </button>
            ))}
          </div>
        </div>

        {error && <Card className="p-4 border border-red-500/30 bg-red-500/10 text-red-200 text-sm">{error}</Card>}

        <Card className="bg-slate-900/60 border-white/10">
          {loading ? (
            <div className="p-10 text-center text-slate-400">Loading map data…</div>
          ) : filteredIssues.length ? (
            <MapContainer center={mapCenter} zoom={13} style={{ height: 500, width: '100%' }} key={mapCenter.join(',')}>
              <TileLayer
                url={mapTileConfig.url}
                attribution={mapTileConfig.attribution}
                maxZoom={mapTileConfig.maxZoom}
                tileSize={mapTileConfig.tileSize}
                zoomOffset={mapTileConfig.zoomOffset}
              />
              <MarkerClusterGroup chunkedLoading iconCreateFunction={buildClusterIcon}>
                {filteredIssues.map((issue) => {
                  const icon = createMarkerIcon(getMarkerColor(issue.status));
                  return (
                    <Marker key={issue.id} position={[issue.lat as number, issue.lng as number]} icon={icon}>
                      <Popup>
                        <div className="space-y-2 min-w-[180px]">
                          <div>
                            <p className="font-semibold text-slate-900">{issue.title}</p>
                            <p className="text-[11px] text-slate-500">{formatDate(issue.createdAt)}</p>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-slate-600">
                            <span className="font-medium">{issue.category}</span>
                            <StatusBadge status={issue.status} />
                          </div>
                          {issue.locationText && <p className="text-xs text-slate-600">{issue.locationText}</p>}
                          {mode === 'admin' && issue.department && (
                            <p className="text-xs text-slate-500">Dept: {issue.department}</p>
                          )}
                          <Button
                            size="sm"
                            className="w-full"
                            onClick={() => navigate(`/issues/${issue.id}`)}
                          >
                            View details
                          </Button>
                        </div>
                      </Popup>
                    </Marker>
                  );
                })}
              </MarkerClusterGroup>
            </MapContainer>
          ) : (
            <div className="p-10 text-center text-slate-400">
              No issues with coordinates to display yet. Ask reporters to capture GPS data when submitting.
            </div>
          )}
        </Card>
      </div>
    </MainLayout>
  );
};

export default MapView;
