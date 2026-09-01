# Data Source Map — Phase 3 Discovery

> Status: **BLOCKED — requires authenticated access**

---

## Discovery Status

The underlying data model (schemas, Business Views, tables, columns, joins, calculated columns) cannot be inspected without authenticated access to the Incorta dashboard or API.

## Discovery Methods Available with Authentication

### Method 1: Insight Query API Response
The Insight Query endpoint returns column metadata in the response:
```json
{
  "headers": {
    "dimensions": [
      { "columnName": "string", "dataType": "string", "label": "string", "type": "string" }
    ],
    "measures": [
      { "columnName": "string", "dataType": "string", "label": "string", "field": "schemaName.tableName.columnName" }
    ]
  }
}
```

The `field` property on measures reveals the `schemaName.tableName.columnName` path, which maps directly to the Incorta data model.

### Method 2: Business View Query API
The `/query` endpoint accepts explicit field references in the format `businessSchemaName.viewName.columnName`, which means the data model can be reverse-engineered from API responses.

### Method 3: List Schemas / List Schema Objects API
```
GET https://enphase-1.cloud2.incorta.com/incorta/api/v2/enphase/schemas
GET https://enphase-1.cloud2.incorta.com/incorta/api/v2/enphase/schemas/{schemaName}/objects
```
These endpoints list available schemas and their objects (tables, views, columns).

### Method 4: Browser Insight Inspection
When an insight is opened in Focus/Expand mode, Incorta's UI shows:
- The Business View/table being queried
- Columns used as dimensions and measures
- Any calculated columns or expressions
- Applied filters

## Expected Data Model Structure (from Phase 2B analysis)

```
Dashboard: C&I – Severity and Cases
  └── Tab: [Overview]
  │    └── Insight: Total C&I Sites (KPI)
  │    │    └── Business View: UNKNOWN
  │    │         └── Measure: COUNT(sites) or similar
  │    │
  │    └── Insight: Severity Breakdown
  │    │    └── Business View: UNKNOWN
  │    │         ├── Dimension: Severity Level
  │    │         ├── Dimension: Subcategory (a/b/c)
  │    │         └── Measure: COUNT(sites)
  │    │
  │    └── Insight: Site Table
  │         └── Business View: UNKNOWN
  │              ├── Column: Site Id
  │              ├── Column: Site Name
  │              ├── Column: Site Stage
  │              ├── Column: Site Status
  │              ├── Column: Last Interval End Date (PST)
  │              ├── Column: Micro Count
  │              ├── Column: Inv Produced
  │              ├── Column: Inv ParamBld
  │              ├── Column: Envoy Count
  │              ├── Column: MI Product Sku
  │              └── Column: Envoy Types
  │
  └── Tab: [Open Cases]
  │    └── Insight: SFDC OPEN Cases Table
  │    │    └── Business View: UNKNOWN (likely site + case join)
  │    │
  │    └── Insight: SFDC NO OPEN Cases Table
  │         └── Business View: UNKNOWN (likely site filtered)
  │
  └── Tab: [Case Tracker]
  │    └── Insight: Case Tracker Table
  │         └── Business View: UNKNOWN (case + site join)
  │              ├── Column: Case Number
  │              ├── Column: Site Id
  │              ├── Column: Site Link
  │              ├── Column: Site Name
  │              ├── Column: Site Status
  │              ├── Column: Last Interval End Date (PST)
  │              ├── Column: MI Product Sku
  │              ├── Column: Connection Type
  │              ├── Column: Case Status
  │              ├── Column: Severity (composite)
  │              ├── Column: Case Category
  │              └── Column: Case Type
  │
  └── Tab: [Historical]
       └── Insight: Historical Data per Installer (pivot)
            └── Business View: UNKNOWN
                 ├── Row Dimension: Installer
                 ├── Column Dimension: Date
                 ├── Measure: Sev-1 Sites
                 ├── Measure: Sev-2 Sites
                 ├── Measure: Sev-3 Sites
                 └── Measure: Total
```

**All Business View names, schema names, and column references are UNKNOWN until authenticated access is available.**

## Key Questions for Data Model Discovery

| # | Question | Why It Matters |
|---|---|---|
| 1 | What Business Views underlie each insight? | Determines whether we query insights or Business Views directly |
| 2 | Are severity levels stored as source columns or calculated? | Determines if we can query raw severity data |
| 3 | Is the composite severity `3(b)` a single column or two? | Affects parsing logic |
| 4 | What joins connect sites to cases? | Determines site-case relationship |
| 5 | What schema contains the historical data? | Determines if it's a separate table or derived |
| 6 | Are there calculated columns for subcategories? | Reveals the (a)/(b)/(c) business logic |
| 7 | What is the source of Site Status? | Determines if it's stored or derived |
