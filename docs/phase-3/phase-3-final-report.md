# Phase 3 Final Report — Authenticated Incorta Discovery & Data Architecture Investigation

> C&I – Severity and Cases Dashboard
> Date: 2026-09-02

---

## 1. Executive Summary

Phase 3 attempted to use authenticated access to the Enphase Incorta dashboard to discover the underlying data model, business rules, and API capabilities. **The investigation is blocked by authentication requirements.** The Incorta dashboard is protected by Microsoft Azure AD SSO (SAML), and the Incorta Public API v2 requires a Personal Access Token (PAT) or OAuth JWT that cannot be created without interactive login to the Incorta platform.

**Key finding:** The Incorta Public API v2 platform capabilities are well-documented and confirmed to support the required functionality (Insight Query, Dashboard Prompts, Business View Query, Schema listing). The API architecture is ready for integration once authentication is established.

**Classification: B — API ACCESS BLOCKED**

---

## 2. Dashboard Inventory

| Field | Value | Status |
|---|---|---|
| Dashboard GUID | `ee817bdb-9b6a-4135-97d2-52ac36e23c63` | CONFIRMED |
| Known Tab GUID | `a51d38e4-7698-40df-8ea0-ba0d1d147891` | CONFIRMED |
| Cluster | `enphase-1.cloud2.incorta.com` | CONFIRMED |
| Tenant | `enphase` | CONFIRMED |
| SSO Provider | Microsoft Azure AD (SAML) | CONFIRMED |
| Azure AD App ID | `87d249d5-db8b-414b-8556-d6398bd1569f` | CONFIRMED (from SSO redirect) |
| Azure Tenant ID | `7df9352f-c5eb-4007-a723-44c078605c7a` | CONFIRMED (from SSO redirect) |
| Tab count | UNKNOWN (≥1) | BLOCKED |
| Tab names | UNKNOWN | BLOCKED |

Full details: `docs/phase-3/dashboard-inventory.md`

---

## 3. Insight Inventory

**STATUS: BLOCKED**

18 expected insights identified from Phase 1 screenshot analysis, but no insight GUIDs can be determined without authenticated access.

Full details: `docs/phase-3/insight-inventory.md`

---

## 4. Data Source Map

**STATUS: BLOCKED**

Schema names, Business View names, table names, column references, joins, and calculated columns cannot be determined without:
- API access (Insight Query response headers reveal `field` references)
- Browser inspection (expanding insights reveals Business View references)
- Schema listing API (lists all schemas and objects)

Full details: `docs/phase-3/data-source-map.md`

---

## 5. Filter Contract

**STATUS: BLOCKED**

3 expected dashboard prompts (Connection Type, Site Stage Id, SKU) identified from screenshots. Exact field references, operators, default values, and available values require the Dashboard Prompts API:

```
GET /incorta/api/v2/enphase/dashboards/ee817bdb-9b6a-4135-97d2-52ac36e23c63/prompts
```

Full details: `docs/phase-3/filter-contract.md`

---

## 6. Severity Rules

**STATUS: BLOCKED (P0)**

The #1 unresolved business question remains unanswered:
- How severity levels 1–4 are assigned to sites is UNKNOWN
- Whether severity is a source column, calculated column, or insight expression is UNKNOWN
- The actual rule/formula/CASE expression is UNKNOWN

Full details: `docs/phase-3/severity-rule-discovery.md`

---

## 7. (a)/(b)/(c) Rules

**STATUS: BLOCKED**

The subcategory rules remain at INFERRED confidence:
- (a) = open case, not in progress — INFERRED
- (b) = open case, in progress — INFERRED
- (c) = no open cases — INFERRED
- Multi-case aggregation rule — UNKNOWN
- Sev 4 subcategory existence — UNKNOWN

Verification requires inspecting the Business View or calculated column that produces these categories.

---

## 8. Open Case Definition

**STATUS: BLOCKED (P0)**

Only 2 case statuses observed (`New`, `Case - In Progress`). The complete list of SFDC statuses and the exact definition of "open" remain UNKNOWN.

Full details: `docs/phase-3/open-case-definition.md`

---

## 9. No Severity Definition

**STATUS: BLOCKED (P0)**

1,603 sites with no severity assignment remain an arithmetic inference (2,060 − 457). Whether this is a formal category, a null value, or a conditional exclusion is UNKNOWN.

Full details: `docs/phase-3/no-severity-definition.md`

---

## 10. Sev 4 Definition

