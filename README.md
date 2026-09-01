# C&I – Severity and Cases

## Unified Site Health, Severity & Case Intelligence

A modern graphical web dashboard for C&I (Commercial & Industrial) site health monitoring, severity tracking, case management, and historical analytics. This project is intended to provide a better, more graphical and usable experience based on the information currently presented through the existing Incorta dashboard.

> **Live Incorta data integration is NOT implemented at this stage.**

---

## Current Status

This project is in the **initialization and architecture phase**. The repository contains:

- Project scaffold with React + TypeScript + Vite
- TypeScript data model (types/interfaces)
- DataProvider abstraction with MockDataProvider
- Mock data for development and testing
- Architecture and requirements documentation
- Test infrastructure

The graphical dashboard UI has **not yet been implemented**.

---

## Planned Features

1. **Overview** — KPI cards, severity distribution, site status distribution
2. **Site Health** — Site table with filtering, sorting, and drill-down
3. **Open Cases** — Open case analysis with severity breakdown
4. **Case Tracker** — Comprehensive case tracking (open and closed)
5. **Historical Trends** — Severity trends over time with interactive charts

---

## Technology Stack

| Layer | Technology | Version |
|---|---|---|
| Frontend Framework | React | 18.x |
| Language | TypeScript | 5.5.x (strict mode) |
| Build System | Vite | 5.x |
| Routing | React Router | 6.x |
| Charting (planned) | Recharts | — |
| Tables (planned) | TanStack Table | v8 |
| Testing | Vitest + React Testing Library | 2.x |
| Linting | ESLint | 8.x |

See [docs/architecture.md](docs/architecture.md) for detailed technology decisions.

---

## Project Structure

```
enphase-ci-dashboard/
├── docs/                        # Documentation
│   ├── architecture.md          # Technology decisions
│   ├── dashboard-requirements.md # Dashboard requirements
│   ├── data-dictionary.md       # Field definitions
│   └── dashboard-component-map.md # Component inventory
├── mock-data/                   # Mock data for development
│   ├── sites.ts
│   ├── cases.ts
│   └── historical-severity.ts
├── src/
│   ├── charts/                  # Chart components (planned)
│   ├── components/              # Shared UI components (planned)
│   ├── filters/                 # Filter components (planned)
│   ├── pages/                   # Page components (planned)
│   ├── services/                # Data providers
│   │   ├── DataProvider.ts      # Abstract interface
│   │   └── MockDataProvider.ts  # Mock implementation
│   ├── tables/                  # Table components (planned)
│   ├── types/                   # TypeScript type definitions
│   └── utils/                   # Utility functions (planned)
├── tests/                       # Test files
└── [config files]               # Vite, TypeScript, ESLint configs
```

---

## Development Setup

### Prerequisites

- Node.js 18+ (20.x recommended)
- npm 9+

### Installation

```bash
npm install
```

### Development Server

```bash
npm run dev
```

### Build

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

---

## Testing

```bash
# Run tests once
npm test

# Run tests in watch mode
npm run test:watch
```

---

## Data Architecture

The dashboard uses a **DataProvider abstraction** to decouple the UI from any specific data source.

```
DataProvider (interface)
    ├── MockDataProvider        ← Current (development/testing)
    ├── APIDataProvider         ← Future (REST/GraphQL backend)
    └── IncortaDataProvider     ← Future (direct integration, if needed)
```

The UI depends only on the `DataProvider` interface. Switching data sources requires no UI code changes — only swapping the provider implementation.

See [docs/architecture.md](docs/architecture.md) for details.

---

## Incorta Reference

The existing Enphase Incorta dashboard is the functional and visual reference for this project:

https://enphase-1.cloud2.incorta.com/incorta/

> **Note:** The Incorta dashboard requires authenticated access. This project does not access, scrape, or store any Incorta credentials, tokens, or session information. The supplied screenshots are the primary reference for UI/functional analysis.

---

## Security Notes

- No credentials, tokens, passwords, or secrets are stored in this repository
- `.gitignore` includes rules to prevent accidental commits of `.env` files, credentials, private keys, certificates, and Incorta authentication information
- Mock data uses placeholder/demo data only — no production data
- The frontend will never directly access Incorta; all future production data access will flow through a backend API layer

---

## Future Integration

When live data integration is required:

1. A backend API layer will be created to handle Incorta/SFDC data access
2. An `APIDataProvider` will be implemented conforming to the existing `DataProvider` interface
3. The frontend will swap from `MockDataProvider` to `APIDataProvider` via configuration
4. No UI code changes will be required for the data source switch

---

## Documentation

- [Architecture](docs/architecture.md) — Technology decisions and data architecture
- [Dashboard Requirements](docs/dashboard-requirements.md) — Functional requirements from reference screenshots
- [Data Dictionary](docs/data-dictionary.md) — Field definitions and data types
- [Component Map](docs/dashboard-component-map.md) — UI component inventory and dependencies
