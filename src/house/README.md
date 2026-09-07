# Virtual House

Standalone Vite entry at `/house/`, built alongside the existing website. Public and unprotected by request.

- `HousePage.tsx`: floor selection, room navigation, guided tour, reference panel, and export control.
- `model.ts`: Three.js geometry, materials, walking controls, and GLB export in meters.
- `house.css`: page-only styles, loaded by the separate entry to avoid changing the rest of the website.
- `../../house/index.html`: page title and social metadata.
- `../../public/house/references/`: appraisal photos, floor sketch, and preview assets.

Use the repository's usual `npm run dev` and open `/house/`. `npm run build` emits `dist/house/index.html` for GitHub Pages; `/house` redirects to it.

## Model sources and limitations

The February 2026 appraisal supplies the exterior dimensions and room names (sketch on PDF page 32), with main-unit photos from PDF page 21. Interior partitions, openings, windows, ceiling heights, alignment between levels, and furniture are approximate. Lower-level finishes are provisional. This is an exploratory reconstruction, not a survey or a photographic scan.

Walking uses eye-height navigation with wall collision. Room jumps connect spaces; stairs and door animations are not modeled. Furniture does not block the camera. The guided tour changes viewpoints every 6.5 seconds. Export creates a GLB containing both levels for Blender's glTF importer.
