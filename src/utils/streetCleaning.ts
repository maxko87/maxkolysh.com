// Street cleaning GeoJSON fetching and nearest-segment logic

import * as turf from '@turf/turf';
import type { Feature, FeatureCollection, LineString, MultiLineString, Polygon, MultiPolygon } from 'geojson';

const DATA_BASE_URL = 'https://raw.githubusercontent.com/kaushalpartani/sf-street-cleaning/refs/heads/main/data';

export interface CleaningSide {
  BlockSweepID: string;
  WeekDay: string;
  Week1: boolean;
  Week2: boolean;
  Week3: boolean;
  Week4: boolean;
  Week5: boolean;
  FromHour: string;
  ToHour: string;
  Holidays: string;
  NextCleaning: string | null;
  NextCleaningEnd: string | null;
  NextNextCleaning: string | null;
  NextCleaningCalendarLink: string | null;
}

export interface StreetSegmentProperties {
  Corridor: string;
  Limits: string;
  CNN: number;
  East: CleaningSide | null;
  West: CleaningSide | null;
  North: CleaningSide | null;
  South: CleaningSide | null;
}

export interface NearestSegmentResult {
  feature: Feature<LineString | MultiLineString, StreetSegmentProperties>;
  distance: number; // in meters
  sides: { label: string; data: CleaningSide }[];
}

// Fetch all neighborhood boundaries
export async function fetchNeighborhoods(): Promise<FeatureCollection<Polygon | MultiPolygon>> {
  const response = await fetch(`${DATA_BASE_URL}/neighborhoods.geojson`);
  if (!response.ok) throw new Error('Failed to fetch neighborhood boundaries');
  return response.json();
}

// Determine which SF neighborhood a point is in
export function findNeighborhood(
  lat: number,
  lng: number,
  neighborhoods: FeatureCollection<Polygon | MultiPolygon>
): string | null {
  const pt = turf.point([lng, lat]);

  for (const feature of neighborhoods.features) {
    if (turf.booleanPointInPolygon(pt, feature)) {
      // The neighborhood name is in the feature properties
      const name = feature.properties?.nhood || feature.properties?.name || feature.properties?.NEIGHBORHOOD;
      if (name) return name;
    }
  }

  return null;
}

// Fetch street cleaning data for a neighborhood
export async function fetchNeighborhoodData(
  neighborhoodName: string
): Promise<FeatureCollection<LineString | MultiLineString, StreetSegmentProperties>> {
  const encoded = encodeURIComponent(neighborhoodName);
  const response = await fetch(`${DATA_BASE_URL}/neighborhoods/${encoded}.geojson`);
  if (!response.ok) throw new Error(`Failed to fetch data for neighborhood: ${neighborhoodName}`);
  return response.json();
}

// Find the nearest street segment to a GPS point
export function findNearestSegment(
  lat: number,
  lng: number,
  streetData: FeatureCollection<LineString | MultiLineString, StreetSegmentProperties>
): NearestSegmentResult | null {
  const pt = turf.point([lng, lat]);
  let nearestFeature: Feature<LineString | MultiLineString, StreetSegmentProperties> | null = null;
  let nearestDistance = Infinity;

  for (const feature of streetData.features) {
    try {
      let line: Feature<LineString>;

      if (feature.geometry.type === 'MultiLineString') {
        // Convert MultiLineString to LineString (use first line)
        line = turf.lineString(feature.geometry.coordinates[0]);
      } else {
        line = feature as unknown as Feature<LineString>;
      }

      const snapped = turf.nearestPointOnLine(line, pt, { units: 'meters' });
      const dist = snapped.properties.dist ?? Infinity;

      if (dist < nearestDistance) {
        nearestDistance = dist;
        nearestFeature = feature;
      }
    } catch {
      // Skip invalid geometries
      continue;
    }
  }

  if (!nearestFeature) return null;

  // Extract populated sides
  const sides: { label: string; data: CleaningSide }[] = [];
  const props = nearestFeature.properties;

  for (const sideKey of ['East', 'West', 'North', 'South'] as const) {
    const sideData = props[sideKey];
    if (sideData && sideData.NextCleaning) {
      sides.push({ label: `${sideKey} Side`, data: sideData });
    }
  }

  return {
    feature: nearestFeature,
    distance: nearestDistance,
    sides,
  };
}

// Get cleaning status based on time until next cleaning
export function getCleaningStatus(nextCleaning: string): {
  label: string;
  color: 'green' | 'yellow' | 'red';
  emoji: string;
  timeUntil: string;
} {
  const now = new Date();
  const cleaning = new Date(nextCleaning);
  const diffMs = cleaning.getTime() - now.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);

  const timeUntil = formatTimeUntil(diffMs);

  if (diffHours < 0) {
    return { label: 'Passed', color: 'green', emoji: '✅', timeUntil: 'Already passed' };
  } else if (diffHours < 4) {
    return { label: 'Move Now', color: 'red', emoji: '🔴', timeUntil };
  } else if (diffHours < 24) {
    return { label: 'Soon', color: 'yellow', emoji: '🟡', timeUntil };
  } else {
    return { label: 'Safe', color: 'green', emoji: '🟢', timeUntil };
  }
}

function formatTimeUntil(diffMs: number): string {
  if (diffMs < 0) return 'Already passed';

  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  if (hours >= 48) {
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    return `${days} days, ${remainingHours} hours`;
  } else if (hours >= 1) {
    return `${hours} hours, ${minutes} minutes`;
  } else {
    return `${minutes} minutes`;
  }
}

// Format a cleaning datetime for display
export function formatCleaningTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}
