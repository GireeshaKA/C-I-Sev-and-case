# Architecture – C&I Severity and Cases Dashboard

## Technology Stack

### Frontend Framework
- **React 18** — Mature, well-supported component library with a large ecosystem. Chosen for its stability, TypeScript support, and wide developer familiarity in enterprise environments.

### Language
- **TypeScript 5.5** (strict mode) — Provides compile-time type safety, improved developer experience, and better maintainability for a data-intensive dashboard application.

### Build System
- **Vite 5** — Fast, modern build tool with native ES module support, hot module replacement (HMR), and optimized production builds via Rollup. Chosen over CRA (deprecated) and Webpack (slower) for its speed and simplicity.

### Charting Approach
- **Recharts** (planned) — React-native charting library built on D3. Suitable for interactive analytics charts (bar, line, pie, area, stacked). Alternatives considered: Nivo, Victory, ECharts.
- Selection criteria: React integration, TypeScript support, customizability, performance with moderate dataset sizes, responsive design support.

### Table Approach
- **TanStack Table v8** (planned) — Headless, framework-agnostic table library with React adapter. Supports sorting, filtering, pagination, column resizing, and virtual scrolling for large datasets.
- Selection criteria: Performance with 1000+ rows, built-in sorting/filtering, TypeScript-first, headless (full styling control).

### State Management
- **React Context + useReducer** for global filter state and data provider injection.
- No external state management library (e.g., Redux, Zustand) at this stage. If complexity grows, Zustand is the recommended upgrade path due to its simplicity and minimal boilerplate.

### Routing
- **React Router v6** — Standard routing library for React SPAs. Used for navigation between dashboard sections (Overview, Site Health, Open Cases, Case Tracker, Historical Trends).

### Testing Framework
- **Vitest** — Vite-native test runner, compatible with Jest APIs. Provides fast test execution with native ESM and TypeScript support.
- **React Testing Library** — For component testing with user-centric assertions.
- **jsdom** — Browser environment simulation for component tests.

### Styling Approach (Planned)
- CSS Modules or Tailwind CSS (to be decided in implementation phase).
- Design direction: Enphase-inspired orange accent (#F37421) with neutral colors, clean/analytical layout, high information density.
- See `docs/ui-ux-specification.md` for detailed visual design direction based on Phase 1 screenshot analysis.

### Code Quality
- **ESLint** with TypeScript and React plugins — Static analysis and code style enforcement.
- **TypeScript strict mode** — Maximum type safety.

## Data Architecture

### DataProvider Abstraction

```
DataProvider (interface)
    │
    ├── MockDataProvider        ← Current (development/testing)
    │
    ├── APIDataProvider         ← Future (REST/GraphQL backend)
    │
    └── IncortaDataProvider     ← Future (direct Incorta integration, if needed)
```

The UI layer depends only on the `DataProvider` interface. The concrete implementation is injected via React Context, enabling:

1. **Development** with mock data (no backend required)
2. **Testing** with deterministic mock data
3. **Production** with real API data (swap provider without UI changes)

### Data Flow

```
DataProvider → React Context → Page Components → UI Components
                                    ↑
                              Filter State (Context + useReducer)
```

### Future Backend/Data Integration

When live data integration is required:

1. Create an `APIDataProvider` implementing the `DataProvider` interface.
2. The API backend would handle Incorta/SFDC data access, caching, and transformation.
3. The frontend swaps `MockDataProvider` for `APIDataProvider` via configuration.
4. No UI code changes required for the data source switch.

**Important:** The frontend will never directly access Incorta. All production data access will flow through a backend API layer that handles authentication, authorization, and data transformation.

### Phase 1 Data Model Corrections

The Phase 1 screenshot analysis revealed significant differences from the Phase 0 assumptions:

- **Severity levels:** 1, 2, 3, 4 (not S0-S4; no S0 exists; no "S" prefix)
- **Severity sub-categories:** (a), (b), (c) based on case status — unique to this dashboard
- **Site Status values:** Operational descriptions (Normal, Production Issue, Envoy Not Reporting, Microinverters Not Reporting, Meter Issue) — not abstract categories
- **Site Stage values:** Ready, Final, Verifying — not Active/Inactive/Decommissioned
- **Site ID format:** Numeric (e.g., `6256648`) — not prefixed strings
- **Case Number format:** 8-digit numeric (e.g., `20139519`) — not prefixed strings
- **Case Status values:** New, Case - In Progress — not Open/Closed/Escalated
- **Historical data:** Per-installer pivot with daily granularity, Sev-1/2/3 only (no Sev-4)

The mock data and TypeScript types from Phase 0 must be updated to match these confirmed values before implementation begins. See `docs/data-dictionary.md` for full corrections.

## Project Structure

```
enphase-ci-dashboard/
├── docs/                    # Project documentation
├── mock-data/               # Mock data for development
│   ├── sites.ts
│   ├── cases.ts
│   ├── historical-severity.ts
│   └── index.ts
├── public/                  # Static assets
├── src/
│   ├── charts/              # Chart components (planned)
│   ├── components/          # Shared UI components (planned)
│   ├── filters/             # Filter components (planned)
│   ├── pages/               # Page-level components (planned)
│   ├── services/            # Data providers and business logic
│   │   ├── DataProvider.ts  # Abstract interface
│   │   ├── MockDataProvider.ts
│   │   └── index.ts
│   ├── tables/              # Table components (planned)
│   ├── types/               # TypeScript type definitions
│   │   ├── case.ts
│   │   ├── filters.ts
│   │   ├── kpi.ts
│   │   ├── severity.ts
│   │   ├── site.ts
│   │   └── index.ts
│   ├── utils/               # Utility functions (planned)
│   ├── App.tsx              # Root component
│   ├── main.tsx             # Entry point
│   └── vite-env.d.ts        # Vite type declarations
├── tests/                   # Test files
├── .eslintrc.cjs            # ESLint configuration
├── .gitignore               # Git ignore rules (includes security rules)
├── index.html               # HTML entry point
├── package.json             # Dependencies and scripts
├── tsconfig.json            # TypeScript project references
├── tsconfig.app.json        # App TypeScript config (strict)
├── tsconfig.node.json       # Node/Vite TypeScript config
├── vite.config.ts           # Vite configuration
└── vitest.config.ts         # Vitest configuration
```
