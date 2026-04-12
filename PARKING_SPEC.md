# Tesla Street Parking — MVP Spec

## Overview

A web app at **maxkolysh.com/parking** that connects to a user's Tesla, reads the car's GPS location, and tells them the next street cleaning time for the street they're parked on in San Francisco.

## Problem

SF street cleaning tickets are $76+. Drivers forget which day their street gets cleaned. Tesla knows exactly where the car is parked — this app bridges that data with SF's street cleaning schedule.

## User Flow

1. **Landing** — User visits `/parking`, sees a clean dark UI explaining what the app does
2. **Connect Tesla** — User clicks "Connect Tesla" → redirected to Tesla OAuth2 consent screen
3. **OAuth Callback** — Tesla redirects back with `code`, app exchanges it for tokens via Supabase Edge Function
4. **Vehicle Select** — App fetches vehicle list from Tesla Fleet API, user picks their car
5. **Location Fetch** — App gets GPS coordinates from Tesla Fleet API (`drive_state.latitude/longitude`)
6. **Neighborhood Lookup** — Point-in-polygon against SF neighborhood boundaries to determine which neighborhood the car is in
7. **Street Segment Match** — Fetch that neighborhood's GeoJSON, find nearest street segment to car's GPS using turf.js
8. **Display Results** — Show street name, block range, next cleaning time(s) for both sides, countdown, and "Add to Calendar" links
9. **Both Sides** — If relevant, show cleaning schedules for both sides of the street

## Data Source