**STATUS: BLOCKED**

Whether Sev 4 follows the (a)/(b)/(c) subcategory model is UNKNOWN. The mock data's split of (b)=100, (c)=23 is fabricated and MUST NOT be treated as confirmed.

---

## 11. Site/Case Grain

**STATUS: PARTIALLY INFERRED**

| Relationship | Confidence |
|---|---|
| One site → many cases | CONFIRMED (583/526 ratio) |
| One case → one site | INFERRED |
| One site → one severity | INFERRED |
| One site → one installer | INFERRED |
| Historical: installer × date | CONFIRMED |

Full details: `docs/phase-3/entity-grain.md`

---

## 12. Historical Data Contract

**STATUS: BLOCKED**

Structure confirmed from screenshots (installer × date, Sev-1/2/3/Total, no Sev-4). Source Business View, column references, snapshot semantics, and timezone remain UNKNOWN.

Full details: `docs/phase-3/historical-data-contract.md`

---

## 13. API Availability

| Attribute | Value | Confidence |
|---|---|---|
| Incorta Cloud Platform | `enphase-1.cloud2.incorta.com` | CONFIRMED |
| Public API v2 platform support | YES (Cloud installs support it from 2023.4.0) | CONFIRMED |
| API base URL | `https://enphase-1.cloud2.incorta.com/incorta/api/v2/enphase` | CONFIRMED |
| Swagger UI | `https://enphase-1.cloud2.incorta.com/incorta/api?urls.primaryName=v2` | CONFIRMED |
| HTTPS required | YES | CONFIRMED |
| API accessible for this user | UNKNOWN — requires checking if Public API is enabled | BLOCKED |

---

## 14. API Authentication

| Method | Status |
|---|---|
| Personal Access Token (PAT) | Available if Super User has enabled Public API for the user |
| OAuth 2.0 JWT | Available if OAuth is configured on the tenant |
| SSO pass-through | NOT supported — API requires PAT or OAuth JWT, not SSO session |

### Steps Required

1. Verify that Public API access is enabled for the user's account (requires Super User or self-check in profile Security tab)
2. Create a PAT in the Incorta Profile Manager → Security → API Tokens
3. Store the PAT securely (environment variable, not source code)
4. Test with the Dashboard Prompts GET endpoint

---

## 15. API POC

**STATUS: BLOCKED — no PAT available**

The POC plan is documented and ready to execute:
1. GET Dashboard Prompts
2. POST Insight Query (Total C&I Sites)
3. GET List Schemas

Full details: `docs/phase-3/api-poc.md`

---

## 16. Filter POC

**STATUS: BLOCKED — depends on API POC**

Plan to test Connection Type filter via Insight Query prompts parameter.

Full details: `docs/phase-3/api-filter-poc.md`

---

## 17. Business View Investigation

**STATUS: BLOCKED**

The `/query` endpoint can query Business Views directly (without going through an insight), which could be more flexible for the application. Determining available Business Views requires the List Schemas/List Schema Objects APIs.

Comparison:
| Approach | Pros | Cons |
|---|---|---|
| Insight Query | Uses existing dashboard definitions; prompts are pre-configured | Tied to specific insights; may have hard-coded filters |
| Business View Query | Flexible; can construct custom queries; access raw data | Need to know schema/view/column names; need to rebuild aggregation logic |

**Recommendation:** Start with Insight Query (reuses dashboard logic), then evaluate Business View Query for custom views.

---

## 18. Mock vs Incorta Differences

| Classification | Count |
|---|---|
| MATCH (snapshot values) | 9 |
| MISMATCH | 3 |
| MOCK ASSUMPTION | 6 |
| UNKNOWN | 12 |

Key mismatches:
1. `sitesWithNoOpenCases` calculation differs from reference value (16)
2. Historical row count (mock ~8,400 vs reference 497)
3. Data freshness (static mock vs live Incorta)

Full details: `docs/phase-3/mock-vs-incorta-diff.md`

---

## 19. Recommended Architecture

**Option B: React Browser → Express.js Backend → Incorta API**

This is the recommended architecture because:
- PAT stored server-side (secure)
- CORS controlled by backend
- Backend can cache responses
- Backend supports multi-user access
- Existing `DataProvider` interface enables zero-change UI swap

Full details: `docs/phase-3/architecture-recommendation.md`

---

## 20. Phase 4 Readiness

### READINESS: NOT READY

### Blockers

