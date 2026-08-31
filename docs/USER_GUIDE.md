# User guide

This guide explains the supported public demonstration and the optional local live integration.

## Public demo

Open [strava-dashboard-zeta.vercel.app](https://strava-dashboard-zeta.vercel.app). No account, API key or backend is required.

The demo is designed to answer a simple question: how can raw activity records become a useful view of training consistency and recent load?

### 1. Read the training totals

The three summary cards are recalculated whenever the activity filter changes:

- **Activities** counts the displayed sessions.
- **Distance** adds their recorded distance in kilometres.
- **Moving time** adds active time rather than elapsed time.

### 2. Filter by activity type

Use **Activity type** to select all activities, runs, rides or swims. The totals, chart, summary tables and recent-activity list use the same filtered collection.

The AI demonstration continues to describe the complete eight-activity sample. It is a fixed example of the live feature, not a newly generated analysis of the selected filter.

### 3. Inspect the AI training review

Select **Replay cached insight** to show a representative structured response containing:

- the overall trend and confidence;
- evidence-based highlights;
- risks or uncertainties; and
- conservative suggestions for the next seven days.

This action does not call OpenAI or consume API credit. The response is illustrative training guidance and is not medical advice.

### 4. Follow distance over time

The line chart plots the distance of each displayed activity in chronological order. It is useful for spotting large sessions and changes in volume; it does not calculate fitness, fatigue or training zones.

### 5. Compare weekly and monthly summaries

Both tables aggregate the selected activities by period and display:

- session count;
- total distance; and
- total moving time.

These are direct totals, not predictions or Strava-provided training metrics.

### 6. Open a route preview

Activities with route geometry show **Show synthetic map**. Opening one:

1. decodes the stored example polyline;
2. fits a Leaflet map to the decoded coordinates; and
3. downloads background tiles from OpenStreetMap.

The routes are synthetic and are not derived from the owner's home, workplace or personal activity history. Because map tiles come from an external provider, that provider receives the normal network information associated with serving a web request, such as the requesting IP address.

## What the demo does not do

The public route does not:

- connect to a Strava account;
- retrieve live or personal activities;
- call OpenAI;
- upload an account export;
- persist filters or analysis; or
- provide medical, diagnostic or prescriptive coaching.

## Live developer mode

The hidden `?live=1` route is retained for developers studying the original integration. It requires a locally running backend, a registered and eligible Strava API application and an active Strava subscription under the current Standard Tier rules.

When configured, live mode:

1. starts a Strava OAuth authorisation flow;
2. saves the returned access and refresh tokens to an ignored local JSON file;
3. retrieves the authenticated athlete's recent activities;
4. displays those activities using the same dashboard components; and
5. optionally submits a minimised metric-only dataset to OpenAI when the user requests an insight.

Live mode is local, single-user and educational. It is not documented as a hosted multi-user product. Follow [Development](DEVELOPMENT.md) before attempting to run it.

## Data and privacy summary

| Data | Public demo | Live developer mode |
| --- | --- | --- |
| Activity records | Synthetic JavaScript fixture | Returned by Strava |
| Routes | Synthetic encoded polylines | Returned in Strava activity data |
| OAuth tokens | None | Ignored local `backend/token.json` |
| AI input | None; cached response only | Sanitised dates, types and numerical metrics |
| Activity names sent to AI | No | No |
| Route geometry sent to AI | No | No |
| Map tiles | Requested when a map opens | Requested when a map opens |

## Troubleshooting as a visitor

- **The map is blank:** check that map-tile requests are not blocked by a browser extension or network policy.
- **The dashboard says live sync is unavailable:** remove `?live=1` from the URL to return to the public demo.
- **Replay cached insight does not change:** the demo deliberately replays the same fixed response.
- **The dates look historical:** the sample is a fixed portfolio fixture, not a live feed.
