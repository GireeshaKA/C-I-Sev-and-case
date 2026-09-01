# Architecture Recommendation — Phase 3 Discovery

> Status: Preliminary recommendation based on Incorta API documentation analysis.
> Final recommendation requires API POC results.

---

## Options Evaluated

### Option A: React Browser → Incorta API (Direct)

```
React Browser (SPA)
     ↓ HTTPS
Incorta Public API v2
```

| Attribute | Assessment |
|---|---|
| **CORS** | ⚠️ HIGH RISK — Incorta Cloud may not allow cross-origin requests from a custom domain. No CORS documentation found. |
| **Credentials** | ❌ CRITICAL — PAT/JWT would be exposed in browser JavaScript. NEVER acceptable for production. |
| **Token refresh** | ❌ No mechanism to refresh PAT from browser without exposing it |
| **Access control** | ❌ Single token = single user. Cannot support per-user access. |
| **Caching** | ❌ No server-side caching. Every page load hits Incorta API. |
| **Performance** | ⚠️ Unknown — Incorta API response times not benchmarked |
| **Pagination** | ✅ Supported by API (startRow, pageSize) |
| **Multi-user** | ❌ Not supported — would need unique tokens per user |

**VERDICT: NOT RECOMMENDED**

Exposing API tokens in browser JavaScript is a security violation. CORS restrictions would likely block requests.

---

### Option B: React Browser → Backend API → Incorta API (Proxied)

```
React Browser (SPA)
     ↓ HTTPS
Backend API (Node.js/Express)
     ↓ HTTPS
Incorta Public API v2
```

| Attribute | Assessment |
|---|---|
| **CORS** | ✅ Controlled — backend serves same domain or configures CORS headers |
| **Credentials** | ✅ PAT stored server-side as environment variable. Never exposed to browser. |
| **Token refresh** | ✅ Backend can manage PAT rotation or OAuth JWT refresh |
| **Access control** | ✅ Backend can implement user authentication (SSO, session, JWT) |
| **Caching** | ✅ Backend can cache Incorta responses (Redis, in-memory) |
| **Performance** | ✅ Backend can batch/parallelize Incorta API calls |
| **Pagination** | ✅ Backend can handle Incorta pagination and aggregate results |
| **Multi-user** | ✅ Backend authenticates users independently from Incorta |
| **Complexity** | ⚠️ Requires deploying and maintaining a backend service |

**VERDICT: RECOMMENDED (minimum viable)**

This is the simplest secure architecture. The backend acts as an authenticated proxy.

---

### Option C: React Browser → Backend → Cached Layer → Incorta (Full Stack)

```
React Browser (SPA)
     ↓ HTTPS
Backend API (Node.js/Express)
     ↓
Cache / Normalized Data Store (Redis / PostgreSQL)
     ↓ HTTPS (periodic sync)
Incorta Public API v2
```

| Attribute | Assessment |
|---|---|
| **CORS** | ✅ Same as Option B |
| **Credentials** | ✅ Same as Option B |
| **Token refresh** | ✅ Same as Option B |
| **Access control** | ✅ Same as Option B |
| **Caching** | ✅ Full control — data synced on schedule, served from cache |
| **Performance** | ✅ Excellent — browser queries cache, not Incorta |
| **Pagination** | ✅ Cache handles pagination independently |
| **Multi-user** | ✅ Cache serves all users |
| **Offline capability** | ✅ Dashboard works even if Incorta is temporarily unavailable |
| **Data freshness** | ⚠️ Depends on sync interval (e.g., every 15 min, hourly) |
| **Complexity** | ❌ Significantly more infrastructure (cache, sync jobs, monitoring) |

**VERDICT: RECOMMENDED for production scale**

Best option if dashboard needs to support many users, fast response times, or Incorta API rate limits are a concern. However, the added complexity may not be justified initially.

---

## Recommendation

### Phase 4/5: Start with Option B

```
React Browser (SPA)
     ↓ HTTPS
Express.js Backend
  ├── Auth middleware (SSO or JWT)
  ├── Incorta API client (PAT stored as env var)
  ├── Response caching (in-memory, 5-15 min TTL)
  └── DataProvider-compatible REST API
     ↓ HTTPS
Incorta Public API v2
```

### Key Architecture Decisions

| Decision | Recommendation | Rationale |
|---|---|---|
| Backend framework | Express.js (Node.js) | Same language as frontend; lightweight; fast to develop |
| PAT storage | Environment variable (`INCORTA_PAT`) | Never in source code; rotatable |
| Caching | In-memory (Map/LRU) initially; Redis later | Simple to start; Redis for production scale |
| Cache TTL | 5–15 minutes | Balance freshness vs. API load |
| Authentication | Enphase SSO (Azure AD) pass-through | Users authenticate via existing SSO; backend validates |
| DataProvider swap | Create `IncortaDataProvider` implementing `DataProvider` interface | Existing React code unchanged |
| Error handling | Fallback to cached data on Incorta API errors | Dashboard stays functional |
| Rate limiting | Backend-side throttling of Incorta API calls | Prevents hitting API limits |

### Migration Path

```
Phase 4: Create Express.js backend + IncortaDataProvider
Phase 5: Deploy, test, switch from MockDataProvider to IncortaDataProvider
Phase 6: Add caching, monitoring, error handling (Option C elements)
```

### Existing Architecture Advantage

The current `DataProvider` interface abstraction in `src/services/DataProvider.ts` was designed for exactly this purpose:

```typescript
interface DataProvider {
  getSites(filters?: DashboardFilters): Promise<Site[]>;
  getSiteById(siteId: string): Promise<Site | null>;
  getCases(filters?: DashboardFilters): Promise<SfdcCase[]>;
  getCasesBySiteId(siteId: string): Promise<SfdcCase[]>;
  getCaseByNumber(caseNumber: string): Promise<SfdcCase | null>;
  getSeverityDistribution(filters?: DashboardFilters): Promise<SeverityDistribution[]>;
  getHistoricalSeverity(filters?: DashboardFilters): Promise<HistoricalSeverity[]>;
  getKpis(filters?: DashboardFilters): Promise<DashboardKpis>;
  getFilterOptions(field: string): Promise<string[]>;
}
```

The backend would expose REST endpoints matching these methods, and a new `APIDataProvider` would call them instead of using mock data. **Zero React component changes required.**

## Prerequisites for Architecture Implementation

| # | Prerequisite | Status |
|---|---|---|
| 1 | PAT created and tested | BLOCKED |
| 2 | Insight GUIDs identified | BLOCKED |
| 3 | API POC successful | BLOCKED |
| 4 | Filter contract confirmed | BLOCKED |
| 5 | Data model mapped | BLOCKED |
| 6 | Severity business logic confirmed | BLOCKED |
