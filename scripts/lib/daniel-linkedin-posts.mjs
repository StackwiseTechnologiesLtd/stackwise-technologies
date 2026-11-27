/**
 * Personal LinkedIn scripts for Daniel "Teddy" Tshikomba.
 * Voice rules: docs/engineering/DANIEL_LINKEDIN_CONTENT_BRIEF.md
 */

/** @type {Array<{ slug: string; audience: string; angle: string; script: string; notes: string }>} */
export const danielLinkedInPosts = [
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
    slug: "CMND — dangerous tools + handover",
    audience: "Primary: AI hiring / recruiters",
    angle: "1 — blast radius",
    script: `On CMND, not every tool belongs in the same trust tier.

Built-in sendCMNDEmail is marked dangerous: true. The agent can propose it; the product still expects confirmation in the chat loop—tool.confirmed false means no execution, model rethinks.

Same registry includes handoverToHumanOperator—automation ends, a person takes over.

Early Gmail Activepieces work was the same lesson at the connector layer: send, list, search, multi-recipient MIME—outbound mail isn’t “another function call.”

I also added Trello actions so workflows could read state before writing.

Pattern: classify tools by blast radius, validate args in getFunctionToRun, don’t execute side effects on the first JSON blob.

Phi taught me the UI version—don’t collapse “recording” and “mirrored” into one badge. CMND taught me the API version.

If you’re hiring for agents with email or chat side effects, ask how candidates split propose from commit—that’s code I’ve shipped.`,
    notes: "built-in/index.ts dangerous + handover.",
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
];