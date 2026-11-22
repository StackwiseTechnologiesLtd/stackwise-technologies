"use client";

import { useToast } from "@/components/ToastProvider";
import { AdminActionButton } from "@/components/admin/AdminActionButton";
import { AdminConfirmDialog } from "@/components/admin/AdminConfirmDialog";
import { InstagramCampaignInsightsTable } from "@/components/admin/instagram/InstagramCampaignInsightsTable";
import { TablePagination } from "@/components/admin/TablePagination";
import type {
  InstagramAccount,
  InstagramCampaign,
  InstagramCampaignInsight,
  InstagramDelivery,
  InstagramMetaApp,
} from "@/lib/instagram/types";
import Link from "next/link";
import { useDeferredEffect } from "@/lib/use-deferred-effect";
import { useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";
import { instagramDeliveryStatuses } from "@/lib/instagram/types";
import { StackwiseSelect } from "@/components/stackwise";
import { ADMIN_INPUT } from "@/lib/ui/admin";

function formatWhen(iso: string | null): string {
  if (!iso) return "Never";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function formatDeliveryStatus(d: InstagramDelivery): string {
  if (d.metaMessageId === "dry_run" || d.skipReason === "dry_run") {
    return "dry run";
  }
  return d.status;
}

function formatDeliveryReason(d: InstagramDelivery): string {
  if (d.metaMessageId === "dry_run") {
    return "Not sent to Instagram (INSTAGRAM_DRY_RUN)";
  }
  return d.skipReason ?? d.errorDetail ?? "—";
}

const DELIVERY_PAGE_SIZE = 25;

export type InstagramPortalView =
  | "full"
  | "overview"
  | "campaigns"
  | "activity"
  | "connection"
  | "team"
  | "meta-only";

export function GrowthInstagramPanel({
  view = "full",
}: {
  view?: InstagramPortalView;
}) {
  const show = (section: InstagramPortalView) =>
    view === "full" || view === section;
  const searchParams = useSearchParams();
  const toast = useToast();
  const [apps, setApps] = useState<InstagramMetaApp[]>([]);
  const [accounts, setAccounts] = useState<InstagramAccount[]>([]);
  const [removedAccounts, setRemovedAccounts] = useState<InstagramAccount[]>([]);
  const [campaigns, setCampaigns] = useState<InstagramCampaign[]>([]);
  const [deliveries, setDeliveries] = useState<InstagramDelivery[]>([]);
  const [deliveryPage, setDeliveryPage] = useState(1);
  const [deliveryTotal, setDeliveryTotal] = useState(0);
  const [deliveryTotalPages, setDeliveryTotalPages] = useState(1);
  const [deliveriesLoading, setDeliveriesLoading] = useState(false);
  const [deliveryFilter, setDeliveryFilter] = useState<string>("");
  const [deliveryCampaignId, setDeliveryCampaignId] = useState<string>("");
  const [campaignInsights, setCampaignInsights] = useState<InstagramCampaignInsight[]>([]);
  const [oauthSetup, setOauthSetup] = useState<{
    redirectUri: string;
    scopes: string[];
    webhookHint: string;
    usesTunnel?: boolean;
    adminReturnOrigin?: string;
    publicOrigin?: string;
  } | null>(null);
  const [access, setAccess] = useState<{
    kind: "owner" | "operator";
    canManageMetaApps: boolean;
    canManageTeam: boolean;
  } | null>(null);
  const [confirmBusy, setConfirmBusy] = useState(false);
  const [pendingConfirm, setPendingConfirm] = useState<
    | { kind: "account"; accountId: string; label: string }
    | { kind: "campaign"; id: string; name: string }
    | null
  >(null);

  const [appForm, setAppForm] = useState({
    label: "",
    slug: "",
    metaAppId: "",
    appSecret: "",
    facebookAppSecret: "",
    webhookVerifyToken: "",
  });
  const [accountForm, setAccountForm] = useState({
    metaAppId: "",
    igUserId: "",
    username: "",
    accessToken: "",
    subscribeWebhooks: true,
  });
  const [campaignForm, setCampaignForm] = useState({
    accountId: "",
    name: "",
    triggerType: "comment" as "comment" | "dm" | "story_reply",
    mediaId: "",
    keyword: "",
    privateReplyTemplate: "Hey {username}! Thanks — here's the link: …",
    publicReplyTemplate: "",
    buttonLabel1: "",
    buttonUrl1: "",
    buttonLabel2: "",
    buttonUrl2: "",
  });

  const loadDeliveries = useCallback(async () => {
    setDeliveriesLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(deliveryPage),
        limit: String(DELIVERY_PAGE_SIZE),
      });
      if (deliveryFilter) params.set("status", deliveryFilter);
      if (deliveryCampaignId) params.set("campaignId", deliveryCampaignId);
      const res = await fetch(`/api/admin/instagram/deliveries?${params}`);
      if (!res.ok) throw new Error("Delivery log load failed");
      const data = (await res.json()) as {
        deliveries: InstagramDelivery[];
        total: number;
        totalPages: number;
      };
      setDeliveries(data.deliveries);
      setDeliveryTotal(data.total);
      setDeliveryTotalPages(data.totalPages);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delivery log load failed");
    } finally {
      setDeliveriesLoading(false);
    }
  }, [deliveryCampaignId, deliveryFilter, deliveryPage, toast]);

  const load = useCallback(async () => {
    try {
      const [appsRes, accRes, campRes, insightsRes, oauthCfg, accessRes] = await Promise.all([
        fetch("/api/admin/instagram/meta-apps"),
        fetch("/api/admin/instagram/accounts?removed=1"),
        fetch("/api/admin/instagram/campaigns"),
        fetch("/api/admin/instagram/campaigns/insights"),
        fetch("/api/admin/instagram/oauth/config"),
        fetch("/api/admin/instagram/access"),
      ]);
      if (appsRes.ok) {
        const data = (await appsRes.json()) as { apps: InstagramMetaApp[] };
        setApps(data.apps);
      }
      if (accRes.ok) {
        const data = (await accRes.json()) as {
          accounts: InstagramAccount[];
          removedAccounts?: InstagramAccount[];
        };
        setAccounts(data.accounts);
        setRemovedAccounts(data.removedAccounts ?? []);
      }
      if (campRes.ok) {
        const data = (await campRes.json()) as { campaigns: InstagramCampaign[] };
        setCampaigns(data.campaigns);
      }
      if (insightsRes.ok) {
        const data = (await insightsRes.json()) as { insights: InstagramCampaignInsight[] };
        setCampaignInsights(data.insights);
      }
      if (oauthCfg.ok) {
        const data = (await oauthCfg.json()) as {
          redirectUri: string;
          scopes: string[];
          webhookHint: string;
          usesTunnel?: boolean;
          adminReturnOrigin?: string;
          publicOrigin?: string;
        };
        setOauthSetup(data);
      }
      if (accessRes.ok) {
        const data = (await accessRes.json()) as {
          kind: "owner" | "operator";
          canManageMetaApps: boolean;
          canManageTeam: boolean;
        };
        setAccess(data);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Load failed");
    }
  }, [toast]);

  useDeferredEffect(() => {
    void load();
  }, [load]);

  useDeferredEffect(() => {
    if (!show("activity")) return;
    const statusParam = searchParams.get("status")?.trim() ?? "";
    if (
      statusParam &&
      instagramDeliveryStatuses.includes(
        statusParam as (typeof instagramDeliveryStatuses)[number],
      )
    ) {
      setDeliveryFilter(statusParam);
    }
    const campaignParam = searchParams.get("campaignId")?.trim() ?? "";
    if (campaignParam) setDeliveryCampaignId(campaignParam);
  }, [searchParams, view]);

  useDeferredEffect(() => {
    setDeliveryPage(1);
  }, [deliveryFilter]);

  useDeferredEffect(() => {
    if (show("activity")) void loadDeliveries();
  }, [loadDeliveries, view]);

  async function saveMetaApp() {
    try {
      const res = await fetch("/api/admin/instagram/meta-apps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(appForm),
      });
      if (!res.ok) throw new Error("Save failed");
      toast.success("Meta app saved");
      setAppForm({
        label: "",
        slug: "",
        metaAppId: "",
        appSecret: "",
        facebookAppSecret: "",
        webhookVerifyToken: "",
      });
      await load();
    } catch {
      toast.error("Could not save Meta app");
    }
  }

  async function saveAccount() {
    try {
      const res = await fetch("/api/admin/instagram/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(accountForm),
      });
      const data = (await res.json()) as {
        error?: string;
        webhookSubscribed?: boolean;
      };
      if (!res.ok) throw new Error(data.error ?? "Save failed");
      const subNote =
        accountForm.accessToken && data.webhookSubscribed === false
          ? " (token ok; webhook subscribe off — use Subscribe below or Meta console)"
          : accountForm.accessToken && data.webhookSubscribed
            ? " · webhooks subscribed"
            : "";
      toast.success(`Instagram account saved${subNote}`);
      setAccountForm((prev) => ({ ...prev, accessToken: "" }));
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save account");
    }
  }

  async function subscribeAccountWebhooks(accountId: string) {
    try {
      const res = await fetch(
        `/api/admin/instagram/accounts/${accountId}/subscribe-webhooks`,
        { method: "POST" },
      );
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) throw new Error(data.error ?? "Subscribe failed");
      toast.success("Webhook subscription updated for this account");
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Subscribe failed");
    }
  }

  async function saveCampaign() {
    try {
      const res = await fetch("/api/admin/instagram/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...campaignForm,
          publicReplyTemplate: campaignForm.publicReplyTemplate || null,
          buttonLabel1: campaignForm.buttonLabel1 || null,
          buttonUrl1: campaignForm.buttonUrl1 || null,
          buttonLabel2: campaignForm.buttonLabel2 || null,
          buttonUrl2: campaignForm.buttonUrl2 || null,
        }),
      });
      if (!res.ok) throw new Error("Save failed");
      toast.success("Campaign created");
      await load();
    } catch {
      toast.error("Could not create campaign");
    }
  }

  function requestRemoveAccount(accountId: string, label: string) {
    setPendingConfirm({ kind: "account", accountId, label });
  }

  async function runPendingConfirm() {
    if (!pendingConfirm) return;
    setConfirmBusy(true);
    try {
      if (pendingConfirm.kind === "account") {
        const res = await fetch(
          `/api/admin/instagram/accounts/${pendingConfirm.accountId}`,
          { method: "DELETE" },
        );
        if (!res.ok) throw new Error("Remove failed");
        toast.toast("Account disconnected. Historical data is kept.");
      } else {
        const res = await fetch(`/api/admin/instagram/campaigns/${pendingConfirm.id}`, {
          method: "DELETE",
        });
        if (!res.ok) throw new Error("Delete failed");
        toast.toast("Campaign deleted.");
      }
      setPendingConfirm(null);
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Action failed");
    } finally {
      setConfirmBusy(false);
    }
  }

  async function testAccountToken(accountId: string) {
    try {
      const res = await fetch(`/api/admin/instagram/accounts/${accountId}/test`, {
        method: "POST",
      });
      const data = (await res.json()) as { ok?: boolean; detail?: string };
      if (!res.ok || !data.ok) {
        throw new Error(data.detail ?? "Token check failed");
      }
      toast.success(data.detail ?? "Token looks valid");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Token check failed");
    }
  }

  async function toggleCampaign(id: string, active: boolean) {
    try {
      const res = await fetch(`/api/admin/instagram/campaigns/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active }),
      });
      if (!res.ok) throw new Error("Update failed");
      await load();
    } catch {
      toast.error("Could not update campaign");
    }
  }

  function requestDeleteCampaign(id: string, name: string) {
    setPendingConfirm({ kind: "campaign", id, name });
  }

  const canConfigureMeta = access?.canManageMetaApps !== false;

  const confirmCopy =
    pendingConfirm?.kind === "account"
      ? {
          title: `Disconnect ${pendingConfirm.label}?`,
          description:
            "This soft-removes the account: tokens are cleared and it disappears from the portal, but campaigns, delivery history, and inbox rows stay linked to the same id. Meta may still send webhooks until you disconnect there — we ignore them.",
          confirmLabel: "Disconnect account",
          destructive: true,
        }
      : pendingConfirm?.kind === "campaign"
        ? {
            title: `Delete “${pendingConfirm.name}”?`,
            description:
              "The automation is removed. Delivery log rows are kept; they may show without a campaign name.",
            confirmLabel: "Delete campaign",
            destructive: true,
          }
        : null;

  return (
    <div className="space-y-6">
      <AdminConfirmDialog
        open={pendingConfirm !== null}
        title={confirmCopy?.title ?? ""}
        description={confirmCopy?.description}
        confirmLabel={confirmCopy?.confirmLabel}
        destructive={confirmCopy?.destructive}
        busy={confirmBusy}
        onClose={() => {
          if (!confirmBusy) setPendingConfirm(null);
        }}
        onConfirm={() => void runPendingConfirm()}
      />
      {show("connection") && canConfigureMeta ? (
      <section className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] shadow-[var(--admin-panel-inset)] p-5 sm:p-6">
        <h3 className="text-base font-semibold tracking-tight">Meta apps</h3>
        <p className="mt-1 text-sm text-muted">
          Instagram Business Login + Graph API (OpenReply-class). Register OAuth redirect and
          webhooks in Meta → Instagram → API setup (see{" "}
          <code className="text-foreground">docs/INSTAGRAM_META_SETUP.md</code>). Webhook path:{" "}
          <code className="text-foreground">/api/webhooks/meta/[slug]</code>.
        </p>
        {oauthSetup && (
          <div className="mt-3 space-y-4 rounded-lg border border-[var(--admin-border)] bg-black/30 px-3 py-3 text-xs">
            <div>
              <p className="font-medium text-foreground">
                Set up Instagram business login → Redirect URL
              </p>
              <p className="mt-1 text-muted">
                Paste this in Meta (exact match; no trailing slash). This is not the webhook URL.
              </p>
              <div className="mt-2 flex flex-wrap items-start gap-2">
                <code className="min-w-0 flex-1 break-all rounded-md border border-[var(--admin-border)] bg-black/40 px-2 py-1.5 text-foreground">
                  {oauthSetup.redirectUri}
                </code>
                <AdminActionButton
                  onClick={() => {
                    void navigator.clipboard.writeText(oauthSetup.redirectUri);
                    toast.success("Redirect URL copied");
                  }}
                >
                  Copy
                </AdminActionButton>
              </div>
            </div>
            <div>
              <p className="font-medium text-amber-200/95">
                Configure webhooks → Callback URL
              </p>
              <p className="mt-1 text-muted">
                Use the per-app webhook URL under your slug below (not the Redirect URL).
              </p>
            </div>
            {oauthSetup.usesTunnel ? (
              <p className="text-amber-200/90">
                Tunnel mode: after Connect you return to{" "}
                <code className="text-foreground">{oauthSetup.adminReturnOrigin ?? "…"}</code> — only
                Meta needs the ngrok Redirect URL above.
              </p>
            ) : (
              <p className="text-muted">
                Live mode: register the Redirect URL and webhook host on{" "}
                <strong>{oauthSetup.publicOrigin}</strong> in Meta (not localhost).
              </p>
            )}
          </div>
        )}
        {apps.length > 0 && (
          <ul className="mt-3 space-y-2 text-sm">
            {apps.map((app) => (
              <li
                key={app.id}
                className="flex flex-col gap-2 rounded-lg border border-[var(--admin-border)] bg-black/30 px-3 py-2"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                <span>
                  <span className="font-medium">{app.label}</span>{" "}
                  <span className="text-muted">({app.slug})</span>
                </span>
                <a
                  className="rounded-lg border border-accent/40 px-2 py-1 text-xs font-medium text-accent hover:bg-accent/10"
                  href={`/api/admin/instagram/oauth/start?metaAppId=${encodeURIComponent(app.id)}`}
                >
                  Connect Instagram
                </a>
                </div>
                {oauthSetup?.publicOrigin ? (
                  <code className="block break-all text-[11px] text-muted">
                    Webhook URL: {oauthSetup.publicOrigin}/api/webhooks/meta/{app.slug}
                  </code>
                ) : null}
              </li>
            ))}
          </ul>
        )}
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="text-sm">
            Label
            <input
              className={`mt-1 ${ADMIN_INPUT}`}
              value={appForm.label}
              onChange={(e) => setAppForm((f) => ({ ...f, label: e.target.value }))}
            />
          </label>
          <label className="text-sm">
            Slug (optional)
            <input
              className={`mt-1 ${ADMIN_INPUT}`}
              value={appForm.slug}
              onChange={(e) => setAppForm((f) => ({ ...f, slug: e.target.value }))}
            />
          </label>
          <label className="text-sm">
            Instagram App ID
            <input
              className={`mt-1 ${ADMIN_INPUT}`}
              value={appForm.metaAppId}
              onChange={(e) => setAppForm((f) => ({ ...f, metaAppId: e.target.value }))}
              placeholder="974253428666592"
            />
          </label>
          <label className="text-sm">
            Webhook verify token
            <input
              className={`mt-1 ${ADMIN_INPUT}`}
              value={appForm.webhookVerifyToken}
              onChange={(e) =>
                setAppForm((f) => ({ ...f, webhookVerifyToken: e.target.value }))
              }
            />
          </label>
          <label className="text-sm sm:col-span-2">
            Instagram App secret
            <input
              type="password"
              autoComplete="off"
              className={`mt-1 ${ADMIN_INPUT}`}
              value={appForm.appSecret}
              onChange={(e) => setAppForm((f) => ({ ...f, appSecret: e.target.value }))}
            />
          </label>
          <label className="text-sm sm:col-span-2">
            Facebook App secret (optional — webhook signature)
            <input
              type="password"
              autoComplete="off"
              className={`mt-1 ${ADMIN_INPUT}`}
              value={appForm.facebookAppSecret}
              onChange={(e) =>
                setAppForm((f) => ({ ...f, facebookAppSecret: e.target.value }))
              }
            />
          </label>
        </div>
        <AdminActionButton className="mt-4" onClick={() => void saveMetaApp()}>
          Add Meta app
        </AdminActionButton>
      </section>
      ) : null}

      {show("connection") ? (
      <section className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] shadow-[var(--admin-panel-inset)] p-5 sm:p-6">
        <h3 className="text-base font-semibold tracking-tight">Instagram account</h3>
        <p className="mt-1 text-sm text-muted">
          Meta console step 2: copy the account’s numeric ID and paste the token from{" "}
          <em>Generate token</em> below (encrypted in Neon). Or use{" "}
          <strong>Connect Instagram</strong>.{" "}
          <code className="text-foreground">ig_user_id</code> must match webhook{" "}
          <code className="text-foreground">entry.id</code> (e.g.{" "}
          <code className="text-foreground">17841447839356666</code> for @just.one.teddy).
        </p>
        {canConfigureMeta ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="text-sm sm:col-span-2">
            Meta app
            <StackwiseSelect
              aria-label="Meta app"
              className="mt-1"
              value={accountForm.metaAppId}
              onChange={(v) => setAccountForm((f) => ({ ...f, metaAppId: v }))}
              placeholder="Select app"
              options={apps.map((a) => ({ value: a.id, label: a.label }))}
            />
          </div>
          <label className="text-sm">
            IG user ID
            <input
              className={`mt-1 ${ADMIN_INPUT}`}
              value={accountForm.igUserId}
              onChange={(e) => setAccountForm((f) => ({ ...f, igUserId: e.target.value }))}
            />
          </label>
          <label className="text-sm">
            @username
            <input
              className={`mt-1 ${ADMIN_INPUT}`}
              value={accountForm.username}
              onChange={(e) => setAccountForm((f) => ({ ...f, username: e.target.value }))}
            />
          </label>
          <label className="text-sm sm:col-span-2">
            Access token (from Meta → Generate token)
            <input
              type="password"
              autoComplete="off"
              className={`mt-1 ${ADMIN_INPUT}`}
              value={accountForm.accessToken}
              onChange={(e) => setAccountForm((f) => ({ ...f, accessToken: e.target.value }))}
            />
          </label>
          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <input
              type="checkbox"
              checked={accountForm.subscribeWebhooks}
              onChange={(e) =>
                setAccountForm((f) => ({ ...f, subscribeWebhooks: e.target.checked }))
              }
            />
            After save, subscribe this account to comments + messages webhooks (Graph API)
          </label>
        </div>
        ) : (
          <p className="mt-4 text-sm text-muted">
            Connection settings are managed by the workspace owner. You can run automations on the
            accounts you have access to.
          </p>
        )}
        {accounts.length > 0 && (
          <ul className="mt-3 text-sm text-muted">
            {accounts.map((a) => (
              <li
                key={a.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[var(--admin-border)] bg-black/20 px-3 py-2"
              >
                <span className="text-sm">
                  {a.username ? `@${a.username}` : a.igUserId} ·{" "}
                  {a.hasAccessToken ? "token set" : "no token"}
                  {a.webhookSubscribed ? " · webhooks on" : " · webhooks off"}
                  {a.tokenExpiresAt ? ` · expires ${formatWhen(a.tokenExpiresAt)}` : ""}
                </span>
                {canConfigureMeta ? (
                  <span className="flex flex-wrap gap-2">
                    {a.hasAccessToken && (
                      <>
                        <button
                          type="button"
                          className="text-xs text-accent underline"
                          onClick={() => void testAccountToken(a.id)}
                        >
                          Test token
                        </button>
                        {!a.webhookSubscribed && (
                          <button
                            type="button"
                            className="text-xs text-accent underline"
                            onClick={() => void subscribeAccountWebhooks(a.id)}
                          >
                            Subscribe webhooks
                          </button>
                        )}
                      </>
                    )}
                    <button
                      type="button"
                      className="text-xs text-red-400 underline hover:text-red-300"
                      onClick={() =>
                        requestRemoveAccount(
                          a.id,
                          a.username ? `@${a.username}` : a.igUserId,
                        )
                      }
                    >
                      Disconnect
                    </button>
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        )}
        {canConfigureMeta ? (
          <AdminActionButton className="mt-4" onClick={() => void saveAccount()}>
            Save account
          </AdminActionButton>
        ) : null}
        {canConfigureMeta && removedAccounts.length > 0 ? (
          <div className="mt-6 border-t border-[var(--admin-border)] pt-4">
            <h4 className="text-sm font-semibold text-muted">Disconnected (archived)</h4>
            <p className="mt-1 text-xs text-muted">
              Tokens cleared; delivery history kept. Reconnect with the same IG user ID and Meta app to
              reactivate this row.
            </p>
            <ul className="mt-2 space-y-2 text-sm text-muted">
              {removedAccounts.map((a) => (
                <li
                  key={a.id}
                  className="rounded-lg border border-[var(--admin-border)] bg-black/10 px-3 py-2"
                >
                  {a.username ? `@${a.username}` : a.igUserId}
                  <span className="text-xs"> · removed</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>
      ) : null}

      {show("campaigns") ? (
      <section className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] shadow-[var(--admin-panel-inset)] p-5 sm:p-6">
        <h3 className="text-base font-semibold tracking-tight">Campaign insights</h3>
        <p className="mt-1 text-sm text-muted">
          Clicks come from tracked links in DMs. CTR = clicks ÷ total sends. Open a name to filter
          Activity.
        </p>
        <div className="mt-4 overflow-hidden rounded-xl border border-[var(--admin-border)] bg-black/20">
          <InstagramCampaignInsightsTable
            insights={campaignInsights}
            accounts={accounts}
            onToggleActive={(id, active) => void toggleCampaign(id, active)}
            onDelete={(id, name) => requestDeleteCampaign(id, name)}
          />
        </div>
        <h3 className="mt-8 text-base font-semibold tracking-tight">New automation</h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="text-sm sm:col-span-2">
            Account
            <StackwiseSelect
              aria-label="Instagram account"
              className="mt-1"
              value={campaignForm.accountId}
              onChange={(v) => setCampaignForm((f) => ({ ...f, accountId: v }))}
              placeholder="Select account"
              options={accounts.map((a) => ({
                value: a.id,
                label: a.username ?? a.igUserId,
              }))}
            />
          </div>
          <label className="text-sm">
            Name
            <input
              className={`mt-1 ${ADMIN_INPUT}`}
              value={campaignForm.name}
              onChange={(e) => setCampaignForm((f) => ({ ...f, name: e.target.value }))}
            />
          </label>
          <div className="text-sm">
            Trigger
            <StackwiseSelect<InstagramCampaign["triggerType"]>
              aria-label="Campaign trigger"
              className="mt-1"
              value={campaignForm.triggerType}
              onChange={(triggerType) =>
                setCampaignForm((f) => ({ ...f, triggerType }))
              }
              options={[
                { value: "comment", label: "Comment on post" },
                { value: "dm", label: "Inbound DM" },
                { value: "story_reply", label: "Story reply" },
              ]}
            />
          </div>
          <label className="text-sm">
            Media ID {campaignForm.triggerType === "comment" ? "(required)" : "(optional)"}
            <input
              className={`mt-1 ${ADMIN_INPUT}`}
              value={campaignForm.mediaId}
              onChange={(e) => setCampaignForm((f) => ({ ...f, mediaId: e.target.value }))}
            />
          </label>
          <label className="text-sm">
            Keyword
            <input
              className={`mt-1 ${ADMIN_INPUT}`}
              value={campaignForm.keyword}
              onChange={(e) => setCampaignForm((f) => ({ ...f, keyword: e.target.value }))}
            />
          </label>
          <label className="text-sm sm:col-span-2">
            Private reply
            <textarea
              className={`mt-1 ${ADMIN_INPUT}`}
              rows={3}
              value={campaignForm.privateReplyTemplate}
              onChange={(e) =>
                setCampaignForm((f) => ({ ...f, privateReplyTemplate: e.target.value }))
              }
            />
          </label>
          <label className="text-sm">
            Button 1 label
            <input
              className={`mt-1 ${ADMIN_INPUT}`}
              value={campaignForm.buttonLabel1}
              onChange={(e) => setCampaignForm((f) => ({ ...f, buttonLabel1: e.target.value }))}
            />
          </label>
          <label className="text-sm">
            Button 1 URL
            <input
              className={`mt-1 ${ADMIN_INPUT}`}
              value={campaignForm.buttonUrl1}
              onChange={(e) => setCampaignForm((f) => ({ ...f, buttonUrl1: e.target.value }))}
            />
          </label>
          <label className="text-sm">
            Button 2 label
            <input
              className={`mt-1 ${ADMIN_INPUT}`}
              value={campaignForm.buttonLabel2}
              onChange={(e) => setCampaignForm((f) => ({ ...f, buttonLabel2: e.target.value }))}
            />
          </label>
          <label className="text-sm">
            Button 2 URL
            <input
              className={`mt-1 ${ADMIN_INPUT}`}
              value={campaignForm.buttonUrl2}
              onChange={(e) => setCampaignForm((f) => ({ ...f, buttonUrl2: e.target.value }))}
            />
          </label>
        </div>
        <AdminActionButton className="mt-4" onClick={() => void saveCampaign()}>
          Create campaign
        </AdminActionButton>
      </section>
      ) : null}

      {show("activity") ? (
      <section className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] shadow-[var(--admin-panel-inset)] p-5 sm:p-6">
        <p className="text-sm text-muted">
          Only keyword-matched campaign events on connected accounts. Unmatched DMs and removed
          accounts are omitted.
        </p>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-base font-semibold tracking-tight">Delivery log</h3>
          <div className="flex flex-wrap gap-2">
            <StackwiseSelect
              aria-label="Filter deliveries by campaign"
              className="min-w-[10rem]"
              value={deliveryCampaignId}
              onChange={(v) => {
                setDeliveryCampaignId(v);
                setDeliveryPage(1);
              }}
              options={[
                { value: "", label: "All campaigns" },
                ...campaignInsights.map((c) => ({
                  value: c.campaignId,
                  label: c.name,
                })),
              ]}
            />
            <StackwiseSelect
              aria-label="Filter deliveries by status"
              className="min-w-[9rem]"
              value={deliveryFilter}
              onChange={(v) => {
                setDeliveryFilter(v);
                setDeliveryPage(1);
              }}
              options={[
                { value: "", label: "All statuses" },
                ...instagramDeliveryStatuses.map((s) => ({
                  value: s,
                  label: s,
                })),
              ]}
            />
          </div>
        </div>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-xs">
            <thead className="text-muted">
              <tr>
                <th className="pb-2 pr-3">Time</th>
                <th className="pb-2 pr-3">Status</th>
                <th className="pb-2 pr-3">Trigger</th>
                <th className="pb-2 pr-3">Campaign</th>
                <th className="pb-2 pr-3">Clicks</th>
                <th className="pb-2 pr-3">User</th>
                <th className="pb-2 pr-3">Comment</th>
                <th className="pb-2">Reason / error</th>
              </tr>
            </thead>
            <tbody>
              {deliveries.map((d) => (
                <tr key={d.id} className="border-t border-[var(--admin-border)] align-top">
                  <td className="py-2 pr-3 whitespace-nowrap">{formatWhen(d.createdAt)}</td>
                  <td className="py-2 pr-3">{formatDeliveryStatus(d)}</td>
                  <td className="py-2 pr-3">{d.triggerType}</td>
                  <td className="py-2 pr-3">{d.campaignName ?? "—"}</td>
                  <td className="py-2 pr-3">{d.clickCount ?? 0}</td>
                  <td className="py-2 pr-3">
                    {d.recipientIgsid ? (
                      <Link
                        href={`/admin/instagram/inbox?accountId=${encodeURIComponent(d.accountId)}&participantIgsid=${encodeURIComponent(d.recipientIgsid)}`}
                        className="text-accent underline"
                      >
                        {d.recipientUsername ?? d.recipientIgsid}
                      </Link>
                    ) : (
                      (d.recipientUsername ?? "—")
                    )}
                  </td>
                  <td className="py-2 pr-3 max-w-[160px] truncate">{d.triggerText ?? "—"}</td>
                  <td className="py-2 text-muted">{formatDeliveryReason(d)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!deliveriesLoading && deliveries.length === 0 && (
            <p className="mt-2 text-sm text-muted">No deliveries yet.</p>
          )}
          {deliveriesLoading ? (
            <p className="mt-2 text-sm text-muted">Loading deliveries…</p>
          ) : null}
        </div>
        <div className="mt-4">
          <TablePagination
            currentPage={deliveryPage}
            totalPages={deliveryTotalPages}
            totalItems={deliveryTotal}
            pageSize={DELIVERY_PAGE_SIZE}
            onPageChange={setDeliveryPage}
          />
        </div>
      </section>
      ) : null}
    </div>
  );
}