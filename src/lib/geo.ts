export type LatLng = { lat: number; lng: number };

/** China envelope as [[south, west], [north, east]] (lat/lng order) */
export const CHINA_MAX_BOUNDS: [[number, number], [number, number]] = [
  [3.0, 73.0],
  [54.0, 135.0],
];

export function haversineKm(a: LatLng, b: LatLng): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function sortPlacesByDistance<T extends LatLng>(
  places: T[],
  origin: LatLng,
): (T & { distanceKm: number })[] {
  return places
    .map((p) => ({ ...p, distanceKm: haversineKm(origin, p) }))
    .sort((x, y) => x.distanceKm - y.distanceKm);
}
