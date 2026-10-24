# Twenty reference — what Stackwise CRM borrows

We **do not** run [Twenty](https://github.com/twentyhq/twenty) as a service. This doc records the **subset** of their model we implement in Neon + `/admin/crm`.

Upstream license: check `LICENSE` in the Twenty repo before copying any code into `vendor/twenty/`.

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
- `platform` + future `leadSource` → tags / custom fields

## What we intentionally skip from Twenty

- Email/calendar sync, workflows builder, AI agents inside Twenty
- Multi-tenant workspace UI, permissions matrix
- Their React front-end bundle
- Redis / BullMQ job system

## When to revisit upstream

When adding a CRM feature, search Twenty docs/issues for the **data shape** only, then implement in `src/lib/crm/`.