**Repository:** [kaushalpartani/sf-street-cleaning](https://github.com/kaushalpartani/sf-street-cleaning)

- Pre-built GeoJSON files per SF neighborhood, updated daily via GitHub Actions
- **Neighborhood boundaries:** `https://raw.githubusercontent.com/kaushalpartani/sf-street-cleaning/refs/heads/main/data/neighborhoods.geojson`
- **Per-neighborhood data:** `https://raw.githubusercontent.com/kaushalpartani/sf-street-cleaning/refs/heads/main/data/neighborhoods/{Name}.geojson`

### GeoJSON Feature Properties

Each street segment feature contains:

```json
{
  "Corridor": "VALENCIA ST",
  "Limits": "16TH ST to 17TH ST",
  "CNN": 13042000,
  "East": {
    "BlockSweepID": "12345",
    "WeekDay": "Mon",
    "Week1": true,
    "Week2": false,
    "Week3": true,
    "Week4": false,
    "Week5": false,
    "FromHour": "08:00",
    "ToHour": "10:00",
    "Holidays": "Y",
    "NextCleaning": "2025-04-14T08:00:00",
    "NextCleaningEnd": "2025-04-14T10:00:00",
    "NextNextCleaning": "2025-04-28T08:00:00",
    "NextCleaningCalendarLink": "https://calendar.google.com/..."
  },
  "West": { ... },
  "North": null,
  "South": null
}
```

**Sides:** East, West, North, South — only populated sides are relevant.

## Tesla API Integration

### OAuth2 Flow

1. **Authorization URL:** `https://auth.tesla.com/oauth2/v3/authorize`
   - `response_type=code`
   - `client_id={TESLA_CLIENT_ID}`
   - `redirect_uri=https://maxkolysh.com/parking`
   - `scope=openid vehicle_device_data vehicle_location offline_access`
   - `state={random_nonce}`
2. **Token Exchange** (via Supabase Edge Function — client_secret must stay server-side):
   - POST `https://auth.tesla.com/oauth2/v3/token`
   - Body: `grant_type=authorization_code`, `code`, `client_id`, `client_secret`, `redirect_uri`
3. **Token Storage:** Access token stored in memory/sessionStorage. Refresh token in sessionStorage.

### Fleet API Endpoints

- **Base URL:** `https://fleet-api.prd.na.vn.cloud.tesla.com`
- **List Vehicles:** `GET /api/1/vehicles` → `response[].{id, vehicle_id, display_name, vin}`
- **Vehicle Data:** `GET /api/1/vehicles/{id}/vehicle_data?endpoints=location_data` → `response.drive_state.{latitude, longitude}`
- **Wake Vehicle:** `POST /api/1/vehicles/{id}/wake_up` (vehicle must be awake to read location)

### Public Key Hosting

Tesla requires third-party apps to host their public key at:
```
https://maxkolysh.com/.well-known/appspecific/com.tesla.3p.public-key.pem
```
This file must be served as a static asset from the `public/` directory.

## Architecture

### Frontend (React SPA)

```
src/
├── pages/
│   └── ParkingPage.tsx          # Main page component, state machine orchestrator
├── components/parking/
│   ├── TeslaConnect.tsx         # OAuth button + auth flow handler
│   ├── VehicleSelect.tsx        # Vehicle picker dropdown/cards
│   ├── CleaningSchedule.tsx     # Cleaning info display + calendar links
│   └── ParkingMap.tsx           # Optional: map with car pin + street overlay
├── utils/
│   ├── tesla.ts                 # Tesla OAuth + Fleet API helpers
│   └── streetCleaning.ts        # GeoJSON fetch, point-in-polygon, nearest segment
```

### Backend (Supabase Edge Function)

```
supabase/functions/
└── tesla-auth/
    └── index.ts                 # Token exchange proxy (holds client_secret)
```

**Why Supabase?** The Tesla OAuth token exchange requires `client_secret`, which cannot be exposed in browser JS. The edge function acts as a thin proxy.

### State Machine

The page progresses through states:

```
LANDING → AUTHENTICATING → SELECTING_VEHICLE → FETCHING_LOCATION → LOADING_DATA → SHOWING_RESULTS
                                                                                  → ERROR
```

## Geo Logic

### 1. Point-in-Polygon (Neighborhood Detection)

```ts
import booleanPointInPolygon from '@turf/boolean-point-in-polygon';

// Fetch neighborhoods.geojson (all boundaries)
// For each feature, check if car point is inside
// Return matching neighborhood name
```

### 2. Nearest Street Segment

```ts
import nearestPointOnLine from '@turf/nearest-point-on-line';
import { point } from '@turf/helpers';

// Fetch {Neighborhood}.geojson
// For each street segment (LineString), compute distance to car point
// Return the closest segment(s) — ideally the 1-3 nearest
```

### 3. Display Logic

- Show the **nearest** segment's cleaning info
- For each populated side (East/West/North/South), show:
  - Day + time window (e.g., "Monday 8:00 AM – 10:00 AM")
  - Next cleaning date + countdown ("in 3 days, 4 hours")
  - "Add to Calendar" link (Google Calendar)
  - Next-next cleaning date for planning ahead

## UI Design

### Landing State
- Dark background (#0a0a0a or similar)
- Tesla-inspired minimal aesthetic
- Car silhouette icon
- "SF Street Cleaning for Tesla" headline
- Brief description: "Connect your Tesla to see when street cleaning happens where you're parked"
- "Connect Tesla" CTA button (Tesla red: #cc0000 or similar accent)

### Results State
- Street name + block range prominently displayed
- Side-by-side cards for each street side
- Each card shows:
  - Side label (e.g., "East Side")
  - Next cleaning: date, time window
  - Countdown: "2 days, 5 hours from now"
  - Status badge: 🟢 "Safe" (>24h), 🟡 "Soon" (4-24h), 🔴 "Move Now" (<4h)
  - "Add to Calendar" button
- "Check Another Vehicle" link
- "Refresh Location" button

### Error States
- Vehicle asleep → "Your Tesla is asleep. Wake it up?" with retry button
- Not in SF → "Your car doesn't appear to be in San Francisco"
- No cleaning data → "No street cleaning data found for this location"
- Auth failed → "Connection to Tesla failed. Try again?"

## Dependencies

### New (to install)
- `@turf/turf` — geospatial operations (or individual modules: `@turf/nearest-point-on-line`, `@turf/boolean-point-in-polygon`, `@turf/helpers`)

### Existing (in repo)
- React 19, TypeScript, Vite 7, Tailwind CSS 4
- React Router DOM 7
- Supabase client

## Environment Variables

### Frontend (.env)
```
VITE_TESLA_CLIENT_ID=<tesla_app_client_id>
VITE_TESLA_REDIRECT_URI=https://maxkolysh.com/parking
VITE_SUPABASE_URL=<already_configured>
VITE_SUPABASE_ANON_KEY=<already_configured>
```

### Supabase Edge Function (secrets)
```
TESLA_CLIENT_ID=<tesla_app_client_id>
TESLA_CLIENT_SECRET=<tesla_app_client_secret>
```

## MVP Scope

### In Scope
- Tesla OAuth2 connect flow
- Vehicle selection
- GPS location read
- SF neighborhood detection
- Street cleaning schedule lookup (nearest segment)
- Display next cleaning times for both sides
- Add to Calendar links
- Status indicators (safe/soon/move)
- Dark, polished UI

### Out of Scope (Future)
- Push notifications / reminders
- Historical ticket data overlay
- Multiple city support
- Automatic calendar integration (vs. manual link)
- Map visualization (scaffolded but optional for MVP)
- Persistent sessions / saved vehicles
- Mobile app wrapper

## Deployment

- Frontend deploys automatically via GitHub Pages (existing CI/CD)
- Supabase Edge Function deployed via `supabase functions deploy tesla-auth`
- Tesla public key (`com.tesla.3p.public-key.pem`) served from `public/.well-known/appspecific/`

## Security Considerations

- `client_secret` never exposed to browser — only in Supabase Edge Function
- Access tokens stored in sessionStorage (cleared on tab close)
- PKCE flow recommended for additional security (Tesla supports it)
- State parameter validated on callback to prevent CSRF
- No user data stored server-side in MVP
