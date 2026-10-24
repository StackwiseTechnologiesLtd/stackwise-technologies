# Twenty reference — data model for Stackwise CRM

We **do not** run [Twenty](https://github.com/twentyhq/twenty) as a service. This doc records the **data** subset we implement in Neon + `/admin/crm`.

**UI, features, and copying policy:** [TWENTY_UI_AND_FEATURES.md](./TWENTY_UI_AND_FEATURES.md)

Upstream license: **[AGPL-3.0](https://github.com/twentyhq/twenty/blob/main/LICENSE)** — check the commit when copying code into `vendor/twenty/`.

## Objects we mirror

| Twenty concept  | Stackwise table     | Notes                                                             |
| --------------- | ------------------- | ----------------------------------------------------------------- |
| Person          | `crm_people`        | Name, email, LinkedIn/X profile URL; `growth_lead_id` optional FK |
| Company         | `crm_companies`     | Name, domain, from lead `companyName`                             |
| Opportunity     | `crm_opportunities` | Stage, amount (optional), `growth_lead_id`, `source_post_url`     |
| Activity / Note | `crm_activities`    | Type: `note`, `stage_change`, `system`; body text                 |

## Pipeline stages

Align `crm_opportunities.stage` with existing `growth_leads.pipeline_status` where possible:

| growth `pipeline_status` | CRM opportunity stage |
| ------------------------ | --------------------- |
| `new`                    | New                   |
| `reviewed`               | Qualified             |
| `outreach`               | Outreach              |
| `replied`                | Engaged               |
| `booked`                 | Meeting booked        |
| `won`                    | Won                   |
| `lost`                   | Lost                  |
| `not_a_fit`              | Disqualified          |

## Fields to copy from a lead on promote

- `fullName` → person name
- `profileUrl` / signal `authorProfileUrl` → person links
- `companyName` → company
- `compositeScore` → opportunity metadata (not Twenty “amount”)
- `sourceUrl` → opportunity `source_post_url`
- `platform` + `leadSource` → tags / badges on record UI

## Backend we skip from Twenty

- `twenty-server`, GraphQL API, Redis, BullMQ workers
- Multi-tenant workspace provisioning
- Email/calendar sync engines (Tier C in UI doc)

## Frontend we reimplement (not skip)

We **do** build Twenty-like **screens** in Stackwise admin — pipeline board, record pages, timeline — using our stack. See feature tiers in [TWENTY_UI_AND_FEATURES.md](./TWENTY_UI_AND_FEATURES.md).

## When to revisit upstream

- **Schema / fields:** search Twenty docs and `packages/twenty-server` metadata.
- **Layout / interaction:** search `packages/twenty-front` and follow the UI copy workflow in the UI doc.
