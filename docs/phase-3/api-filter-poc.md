# API Filter POC — Phase 3 Discovery

> Status: **BLOCKED — requires PAT and insight GUIDs**

---

## Planned Test

Once the API POC (Test 1 and 2) succeeds, test a single filter:

### Preferred filter: Connection Type

```
POST https://enphase-1.cloud2.incorta.com/incorta/api/v2/enphase/dashboards/{dashboardGuid}/insights/{insightGuid}/query
Authorization: Bearer {PAT}
Content-Type: application/json

{
  "prompts": [
    {
      "field": "{schema}.{table}.{connectionTypeColumn}",
      "operator": "IN",
      "values": ["Ethernet"],
      "type": "dimension"
    }
  ],
  "pagination": {
    "startRow": 0,
    "pageSize": 10
  }
}
```

### Expected Result

The response should:
- Return fewer rows than the unfiltered query
- The `totalRows` header should differ from the unfiltered count
- The `prompts` section in the response should echo the applied filter

### What This Would Confirm

| Finding | Impact |
|---|---|
| The exact `field` reference for Connection Type | Maps to `schemaName.tableName.columnName` format |
| Whether the operator is `IN`, `EQUALS`, or another type | Determines our filter implementation |
| Whether the filter applies across insights or per-insight | Determines if we pass prompts per query or globally |
| The response structure with applied filters | Confirms API filter contract |

## Result Template (to be completed)

```
Prompt field: UNKNOWN
Operator: UNKNOWN
Value format: UNKNOWN
Type: UNKNOWN
Response change: UNKNOWN
Notes: Blocked by PAT requirement
```
