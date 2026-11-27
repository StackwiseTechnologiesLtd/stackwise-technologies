/**
 * Personal LinkedIn scripts for Daniel "Teddy" Tshikomba.
 * Voice rules: docs/engineering/DANIEL_LINKEDIN_CONTENT_BRIEF.md
 */

/** @type {Array<{ slug: string; audience: string; angle: string; script: string; notes: string }>} */
export const danielLinkedInPosts = [
  {
    slug: "CMND — dangerous tools + handover",
    audience: "Primary: AI hiring / recruiters",
    angle: "1 — blast radius (kickoff)",
    script: `On CMND, not every tool belongs in the same trust tier.

Built-in sendCMNDEmail is marked dangerous: true. The agent can propose it; the product still expects confirmation in the chat loop—tool.confirmed false means no execution, the model rethinks.

Same registry includes handoverToHumanOperator—automation ends, a person takes over.

Early Gmail Activepieces work was the same lesson at the connector layer: send, list, search, multi-recipient MIME—outbound mail isn’t “another function call.”

Pattern: classify tools by blast radius, validate args in getFunctionToRun, don’t execute side effects on the first JSON blob.

Phi taught me the UI version—don’t collapse “recording” and “mirrored” into one badge. CMND taught me the API version.

If you’re hiring for agents with email or chat side effects, ask how candidates split propose from commit—that’s code I’ve shipped.`,
    notes: "Good first republish after Phi. built-in/index.ts dangerous + handover.",
  },
  {
    slug: "CMND — getFunctionToRun validation",
    audience: "Primary: AI hiring / recruiters",
    angle: "4 — agentic pattern (validation routing)",
    script: `The first time a CMND agent “called Gmail,” the model returned JSON that looked fine and still couldn’t send.

In getFunctionToRun we don’t run on the first blob. We resolve the tool by name, then branch on functionType: backend tools go through Yup validation with conversation + prior call history; UI tools go through JSON-schema validation.

If validation fails, the failure goes back into the context as a user-visible correction—not a generic 500—so the model can retry with structured feedback.

That’s orchestration at the boring layer: routing, retries via context, separate paths for “show a chart” vs “hit an API.”

I wired Gmail into that loop and iterated on Activepieces send/list/search until multi-recipient and MIME edge cases behaved.

If you’re evaluating agent engineers, ask how they validate tool args before side effects—not which model they default to.`,
    notes:
      "cmnd-ai-api: src/utils/chat/getFunctionToRun.ts. Confirm before publish.",
  },
  {
    slug: "CMND — WhatsApp webhook verify",
    audience: "Primary: AI hiring / recruiters",
    angle: "1 — design decision (trust boundary)",
    script: `Shipping the CMND WhatsApp piece, the easy part was sendMessage to Graph API.

The part that breaks production is inbound: Meta posts webhooks you must verify before any trigger runs agent logic.

We used verifyMetaWebhookSignature — HMAC sha256 on the raw body, timingSafeEqual on the header—before treating a payload as a new message or status update.

Constraint: agents want instant replies; security wants “prove this is Meta first.”

If you skip that step, your WhatsApp bot is an open endpoint with a brand attached.

Outbound stays explicit actions (text, media, template, interactive); orchestration stays in CMND; trust stays at the webhook boundary.

I’ve shipped both sides in cmnd-ai-api, same repo as Gmail tool confirmation.

If your stack has customer-facing agents on messaging channels, I’d compare where you verify vs where you generate.`,
    notes: "Piece: community/whatsapp. Optional: link GitHub PR/commit.",
  },
  {
    slug: "CMND — propose vs commit (tool.confirmed)",
    audience: "Primary: AI hiring / recruiters",
    angle: "4 — plan vs commit",
    script: `When I wired Gmail send into CMND’s chat loop, the bug wasn’t OAuth—it was treating a model-chosen function call as ready to run.

The API already had a branch: function call without tool.confirmed doesn’t execute; the user or UI must confirm, or the model gets pushed to reconsider tools and context.

Separately, getFunctionToRun validates backend tools with Yup plus message/call history, and UI tools with JSON schema—failed parse goes back as correction, not a silent 500.

Tradeoff: more round-trips. Cheaper than an email blast from a hallucinated to field.

That’s the same discipline I use on outbound channels today: plan in the LLM, commit only after validation and confirmation.

Happy to compare notes if your agent stack still auto-runs tools on the first JSON blob.`,
    notes: "src/utils/chat/index.ts — confirmed gate.",
  },
  {
    slug: "CMND — built-in UI vs backend tools",
    audience: "Primary: hiring; secondary: operators",
    angle: "4 — UI vs backend FunctionType",
    script: `Early on CMND I added built-in agent tools that aren’t APIs—they’re UI: show forms from JSON Schema, maps, charts, tables (FunctionType.UI vs backend memory/search/email in built-in).

Constraint: the model had to both call a tool and render something a human could confirm before the next backend step.

UI tools use different validation than backend tools; some backend tools are marked dangerous because they actually send email.

Healthcare-demo and hackathon flows needed the agent to show structured data, not narrate it.

INSIGHTER at Construct AI ran on CMND; WhatsApp bots in prod need the same split: surface in UI, act only on confirmed backend tools.

I ship that layer—TypeScript, Activepieces pieces, chat wiring—not slides about “8 agent steps.”`,
    notes: "Healthcare demo era commits (Daniel Teddy, 2024).",
  },
  {
    slug: "CMND — workspaces and tenancy",
    audience: "Primary: AI hiring / recruiters",
    angle: "1 — org/workspace scoping",
    script: `CMND orgs grew faster than “every user sees every integration.”

I worked on workspace APIs in cmnd-ai-api: fetch by user and org, access lists, refresh logic—routes under organizations/.../workspaces and workspace-scoped access.

Downstream, triggers gained optional workspaceId so automation isn’t only org-wide.

Constraint: an agent graph doesn’t care about tenancy; the API must, or one team’s connector leaks into another’s.

That’s orchestration plumbing: where tool catalogs are filtered, where webhooks resolve context, where refresh tokens attach to the right workspace record.

I’m a full-stack engineer on that stack—Gmail/WhatsApp connectors plus workspace boundaries—not an LLM wrapper résumé line.

If your platform multi-tenants agent tools, I’d compare how you scope connector credentials per workspace.`,
    notes: "where.is.one workspace commits 2024.",
  },
  {
    slug: "Phi — mirrored vs presenting (PR 268)",
    audience: "Primary: AI hiring / recruiters",
    angle: "2 — OSS; split capture state",
    script: `On a Google Meet in Phi split view, I could share a tab and still not know which pixels the room actually saw.

Chromium already splits capture: mic/camera vs present vs isBeingMirrored. Our tab UI didn’t.

PR #268 on phibrowser/phibrowser-mac (issue #259) wired those apart—isCapturingMedia for A/V only, isPresentingScreenShare and isBeingSharedRemotely on their own, yellow outline on the mirrored sidebar row and ScreenShareMirroredBorderOverlayView on the web content.

Split view was the catch: highlighting “recording” on the wrong pane is worse than no highlight.

Tests (TabCaptureBadgeSignalTests), Reduce Motion, fullscreen hide on HTML5 video.

If you hire people to ship agent UIs—or any UI where backend state is finer than one badge—I’d compare notes on how you expose it.`,
    notes: "Already posted a longer variant on LinkedIn — tighten or use as republish.",
  },
  {
    slug: "Phi ↔ CMND — one boolean lying",
    audience: "Primary: AI hiring / recruiters",
    angle: "4 — cross-project pattern",
    script: `In Phi I split isBeingMirrored from “recording.” In CMND I split backend tool validation from UI tools and mark outbound email dangerous.

Different domains; same bug class—one boolean that lies to the operator.

Meet users need to know which tab is mirrored, not which tab feels “on.” CMND operators need to know whether a tool already committed, not whether the model sounded confident.

When I review agent or browser UI, I look for collapsed state that makes recovery harder than the happy path.

Open source let me fix Phi without a vendor queue. Founding-team CMND let me fix confirmations before customer-visible sends.

If your team ships agents plus client-facing UI, I’m useful on that seam—not only on prompts.`,
    notes: "Short bridge post; pin candidate.",
  },
  {
    slug: "Construct AI — INSIGHTER mentoring",
    audience: "Primary: AI hiring / recruiters",
    angle: "6 — hackathon coaching",
    script: `At the Construct AI Hackathon in İskele I mentored the team that won grand prize with INSIGHTER on CMND—property-market analysis under live demo time, not a slide-deck agent.

Noor Ul Zain, Talal Shafei, and Joseph Adepoju had CMND plus ambition; they didn’t have unlimited graph complexity.

The line I held: one user-visible bottleneck per demo path—enough backend tools to show insight, not every integration on the canvas.

They built; I cut scope so failures were recoverable on stage—same mindset as tool.confirmed and dangerous sends in production CMND.

If you hire for agent systems plus coaching juniors under pressure, that weekend is as relevant as my Phi PR.

Confirm hackathon year in notes before publish.`,
    notes: "FACT CHECK: year (2024 vs 2025). Add scope ‘no’ if you remember one.",
  },
  {
    slug: "Looial — Nairobi counter, no app",
    audience: "Secondary: African SMB; hiring (founder)",
    angle: "8 — M-Pesa-era checkout",
    script: `I’m in Nairobi until mid-December shipping Looial—loyalty through WhatsApp and Apple/Google Wallet, no customer app, no extra hardware.

Background: CMND and WhatsApp in production, wallet flows, full-stack alone from Düsseldorf—now watching real counters.

The constraint isn’t points logic. It’s whether signup finishes before the next person leans in, on connections and patience that don’t forgive an App Store detour.

Pilots are live with merchants here. I care less about “AI loyalty” headlines than whether staff can recognize someone in one motion on a busy afternoon.

If you run checkout-heavy SMBs in East Africa and you’ve killed an app-only programme, tell me what broke at the counter—I’ll say honestly if chat plus pass fits.`,
    notes: "Update ‘until mid-December’ when travel changes.",
  },
  {
    slug: "Solo Looial vs founding CMND",
    audience: "Primary: AI hiring / recruiters",
    angle: "7 — solo vs team",
    script: `On CMND I worked inside a founding team: chat loop, tool.confirmed, Gmail and dozens of Activepieces connectors—including WhatsApp—so agents could plan in the model and commit only after validation.

On Looial I ship alone: loyalty in WhatsApp and wallet passes, no customer app, pilots in Nairobi.

Same muscle, different constraint.

CMND punishes you when tools run too early; a coffee shop punishes you when signup takes longer than the person behind your customer.

Teams force clear interfaces. Solo forces one person to own product, counter, and webhook bugs.

I’m looking for roles where production agent orchestration matters; I’m building Looial where checkout speed matters.`,
    notes: "",
  },
  {
    slug: "CMND — partial failure retries (concept)",
    audience: "Primary: AI hiring / recruiters",
    angle: "1 — checkpoint mindset",
    script: `A multi-step CMND run used to fail as one big red block.

The constraint: early tool calls weren’t always safe to repeat. A flaky step in the middle meant restarting from the top—or guessing what had already hit the outside world.

What I push for: checkpoint after each successful tool response, retry only the failing node, show that state in the run view—not a generic error string.

Human approval stays ahead of side-effecting tools—messages, writes, anything a merchant would notice.

Tradeoff: more persisted state and a busier timeline. Worth it because production orchestration is graded on recovery, not demo happy paths.

If you’re shipping agentic workflows with real side effects, I’m interested in how you draw retry boundaries and approval gates.`,
    notes: "Align wording with what shipped on main today—soft conceptual post.",
  },
  {
    slug: "CMND — Gmail multi-recipient MIME",
    audience: "Primary: AI hiring / recruiters",
    angle: "2 — integration bug",
    script: `CMND’s Gmail send action looked done until someone tried the boring case: multiple recipients and an attachment in one agent turn.

The model produced valid-looking args. MailComposer still built a MIME draft that failed silently or addressed the wrong thread when cc/bcc and base64 attachments overlapped.

I fixed send/list/search in the Activepieces Gmail piece and threaded it through the same chat loop as tool.confirmed—not a one-off script.

Constraint: agents don’t fail on happy path demos; they fail on the second cc with a PDF.

That’s why I care about connector code in cmnd-ai-api as much as prompts—tool calling is product surface.

If you evaluate agent platforms, ask who owns email MIME edge cases, not who picked the embedding model.`,
    notes: "Commits: bb52addd, 11f55fc0, 5887a4d0 (Daniel Teddy).",
  },
  {
    slug: "Looial — cashier problem (verify vs first use)",
    audience: "Secondary: SMB; hiring",
    angle: "5 — verification vs production",
    script: `Between “it works in verification” and the first busy hour at a counter, most loyalty products die.

I’m building Looial for that gap: WhatsApp they already open, wallet pass staff can scan, no install sermon at checkout.

Verification rewards clean demos—one phone, quiet shop, patient tester.

Production rewards one motion while three people wait, when mobile data hiccups, when the cashier is new.

Engineering choices I care about: signup in the chat they already use, staff UI that doesn’t need a manual, webhooks that don’t block the line on retries.

I’m in Nairobi with pilots until mid-December watching that transition, not chasing feature parity with app-first programmes.

If you’ve launched loyalty or payments where the first real Saturday mattered, I’d hear what broke—we might be solving the same gap.`,
    notes: "Angle 5. No invented merchant metrics.",
  },
  {
    slug: "CMND — connectors are the agent API",
    audience: "Primary: AI hiring / recruiters",
    angle: "4 — Activepieces as tool surface",
    script: `Models are interchangeable. What sticks in production is which tools your graph can call without lying about state.

On CMND I spent a lot of cmnd-ai-api in Activepieces community pieces—WhatsApp inbound/outbound, Gmail depth, Trello reads, later calendar and docs connectors—the same registry the runtime exposes to agents.

Adding a piece isn’t marketing. It’s schema, auth, error shapes, and tests so getFunctionToRun can validate args before a customer sees a send.

When community/index grew huge, refactoring imports was tedious—but the alternative is agents that reference tools that don’t load in some tenants.

I ship on that layer: orchestration assumes connectors exist; I made more of them exist, including WhatsApp webhooks with verified signatures.

If your hiring bar is “prompt engineer,” we’ll talk past each other. If it’s “tooling in production,” that’s my CMND footprint.`,
    notes: "WhatsApp 8690b76b; community index refactor f9097c12.",
  },
  {
    slug: "CMND — YouTube trigger dedupe",
    audience: "Primary: AI hiring / recruiters",
    angle: "4 — polling + state",
    script: `YouTube agents fail in boring ways: the “new video” trigger fires twice for one upload, and your graph spam comments or Slack posts.

I extended the YouTube piece in cmnd-ai-api—actions for search, playlists, captions, upload—and refactored the new-video trigger around robust deduplication (polling + store keys, not hope).

Constraint: RSS and feed shapes shift; agents don’t care—they only see “run again.”

Orchestration needs idempotent triggers the same way it needs confirmed sends: if the scheduler can’t remember what it already emitted, humans lose trust in automation.

That’s the work I like: connector-level state, not prettier prompts.

If you run agent workflows on social or content webhooks, ask how triggers dedupe—not how often you poll.`,
    notes: "73bc1ebe new-video dedupe.",
  },
  {
    slug: "CMND — Calendly as agent tools",
    audience: "Primary: AI hiring / recruiters",
    angle: "4 — scheduling actions",
    script: `An agent that “schedules a meeting” without tools is just a polite hallucination.

I added Calendly actions and triggers to CMND’s Activepieces layer—event types, invitees, scheduling links, availability—so graphs can book from real APIs, not invented calendar URLs.

Constraint: Calendly tokens are scope-sensitive; a demo token can read but not book.

So each action documents what it needs, and failures surface as tool errors the model can replan—not silent success text.

Agents that touch customers need scheduling with the same discipline as email: validate args, confirm when it’s outbound, dedupe triggers when it’s inbound.

I ship those connectors in TypeScript on the same registry WhatsApp and Gmail use.

If your use case is revenue agents or support agents that actually book time, that’s production tool work.`,
    notes: "aa353c30 Calendly piece.",
  },
  {
    slug: "CMND — Google Calendar polling",
    audience: "Primary: AI hiring / recruiters",
    angle: "4 — triggers",
    script: `Google Calendar triggers are deceptively hard: “event created” isn’t one webhook shape for every tenant.

On CMND I worked on Calendar actions and triggers—create, get, cancel, search-style flows—with polling where push subscriptions aren’t reliable.

Constraint: agent graphs want instant reaction; Google gives quotas, sync tokens, and partial failures.

So the connector owns backoff and dedupe, not the LLM.

That split is the orchestration story: models propose; infrastructure remembers what already fired.

Calendly plus Calendar pieces mean CMND agents can reason about time in tools, not in prose.

If you’re hiring for agent backends, calendar integrations are a good interview—errors are messy, users notice immediately.`,
    notes: "70ccf685 Calendar; ddf596ae polling refactor.",
  },
  {
    slug: "CMND — Notion page ID resolution",
    audience: "Primary: AI hiring / recruiters",
    angle: "2 — integration gotcha",
    script: `Notion agents break when the model cites a pretty page title but the API wants an ID.

I worked on Notion integration updates in cmnd-ai-api—resolving page IDs, clearer errors on comments and updates—so tool calls fail with something the graph can correct, not a generic 404.

Constraint: users speak in titles; Notion speaks in UUIDs.

Same class as getFunctionToRun pushing validation errors back into context: the fix isn’t “smarter prompt,” it’s resolver logic at the connector.

Knowledge agents need read paths that survive messy inputs—search then act—not one-shot JSON from the model.

I extend CMND’s Activepieces Notion piece with that mindset: agents are only as good as the tools they’re allowed to call correctly.

If your stack connects Notion to agents, compare how you resolve entities before execute.`,
    notes: "d3610ffd Notion page ID.",
  },
  {
    slug: "CMND — Google Docs and Sheets tools",
    audience: "Primary: AI hiring / recruiters",
    angle: "4 — document automation",
    script: `“Update the doc” sounds like one step. In practice it’s insert text, batchUpdate ranges, Sheets row appends, and auth that expires mid-run.

I shipped Google Docs and Sheets integrations in cmnd-ai-api so CMND agents manipulate documents through Activepieces actions—not copy-paste from chat.

Constraint: a partial batchUpdate leaves the document in a worse state than before the agent touched it.

Tools need explicit args, idempotent patterns where possible, and errors that map to user-meaningful chunks.

That’s agent orchestration for office workflows: connectors expose small verbs; graphs compose them; humans confirm when the verb is destructive.

Founding-team pace meant I owned boring API glue while others owned model routing—and customers still see “the agent edited my sheet.”

If you hire for enterprise agents, ask who wrote the Docs/Sheets tools, not who tuned temperature.`,
    notes: "Google docs/sheets commits May–Jun 2024 where.is.one.",
  },
  {
    slug: "CMND — Discord bot actions",
    audience: "Primary: AI hiring / recruiters",
    angle: "4 — community ops agents",
    script: `Community agents need Discord tools that match how moderators think: roles, channels, bans, sends—not one generic “HTTP request.”

I added Discord actions and a new-member trigger to CMND’s Activepieces Discord piece—create channel, guild roles, ban/remove ban, send with bot—alongside triggers that can start graphs on real server events.

Constraint: Discord rate limits and permission errors are user-visible instantly.

So each action maps to Graph API shapes with clear props; failures belong in tool results the orchestrator can branch on.

Messaging agents often start with Slack or WhatsApp; ops teams still live in Discord for communities and support labs.

Same CMND registry, same validation path as email—another channel where tool calling is the product.

If you’re building agents that moderate or notify in Discord, I’ve extended production connectors there.`,
    notes: "ff67ca27 Discord piece.",
  },
  {
    slug: "CMND — Trello read before write",
    audience: "Primary: AI hiring / recruiters",
    angle: "2 — design decision",
    script: `The first Trello tools I added to CMND were create-heavy—cards, lists, comments.

Then agent demos kept duplicating cards because the model never listed boards first.

I added list-boards and list-cards actions so graphs could read state before write—a small API surface change, a large reduction in messy boards.

Constraint: agents default to action verbs; product needs guardrail verbs.

That’s orchestration design: expose safe reads, mark writes as higher risk, let getFunctionToRun and confirmations sit in front of the dangerous ones.

Same pattern later on Gmail and WhatsApp—know what’s already true before you send.

If you evaluate agent engineers, ask whether they’ve shipped read tools, not only “create” wrappers.`,
    notes: "ee3bb170 Trello WIP; Daniel Teddy 2024.",
  },
  {
    slug: "CMND — conversation memory tools",
    audience: "Primary: AI hiring / recruiters",
    angle: "4 — state in agents",
    script: `Stateless agents forget; stateful agents without schema leak keys across turns.

CMND built-ins include memory tools—set, get, remove item—with Yup schemas and backend FunctionType so the model can persist conversation-scoped facts without ad-hoc prompt stuffing.

Constraint: memory keys must parse consistently (we normalized MySQL JSON paths) or retries write garbage.

Orchestration connects memory to chatbot conversations: tools receive conversationId injection, not trust from the LLM.

That’s the difference between “agent with RAG” and “agent with controlled recall across tool calls.”

I worked on that built-in registry alongside UI tools—maps, charts, tables—so agents both remember and show.

If your hiring loop tests memory design, I can walk through what we shipped in built-in/index—not theory.`,
    notes: "built-in memory tools; parseMySqlJsonKey.",
  },
  {
    slug: "CMND — WhatsApp as chatbot type",
    audience: "Primary: AI hiring / recruiters",
    angle: "4 — product wiring",
    script: `A WhatsApp connector in git isn’t the same as WhatsApp as a first-class CMND chatbot.

I updated chatbot type constants and conversation title logic so WhatsApp sits beside other agent surfaces—not a bolt-on demo.

Constraint: inbound messages need verified webhooks; outbound needs phone-number auth; the UX needs to know which channel shaped the thread.

Product + API had to agree, or support chases ghosts in logs.

That’s why I care about both the WhatsApp piece (send, template, interactive, triggers) and the types that route conversations in the monolith.

Messaging agents are full-stack: Meta signatures, Graph errors, and how the admin UI labels the thread.

If you hire for omnichannel agents, ask who connected channel types end-to-end—not only who wrote the sendMessage action.`,
    notes: "8adc1a33 chatbot types.",
  },
  {
    slug: "Activepieces — extend, don’t fork",
    audience: "Primary: AI hiring / recruiters",
    angle: "4 — OSS + platform",
    script: `I contribute to open-source Activepieces and ship extensions inside CMND’s cmnd-ai-api fork of the community catalog.

The pattern: keep pieces compatible with Activepieces’ action/trigger model, load them in CMND’s tool registry, let getFunctionToRun validate what agents call.

Constraint: upstream pieces drift; CMND tenants expect Gmail, WhatsApp, Calendar, Notion to keep working after dependency bumps.

So work is import hygiene, auth docs in piece markdown, and error handling that survives agent retries—not rebrand someone else’s connector as “AI magic.”

When community/index grew, reorganizing imports was unglamorous—and necessary—or pieces fail to register at boot.

Phi taught me to fix browser state in public. Activepieces taught me to keep connector contracts boring and versioned.

If your stack is agents on top of workflow tools, I’m a fit on the integration seam.`,
    notes: "Brief: OSS Activepieces + in-repo community/. f9097c12 index refactor.",
  },
  {
    slug: "Activepieces — Phi parallel (OSS shipping)",
    audience: "Primary: AI hiring / recruiters",
    angle: "7 — solo OSS habit",
    script: `Two repos, same habit: ship the unglamorous fix where the operator loses trust.

Phi: split mirrored vs presenting so Meet users aren’t lied to by one “recording” flag.

CMND Activepieces layer: split propose vs confirm on dangerous tools; verify Meta webhooks before triggers; dedupe YouTube polling fires.

Constraint: nobody shares screenshots of import refactors or HMAC checks—they share demos that only work on Wi‑Fi.

I still do the refactors because hiring managers who’ve operated agents ask what happens on the second run or the duplicate webhook—not what model you picked.

Open source Phi means I don’t wait for a vendor. CMND community pieces mean customers get connectors that stay registered after we ship.

I’m a full-stack engineer who defaults to that work.

If you want references for OSS velocity plus production tenancy, Phi PR 268 and WhatsApp in cmnd-ai-api are concrete starting points.`,
    notes: "Bridge / pin alternate.",
  },
];