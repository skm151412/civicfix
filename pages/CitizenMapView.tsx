import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../components/MainLayout';
import Card from '../components/Card';
import StatusBadge from '../components/StatusBadge';
import Button from '../components/Button';
import { IssueRecord, listenToAllIssues } from '../services/issueService';
import { getMarkerIcon } from '../utils/markerIcon';
import { IssueStatus } from '../types';
import { getDistanceMeters } from '../utils/distance';
import { mapTileConfig } from '../config/map';
import { buildClusterIcon } from '../utils/mapCluster';

const CitizenMapView: React.FC = () => {
  const [issues, setIssues] = useState<IssueRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [alertsEnabled, setAlertsEnabled] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [activeAlert, setActiveAlert] = useState<IssueRecord | null>(null);
  const alertedIssuesRef = useRef<Set<string>>(new Set());
  const watchIdRef = useRef<number | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = localStorage.getItem('civicfix-nearme-alerts');
    if (stored) {
      setAlertsEnabled(stored === 'true');
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('civicfix-nearme-alerts', String(alertsEnabled));
    if (!alertsEnabled) {
      setActiveAlert(null);
    }
  }, [alertsEnabled]);

  useEffect(() => {
    setLoading(true);
    setError(null);

    const unsubscribe = listenToAllIssues((records) => {
      setIssues(records);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const issuesWithCoords = useMemo(
    () => issues.filter((issue) => typeof issue.lat === 'number' && typeof issue.lng === 'number'),
    [issues]
  );

  const activeIssues = useMemo(
    () => issuesWithCoords.filter((issue) => issue.status !== IssueStatus.RESOLVED),
    [issuesWithCoords]
  );

  const mapCenter = useMemo(() => {
    if (issuesWithCoords.length) {
      return [issuesWithCoords[0].lat as number, issuesWithCoords[0].lng as number] as [number, number];
    }
    return [37.7749, -122.4194] as [number, number];
  }, [issuesWithCoords]);

  const formatDate = (date: Date) =>
    date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

  const checkNearbyHazards = useCallback(
    (coords: GeolocationCoordinates) => {
      if (!alertsEnabled) {
        return;
      }

      const userPoint = { lat: coords.latitude, lng: coords.longitude };
      for (const issue of activeIssues) {
        const distance = getDistanceMeters(userPoint, {
          lat: issue.lat as number,
          lng: issue.lng as number,
        });

        if (distance <= 80 && !alertedIssuesRef.current.has(issue.id)) {
          alertedIssuesRef.current.add(issue.id);
          setActiveAlert(issue);
          break;
        }
      }
    },
    [activeIssues, alertsEnabled]
  );

  useEffect(() => {
    if (!alertsEnabled) {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      setGeoError(null);
      return;
    }

    if (!('geolocation' in navigator)) {
      setGeoError('Geolocation is not supported in this browser.');
      return;
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        setGeoError(null);
        checkNearbyHazards(position.coords);
      },
      () => setGeoError('Unable to retrieve your live position.'),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
    );

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [alertsEnabled, checkNearbyHazards]);

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <p className="text-sm text-slate-400">City context</p>
          <h1 className="text-3xl font-semibold text-white">Map of reported issues</h1>
          <p className="text-slate-400 mt-1">
            Explore what neighbors have reported around you. Tap a pin for full details.
          </p>
        </div>

        <Card className="bg-slate-900/40 border-white/10">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Safety radar</p>
              <h2 className="text-lg font-semibold text-white">Near-me alerts</h2>
              <p className="text-sm text-slate-400">
                {alertsEnabled ? 'We will warn you about nearby hazards in real time.' : 'Enable this to get proximity alerts for unresolved issues.'}
              </p>
              {geoError && <p className="text-sm text-amber-400 mt-1">{geoError}</p>}
            </div>
            <label className="relative inline-flex items-center cursor-pointer self-start md:self-auto">
              <input
                type="checkbox"
                className="sr-only"
                checked={alertsEnabled}
                onChange={(event) => setAlertsEnabled(event.target.checked)}
              />
              <span className="w-16 h-9 bg-white/10 rounded-full transition-colors flex items-center px-1 border border-white/10">
                <span
                  className={`w-7 h-7 rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 shadow-lg transform transition-transform ${
                    alertsEnabled ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </span>
              <span className="ml-3 text-sm text-slate-300">{alertsEnabled ? 'Enabled' : 'Disabled'}</span>
            </label>
          </div>
        </Card>

        {error && <Card className="p-4 border border-red-500/30 bg-red-500/10 text-red-200 text-sm">{error}</Card>}

        <Card className="bg-slate-900/70 border-white/10">
          {loading ? (
            <div className="p-10 text-center text-slate-400">Loading map data…</div>
          ) : !issuesWithCoords.length ? (
            <div className="p-10 text-center text-slate-400">
              No geo-tagged issues yet. Add GPS when reporting to power this view.
            </div>
          ) : (
            <div className="rounded-3xl overflow-hidden border border-white/5">
              <MapContainer
                center={mapCenter}
                zoom={13}
                style={{ height: 520, width: '100%' }}
                className="min-h-[320px]"
                scrollWheelZoom
              >
                <TileLayer
                  url={mapTileConfig.url}
                  attribution={mapTileConfig.attribution}
                  maxZoom={mapTileConfig.maxZoom}
                  tileSize={mapTileConfig.tileSize}
                  zoomOffset={mapTileConfig.zoomOffset}
                />
                <MarkerClusterGroup chunkedLoading iconCreateFunction={buildClusterIcon}>
                  {issuesWithCoords.map((issue) => (
                    <Marker
                      key={issue.id}
                      position={[issue.lat as number, issue.lng as number]}
                      icon={getMarkerIcon(issue.status)}
                    >
                      <Popup>
                        <div className="space-y-2 min-w-[200px]">
                          <div>
                            <p className="text-base font-semibold text-slate-900">{issue.title}</p>
                            <p className="text-xs text-slate-500">
                              {issue.category} · {formatDate(issue.createdAt)}
                            </p>
                          </div>
                          <StatusBadge status={issue.status} />
                          <p className="text-xs text-slate-600">{issue.locationText || 'Location pending'}</p>
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
                  ))}
                </MarkerClusterGroup>
              </MapContainer>
            </div>
          )}
        </Card>

        {activeAlert && (
          <div className="fixed bottom-6 right-6 max-w-sm w-full z-40">
            <div className="bg-amber-500/20 backdrop-blur-xl border border-amber-400/40 rounded-3xl p-4 text-amber-50 shadow-lg">
              <p className="text-sm font-semibold mb-1">⚠ Hazard near you</p>
              <p className="text-base text-white">{activeAlert.title}</p>
              <p className="text-sm text-amber-100">{activeAlert.category}</p>
              <div className="mt-3 flex gap-2">
                <Button
                  size="sm"
                  className="flex-1"
                  onClick={() => navigate(`/issues/${activeAlert.id}`)}
                >
                  View issue
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  className="flex-1 border-amber-300/40 text-amber-100"
                  onClick={() => setActiveAlert(null)}
                >
                  Dismiss
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default CitizenMapView;
