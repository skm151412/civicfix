import L from 'leaflet';
import { IssueStatus } from '../types';
import { getMarkerColor } from './mapColors';

const iconCache = new Map<string, L.Icon>();

const buildIconSvg = (color: string) => `
  <svg width="44" height="56" viewBox="0 0 44 56" xmlns="http://www.w3.org/2000/svg">
    <g fill="none" fill-rule="evenodd">
      <path d="M22 55c11.046 0 20-8.954 20-20S33.046 15 22 15 2 23.954 2 35s8.954 20 20 20Z" fill="${color}" opacity="0.25"/>
      <path d="M22 48c8.837 0 16-7.163 16-16S30.837 16 22 16 6 23.163 6 32s7.163 16 16 16Z" fill="${color}" stroke="#ffffff" stroke-width="2"/>
      <circle cx="22" cy="32" r="6" fill="#ffffff"/>
    </g>
  </svg>
`;

const createMarkerIcon = (color: string) =>
  L.icon({
    iconUrl: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(buildIconSvg(color))}`,
    iconSize: [44, 56],
    iconAnchor: [22, 48],
    popupAnchor: [0, -40],
    className: 'civicfix-map-pin',
  });

export const getMarkerIcon = (status: IssueStatus | string): L.Icon => {
  const color = getMarkerColor(status);
  if (!iconCache.has(color)) {
    iconCache.set(color, createMarkerIcon(color));
  }
  return iconCache.get(color) as L.Icon;
};
