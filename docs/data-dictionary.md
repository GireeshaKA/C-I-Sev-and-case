# Data Dictionary – C&I Severity and Cases

> Fields identified from the Incorta reference dashboard screenshots.
> Fields marked with ❓ have unresolved questions.

---

## Site Fields

| Display Name | Internal Name | Data Type | Example | Purpose | Source/Reference | Notes |
|---|---|---|---|---|---|---|
| Site ID | `siteId` | string | `SITE-001` | Unique identifier for the C&I site | Incorta / Enlighten | ❓ Exact ID format to be confirmed |
| Site Name | `siteName` | string | `Sunnyvale Commercial Plaza` | Human-readable site name | Incorta / Enlighten | |
| Site Stage | `siteStage` | enum | `Active` | Lifecycle stage of the site | Incorta | Values: Active, Inactive, Decommissioned, Pending |
| Site Status | `siteStatus` | enum | `Normal` | Current operational status | Incorta | Values: Normal, Warning, Critical, Offline, Unknown |
| Last Interval End Date | `lastIntervalEndDate` | ISO 8601 datetime | `2024-07-15T23:45:00Z` | Timestamp of last reported data interval | Incorta / Enlighten | ❓ Granularity and timezone handling to be confirmed |
| Micro Count | `microCount` | integer | `120` | Number of microinverters at the site | Incorta / Enlighten | |
| Envoy Count | `envoyCount` | integer | `4` | Number of Envoy/IQ Gateway devices at the site | Incorta / Enlighten | |
| MI Product SKU | `miProductSku` | string | `IQ8A-72-2-US` | Microinverter product SKU | Incorta / Enlighten | |
| Envoy Type | `envoyType` | enum | `IQ Gateway Commercial` | Type of Envoy device | Incorta | Values: IQ Gateway, IQ Gateway Commercial, Envoy-S, Unknown |
| Installer Name | `installerName` | string | `SolarTech Pro` | Name of the installer company | Incorta / Enlighten | |
| State | `state` | string | `California` | US state or region | Incorta / Enlighten | ❓ Whether this uses abbreviation or full name |
| Country | `country` | string | `United States` | Country | Incorta / Enlighten | |
| Connection Type | `connectionType` | enum | `Ethernet` | Network connection type of the Envoy | Incorta | Values: Ethernet, WiFi, Cellular, Unknown |
| Severity | `severity` | enum | `S2` | Current severity level assigned to the site | Incorta | Values: S0, S1, S2, S3, S4, No Severity |
| System Size | `systemSize` | number (kW) | `48.0` | Total system size in kilowatts | Incorta / Enlighten | ❓ Unit confirmation needed (kW vs kWp) |
| Activation Date | `activationDate` | date string | `2023-01-15` | Date the site was activated | Incorta / Enlighten | |

---

## Case Fields

| Display Name | Internal Name | Data Type | Example | Purpose | Source/Reference | Notes |
|---|---|---|---|---|---|---|
| Case Number | `caseNumber` | string | `CS-100001` | Unique SFDC case identifier | SFDC | ❓ Exact format (e.g., 8-digit number) to be confirmed |
| Case Status | `caseStatus` | enum | `Open` | Current status of the case | SFDC | Values: Open, Closed, Escalated, In Progress, Pending |
| Severity | `severity` | string | `S0` | Severity level of the case | SFDC / Incorta | ❓ Whether this matches site severity levels exactly |
| Case Category | `caseCategory` | enum | `Communication` | Category classifying the issue | SFDC | Values: Performance, Communication, Hardware, Software, Grid, Other |
| Case Type | `caseType` | enum | `Proactive` | How the case was initiated | SFDC | Values: Reactive, Proactive, Customer Initiated |
| Site ID | `siteId` | string | `SITE-001` | Reference to the associated site | SFDC / Incorta | Foreign key to Site |
| Site Name | `siteName` | string | `Portland Warehouse District` | Name of the associated site | SFDC / Incorta | Denormalized for display convenience |
| Subject | `subject` | string | `Complete communication loss` | Brief subject line of the case | SFDC | |
| Description | `description` | string | `All 10 envoys have stopped...` | Detailed description of the issue | SFDC | |
| Created Date | `createdDate` | ISO 8601 datetime | `2024-07-10T08:30:00Z` | When the case was created | SFDC | |
| Closed Date | `closedDate` | ISO 8601 datetime or null | `2024-07-01T15:00:00Z` | When the case was closed (null if open) | SFDC | |
| Last Modified Date | `lastModifiedDate` | ISO 8601 datetime | `2024-07-15T14:00:00Z` | When the case was last updated | SFDC | |
| Owner | `owner` | string | `Tier 3 Support` | Current case owner/assignee | SFDC | ❓ Whether this is a person name or team name |
| Age | `age` | integer (days) | `5` | Number of days since case creation | Calculated | ❓ Business rule: calendar days vs business days |
| Priority | `priority` | string | `Critical` | Case priority level | SFDC | ❓ Relationship between priority and severity to be confirmed |

---

## Severity Distribution Fields

| Display Name | Internal Name | Data Type | Example | Purpose | Source/Reference | Notes |
|---|---|---|---|---|---|---|
| Level | `level` | enum | `S0` | Severity level | Aggregated | |
| Count | `count` | integer | `3` | Number of sites at this severity | Aggregated | |
| Percentage | `percentage` | number | `15` | Percentage of total sites | Calculated | |

---

## Historical Severity Fields

| Display Name | Internal Name | Data Type | Example | Purpose | Source/Reference | Notes |
|---|---|---|---|---|---|---|
| Date | `date` | date string | `2024-07-01` | Snapshot date | Incorta | ❓ Granularity: daily, weekly, or monthly |
| S0 | `s0` | integer | `1` | Count of S0 sites on this date | Incorta | |
| S1 | `s1` | integer | `3` | Count of S1 sites on this date | Incorta | |
| S2 | `s2` | integer | `10` | Count of S2 sites on this date | Incorta | |
| S3 | `s3` | integer | `14` | Count of S3 sites on this date | Incorta | |
| S4 | `s4` | integer | `9` | Count of S4 sites on this date | Incorta | |
| No Severity | `noSeverity` | integer | `63` | Count of sites with no severity | Incorta | |
| Total | `total` | integer | `100` | Total sites in snapshot | Calculated | |

---

## Future Fields (Not Yet in Data Model)

These fields may be needed as the project evolves but are not currently represented in mock data:

| Field | Rationale |
|---|---|
| Energy Production (kWh) | Site performance metrics |
| Expected Production (kWh) | For performance ratio calculation |
| Performance Ratio | Production vs expected |
| Alert Count | Number of active alerts per site |
| RMA Count | Return merchandise authorizations |
| Last Communication Date | Per-envoy communication timestamp |
| Firmware Version | Envoy firmware tracking |
