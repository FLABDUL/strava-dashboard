# Project status and revival notes

## Status

**Parked on 31 August 2026.**

The repository remains public as a portfolio case study and learning resource. The synthetic demo is the supported experience. No further live Strava feature development is currently planned.

## Why it was parked

The original goal was to explore a personal activity dashboard using Strava OAuth and activity data. Continuing that integration became unattractive because:

- Standard Tier developer access requires an active Strava subscription;
- a free account export must be requested and downloaded manually;
- the project does not yet import that export;
- maintaining a personal OAuth integration adds provider-policy and token-lifecycle work; and
- the public portfolio experience can demonstrate the engineering without exposing personal data or consuming AI credit.

The decision is economic and operational, not a claim that the current demo is broken.

## What is intentionally preserved

- interactive synthetic training data;
- filtering and reusable aggregations;
- weekly and monthly summaries;
- chart and route visualisation;
- cached structured AI output;
- Strava OAuth and refresh-token example code;
- live activity and OpenAI endpoints; and
- privacy-minimised AI input construction.

## What is not implemented

- import of a Strava account export or `activities.csv`;
- automatic processing of requested export archives;
- complete paginated activity retrieval;
- multi-user accounts or authentication;
- durable database-backed tokens;
- production-grade rate limiting;
- background synchronisation or webhooks;
- backend automated tests; and
- deployment of the personal live backend as a supported service.

## Known technical debt

| Area | Current state | Revival implication |
| --- | --- | --- |
| Activity retrieval | One unpaginated API request | Add pagination and define a history window |
| Token storage | Plain local JSON file | Replace for any multi-user or hosted use |
| OAuth protection | No explicit state/CSRF value | Add before treating the flow as production-ready |
| AI limiting | In-memory map keyed by IP | Replace with durable shared limiting if hosted |
| Tests | Frontend fixture tests only | Add backend and transformation coverage |
| PostgreSQL | Unused module and dependency | Remove or implement deliberately |
| Root package | Historical dependencies, no scripts | Consolidate only if active development resumes |
| Provider endpoints | Based on the 2026 API | Recheck announced 2027 migration requirements |
| Model setting | Environment-configurable default | Confirm current OpenAI model support before use |

## Provider snapshot

At the archival date:

- Strava required a subscription for Standard Tier developer access.
- New applications began in a single-player developer mode.
- API calls remained subject to short-window and daily limits.
- Strava had announced authentication and API base-URL changes for June 2027.

These statements explain the decision made in 2026; they are not a permanent description of Strava's offering. Always consult the current [Strava developer documentation](https://developers.strava.com/docs/) and [changelog](https://developers.strava.com/docs/changelog/) before revival.

## Revival paths

### Path A: keep the static portfolio demo

This is the lowest-maintenance option. Update dependencies and synthetic examples only when required for security or hosting compatibility.

### Path B: local account-export importer

Implement a browser-local or local-server importer for Strava's exported activity CSV. This avoids routine API access but still requires the user to request and download an export manually. Before implementation, document the accepted export version, columns, units, privacy boundary and deletion behaviour.

### Path C: revive Strava OAuth

Use this only if the subscription and maintenance cost are worthwhile. Review current API terms, migrate endpoints, add pagination, add OAuth state validation, decide on secure token storage and add backend tests before presenting it as supported.

## Reactivation checklist

1. Read current Strava API terms, authentication documentation and changelog.
2. Confirm the owning account and application are active and eligible.
3. Review the API base URL and token-exchange requirements.
4. Update dependencies and review security advisories.
5. Decide whether to remove or adopt the unused PostgreSQL scaffolding.
6. Add backend unit tests for token refresh and training-data minimisation.
7. Add activity pagination or explicitly define the supported history window.
8. Add OAuth state validation.
9. Verify that no personal fixture, token or route data is committed.
10. Run all frontend checks and end-to-end browser tests.
11. Test live Strava and OpenAI integrations with newly issued credentials.
12. Update the status date and provider snapshot in this document.

## Archival acceptance criteria

The parked project is considered healthy when:

- the public demo loads without a backend;
- all demo data is synthetic;
- cached AI replay makes no OpenAI request;
- route maps are clearly labelled synthetic;
- the frontend test, lint and build commands pass;
- secrets and token files remain ignored; and
- this status document accurately separates implemented behaviour from possible future work.
