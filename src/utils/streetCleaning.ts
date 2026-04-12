// Street cleaning GeoJSON fetching and nearest-segment logic

import * as turf from '@turf/turf';
import type { Feature, FeatureCollection, LineString, MultiLineString, Polygon, MultiPolygon } from 'geojson';

const DATA_BASE_URL = 'https://raw.githubusercontent.com/kaushalpartani/sf-street-cleaning/refs/heads/main/data';

export interface CleaningSide {
  NextCleaning: string | null;
  NextNextCleaning: string | null;
  NextCleaningEnd: string | null;
  NextNextCleaningEnd: string | null;
  NextCleaningCalendarLink: string | null;
  NextNextCleaningCalendarLink: string | null;
}

export interface RelevantCleaning {
  start: string;
  end: string;
  calendarLink: string | null;
  nextStart: string | null;
  nextEnd: string | null;
  nextCalendarLink: string | null;
}

export interface StreetSegmentProperties {
  Corridor: string;
  Limits: string;
  StreetIdentifier?: string;
  CNN?: number;
  Sides: { [key: string]: CleaningSide };
}

export interface NearestSegmentResult {
  feature: Feature<LineString | MultiLineString, StreetSegmentProperties>;
  distance: number; // in meters
  sides: { label: string; data: CleaningSide; relevant: RelevantCleaning | null }[];
  parkedSide: string | null; // e.g. "North Side", "South Side" — which side the car is on
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
      const props = feature.properties || {};
      const name = props.FileName || props.NeighborhoodName || props.nhood || props.name || props.NEIGHBORHOOD;
      console.log('[Parking] Matched neighborhood:', name, 'props:', props);
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

// Get the relevant upcoming cleaning from a side's data
export function getRelevantCleaning(side: CleaningSide): RelevantCleaning | null {
  const now = new Date();

  // Check if NextCleaning is in the future
  if (side.NextCleaning) {
    const nextEnd = side.NextCleaningEnd ? new Date(side.NextCleaningEnd) : new Date(side.NextCleaning);
    if (nextEnd > now) {
      // NextCleaning is still relevant (hasn't ended yet)
      return {
        start: side.NextCleaning,
        end: side.NextCleaningEnd || side.NextCleaning,
        calendarLink: side.NextCleaningCalendarLink || null,
        nextStart: side.NextNextCleaning || null,
        nextEnd: side.NextNextCleaningEnd || null,
        nextCalendarLink: side.NextNextCleaningCalendarLink || null,
      };
    }
  }

  // NextCleaning is past, fall back to NextNextCleaning
  if (side.NextNextCleaning) {
    return {
      start: side.NextNextCleaning,
      end: side.NextNextCleaningEnd || side.NextNextCleaning,
      calendarLink: side.NextNextCleaningCalendarLink || null,
      nextStart: null,
      nextEnd: null,
      nextCalendarLink: null,
    };
  }

  return null;
}

// Determine which side of the street a point is on using cross product
function determineSide(
  lat: number,
  lng: number,
  lineCoords: number[][],
  sideKeys: string[]
): string | null {
  if (lineCoords.length < 2 || sideKeys.length === 0) return null;

  const pt = turf.point([lng, lat]);
  const line = turf.lineString(lineCoords);
  const snapped = turf.nearestPointOnLine(line, pt);
  const idx = snapped.properties.index ?? 0;

  // Get the segment direction at the nearest point
  const segStart = lineCoords[Math.min(idx, lineCoords.length - 2)];
  const segEnd = lineCoords[Math.min(idx + 1, lineCoords.length - 1)];

  // Direction vector of the street segment (in lng/lat space)
  const dx = segEnd[0] - segStart[0]; // east-west component
  const dy = segEnd[1] - segStart[1]; // north-south component

  // Vector from nearest point on line to the car
  const nearPt = snapped.geometry.coordinates;
  const px = lng - nearPt[0];
  const py = lat - nearPt[1];

  // Cross product: positive = point is to the LEFT of the line direction
  const cross = dx * py - dy * px;

  // Determine if street runs more east-west or north-south
  const absDx = Math.abs(dx);
  const absDy = Math.abs(dy);

  // Map left/right to actual side names
  // For an east-going street (dx > 0): LEFT = North, RIGHT = South
  // For a west-going street (dx < 0): LEFT = South, RIGHT = North
  // For a north-going street (dy > 0): LEFT = West, RIGHT = East
  // For a south-going street (dy < 0): LEFT = East, RIGHT = West

  let detectedSide: string | null = null;

  if (absDx >= absDy) {
    // Street runs more east-west
    if (dx >= 0) {
      detectedSide = cross > 0 ? 'North' : 'South';
    } else {
      detectedSide = cross > 0 ? 'South' : 'North';
    }
  } else {
    // Street runs more north-south
    if (dy >= 0) {
      detectedSide = cross > 0 ? 'West' : 'East';
    } else {
      detectedSide = cross > 0 ? 'East' : 'West';
    }
  }

  // Only return if the detected side actually exists in the data
  if (detectedSide && sideKeys.includes(detectedSide)) {
    return `${detectedSide} Side`;
  }

  // Fallback: if detected side doesn't match available sides, try to match
  // e.g., data might have "East"/"West" for what we detected as "North"/"South"
  // In that case, use the cross product sign directly
  if (sideKeys.length === 2) {
    // Just pick based on cross product sign — first key = one side, second = other
    // Sort keys so mapping is consistent
    const sorted = [...sideKeys].sort();
    // For 2 sides, cross > 0 (left) gets first alphabetically, cross < 0 gets second
    // This is a heuristic fallback
    return cross > 0 ? `${sorted[0]} Side` : `${sorted[1]} Side`;
  }

  return null;
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
      continue;
    }
  }

  if (!nearestFeature) return null;

  // Extract populated sides from the nested Sides object
  const sides: { label: string; data: CleaningSide; relevant: RelevantCleaning | null }[] = [];
  const sidesObj = nearestFeature.properties.Sides;

  if (sidesObj && typeof sidesObj === 'object') {
    for (const [sideKey, sideData] of Object.entries(sidesObj)) {
      if (sideData) {
        const relevant = getRelevantCleaning(sideData);
        if (relevant) {
          sides.push({ label: `${sideKey} Side`, data: sideData, relevant });
        }
      }
    }
  }

  // Determine which side the car is parked on
  let parkedSide: string | null = null;
  const geom = nearestFeature.geometry;
  const lineCoords = geom.type === 'MultiLineString' ? geom.coordinates[0] : geom.coordinates;
  const sideKeys = sidesObj ? Object.keys(sidesObj).filter(k => sidesObj[k]) : [];

  if (sideKeys.length > 0 && lineCoords.length >= 2) {
    parkedSide = determineSide(lat, lng, lineCoords, sideKeys);
    console.log('[Parking] Side detection:', { parkedSide, sideKeys, lineCoords: lineCoords.slice(0, 3) });
  }

  // Sort sides so parked side comes first
  if (parkedSide) {
    sides.sort((a, b) => {
      if (a.label === parkedSide) return -1;
      if (b.label === parkedSide) return 1;
      return 0;
    });
  }

  return {
    feature: nearestFeature,
    distance: nearestDistance,
    sides,
    parkedSide,
  };
}

