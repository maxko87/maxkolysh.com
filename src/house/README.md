# Virtual House

Standalone Vite entry at `/house/`, built alongside the existing website. Public and unprotected by request.

- `HousePage.tsx`: floor selection, room navigation, guided tour, reference panel, and export control.
- `model.ts`: Three.js geometry, materials, walking controls, and GLB export in meters.
- `personalFurniture.ts`: separate, switchable furniture layer reconstructed approximately from the owner's photos.
- `photoReferences.ts`: dated room matches, confidence, visual evidence, and estimated comparison viewpoints.
- `photoStyles.css`: photo cards, comparison opacity controls, furniture toggle, and reference gallery.
- `house.css`: page-only styles, loaded by the separate entry to avoid changing the rest of the website.
- `../../house/index.html`: page title and social metadata.
- `../../public/house/references/`: appraisal photos, floor sketch, and preview assets.

Use the repository's usual `npm run dev` and open `/house/`. `npm run build` emits `dist/house/index.html` for GitHub Pages; `/house` redirects to it.

## Model sources and limitations

The February 2026 appraisal supplies the exterior dimensions and room names (sketch on PDF page 32), with main-unit photos from PDF page 21. Interior partitions, openings, windows, ceiling heights, alignment between levels, and furniture are approximate. Lower-level finishes are provisional. This is an exploratory reconstruction, not a survey or a photographic scan.

Walking uses eye-height navigation with wall collision. Room jumps connect spaces; stairs and door animations are not modeled. Furniture does not block the camera. The guided tour changes viewpoints every 6.5 seconds. Export creates a GLB containing both levels for Blender's glTF importer.

## Apple Photos references

Ten curated March–August 2026 images are in `public/house/photos`. Copies were re-encoded without EXIF/GPS metadata; the original Photos library was read only. Library identifiers, local paths, the broad review manifest, and unrelated photos are not included here. The house page and these selected images are public, as requested.

Living, dining, kitchen, and hallway matches use visible windows, finishes, openings, and adjoining rooms. The office placement is likely, not confirmed. The bedroom with two dark dressers and blue prints, garden, and handwritten “Lefty/Righty” measurements remain unplaced. Dates distinguish changing furniture arrangements; the model combines useful views and does not claim to capture a single exact date.

The personal layer includes white living-room seating, slatted walnut coffee table, leather lounge chair/ottoman, walnut dining table, cream dining chairs, arched mirrors, black bar cabinet, navy office cabinetry, desk/chair, and espresso machine. Other rooms retain provisional staging. No photo textures, calibrated photogrammetry, or exact furniture dimensions are claimed. Photo overlays use adjustable opacity and approximate camera placement. GLB export includes whichever furniture layer is selected.
