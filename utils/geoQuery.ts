import { GeoPoint, getDistanceMeters } from './distance';

export interface BoundingBox {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

const METERS_PER_DEGREE_LAT = 111_320;

/**
 * Returns an approximate latitude/longitude bounding box that fully contains a circle.
 * Use it to scope Firestore queries via range filters, then refine results with Haversine distances client-side.
 */
export const computeBoundingBox = (center: GeoPoint, radiusMeters: number): BoundingBox => {
  const latDelta = radiusMeters / METERS_PER_DEGREE_LAT;
  const lngDelta = radiusMeters / (METERS_PER_DEGREE_LAT * Math.cos((center.lat * Math.PI) / 180));
  return {
    minLat: center.lat - latDelta,
    maxLat: center.lat + latDelta,
    minLng: center.lng - lngDelta,
    maxLng: center.lng + lngDelta,
  };
};

export const isWithinBoundingBox = (point: GeoPoint, bounds: BoundingBox) =>
  point.lat >= bounds.minLat && point.lat <= bounds.maxLat && point.lng >= bounds.minLng && point.lng <= bounds.maxLng;

export const filterByGeoRadius = <T>(items: T[], center: GeoPoint, radiusMeters: number, pickCoords: (item: T) => GeoPoint | null): T[] => {
  const bounds = computeBoundingBox(center, radiusMeters);
  return items
    .map((item) => ({ coords: pickCoords(item), item }))
    .filter(({ coords }) => coords !== null && isWithinBoundingBox(coords, bounds))
    .filter(({ coords }) => coords && getDistanceMeters(center, coords) <= radiusMeters)
    .map(({ item }) => item);
};
