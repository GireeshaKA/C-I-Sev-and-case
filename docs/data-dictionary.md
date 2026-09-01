# Data Dictionary – C&I Severity and Cases

> Updated based on detailed analysis of three Incorta dashboard screenshots.
> Classification: **CONFIRMED** = directly visible | **INFERRED** = logically deduced | **PHASE 0 ASSUMPTION** = from initial setup, needs review
> Fields marked with ❓ have unresolved questions.

---

## Site Fields (CONFIRMED from Screenshots 1, 2)

| Display Name | Internal Name | Data Type | Example | Purpose | Source | Confidence |
|---|---|---|---|---|---|---|
| Site Id | `siteId` | string (numeric) | `6256648` | Unique identifier for the C&I site | Incorta / Enlighten | CONFIRMED — numeric IDs visible |
| Site Name | `siteName` | string | `Derek Shannon 2040 South Navajo` | Human-readable site name | Incorta / Enlighten | CONFIRMED |
| Site Stage | `siteStage` | enum | `Ready` | Lifecycle stage of the site | Incorta | CONFIRMED — Values: Ready, Final, Verifying |
| Site Status | `siteStatus` | enum | `Normal` | Current operational status | Incorta | CONFIRMED — Values: Normal, Production Issue, Microinverters Not Reporting, Envoy Not Reporting, Meter Issue |
| Last Interval End Date (PST) | `lastIntervalEndDate` | datetime | `2026-04-10 12:30:00` | Timestamp of last data interval | Incorta / Enlighten | CONFIRMED — displayed in PST timezone |
| Micro Count | `microCount` | integer | `22` | Number of microinverters | Incorta / Enlighten | CONFIRMED |
| Inv Produced | `invProduced` | string | `521-00006-r-06-r02-57.03` | Inverter produced version/firmware | Incorta / Enlighten | CONFIRMED — Screenshot 1 only |
| Inv ParamBld | `invParamBld` | string | `549-00068-r01-r02-57.03` | Inverter parameter build version | Incorta / Enlighten | CONFIRMED — Screenshot 1 only |
| Envoy Count | `envoyCount` | integer | `1` | Number of Envoy/Gateway devices | Incorta / Enlighten | CONFIRMED |
| MI Product Sku | `miProductSku` | string | `IQ8P-3P-72-E-US` | Microinverter product SKU | Incorta / Enlighten | CONFIRMED |
| Envoy Types | `envoyTypes` | string | `IQD Commercial Gateway` | Type of Envoy device | Incorta | CONFIRMED — Values: IQD Commercial Gateway, IQ Gateway Commercial, IQ Gateway Commercial Si |
| Installer Name | `installerName` | string | `Solar and Wind Power LLC` | Installer company name | Incorta / Enlighten | CONFIRMED — Screenshot 2 |
| State | `state` | string | `MD`, `CA`, `CO` | US state abbreviation | Incorta / Enlighten | CONFIRMED — uses 2-letter abbreviations. Some show `Unknown`, `QROO` (non-US) |
| Country | `country` | string | `US`, `MX` | Country code | Incorta / Enlighten | CONFIRMED — uses 2-letter codes |
| Connection Type | `connectionType` | enum | `Ethernet` | Network connection type | Incorta | CONFIRMED — Values: Ethernet, Wifi, Cellular (Screenshot 3) |

### ⚠️ Phase 0 Corrections

