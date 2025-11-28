import L from 'leaflet';

export const buildClusterIcon = (cluster: any) => {
  const count = cluster.getChildCount();
  const color = count < 5 ? '#38bdf8' : count < 10 ? '#fbbf24' : '#ef4444';
  return L.divIcon({
    html: `<div style="background:${color};color:#0f172a;font-weight:700;border-radius:9999px;width:44px;height:44px;display:flex;align-items:center;justify-content:center;border:2px solid white;box-shadow:0 15px 30px rgba(15,23,42,0.35);">${count}</div>`,
    className: 'cluster-marker',
    iconSize: [44, 44],
  });
};