| # | Blocker | Type | Required Action |
|---|---|---|---|
| 1 | No PAT available | Authentication | User must create PAT in Incorta profile (requires Public API to be enabled) |
| 2 | Public API may not be enabled for user | Permission | Super User must enable Public API access for the user |
| 3 | Insight GUIDs unknown | Discovery | Requires authenticated browser or API access |
| 4 | Severity rules unknown | Business Logic | Requires inspecting Business View definitions |
| 5 | Open case definition unknown | Business Logic | Requires inspecting filters/calculated columns |
| 6 | No Severity definition unknown | Business Logic | Requires inspecting severity column definition |

### What the User Needs to Do

1. **Check if Public API is enabled:**
   - Log into Incorta
   - Go to Profile → Security tab
   - Look for "API Tokens" section
   - If not visible, request a Super User to enable Public API for your account

2. **Create a PAT:**
   - In Profile → Security → API Tokens → Create Personal Access Token
   - Set name: `ci-dashboard-discovery`
   - Set expiry: 7 days
   - Copy the token immediately (shown only once)
   - Store as environment variable: `set INCORTA_PAT=<token>`

3. **Alternatively, manually inspect the dashboard:**
   - Open each insight in Focus/Expand mode
   - Note insight GUIDs from the URL
   - Look at Business View references in the insight configuration
   - Provide the findings

### Once PAT Is Available, Phase 3 Can Resume With:

1. Call Dashboard Prompts API → reveals filter contract
2. Call Insight Query for each identified insight → reveals column metadata
3. Call List Schemas → reveals data model
4. Inspect severity/subcategory column definitions → reveals business logic
5. Run API POC and filter POC → confirms API integration viability

---

## Phase 3 Deliverables

| # | File | Content | Status |
|---|---|---|---|
| 1 | `docs/phase-3/dashboard-inventory.md` | Dashboard identification, SSO findings, expected tabs | PARTIAL |
| 2 | `docs/phase-3/insight-inventory.md` | Expected insights list, discovery methods | BLOCKED |
| 3 | `docs/phase-3/filter-contract.md` | Expected filters, API endpoint documentation | BLOCKED |
| 4 | `docs/phase-3/data-source-map.md` | Expected data model structure, discovery methods | BLOCKED |
| 5 | `docs/phase-3/severity-rule-discovery.md` | Discovery plan, P0 blocker documentation | BLOCKED |
| 6 | `docs/phase-3/open-case-definition.md` | P0 blocker documentation, discovery plan | BLOCKED |
| 7 | `docs/phase-3/no-severity-definition.md` | P0 blocker documentation, discovery plan | BLOCKED |
| 8 | `docs/phase-3/entity-grain.md` | Relationship analysis, inferred grain | PARTIAL |
| 9 | `docs/phase-3/historical-data-contract.md` | Known structure, unknown sources | PARTIAL |
| 10 | `docs/phase-3/api-poc.md` | API availability assessment, POC plan | PARTIAL |
| 11 | `docs/phase-3/api-filter-poc.md` | Filter test plan | BLOCKED |
| 12 | `docs/phase-3/architecture-recommendation.md` | Option B recommended (Backend proxy) | COMPLETE |
| 13 | `docs/phase-3/incorta-application-mapping.md` | Mapping template, 24 concepts listed | BLOCKED |
| 14 | `docs/phase-3/mock-vs-incorta-diff.md` | 30-item comparison, 3 mismatches found | PARTIAL |
| 15 | `docs/phase-3/phase-3-final-report.md` | This document | COMPLETE |

---

## PHASE 3 STATUS: B — API ACCESS BLOCKED

```
PHASE 3 STATUS: B — API ACCESS BLOCKED

API STATUS:         Platform supports API v2; access blocked by PAT/auth requirement
BUSINESS LOGIC STATUS: BLOCKED — cannot inspect Business View definitions
SEVERITY RULE STATUS:  BLOCKED — P0 unresolved
OPEN CASE STATUS:      BLOCKED — P0 unresolved
NO SEVERITY STATUS:    BLOCKED — P0 unresolved
DATA MODEL STATUS:     BLOCKED — schema/view/column references unknown
RECOMMENDED NEXT PHASE: Phase 3 RESUME (not Phase 4) once PAT is available

BLOCKERS:
1. No Personal Access Token (PAT) — user must create one in Incorta profile
2. Public API may not be enabled for user — Super User may need to grant access
3. SSO prevents programmatic dashboard inspection without authenticated session
4. All 3 P0 business logic questions remain unresolved from Phase 2B
```
