# API Proof of Concept — Phase 3 Discovery

> Status: **BLOCKED — requires Personal Access Token (PAT)**

---

## API Availability Assessment

| Attribute | Value | Confidence |
|---|---|---|
| Incorta version | Cloud (enphase-1.cloud2.incorta.com) | CONFIRMED |
| Public API v2 supported | Yes — Cloud installations support API v2 starting 2023.4.0 | CONFIRMED (from Incorta docs) |
| API base URL | `https://enphase-1.cloud2.incorta.com/incorta/api/v2/enphase` | CONFIRMED (derived from cluster + tenant) |
| Swagger UI URL | `https://enphase-1.cloud2.incorta.com/incorta/api?urls.primaryName=v2` | CONFIRMED (from Incorta docs) |
| Authentication methods | PAT (Personal Access Token) or OAuth 2.0 JWT | CONFIRMED |
| SSO in use | Microsoft Azure AD (SAML) | CONFIRMED (observed redirect) |
| HTTPS required | Yes (Cloud installation) | CONFIRMED |
| Tenant name | `enphase` (case-sensitive) | CONFIRMED (from dashboard URL) |

## API Access Requirements

### To get a PAT:
1. The Super User or a SuperRole user must **enable Public API access** for the user's account
2. The user generates a PAT in their profile → Security → API Tokens
3. The PAT is used as a Bearer token in API requests

### Prerequisite Check
| Requirement | Status |
|---|---|
| User has Incorta login | YES (dashboard URL confirms SSO access) |
| Public API enabled for user | UNKNOWN — must be verified in Incorta Security settings |
| PAT created | UNKNOWN — user must create one |
| SuperRole user available to enable API | UNKNOWN |

## Planned POC Test

Once a PAT is available, the first test would be:

### Test 1: Dashboard Prompts
```
GET https://enphase-1.cloud2.incorta.com/incorta/api/v2/enphase/dashboards/ee817bdb-9b6a-4135-97d2-52ac36e23c63/prompts
Authorization: Bearer {PAT}
Accept: application/json
```

Expected response: List of dashboard prompts with field references, operators, and available values.

### Test 2: Simple Insight Query (Total C&I Sites)
```
POST https://enphase-1.cloud2.incorta.com/incorta/api/v2/enphase/dashboards/ee817bdb-9b6a-4135-97d2-52ac36e23c63/insights/{insightGuid}/query
Authorization: Bearer {PAT}
Content-Type: application/json
Accept: application/json

{
  "pagination": { "startRow": 0, "pageSize": 10 }
}
```

Expected response:
```json
{
  "headers": {
    "dimensions": [...],
    "measures": [...],
    "apiVersion": 1,
    "totalRows": <number>
  },
  "data": [...]
}
```

### Test 3: List Schemas
```
GET https://enphase-1.cloud2.incorta.com/incorta/api/v2/enphase/schemas
Authorization: Bearer {PAT}
Accept: application/json
```

## POC Result Template (to be completed)

```
Endpoint: UNKNOWN (PAT required)
Method: POST
Authentication: Bearer PAT
HTTP status: UNKNOWN
Insight: Total C&I Sites (GUID unknown)
Result: UNKNOWN
Response schema: UNKNOWN
Pagination: Supported (from Incorta docs)
Prompts supported: Yes (from Incorta docs)
Notes: Blocked by PAT requirement
```

## API Summary

```
API available: YES (platform supports it)
API accessible: UNKNOWN (requires PAT + Public API enabled for user)
Authentication method: PAT (recommended) or OAuth JWT
Tenant: enphase
Dashboard query: UNKNOWN (requires PAT + insight GUIDs)
Business View query: UNKNOWN (requires PAT + schema/view names)
```
