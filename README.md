# maxkolysh.com

Personal website and home of the **GP Carry Calculator** — a tool for modeling General Partner carry across multiple private equity fund scenarios.

## Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS, React Router
- **Build**: Vite
- **Testing**: Vitest + React Testing Library
- **Analytics**: PostHog, DataBuddy
- **Backend**: Supabase Edge Functions (FRED economic data monitor)
- **Hosting**: GitHub Pages (custom domain via CNAME)

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build   # tsc + vite build
```

## Testing

```bash
npm test            # watch mode
npm run test:run    # single run
npm run test:coverage
```

## Project Structure

```
src/
├── pages/           # HomePage, CalculatorPage, blog posts
├── components/
│   ├── calculator/  # Carry calculator UI (sidebar, results, fund management)
│   └── layout/
├── context/         # React Context + useReducer state management
├── hooks/           # useUrlState (compressed shareable URLs)
├── data/            # presetFunds.ts (300+ real PE funds from OPERS data)
├── types/           # TypeScript definitions
└── utils/           # Calculations, state compression, formatting

data-processing/     # Scripts for processing fund data from public sources
supabase/            # Edge functions + DB setup for FRED monitoring
public/              # GitHub Pages files (404.html, CNAME, .nojekyll)
tests/               # Centralized test structure mirroring src/
```

## Deployment

Pushes to `master` trigger GitHub Actions:
- **deploy.yml** — builds and deploys to GitHub Pages
- **deploy-supabase.yml** — deploys Supabase Edge Functions (on changes to `supabase/functions/`)

## Key Features

- **GP Carry Calculator** (`/carry-calc`): Model carry economics with customizable parameters (carry %, management fees, hurdle rates, waterfall calculations, vesting schedules, deployment/realization curves). Includes 300+ preset funds with real performance data. State is compressed into shareable URLs.
- **Blog posts**: Articles on VC recruiting, requesting intros, and Learned League study tools.
- **FRED Monitor**: Supabase Edge Function that watches Federal Reserve economic data pages for changes and sends push notifications via Bark.
