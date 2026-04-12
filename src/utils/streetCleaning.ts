import * as turf from '@turf/turf';

const BASE_URL = 'https://raw.githubusercontent.com/kaushalpartani/sf-street-cleaning/main/data';

interface NeighborhoodInfo {
  FileName: string;
  NeighborhoodName: string;
}

interface CleaningSide {
  NextCleaning?: string;
  Schedule?: string;
  Days?: string;
  Weeks?: string;
  StartTime?: string;
  EndTime?: string;
}

interface CleaningProperties {
  Sides: {
    North?: CleaningSide;
    South?: CleaningSide;
    East?: CleaningSide;
    West?: CleaningSide;
  };
  StreetName?: string;
  BlockSweepID?: string;
  CNN?: string;
  [key: string]: unknown;
}

export interface CleaningResult {
  streetName: string;
  side: string;
  nextCleaning: string | null;
  schedule: string | null;
  recurringPattern: string | null;
  distance: number;
  neighborhoodName: string;
}

export async function getNeighborhoods(): Promise<NeighborhoodInfo[]> {
  const res = await fetch(`${BASE_URL}/neighborhoods.json`);
  if (!res.ok) throw new Error('Failed to load neighborhoods');
  return res.json();
}

export async function findCleaningSchedule(
  lat: number,
  lng: number
): Promise<CleaningResult | null> {
  // 1. Load neighborhood index to find which neighborhood
  const neighborhoods = await getNeighborhoods();
  
  // 2. Try nearby neighborhoods (start with Noe Valley area, expand if needed)
  // Sort by likely proximity to SF neighborhoods
  const priorityOrder = ['NoeValley', 'TheCastro', 'MissionDolores', 'Mission', 'GlenPark', 'Eureka', 'Corona', 'BernalHeights'];
  const sorted = [
    ...neighborhoods.filter(n => priorityOrder.includes(n.FileName)),
    ...neighborhoods.filter(n => !priorityOrder.includes(n.FileName)),
  ];
  
  const point = turf.point([lng, lat]);
  
  let bestResult: CleaningResult | null = null;
  let bestDistance = Infinity;
  
  // Check up to 5 neighborhoods for closest street
  for (const hood of sorted.slice(0, 8)) {
    try {
      const res = await fetch(`${BASE_URL}/neighborhoods/${hood.FileName}.geojson`);
      if (!res.ok) continue;
      
      const geojson = await res.json();
      
      for (const feature of geojson.features) {
        if (feature.geometry.type !== 'LineString' && feature.geometry.type !== 'MultiLineString') continue;
        
        const props = feature.properties as CleaningProperties;
        if (!props.Sides) continue;
        
        try {
          let line;
          if (feature.geometry.type === 'MultiLineString') {
            // Use first line segment
            line = turf.lineString(feature.geometry.coordinates[0]);
          } else {
            line = turf.lineString(feature.geometry.coordinates);
          }
          
          const nearest = turf.nearestPointOnLine(line, point);
          const dist = nearest.properties.dist || Infinity;
          
          if (dist < bestDistance && dist < 0.1) { // Within 100m
            bestDistance = dist;
            
            // Determine which side of street
            const side = determineStreetSide(lat, lng, feature.geometry.coordinates);
            const sideData = props.Sides[side as keyof typeof props.Sides];
            
            if (sideData) {
              bestResult = {
                streetName: props.StreetName || 'Unknown Street',
                side,
                nextCleaning: sideData.NextCleaning || null,
                schedule: sideData.Schedule || null,
                recurringPattern: buildRecurringPattern(sideData),
                distance: dist * 1000, // km to meters
                neighborhoodName: hood.NeighborhoodName,
              };
            }
          }
        } catch {
          continue;
        }
      }
      
      // If we found something close enough, stop searching
      if (bestDistance < 0.03) break; // Within 30m
    } catch {
      continue;
    }
  }
  
  return bestResult;
}

function determineStreetSide(
  lat: number,
  lng: number,
  coordinates: number[][]
): string {
  // Get the two nearest points on the street to form a direction vector
  const coords = (Array.isArray(coordinates[0][0]) ? coordinates[0] : coordinates) as number[][];
  
  if (coords.length < 2) return 'North';
  
  // Find closest segment
  let minDist = Infinity;
  let closestIdx = 0;
  
  for (let i = 0; i < coords.length - 1; i++) {
    const segLine = turf.lineString([coords[i], coords[i + 1]]);
    const pt = turf.point([lng, lat]);
    const nearest = turf.nearestPointOnLine(segLine, pt);
    const dist = nearest.properties.dist || Infinity;
    if (dist < minDist) {
      minDist = dist;
      closestIdx = i;
    }
  }
  
  const p1 = coords[closestIdx];
  const p2 = coords[closestIdx + 1];
  
  // Street direction vector
  const dx = p2[0] - p1[0]; // lng diff
  const dy = p2[1] - p1[1]; // lat diff
  
  // Vector from street to car (cross product)
  const cx = lng - p1[0];
  const cy = lat - p1[1];
  
  const cross = dx * cy - dy * cx;
  
  // Determine cardinal direction based on street bearing
  const bearing = turf.bearing(turf.point(p1), turf.point(p2));
  
  // Street roughly E-W → sides are North/South
  // Street roughly N-S → sides are East/West
  const absBearing = Math.abs(bearing);
  
  if (absBearing < 45 || absBearing > 135) {
    // Street runs roughly N-S
    return cross > 0 ? 'East' : 'West';
  } else {
    // Street runs roughly E-W
    return cross > 0 ? 'North' : 'South';
  }
}

function buildRecurringPattern(side: CleaningSide): string | null {
  if (!side.Days && !side.Weeks) return side.Schedule || null;
  
  const days = side.Days || '';
  const weeks = side.Weeks || '';
  const startTime = side.StartTime || '';
  const endTime = side.EndTime || '';
  
  let weekDesc = '';
  if (weeks) {
    const weekNums = weeks.split(',').map(w => w.trim());
    const ordinals = weekNums.map(w => {
      const n = parseInt(w);
      if (n === 1) return '1st';
      if (n === 2) return '2nd';
      if (n === 3) return '3rd';
      if (n === 4) return '4th';
      return `${n}th`;
    });
    weekDesc = `Every ${ordinals.join(' and ')} `;
  }
  
  let timeDesc = '';
  if (startTime && endTime) {
    timeDesc = `, ${formatTime(startTime)} – ${formatTime(endTime)}`;
  }
  
  return `${weekDesc}${days}${timeDesc}`;
}

function formatTime(time: string): string {
  // Handle "09:00" format
  const parts = time.split(':');
  if (parts.length < 2) return time;
  
  let hour = parseInt(parts[0]);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  if (hour > 12) hour -= 12;
  if (hour === 0) hour = 12;
  
  return `${hour} ${ampm}`;
}
