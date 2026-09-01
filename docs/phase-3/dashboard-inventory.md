# Dashboard Inventory — Phase 3 Discovery

> C&I – Severity and Cases Dashboard
> Cluster: `enphase-1.cloud2.incorta.com`
> Tenant: `enphase`

---

## Dashboard Identification

| Field | Value |
|---|---|
| Dashboard Name | C&I – Severity and Cases (from Phase 1 screenshot analysis) |
| Dashboard URL | `https://enphase-1.cloud2.incorta.com/incorta/!enphase/#/dashboard/ee817bdb-9b6a-4135-97d2-52ac36e23c63/tab/a51d38e4-7698-40df-8ea0-ba0d1d147891` |
| Dashboard GUID | `ee817bdb-9b6a-4135-97d2-52ac36e23c63` |
| Known Tab GUID | `a51d38e4-7698-40df-8ea0-ba0d1d147891` |
| Cluster | `enphase-1.cloud2.incorta.com` |
| Tenant | `enphase` |
| Authentication | Microsoft Azure AD SSO (SAML) |

## Access Status

**STATUS: BLOCKED — SSO authentication required**

When the dashboard URL is accessed programmatically, it returns an HTML page containing a JavaScript redirect to Microsoft Azure AD SAML SSO:

```
Provider URL: https://launcher.myapps.microsoft.com/api/signin/87d249d5-db8b-414b-8556-d6398bd1569f
Tenant ID: 7df9352f-c5eb-4007-a723-44c078605c7a
Method: SAML (SAMLRequest parameter present)
```

This SSO redirect means:
- The dashboard cannot be inspected programmatically without an authenticated session
- Tab names, insight GUIDs, and dashboard structure cannot be enumerated from outside the SSO boundary
- The Incorta Public API v2 also requires an authenticated access token (PAT or OAuth JWT)

## Expected Tabs (from Phase 1 Screenshot Analysis)

Based on Phase 1 screenshot analysis, the dashboard is expected to contain these areas (tabs or sections):

| # | Expected Tab/Section | Evidence | Tab GUID | Status |
|---|---|---|---|---|
| 1 | Overview / Severity Overview | Screenshot 1: KPIs, severity breakdown, site table | `a51d38e4-7698-40df-8ea0-ba0d1d147891` (known) | INFERRED — this is the known tab GUID, likely the overview |
| 2 | SFDC OPEN Cases | Screenshot 2: 526-row site table | UNKNOWN | INFERRED |
| 3 | SFDC NO OPEN Cases | Screenshot 2: 16-row site table | UNKNOWN | INFERRED |
| 4 | Case Tracker | Screenshot 3: 583-row case table | UNKNOWN | INFERRED |
| 5 | Historical Data per Installer | Screenshot 3: 497-row pivot table | UNKNOWN | INFERRED |

**IMPORTANT:** The known tab GUID (`a51d38e4-...`) must NOT be assumed to be an insight GUID. Insight GUIDs are separate identifiers visible in the URL when an insight is expanded/focused.

## What Is Needed to Complete This Inventory

1. **Authenticated browser access** to the Incorta dashboard to enumerate actual tab names, tab GUIDs, and insight counts
2. **OR** a Personal Access Token (PAT) to call the Dashboard Prompts API endpoint which would reveal prompt structure
3. **OR** Incorta admin assistance to export the dashboard metadata

## Actions for the User

To proceed with dashboard discovery, you have two options:

### Option A: Generate a PAT in Incorta
1. Sign into Incorta at `https://enphase-1.cloud2.incorta.com/incorta/!enphase/`
2. Click your profile icon (top right) → select your username
3. Go to the **Security** tab
4. Under **API Tokens**, select **Create Personal Access Token**
5. Set a name (e.g., `ci-dashboard-discovery`) and expiry (7 days recommended)
6. **Copy the token** — it can only be seen once
7. Store it securely (e.g., environment variable `INCORTA_PAT`)
8. **Do NOT paste the token into chat** — instead set it as an environment variable

### Option B: Manual Dashboard Inspection
1. Open the dashboard URL in your authenticated browser
2. Navigate through each tab and note:
   - Tab name and count
   - For each insight: click the focus/expand icon and note the insightGuid from the URL
3. Provide the findings to continue Phase 3
