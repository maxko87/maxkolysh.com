#!/usr/bin/env python3
"""Diagnose why maxko87's GPS snaps to Elizabeth St instead of Douglass St.

Replicates parking-check's nearest-segment logic and compares it against a
correct full-geometry distance, to see if the MultiLineString[0]-only shortcut
or the centerline-distance approach is causing the wrong street match.
"""
import json, math, urllib.request

LAT, LNG = 37.752159, -122.43867  # live GPS from Tesla
DATA = "https://raw.githubusercontent.com/kaushalpartani/sf-street-cleaning/refs/heads/main/data"

def fetch(url):
    with urllib.request.urlopen(url) as r:
        return json.load(r)

# meters-per-degree at this latitude (equirectangular local projection)
M_LAT = 111320.0
M_LNG = 111320.0 * math.cos(math.radians(LAT))

def to_m(lng, lat):
    return ((lng - LNG) * M_LNG, (lat - LAT) * M_LAT)

def pt_seg_dist(p, a, b):
    (px, py), (ax, ay), (bx, by) = p, a, b
    dx, dy = bx - ax, by - ay
    if dx == 0 and dy == 0:
        return math.hypot(px - ax, py - ay)
    t = max(0, min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)))
    return math.hypot(px - (ax + t * dx), py - (ay + t * dy))

def line_parts(geom):
    if geom["type"] == "MultiLineString":
        return geom["coordinates"], geom["coordinates"][0]  # (all parts, app's [0]-only)
    return [geom["coordinates"]], geom["coordinates"]

def min_dist(parts):
    p = (0.0, 0.0)  # the GPS point is the origin in local meters
    best = float("inf")
    for coords in parts:
        ms = [to_m(c[0], c[1]) for c in coords]
        for i in range(len(ms) - 1):
            best = min(best, pt_seg_dist(p, ms[i], ms[i + 1]))
    return best

print(f"GPS: {LAT}, {LNG}\n")
nhoods = fetch(f"{DATA}/neighborhoods.geojson")

def pip(pt, poly):
    # ray cast; poly = list of rings
    x, y = pt
    inside = False
    for ring in poly:
        n = len(ring)
        j = n - 1
        for i in range(n):
            xi, yi = ring[i][0], ring[i][1]
            xj, yj = ring[j][0], ring[j][1]
            if ((yi > y) != (yj > y)) and (x < (xj - xi) * (y - yi) / (yj - yi) + xi):
                inside = not inside
            j = i
    return inside

nb = None
for f in nhoods["features"]:
    g = f["geometry"]
    polys = g["coordinates"] if g["type"] == "MultiPolygon" else [g["coordinates"]]
    if any(pip((LNG, LAT), poly) for poly in polys):
        pr = f["properties"]
        nb = pr.get("FileName") or pr.get("NeighborhoodName") or pr.get("nhood") or pr.get("name") or pr.get("NEIGHBORHOOD")
        break
print(f"Neighborhood: {nb}\n")

streets = fetch(f"{DATA}/neighborhoods/{urllib.parse.quote(nb)}.geojson")
rows = []
for f in streets["features"]:
    allp, first = line_parts(f["geometry"])
    d_app = min_dist([first])      # what the app computes (MultiLineString -> [0] only)
    d_true = min_dist(allp)        # correct: all parts
    pr = f["properties"]
    rows.append((d_app, d_true, pr.get("Corridor", "?"), pr.get("Limits", ""), f["geometry"]["type"]))

print("=== TOP 8 by app's distance (MultiLineString uses [0] only) ===")
for d_app, d_true, c, lim, gt in sorted(rows, key=lambda r: r[0])[:8]:
    print(f"  {d_app:7.1f}m  (true {d_true:6.1f}m)  {c:18s} {lim:22s} [{gt}]")

print("\n=== TOP 8 by CORRECT distance (all parts) ===")
for d_app, d_true, c, lim, gt in sorted(rows, key=lambda r: r[1])[:8]:
    print(f"  {d_true:7.1f}m  (app {d_app:6.1f}m)  {c:18s} {lim:22s} [{gt}]")
