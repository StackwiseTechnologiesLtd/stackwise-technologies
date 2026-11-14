"use client";

import { useToast } from "@/components/ToastProvider";
import { AdminActionButton } from "@/components/admin/AdminActionButton";
import { TablePagination } from "@/components/admin/TablePagination";
import type {
  InstagramAccount,
  InstagramCampaign,
  InstagramDelivery,
  InstagramMetaApp,
  InstagramOpsStatus,
} from "@/lib/instagram/types";
import Link from "next/link";
import { useDeferredEffect } from "@/lib/use-deferred-effect";
import { useCallback, useState } from "react";

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

function webhookPatternForDisplay(pattern: string | undefined): string {
  if (!pattern) return "…";
  if (typeof window === "undefined") return pattern;
  return pattern.replace(/^https?:\/\/[^/]+/, window.location.origin);
}

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
  const toast = useToast();
  const [status, setStatus] = useState<InstagramOpsStatus | null>(null);
  const [apps, setApps] = useState<InstagramMetaApp[]>([]);
  const [accounts, setAccounts] = useState<InstagramAccount[]>([]);
  const [campaigns, setCampaigns] = useState<InstagramCampaign[]>([]);
  const [deliveries, setDeliveries] = useState<InstagramDelivery[]>([]);
  const [deliveryPage, setDeliveryPage] = useState(1);
  const [deliveryTotal, setDeliveryTotal] = useState(0);
  const [deliveryTotalPages, setDeliveryTotalPages] = useState(1);
  const [deliveriesLoading, setDeliveriesLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [deliveryFilter, setDeliveryFilter] = useState<string>("");
  const [oauthSetup, setOauthSetup] = useState<{
    redirectUri: string;
    scopes: string[];
    webhookHint: string;
    usesTunnel?: boolean;
    adminReturnOrigin?: string;
    publicOrigin?: string;
  } | null>(null);
  const [access, setAccess] = useState<{
    canManageMetaApps: boolean;
  } | null>(null);

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
  }, [deliveryFilter, deliveryPage, toast]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [st, appsRes, accRes, campRes, oauthCfg, accessRes] = await Promise.all([
        fetch("/api/admin/instagram/status"),
        fetch("/api/admin/instagram/meta-apps"),
        fetch("/api/admin/instagram/accounts"),
        fetch("/api/admin/instagram/campaigns"),
        fetch("/api/admin/instagram/oauth/config"),
        fetch("/api/admin/instagram/access"),
      ]);
      if (!st.ok) throw new Error("Status load failed");
      setStatus((await st.json()) as InstagramOpsStatus);
      if (appsRes.ok) {
        const data = (await appsRes.json()) as { apps: InstagramMetaApp[] };
        setApps(data.apps);
      }
      if (accRes.ok) {
        const data = (await accRes.json()) as { accounts: InstagramAccount[] };
        setAccounts(data.accounts);
      }
      if (campRes.ok) {
        const data = (await campRes.json()) as { campaigns: InstagramCampaign[] };
        setCampaigns(data.campaigns);
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
        const data = (await accessRes.json()) as { canManageMetaApps: boolean };
        setAccess(data);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Load failed");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useDeferredEffect(() => {
    void load();
  }, [load]);

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

  async function deleteCampaign(id: string, name: string) {
    if (
      !confirm(
        `Delete “${name}”? Delivery log rows for this automation are kept; they will no longer link to this campaign.`,
      )
    ) {
      return;
    }
    try {
      const res = await fetch(`/api/admin/instagram/campaigns/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Delete failed");
      toast.toast("Campaign deleted.");
      await load();
    } catch {
      toast.error("Could not delete campaign");
    }
  }

  const canConfigureMeta = access?.canManageMetaApps !== false;

  return (
    <div className="space-y-6">
      {show("overview") ? (
      <section className="rounded-xl border border-line bg-panel p-5 sm:p-6">
        {status?.dryRunMode ? (
          <p className="mb-4 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
            <strong>Dry run is on</strong> (<code className="text-foreground">INSTAGRAM_DRY_RUN=1</code>
            ). Automations log deliveries but do not send real Instagram DMs. Set{" "}
            <code className="text-foreground">INSTAGRAM_DRY_RUN=0</code> and restart the dev server.
          </p>
        ) : null}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold tracking-tight">Instagram status</h3>
            <p className="mt-1 text-sm text-muted">
              Webhook URL pattern:{" "}
              <code className="text-foreground">
                {webhookPatternForDisplay(status?.webhookUrlPattern)}
              </code>
            </p>
            <p className="mt-2 text-xs text-muted">
              Meta apps: {status?.metaAppCount ?? 0} · Connected accounts:{" "}
              {status?.connectedAccounts ?? 0} · Active campaigns:{" "}
              {status?.activeCampaigns ?? 0}
            </p>
            <p className="mt-1 text-xs text-muted">
              Last webhook: {formatWhen(status?.lastWebhookAt ?? null)} · Last send:{" "}
              {formatWhen(status?.lastSendAt ?? null)}
            </p>
          </div>
          <AdminActionButton
            busy={loading}
            busyLabel="Refreshing…"
            onClick={() => {
              void load();
              if (show("activity")) void loadDeliveries();
            }}
          >
            Refresh
          </AdminActionButton>
        </div>
      </section>
      ) : null}

      {show("connection") && canConfigureMeta ? (
      <section className="rounded-xl border border-line bg-panel p-5 sm:p-6">
        <h3 className="text-base font-semibold tracking-tight">Meta apps</h3>
        <p className="mt-1 text-sm text-muted">
          Instagram Business Login + Graph API (OpenReply-class). Register OAuth redirect and
          webhooks in Meta → Instagram → API setup (see{" "}
          <code className="text-foreground">docs/INSTAGRAM_META_SETUP.md</code>). Webhook path:{" "}
          <code className="text-foreground">/api/webhooks/meta/[slug]</code>.
        </p>
        {oauthSetup && (
          <div className="mt-3 space-y-4 rounded-lg border border-line bg-black/30 px-3 py-3 text-xs">
            <div>
              <p className="font-medium text-foreground">
                Set up Instagram business login → Redirect URL
              </p>
              <p className="mt-1 text-muted">
                Paste this in Meta (exact match; no trailing slash). This is not the webhook URL.
              </p>
              <div className="mt-2 flex flex-wrap items-start gap-2">
                <code className="min-w-0 flex-1 break-all rounded-md border border-line bg-black/40 px-2 py-1.5 text-foreground">
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
            ) : null}
          </div>
        )}
        {apps.length > 0 && (
          <ul className="mt-3 space-y-2 text-sm">
            {apps.map((app) => (
              <li
                key={app.id}
                className="flex flex-col gap-2 rounded-lg border border-line bg-black/30 px-3 py-2"
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
              className="mt-1 w-full rounded-lg border border-line bg-black/40 px-3 py-2"
              value={appForm.label}
              onChange={(e) => setAppForm((f) => ({ ...f, label: e.target.value }))}
            />
          </label>
          <label className="text-sm">
            Slug (optional)
            <input
              className="mt-1 w-full rounded-lg border border-line bg-black/40 px-3 py-2"
              value={appForm.slug}
              onChange={(e) => setAppForm((f) => ({ ...f, slug: e.target.value }))}
            />
          </label>
          <label className="text-sm">
            Instagram App ID
            <input
              className="mt-1 w-full rounded-lg border border-line bg-black/40 px-3 py-2"
              value={appForm.metaAppId}
              onChange={(e) => setAppForm((f) => ({ ...f, metaAppId: e.target.value }))}
              placeholder="974253428666592"
            />
          </label>
          <label className="text-sm">
            Webhook verify token
            <input
              className="mt-1 w-full rounded-lg border border-line bg-black/40 px-3 py-2"
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
              className="mt-1 w-full rounded-lg border border-line bg-black/40 px-3 py-2"
              value={appForm.appSecret}
              onChange={(e) => setAppForm((f) => ({ ...f, appSecret: e.target.value }))}
            />
          </label>
          <label className="text-sm sm:col-span-2">
            Facebook App secret (optional — webhook signature)
            <input
              type="password"
              autoComplete="off"
              className="mt-1 w-full rounded-lg border border-line bg-black/40 px-3 py-2"
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
      <section className="rounded-xl border border-line bg-panel p-5 sm:p-6">
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
          <label className="text-sm sm:col-span-2">
            Meta app
            <select
              className="mt-1 w-full rounded-lg border border-line bg-black/40 px-3 py-2"
              value={accountForm.metaAppId}
              onChange={(e) => setAccountForm((f) => ({ ...f, metaAppId: e.target.value }))}
            >
              <option value="">Select app</option>
              {apps.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            IG user ID
            <input
              className="mt-1 w-full rounded-lg border border-line bg-black/40 px-3 py-2"
              value={accountForm.igUserId}
              onChange={(e) => setAccountForm((f) => ({ ...f, igUserId: e.target.value }))}
            />
          </label>
          <label className="text-sm">
            @username
            <input
              className="mt-1 w-full rounded-lg border border-line bg-black/40 px-3 py-2"
              value={accountForm.username}
              onChange={(e) => setAccountForm((f) => ({ ...f, username: e.target.value }))}
            />
          </label>
          <label className="text-sm sm:col-span-2">
            Access token (from Meta → Generate token)
            <input
              type="password"
              autoComplete="off"
              className="mt-1 w-full rounded-lg border border-line bg-black/40 px-3 py-2"
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
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-line bg-black/20 px-3 py-2"
              >
                <span className="text-sm">
                  {a.username ? `@${a.username}` : a.igUserId} ·{" "}
                  {a.hasAccessToken ? "token set" : "no token"}
                  {a.webhookSubscribed ? " · webhooks on" : " · webhooks off"}
                  {a.tokenExpiresAt ? ` · expires ${formatWhen(a.tokenExpiresAt)}` : ""}
                </span>
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
                </span>
              </li>
            ))}
          </ul>
        )}
        {canConfigureMeta ? (
          <AdminActionButton className="mt-4" onClick={() => void saveAccount()}>
            Save account
          </AdminActionButton>
        ) : null}
      </section>
      ) : null}

      {show("campaigns") ? (
      <section className="rounded-xl border border-line bg-panel p-5 sm:p-6">
        <h3 className="text-base font-semibold tracking-tight">Campaigns</h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="text-sm sm:col-span-2">
            Account
            <select
              className="mt-1 w-full rounded-lg border border-line bg-black/40 px-3 py-2"
              value={campaignForm.accountId}
              onChange={(e) => setCampaignForm((f) => ({ ...f, accountId: e.target.value }))}
            >
              <option value="">Select account</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.username ?? a.igUserId}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            Name
            <input
              className="mt-1 w-full rounded-lg border border-line bg-black/40 px-3 py-2"
              value={campaignForm.name}
              onChange={(e) => setCampaignForm((f) => ({ ...f, name: e.target.value }))}
            />
          </label>
          <label className="text-sm">
            Trigger
            <select
              className="mt-1 w-full rounded-lg border border-line bg-black/40 px-3 py-2"
              value={campaignForm.triggerType}
              onChange={(e) =>
                setCampaignForm((f) => ({
                  ...f,
                  triggerType: e.target.value as typeof f.triggerType,
                }))
              }
            >
              <option value="comment">Comment on post</option>
              <option value="dm">Inbound DM</option>
              <option value="story_reply">Story reply</option>
            </select>
          </label>
          <label className="text-sm">
            Media ID {campaignForm.triggerType === "comment" ? "(required)" : "(optional)"}
            <input
              className="mt-1 w-full rounded-lg border border-line bg-black/40 px-3 py-2"
              value={campaignForm.mediaId}
              onChange={(e) => setCampaignForm((f) => ({ ...f, mediaId: e.target.value }))}
            />
          </label>
          <label className="text-sm">
            Keyword
            <input
              className="mt-1 w-full rounded-lg border border-line bg-black/40 px-3 py-2"
              value={campaignForm.keyword}
              onChange={(e) => setCampaignForm((f) => ({ ...f, keyword: e.target.value }))}
            />
          </label>
          <label className="text-sm sm:col-span-2">
            Private reply
            <textarea
              className="mt-1 w-full rounded-lg border border-line bg-black/40 px-3 py-2"
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
              className="mt-1 w-full rounded-lg border border-line bg-black/40 px-3 py-2"
              value={campaignForm.buttonLabel1}
              onChange={(e) => setCampaignForm((f) => ({ ...f, buttonLabel1: e.target.value }))}
            />
          </label>
          <label className="text-sm">
            Button 1 URL
            <input
              className="mt-1 w-full rounded-lg border border-line bg-black/40 px-3 py-2"
              value={campaignForm.buttonUrl1}
              onChange={(e) => setCampaignForm((f) => ({ ...f, buttonUrl1: e.target.value }))}
            />
          </label>
          <label className="text-sm">
            Button 2 label
            <input
              className="mt-1 w-full rounded-lg border border-line bg-black/40 px-3 py-2"
              value={campaignForm.buttonLabel2}
              onChange={(e) => setCampaignForm((f) => ({ ...f, buttonLabel2: e.target.value }))}
            />
          </label>
          <label className="text-sm">
            Button 2 URL
            <input
              className="mt-1 w-full rounded-lg border border-line bg-black/40 px-3 py-2"
              value={campaignForm.buttonUrl2}
              onChange={(e) => setCampaignForm((f) => ({ ...f, buttonUrl2: e.target.value }))}
            />
          </label>
        </div>
        <AdminActionButton className="mt-4" onClick={() => void saveCampaign()}>
          Create campaign
        </AdminActionButton>
        <ul className="mt-4 space-y-2">
          {campaigns.map((c) => (
            <li
              key={c.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-line bg-black/30 px-3 py-2 text-sm"
            >
              <span>
                <span className="font-medium">{c.name}</span> ·{" "}
                <code className="text-xs">{c.triggerType}</code> ·{" "}
                <code className="text-xs">{c.keyword}</code>
                {c.mediaId ? ` on ${c.mediaId}` : ""}
              </span>
              <span className="flex flex-wrap items-center gap-2">
                <AdminActionButton onClick={() => void toggleCampaign(c.id, !c.active)}>
                  {c.active ? "Deactivate" : "Activate"}
                </AdminActionButton>
                <AdminActionButton
                  className="text-red-400 hover:text-red-300"
                  onClick={() => void deleteCampaign(c.id, c.name)}
                >
                  Delete
                </AdminActionButton>
              </span>
            </li>
          ))}
        </ul>
      </section>
      ) : null}

      {show("activity") ? (
      <section className="rounded-xl border border-line bg-panel p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-base font-semibold tracking-tight">Delivery log</h3>
          <select
            className="rounded-lg border border-line bg-black/40 px-2 py-1 text-sm"
            value={deliveryFilter}
            onChange={(e) => {
              setDeliveryFilter(e.target.value);
              setDeliveryPage(1);
            }}
          >
            <option value="">All statuses</option>
            <option value="queued">queued</option>
            <option value="sent">sent</option>
            <option value="skipped">skipped</option>
            <option value="failed">failed</option>
          </select>
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
                <tr key={d.id} className="border-t border-line/60 align-top">
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