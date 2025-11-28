export interface GeoPoint {
  lat: number;
  lng: number;
}

const toRadians = (value: number) => (value * Math.PI) / 180;
const EARTH_RADIUS_METERS = 6371000;

/**
 * Calculates the great-circle distance between two points using the Haversine formula.
 *
 * Example:
 * const meters = getDistanceMeters({ lat: 12.98, lng: 77.59 }, { lat: 12.99, lng: 77.60 });
 */
export const getDistanceMeters = (a: GeoPoint, b: GeoPoint): number => {
  const dLat = toRadians(b.lat - a.lat);
  const dLng = toRadians(b.lng - a.lng);
  const lat1 = toRadians(a.lat);
  const lat2 = toRadians(b.lat);

  const haversine =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLng / 2) * Math.sin(dLng / 2) * Math.cos(lat1) * Math.cos(lat2);

  const c = 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
  return EARTH_RADIUS_METERS * c;
};
