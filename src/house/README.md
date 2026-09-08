# Virtual House

Standalone Vite entry at `/house/`, built alongside the existing website. Public and unprotected by request.

- `HousePage.tsx`: floor selection, room navigation, guided tour, reference panel, and export control.
- `model.ts`: Three.js geometry, materials, walking controls, and GLB export in meters.
- `personalFurniture.ts`: separate, switchable furniture layer reconstructed approximately from the owner's photos.
- `photoReferences.ts`: dated room matches, confidence, visual evidence, and estimated comparison viewpoints.
- `photoStyles.css`: photo cards, comparison opacity controls, furniture toggle, and reference gallery.
- `layout.ts`: room jumps and interior partitions traced from the recovered listing plan, in feet.
- `house.css`: page-only styles, loaded by the separate entry to avoid changing the rest of the website.
- `../../house/index.html`: page title and social metadata.
- `../../public/house/references/`: appraisal photos, floor sketch, and preview assets.

Use the repository's usual `npm run dev` and open `/house/`. `npm run build` emits `dist/house/index.html` for GitHub Pages; `/house` redirects to it.

## Model sources and limitations

The February 2026 appraisal supplies exterior dimensions (sketch on PDF page 32). A saved February 21 listing floor plan recovered from Apple Photos now supplies interior topology: bedrooms, bathrooms, closets, office/Murphy-bed wall, door connections, lower open living/kitchen area, and rear deck/garden. Interior positions are traced and scaled to the appraisal, not measured. Window and ceiling geometry uses interior photos. Heights, exact wall lengths, garden size, alignment between levels, and furniture dimensions remain approximate. This is an exploratory reconstruction, not a survey or a photographic scan.

Walking uses eye-height navigation with wall collision. Room jumps connect spaces; stairs and door animations are not modeled. Furniture does not block the camera. The guided tour changes viewpoints every 6.5 seconds. Export creates a GLB containing both levels for Blender's glTF importer.

## Apple Photos references

Twenty-one curated references are in `public/house/photos`. The second search reviewed 558 additional candidates, including 201 video entries, by widening the location area and including untagged 2026 media. Available previews and selected cached video frames were inspected; this does not mean 201 complete videos were watched. The crucial interior plan was an untagged screenshot. Copies were re-encoded without EXIF/GPS metadata; the original Photos library was read only. Library identifiers, local paths, broad review manifests, and unrelated photos are not included here. The house page and selected references are public, as requested.

Living, dining, kitchen, hallway, office, and rear garden matches use the plan together with windows, finishes, openings, and adjoining-room views. The two photographed bedrooms, exercise room, and handwritten “Lefty/Righty” measurements remain unplaced. Dates distinguish changing furniture arrangements; the model combines useful views and does not claim to capture a single exact date.

The personal layer includes white living-room seating, slatted walnut coffee table, leather lounge chair/ottoman, walnut dining table, cream dining chairs, arched mirrors, black bar cabinet, navy office cabinetry, desk/chair, espresso machine, kitchen nook table, and a simplified blue patio set with yellow planters. Other rooms retain provisional staging. No photo textures, calibrated photogrammetry, or exact furniture dimensions are claimed. Photo overlays use adjustable opacity and approximate camera placement. GLB export includes whichever furniture layer is selected.

Second-pass corrections also replace the single roof slope with a pitched cedar ceiling and skylight, cut actual window openings instead of placing glass over opaque walls, add the front door and frosted office slider, and remove guessed lower-level divisions. Tests check reference navigation, layer controls, geometry validity, room spawn clearance, and that door gaps fit their wall runs. Browser visual QA has not been performed in this pass.
