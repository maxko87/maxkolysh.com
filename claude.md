- Never run `npm run dev` - the user is already running the server in dev.
- Never make commits unless explicitly asked by the user.
- Do the following ONLY when I say the word "commit":
	- first, run `npx tsc && npx vite build` to test your changes and fix the errors.
	- run 'git add .; git commit -am XXX; git push' and add a message based on this chat history (since the last commit). be thorough in your message.
- Any one-off scripts go into data-processing folder.
- Do NOT run `npx tsc && npx vite build` unless expicitly asked.

## Testing
- Tests are in `/tests` folder (centralized structure mirroring `/src`)
- Run: `npm test` (watch mode) or `npm run test:run` (single run)
- Coverage: `npm run test:coverage` (target: 80%+)