| Phase 0 Field | Status | Correction |
|---|---|---|
| Site ID format `SITE-001` | INCORRECT | Actual format is numeric: `6256648` |
| Site Stage values (Active, Inactive, Decommissioned, Pending) | PARTIALLY INCORRECT | Confirmed values: Ready, Final, Verifying |
| Site Status values (Normal, Warning, Critical, Offline, Unknown) | MOSTLY INCORRECT | Confirmed values: Normal, Production Issue, Microinverters Not Reporting, Envoy Not Reporting, Meter Issue |
| Envoy Type values (IQ Gateway, IQ Gateway Commercial, Envoy-S) | PARTIALLY CORRECT | Confirmed: IQD Commercial Gateway, IQ Gateway Commercial, IQ Gateway Commercial Si |
| State format (full name) | INCORRECT | Uses 2-letter abbreviations (MD, CA, CO) |
| Country format (full name) | INCORRECT | Uses 2-letter codes (US, MX) |
| Severity values (S0-S4) | INCORRECT | Actual values: 1, 2, 3, 4 (no "S" prefix, no S0) |
| System Size field | NOT CONFIRMED | Not visible in any screenshot |
| Activation Date field | NOT CONFIRMED | Not visible in any screenshot |
| Inv Produced field | NOT IN PHASE 0 | New field confirmed in Screenshot 1 |
| Inv ParamBld field | NOT IN PHASE 0 | New field confirmed in Screenshot 1 |

---

## Case Fields (CONFIRMED from Screenshot 3 — Case Tracker)

| Display Name | Internal Name | Data Type | Example | Purpose | Source | Confidence |
|---|---|---|---|---|---|---|
| Case Number | `caseNumber` | string (numeric) | `20139519` | Unique SFDC case identifier | SFDC | CONFIRMED — 8-digit numeric |
| Site Id | `siteId` | string (numeric) | `6320142` | Associated site identifier | SFDC / Incorta | CONFIRMED |
| Site Link | `siteLink` | string (numeric) | `6320142` | Clickable link to site (same as Site Id) | Incorta | CONFIRMED |
| Site Name | `siteName` | string | `Dunsoth Fire Department` | Associated site name | SFDC / Incorta | CONFIRMED |
| Site Status | `siteStatus` | enum | `Production Issue` | Current site operational status | Incorta | CONFIRMED |
| Last Interval End Date (PST) | `lastIntervalEndDate` | datetime | `2026-09-01 01:57:38` | Last data interval for the site | Incorta | CONFIRMED |
| MI Product Sku | `miProductSku` | string | `IQ8P-3P-72-E-US` | Site microinverter SKU | Incorta | CONFIRMED |
| Connection Type | `connectionType` | enum | `Ethernet` | Site network connection | Incorta | CONFIRMED |
| Case Status | `caseStatus` | enum | `New` | Current SFDC case status | SFDC | CONFIRMED — Values: New, Case - In Progress |
| Severity | `severity` | string (composite) | `3(b)` | Severity level + sub-category | SFDC / Incorta | CONFIRMED — Format: `{level}({subcategory})` |
| Case Category | `caseCategory` | enum | `Microinverter` | Hardware category of the case | SFDC | CONFIRMED |
| Case Type | `caseType` | string | `MI. Drop Out` | Specific case type/issue classification | SFDC | CONFIRMED — Values: MI. Drop Out, MI. AC Branch Issue |

### ⚠️ Phase 0 Corrections

| Phase 0 Field | Status | Correction |
|---|---|---|
| Case Number format `CS-100001` | INCORRECT | Actual format is numeric: `20139519` |
| Case Status values (Open, Closed, Escalated, In Progress, Pending) | PARTIALLY INCORRECT | Confirmed: New, Case - In Progress. Others may exist but not visible. |
| Severity format (S0, S1, etc.) | INCORRECT | Actual format is composite: `3(b)`, `1(c)` — numeric level + sub-category letter |
| Case Category values (Performance, Communication, Hardware, Software, Grid, Other) | INCORRECT | Confirmed: Microinverter. Other values may exist. |
| Case Type values (Reactive, Proactive, Customer Initiated) | INCORRECT | Confirmed: MI. Drop Out, MI. AC Branch Issue. These are specific issue types, not initiation modes. |
| Subject field | NOT CONFIRMED | Not visible in Case Tracker |
| Description field | NOT CONFIRMED | Not visible in any screenshot |
| Created Date field | NOT CONFIRMED | Not visible in Case Tracker |
| Closed Date field | NOT CONFIRMED | Not visible in Case Tracker |
| Last Modified Date field | NOT CONFIRMED | Not visible in Case Tracker |
| Owner field | NOT CONFIRMED | Not visible in Case Tracker |
| Age field | NOT CONFIRMED | Not visible in Case Tracker |
| Priority field | NOT CONFIRMED | Not visible in Case Tracker |

