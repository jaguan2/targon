/**
 * A small offline city list, so the common case does not require looking up
 * coordinates by hand.
 *
 * Deliberately not a geocoding API: birth data is about as personal as it
 * gets, and the whole app is built to run without sending any of it anywhere.
 * Users outside this list enter coordinates directly.
 */
export interface City {
  name: string;
  latitude: number;
  longitude: number;
}

export const CITIES: readonly City[] = [
  { name: 'Atlanta, US', latitude: 33.749, longitude: -84.388 },
  { name: 'Auckland, NZ', latitude: -36.8485, longitude: 174.7633 },
  { name: 'Berlin, DE', latitude: 52.52, longitude: 13.405 },
  { name: 'Buenos Aires, AR', latitude: -34.6037, longitude: -58.3816 },
  { name: 'Cairo, EG', latitude: 30.0444, longitude: 31.2357 },
  { name: 'Chicago, US', latitude: 41.8781, longitude: -87.6298 },
  { name: 'Delhi, IN', latitude: 28.6139, longitude: 77.209 },
  { name: 'Denver, US', latitude: 39.7392, longitude: -104.9903 },
  { name: 'Dublin, IE', latitude: 53.3498, longitude: -6.2603 },
  { name: 'Houston, US', latitude: 29.7604, longitude: -95.3698 },
  { name: 'Istanbul, TR', latitude: 41.0082, longitude: 28.9784 },
  { name: 'Johannesburg, ZA', latitude: -26.2041, longitude: 28.0473 },
  { name: 'Lagos, NG', latitude: 6.5244, longitude: 3.3792 },
  { name: 'London, UK', latitude: 51.5074, longitude: -0.1278 },
  { name: 'Los Angeles, US', latitude: 34.0522, longitude: -118.2437 },
  { name: 'Madrid, ES', latitude: 40.4168, longitude: -3.7038 },
  { name: 'Manila, PH', latitude: 14.5995, longitude: 120.9842 },
  { name: 'Mexico City, MX', latitude: 19.4326, longitude: -99.1332 },
  { name: 'Miami, US', latitude: 25.7617, longitude: -80.1918 },
  { name: 'Moscow, RU', latitude: 55.7558, longitude: 37.6173 },
  { name: 'Mumbai, IN', latitude: 19.076, longitude: 72.8777 },
  { name: 'New York, US', latitude: 40.7128, longitude: -74.006 },
  { name: 'Paris, FR', latitude: 48.8566, longitude: 2.3522 },
  { name: 'Rio de Janeiro, BR', latitude: -22.9068, longitude: -43.1729 },
  { name: 'São Paulo, BR', latitude: -23.5505, longitude: -46.6333 },
  { name: 'Seattle, US', latitude: 47.6062, longitude: -122.3321 },
  { name: 'Seoul, KR', latitude: 37.5665, longitude: 126.978 },
  { name: 'Shanghai, CN', latitude: 31.2304, longitude: 121.4737 },
  { name: 'Singapore, SG', latitude: 1.3521, longitude: 103.8198 },
  { name: 'Sydney, AU', latitude: -33.8688, longitude: 151.2093 },
  { name: 'Tokyo, JP', latitude: 35.6762, longitude: 139.6503 },
  { name: 'Toronto, CA', latitude: 43.6532, longitude: -79.3832 },
];
