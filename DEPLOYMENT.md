# Deployment Guide — Enphase C&I Fleet Health Intelligence Platform

## Architecture Overview

```
Browser → Frontend (React SPA / Netlify or Nginx)
               ↓ /api/*  (proxied or direct)
          Backend (Express / Node.js server)
               ↓ HTTPS + Bearer PAT (server-side only)
          Incorta Cloud (enphase-1.cloud2.incorta.com)
```

**Security principle**: `INCORTA_PAT` lives only in the backend process environment. It is never sent to the browser, never in Vite's `VITE_*` namespace in production, never in source control.

---

## Option A — Docker Compose (recommended for internal servers)

### Prerequisites
- Docker ≥ 24 and Docker Compose ≥ 2 on any Linux VM
- Nginx or a load balancer for TLS termination
- Incorta PAT from Enphase InfoSec

### 1. Create `docker-compose.yml`

```yaml
version: "3.9"

services:
  backend:
    build:
      context: .
      dockerfile: Dockerfile.backend
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - API_PORT=3001
      - INCORTA_PAT=${INCORTA_PAT}
      - INCORTA_DASHBOARD_ID=${INCORTA_DASHBOARD_ID}
      - INCORTA_INSIGHT_ID=${INCORTA_INSIGHT_ID}
      - INCORTA_CASE_DASHBOARD_ID=${INCORTA_CASE_DASHBOARD_ID}
      - INCORTA_CASE_INSIGHT_ID=${INCORTA_CASE_INSIGHT_ID}
    ports:
      - "3001:3001"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  frontend:
    build:
      context: .
      dockerfile: Dockerfile.frontend
    restart: unless-stopped
    ports:
      - "8080:80"
    depends_on:
      - backend
```

### 2. Create `Dockerfile.backend`

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build:server

FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist-server ./dist-server
COPY --from=builder /app/src ./src
ENV NODE_ENV=production
EXPOSE 3001
CMD ["node", "--experimental-vm-modules", "dist-server/index.js"]
```

### 3. Create `Dockerfile.frontend`

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# Build frontend pointing to same-origin /api/* (no VITE_API_URL needed in prod)
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

### 4. Create `nginx.conf`

```nginx
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    # API proxy to backend container
    location /api/ {
        proxy_pass http://backend:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_read_timeout 60s;
    }

    # SPA fallback
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

### 5. Create `.env.production` (never commit this file)

```env
INCORTA_PAT=your-incorta-personal-access-token
INCORTA_DASHBOARD_ID=your-fleet-dashboard-id
INCORTA_INSIGHT_ID=your-fleet-insight-id
INCORTA_CASE_DASHBOARD_ID=your-case-dashboard-id
INCORTA_CASE_INSIGHT_ID=your-case-insight-id
```

### 6. Deploy

```bash
# On your Linux server
git clone https://github.com/your-org/enphase-ci-dashboard.git
cd enphase-ci-dashboard
cp .env.example .env.production  # fill in values
docker compose --env-file .env.production up -d
```

### 7. TLS / HTTPS

Place Nginx (or Caddy) in front on the host:

```nginx
# /etc/nginx/sites-enabled/fleet-health
server {
    listen 443 ssl;
    server_name fleet.enphase.internal;
    ssl_certificate     /etc/ssl/certs/fleet-enphase.crt;
    ssl_certificate_key /etc/ssl/private/fleet-enphase.key;

    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
    }
    location /api/ {
        proxy_pass http://localhost:3001;
    }
}
server {
    listen 80;
    server_name fleet.enphase.internal;
    return 301 https://$host$request_uri;
}
```

---

## Option B — Cloud PaaS (Railway or Render)

### Backend on Railway

1. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
2. Select this repository
3. Set root directory: `/` (or `server/` for backend-only service)
4. Add environment variables in the Railway dashboard:
   - `INCORTA_PAT`, `INCORTA_DASHBOARD_ID`, `INCORTA_INSIGHT_ID`, etc.
5. Railway auto-assigns an HTTPS URL: `https://your-app.up.railway.app`
6. Set `API_PORT=8080` (Railway maps external 443 → internal 8080)
7. Health check: `GET /api/health`

### Frontend on Netlify