---

## Severity Model (CONFIRMED from Screenshots 1, 3)

### Severity Levels

| Level | Display Name | Confirmed |
|---|---|---|
| 1 | Sev 1 / Sev-1 | CONFIRMED |
| 2 | Sev 2 / Sev-2 | CONFIRMED |
| 3 | Sev 3 / Sev-3 | CONFIRMED |
| 4 | Sev 4 / Sev-4 | CONFIRMED |

**⚠️ No "S0" or "No Severity" levels visible in screenshots.** Phase 0 assumption of S0-S4 + No Severity is INCORRECT. Actual levels are 1-4.

**⚠️ "No Severity" concept:** The KPIs show 2,060 total sites but only 457 in severity 1-4, implying 1,603 sites have no severity assignment. However, "No Severity" is not explicitly labeled as a category in the screenshots.

### Severity Sub-categories (CONFIRMED from Screenshot 1 notes)

| Code | Meaning | Confirmed |
|---|---|---|
| (a) | Severity site with open case and NOT marked as 'Case - In Progress' | CONFIRMED |
| (b) | Severity site with open case and marked as 'Case - In Progress' | CONFIRMED |
| (c) | Severity site with NO open cases | CONFIRMED |

### Composite Severity Format (CONFIRMED from Screenshot 3)

In the Case Tracker, severity is displayed as `{level}({subcategory})`, e.g., `3(b)`, `1(c)`.

---

## Historical Severity Fields (CONFIRMED from Screenshot 3)

| Display Name | Internal Name | Data Type | Example | Purpose | Source | Confidence |
|---|---|---|---|---|---|---|
| Date | `date` | date string | `2026-08-27` | Snapshot date | Incorta | CONFIRMED — daily granularity |
| Sev-1 Sites | `sev1` | integer | `3` | Count of Sev-1 sites per installer | Incorta | CONFIRMED |
| Sev-2 Sites | `sev2` | integer | `2` | Count of Sev-2 sites per installer | Incorta | CONFIRMED |
| Sev-3 Sites | `sev3` | integer | `5` | Count of Sev-3 sites per installer | Incorta | CONFIRMED |
| Total | `total` | integer | `10` | Total severity sites per installer | Calculated | CONFIRMED |

**⚠️ No Sev-4 column in historical data.** Only Sev-1, Sev-2, Sev-3, and Total are visible.

**Grouping:** Per installer — CONFIRMED.

**Data saved since:** 2025-05-27 — CONFIRMED.

---

## Fields NOT Visible in Screenshots (Phase 0 assumptions to remove or mark as future)

| Field | Status |
|---|---|
| System Size | NOT CONFIRMED — remove from current model |
| Activation Date | NOT CONFIRMED — remove from current model |
| Subject | NOT CONFIRMED — may exist in SFDC but not in dashboard |
| Description | NOT CONFIRMED — may exist in SFDC but not in dashboard |
| Created Date | NOT CONFIRMED — may exist in SFDC but not in dashboard |
| Closed Date | NOT CONFIRMED — may exist in SFDC but not in dashboard |
| Owner | NOT CONFIRMED — may exist in SFDC but not in dashboard |
| Age | NOT CONFIRMED — may exist in SFDC but not in dashboard |
| Priority | NOT CONFIRMED — may exist in SFDC but not in dashboard |
| Energy Production (kWh) | NOT CONFIRMED |
| Expected Production (kWh) | NOT CONFIRMED |
| Performance Ratio | NOT CONFIRMED |
| Alert Count | NOT CONFIRMED |
| RMA Count | NOT CONFIRMED |
| Firmware Version | NOT CONFIRMED |
