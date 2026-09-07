/** Distance is computed here because no endpoint returns it; the map gives coordinates. */

const EARTH_RADIUS_KM = 6371;

const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

export type Coordinates = { latitude: number; longitude: number };

/** Haversine. An oasis spans a few km, so the spherical error is far under a pin's width. */
export function distanceKm(from: Coordinates, to: Coordinates): number {
  const dLat = toRadians(to.latitude - from.latitude);
  const dLon = toRadians(to.longitude - from.longitude);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(from.latitude)) *
      Math.cos(toRadians(to.latitude)) *
      Math.sin(dLon / 2) ** 2;

  return EARTH_RADIUS_KM * 2 * Math.asin(Math.min(1, Math.sqrt(a)));
}

/** F-01 writes "0.8 كم" and "3.2 كم", so under 10km keeps one decimal. */
export function formatDistance(km: number): string {
  if (!Number.isFinite(km) || km < 0) {
    return '';
  }
  // Below 100m "0.1 كم" overstates the precision of a phone GPS fix.
  if (km < 0.1) {
    return 'قريب جدًا';
  }
  return `${km < 10 ? km.toFixed(1) : Math.round(km)} كم`;
}