// Get cleaning status based on time until next cleaning
export function getCleaningStatus(startStr: string, endStr: string): {
  label: string;
  color: 'green' | 'yellow' | 'red';
  emoji: string;
  timeUntil: string;
} {
  const now = new Date();
  const start = new Date(startStr);
  const end = new Date(endStr);
  const diffToStart = start.getTime() - now.getTime();
  const diffHoursToStart = diffToStart / (1000 * 60 * 60);

  // Currently happening
  if (now >= start && now <= end) {
    const remaining = end.getTime() - now.getTime();
    return { label: 'Happening Now', color: 'red', emoji: '🔴', timeUntil: `Ends in ${formatTimeUntil(remaining)}` };
  }

  const timeUntil = formatTimeUntil(diffToStart);

  if (diffHoursToStart < 0) {
    return { label: 'Passed', color: 'green', emoji: '✅', timeUntil: 'Already passed' };
  } else if (diffHoursToStart < 4) {
    return { label: 'Move Now', color: 'red', emoji: '🔴', timeUntil };
  } else if (diffHoursToStart < 24) {
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
    return `in ${days} days`;
  } else if (hours >= 24) {
    const remainingHours = hours - 24;
    return remainingHours > 0 ? `in 1 day, ${remainingHours} hrs` : 'in 1 day';
  } else if (hours >= 1) {
    return `in ${hours} hrs${minutes > 0 ? `, ${minutes} min` : ''}`;
  } else {
    return `in ${minutes} min`;
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

// Format a time range for display
export function formatCleaningRange(startStr: string, endStr: string): string {
  const start = new Date(startStr);
  const end = new Date(endStr);
  const dateStr = start.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
  const startTime = start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  const endTime = end.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  return `${dateStr} · ${startTime} – ${endTime}`;
}
