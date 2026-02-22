# Architecture

## System Overview

```
┌──────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  AWS Database │────▶│  GitHub Actions   │────▶│  GitHub Pages   │
│  (source of   │     │  (data pipeline)  │     │  (static site)  │
│   truth)      │     │                   │     │                 │
└──────────────┘     └──────────────────┘     └─────────────────┘
                            │
                            ▼
                     site/data/*.json
                     (data contract)
```

## Layers

### 1. Data Source (AWS)
- Read-only access to the Atlas Conquest game database.
- Contains match results, deck lists, card definitions, player data.
- We never write to this database.

### 2. Data Pipeline (`scripts/`)
- Python scripts that query AWS and transform raw data into aggregated JSON.
- Runs in GitHub Actions on a schedule (daily) or manual trigger.
- Output: static JSON files committed to `site/data/`.

### 3. Data Contract (`site/data/`)
- Static JSON files are the interface between the pipeline and the frontend.
- Each file has a defined schema documented in [DATA_MODEL.md](DATA_MODEL.md).
- The site reads only from these files — no runtime API calls.

### 4. Frontend (`site/`)
- Vanilla HTML/CSS/JS. No build step, no framework.
- Reads JSON data files and renders interactive dashboards.
- Hosted on GitHub Pages.

## Data Update Flow

1. GitHub Actions triggers (cron daily at 06:00 UTC, or manual `workflow_dispatch`).
2. Pipeline script connects to AWS using secrets stored in GitHub.
3. Queries are run, data is aggregated and transformed.
4. JSON files are written to `site/data/`.
5. Changes are committed and pushed, triggering a GitHub Pages deploy.

## Boundaries

- **Pipeline ↔ Frontend**: Communicate only through `site/data/*.json`. No shared runtime state.
- **AWS ↔ Pipeline**: Read-only. Credentials stored in GitHub Secrets, never in code.
- **Frontend ↔ User**: Static files only. No server-side rendering, no auth required.
