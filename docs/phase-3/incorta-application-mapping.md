# Incorta → Application Mapping — Phase 3 Discovery

> Status: **BLOCKED — requires authenticated access to confirm Incorta sources**

---

## Mapping Table

| # | Application Concept | Dashboard Field | Incorta Source | Confirmed? |
|---|---|---|---|---|
| 1 | Total C&I Sites | `totalSites` (KPI) | UNKNOWN — insight query required | NO |
| 2 | Sev 1 count | `severity === 1` filter count | UNKNOWN — insight or BV column | NO |
| 3 | Sev 2 count | `severity === 2` filter count | UNKNOWN — insight or BV column | NO |
| 4 | Sev 3 count | `severity === 3` filter count | UNKNOWN — insight or BV column | NO |
| 5 | Sev 4 count | `severity === 4` filter count | UNKNOWN — insight or BV column | NO |
| 6 | Sev 1/2/3 (a) | `sev123a` (KPI) | UNKNOWN — calculated from case status? | NO |
| 7 | Sev 1/2/3 (b) | `sev123b` (KPI) | UNKNOWN — calculated from case status? | NO |
| 8 | Sev 1/2/3 (c) | `sev123c` (KPI) | UNKNOWN — calculated from case status? | NO |
| 9 | Sites with Open Cases | `sitesWithOpenCases` (KPI) | UNKNOWN — case join/filter | NO |
| 10 | Sites without Open Cases | `sitesWithNoOpenCases` (KPI) | UNKNOWN — case join/filter | NO |
| 11 | Site Status | `siteStatus` field | UNKNOWN — site table column | NO |
| 12 | Case Status | `caseStatus` field | UNKNOWN — SFDC column? | NO |
| 13 | Case Category | `caseCategory` field | UNKNOWN — SFDC column? | NO |
| 14 | Case Type | `caseType` field | UNKNOWN — SFDC column? | NO |
| 15 | Installer | `installerName` field | UNKNOWN — site/installer table | NO |
| 16 | Connection Type | `connectionType` field | UNKNOWN — site table column | NO |
| 17 | Site Stage Id | `siteStage` field | UNKNOWN — site table column | NO |
| 18 | MI Product SKU | `miProductSku` field | UNKNOWN — site table column | NO |
| 19 | Historical Sev 1 | `sev1` measure | UNKNOWN — historical BV | NO |
| 20 | Historical Sev 2 | `sev2` measure | UNKNOWN — historical BV | NO |
| 21 | Historical Sev 3 | `sev3` measure | UNKNOWN — historical BV | NO |
| 22 | Severity Level | `severity` (1,2,3,4,null) | UNKNOWN — source or calculated? | NO |
| 23 | Severity Subcategory | `severitySubcategory` (a,b,c) | UNKNOWN — source or calculated? | NO |
| 24 | Composite Severity | `severity` string e.g. "3(b)" | UNKNOWN — concatenation in BV? | NO |

## What API Responses Will Reveal

When insight queries are executed, the response headers will contain `field` references in the format:

```
{schemaName}.{tableName}.{columnName}
```

These references will directly map application concepts to Incorta source columns. For example:

```json
{
  "headers": {
    "dimensions": [
      {
        "label": "Site Id",
        "field": "CI_Sites_Schema.Sites_View.site_id",
        "dataType": "string"
      }
    ],
    "measures": [
      {
        "label": "Total",
        "field": "CI_Sites_Schema.Sites_View.total_count",
        "dataType": "integer"
      }
    ]
  }
}
```

(The above is hypothetical — actual field references are unknown.)

## Mapping Completion Requirements

1. **PAT available** → can call Insight Query API
2. **Insight GUIDs known** → can target specific insights
3. **Response headers analyzed** → `field` properties reveal source mapping
4. **Business View inspected** → calculated vs. source columns distinguished
5. **Schema Objects listed** → complete column inventory
