/** Original 5 locations (backward compatible). */
export const DEFAULT_FORECAST_LOCATIONS = [
  { name: 'Bangalore', lat: 12.9716, lng: 77.5946 },
  { name: 'Mysore', lat: 12.2958, lng: 76.6394 },
  { name: 'Mandya', lat: 12.5218, lng: 76.8951 },
  { name: 'Tumkur', lat: 13.3409, lng: 77.101 },
  { name: 'Hassan', lat: 13.0033, lng: 76.1004 },
];

/**
 * Extended Karnataka agricultural districts (20 total including original 5).
 * Each entry: location_name, latitude, longitude.
 */
export const EXTENDED_FORECAST_LOCATIONS = [
  ...DEFAULT_FORECAST_LOCATIONS,
  { name: 'Kolar', lat: 13.1363, lng: 78.1291 },
  { name: 'Chikkaballapur', lat: 13.4355, lng: 77.7315 },
  { name: 'Ramanagara', lat: 12.7233, lng: 77.2798 },
  { name: 'Shivamogga', lat: 13.9299, lng: 75.5681 },
  { name: 'Davanagere', lat: 14.4644, lng: 75.9218 },
  { name: 'Chitradurga', lat: 14.2226, lng: 76.398 },
  { name: 'Belagavi', lat: 15.8497, lng: 74.4977 },
  { name: 'Dharwad', lat: 15.4589, lng: 75.0078 },
  { name: 'Hubli', lat: 15.3647, lng: 75.124 },
  { name: 'Raichur', lat: 16.2076, lng: 77.3463 },
  { name: 'Koppal', lat: 15.35, lng: 76.15 },
  { name: 'Ballari', lat: 15.1394, lng: 76.9214 },
  { name: 'Vijayapura', lat: 16.8302, lng: 75.71 },
  { name: 'Kalaburagi', lat: 17.3297, lng: 76.8343 },
  { name: 'Chamarajanagar', lat: 11.9261, lng: 76.9437 },
];

export const EXTENDED_DATE_DEFAULTS = {
  startDate: '2010-01-01',
  endDate: '2026-01-01',
};

/**
 * Parse locations from query string JSON or use defaults.
 */
export function parseForecastLocations(query, { extended = false } = {}) {
  const fallback = extended ? EXTENDED_FORECAST_LOCATIONS : DEFAULT_FORECAST_LOCATIONS;

  if (query.locations) {
    try {
      const parsed = JSON.parse(query.locations);
      if (!Array.isArray(parsed) || parsed.length === 0) {
        return { error: 'locations must be a non-empty JSON array' };
      }
      for (const loc of parsed) {
        if (loc.lat == null || loc.lng == null) {
          return { error: 'Each location requires lat and lng' };
        }
        const lat = parseFloat(loc.lat);
        const lng = parseFloat(loc.lng);
        if (Number.isNaN(lat) || Number.isNaN(lng)) {
          return { error: `Invalid coordinates for location "${loc.name || 'unknown'}"` };
        }
        if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
          return { error: `Coordinates out of range for "${loc.name || 'unknown'}"` };
        }
      }
      return {
        locations: parsed.map((loc, i) => ({
          name: loc.name || `Location_${i + 1}`,
          lat: parseFloat(loc.lat),
          lng: parseFloat(loc.lng),
        })),
      };
    } catch {
      return { error: 'locations must be valid JSON' };
    }
  }

  if (query.lat && query.lng) {
    return {
      locations: [
        {
          name: query.regionName || query.name || 'Custom',
          lat: parseFloat(query.lat),
          lng: parseFloat(query.lng),
        },
      ],
    };
  }

  if (query.multi === 'true' || query.multi === '1' || query.all === 'true' || extended) {
    return { locations: fallback };
  }

  return { locations: fallback };
}