1. Go to [netlify.com](https://netlify.com) → New Site → Import from Git
2. Build command: `npm run build`
3. Publish directory: `dist`
4. Environment variable: `VITE_DATA_PROVIDER=backend`
5. Set `VITE_API_BASE=https://your-app.up.railway.app`
6. Create `netlify.toml`:

```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/api/*"
  to = "https://your-app.up.railway.app/api/:splat"
  status = 200
  force = true

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

---

## Option C — Azure App Service + Azure Static Web Apps (with SSO)

### Backend — Azure App Service (Node.js)

1. Create App Service (Linux, Node 20 LTS)
2. In Configuration → Application Settings, add all `INCORTA_*` env vars
3. Enable **Authentication** → Microsoft (Azure AD) → Require login
4. Deploy:

```bash
az webapp up --name enphase-fleet-api --resource-group enphase-rg --runtime "NODE:20-lts"
```

5. Health check path: `/api/health`

### Frontend — Azure Static Web Apps

1. Create Static Web App resource linked to this repo
2. Build details: App location `/`, Output location `dist`, App build command `npm run build`
3. Add `staticwebapp.config.json`:

```json
{
  "routes": [
    {
      "route": "/api/*",
      "rewrite": "https://enphase-fleet-api.azurewebsites.net/api/*"
    },
    {
      "route": "/*",
      "serve": "/index.html",
      "statusCode": 200
    }
  ],
  "auth": {
    "identityProviders": {
      "azureActiveDirectory": {
        "registration": {
          "openIdIssuer": "https://login.microsoftonline.com/{YOUR_TENANT_ID}/v2.0",
          "clientIdSettingName": "AAD_CLIENT_ID",
          "clientSecretSettingName": "AAD_CLIENT_SECRET"
        }
      }
    }
  },
  "globalHeaders": {
    "X-Frame-Options": "SAMEORIGIN",
    "X-Content-Type-Options": "nosniff",
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains"
  }
}
```

3. This gives a URL like: `https://proud-cliff-12345.azurestaticapps.net`
4. Map custom domain via Azure DNS: `fleet-health.enphase.com`

---

## Environment Variables Reference

| Variable                      | Required | Description                                      |
|-------------------------------|----------|--------------------------------------------------|
| `INCORTA_PAT`                 | **Yes**  | Incorta Personal Access Token (server-side only) |
| `INCORTA_DASHBOARD_ID`        | **Yes**  | Fleet Business View dashboard UUID               |
| `INCORTA_INSIGHT_ID`          | **Yes**  | Fleet Business View insight UUID                 |
| `INCORTA_CASE_DASHBOARD_ID`   | No       | SFDC Cases dashboard UUID (skips if unset)       |
| `INCORTA_CASE_INSIGHT_ID`     | No       | SFDC Cases insight UUID (skips if unset)         |
| `API_PORT`                    | No       | Backend port (default: 3001)                     |
| `NODE_ENV`                    | No       | `production` | `development`                    |
| `VITE_DATA_PROVIDER`          | No       | `backend` (default) | `mock`                   |

---

## Health Endpoint

```
GET /api/health
```

Response:
```json
{
  "status": "ok",
  "version": "0.1.0",
  "environment": "production",
  "uptime": 3600,
  "ts": "2026-09-28T14:00:00.000Z",
  "incorta": {
    "fleetConfigured": true,
    "caseConfigured": true,
    "patConfigured": true,
    "lastFleetRefreshAt": "2026-09-28T13:55:00.000Z",
    "lastCaseRefreshAt": "2026-09-28T13:55:02.000Z",
    "fleetLatencyMs": 1243,
    "caseLatencyMs": 892,
    "fleetStatus": "ok",
    "caseStatus": "ok"
  }
}
```

---

## SSO (Azure AD) Requirements

To restrict access to Enphase employees only:

1. Register an App Registration in Enphase's Azure AD tenant
2. Set Redirect URI to: `https://fleet-health.enphase.com/.auth/login/aad/callback`
3. Under "API permissions" add `User.Read` (Microsoft Graph)
4. Under "Expose an API" add your app's scope
5. Set `clientIdSettingName` and `clientSecretSettingName` in `staticwebapp.config.json`
6. Add `"requireAuthentication": true` to the static web app config

Contact Enphase IT/InfoSec to provision the App Registration and configure tenant-level Conditional Access.

---

## Current Deployment Status

| Component    | Status                                        | URL                                                              |
|--------------|-----------------------------------------------|------------------------------------------------------------------|
| Frontend     | ✅ Live — publicly accessible (mock/demo data) | https://gireeshaka.github.io/C-I-Sev-and-case/                  |
| Backend      | ⚠ Not yet deployed                            | Requires secure server + INCORTA_PAT                             |
| Health URL   | ⚠ Not available                               | Will be `/api/health` once backend is deployed                   |
| SSO          | ⚠ Pending IT/InfoSec                          | Azure AD App Registration needed                                 |

> **Note**: The Netlify frontend runs in `VITE_DATA_PROVIDER=mock` mode (representative data).
> To disable Netlify's team-level access control and make the site public:
> Go to → [Site settings > Access control](https://app.netlify.com/projects/enphase-fleet-intelligence/configuration/access-control) → set **Site protection: Off**.
> Live data requires the Express backend deployed with `INCORTA_PAT` set.

**Blocker**: `INCORTA_PAT` and Business View IDs must be provided by Enphase InfoSec before a production backend can be deployed. Do not expose these values in source control or frontend builds.

**Action required from IT**:
1. Provision a VM/App Service/Railway app with the env vars in the table above
2. Register an Azure AD application for SSO
3. Configure DNS CNAME for `fleet-health.enphase.com` → deployment URL
4. Issue a TLS certificate (or use Let's Encrypt / Azure managed cert)

---

## Local Development

```bash
# 1. Copy environment template
cp .env.example .env

# 2. Fill in INCORTA_* values
# 3. Start dev server (frontend + backend together)
npm run dev

# Frontend:  http://localhost:5173
# Backend:   http://localhost:3001
# Health:    http://localhost:3001/api/health
# Data QA:   http://localhost:3001/api/data-quality
```

---

## Verification Checklist (post-deployment)

- [ ] `GET /api/health` returns `status: "ok"` and `incorta.fleetStatus: "ok"`
- [ ] `GET /api/fleet` returns at least 1 site (confirms Incorta connectivity)
- [ ] Executive Summary page loads with live IQ8/IQ9 microinverter counts
- [ ] Global Type filter (IQ8 / IQ9) narrows all dashboard pages
- [ ] Microinverter Intelligence page shows IQ8 ~97%, IQ9 ~3%
- [ ] Management Report page exports correct CSV
- [ ] Action Queue shows microinverterType column
- [ ] Site Detail page shows Type badge
- [ ] Unauthenticated browser is redirected to SSO (Azure AD)
- [ ] HTTPS enforced — HTTP redirects to HTTPS
- [ ] No `INCORTA_PAT` visible in browser network tab, page source, or JS bundles
