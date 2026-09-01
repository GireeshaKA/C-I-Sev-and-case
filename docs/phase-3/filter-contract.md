# Filter Contract — Phase 3 Discovery

> Status: **BLOCKED — requires authenticated access**

---

## Discovery Status

Filter/prompt details cannot be determined without authenticated access. The Incorta Dashboard Prompts API endpoint would return the exact prompt configuration:

```
GET https://enphase-1.cloud2.incorta.com/incorta/api/v2/enphase/dashboards/ee817bdb-9b6a-4135-97d2-52ac36e23c63/prompts
Authorization: Bearer {PAT}
```

Expected response structure (from Incorta docs):
```json
{
  "prompts": [
    {
      "dataType": "string",
      "field": "schemaName.tableName.columnName",
      "function": "string",
      "label": "string",
      "operator": "string",
      "defaultValues": ["string"],
      "values": ["string"],
      "variable": "string"
    }
  ]
}
```

This endpoint reveals:
- All dashboard-level prompts
- All presentation variables
- Field references (schema.table.column format)
- Default values
- Operators
- Available values

## Expected Filters (from Phase 1 Screenshot Analysis)

| # | Expected Label | Expected Field | Operator | Type | Default | Available Values | Scope | Status |
|---|---|---|---|---|---|---|---|---|
| 1 | Connection Type | UNKNOWN | IN | Dashboard Prompt | UNKNOWN | Ethernet, Wifi, Cellular (confirmed visible) | Dashboard-wide | INFERRED |
| 2 | Site Stage Id | UNKNOWN | IN | Dashboard Prompt | UNKNOWN | Ready, Final, Verifying (confirmed visible) | Dashboard-wide | INFERRED |
| 3 | SKU | UNKNOWN | IN | Dashboard Prompt | UNKNOWN | IQ8H-3P-72-E-US, IQ8P-3P-72-E-DOM-US, IQ8P-3P-72-E-US, IQ9N-3P-277-A-DOM-US, IQ9N-3P-277-A-US, IQ9S-3P-277-B-DOM-US (confirmed visible) | Dashboard-wide | INFERRED |

### Unresolved Filter Questions

| # | Question | Status |
|---|---|---|
| 1 | Are there hidden/global prompts not visible in screenshots? | UNKNOWN |
| 2 | Are there presentation variables controlling dashboard behavior? | UNKNOWN |
| 3 | Is severity controlled by a prompt or is it an insight-level filter? | UNKNOWN |
| 4 | Is the SKU display text ("C&I Sites with SKU...") a presentation variable? | UNKNOWN |
| 5 | Are there date-range prompts for the historical tab? | UNKNOWN |
| 6 | What operators do the prompts use (IN, EQUALS, CONTAINS)? | UNKNOWN |
| 7 | What are the default values for each prompt? | UNKNOWN |
| 8 | Does each prompt have a hardcoded list of values or is it dynamic? | UNKNOWN |

## Incorta Filter Types (from documentation)

Incorta supports these filter mechanisms:
- **Dashboard Prompts** — global filters visible across tabs, passed to insight queries via API
- **Insight-level Filters** — filters applied within a specific insight definition
- **Calculated Filters** — filters using calculated columns or expressions
- **Presentation Variables** — variables used in insight expressions, controlled by prompt widgets
- **Hard-coded Restrictions** — WHERE-clause-like filters embedded in the Business View

The Dashboard Prompts API endpoint reveals dashboard prompts and presentation variables. Insight-level and hard-coded filters require inspecting each insight definition individually.

## How to Complete This Contract

1. **With PAT:** Call the Dashboard Prompts API endpoint above
2. **With browser:** Open the dashboard, inspect each filter dropdown, note the field reference in the URL or Incorta developer tools
3. **With admin:** Export the dashboard definition to get prompt configurations
