- Never run `npm run dev` - the user is already running the server in dev.
- When committing, first run `npx tsc && npx vite build` to test changes and fix any errors.
- Any one-off scripts go into data-processing folder.
- Do NOT run `npx tsc && npx vite build` unless expicitly asked.

## Testing
- Tests are in `/tests` folder (centralized structure mirroring `/src`)
- Run: `npm test` (watch mode) or `npm run test:run` (single run)
- Coverage: `npm run test:coverage` (target: 80%+)