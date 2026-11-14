"use client";

import { useToast } from "@/components/ToastProvider";
import { AdminActionButton } from "@/components/admin/AdminActionButton";
import type {
  InstagramAccount,
  InstagramCampaign,
  InstagramDelivery,
  InstagramMetaApp,
  InstagramOpsStatus,
} from "@/lib/instagram/types";
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

function webhookPatternForDisplay(pattern: string | undefined): string {
  if (!pattern) return "…";
  if (typeof window === "undefined") return pattern;
  return pattern.replace(/^https?:\/\/[^/]+/, window.location.origin);
}

export function GrowthInstagramPanel() {
  const toast = useToast();
  const [status, setStatus] = useState<InstagramOpsStatus | null>(null);
  const [apps, setApps] = useState<InstagramMetaApp[]>([]);
  const [accounts, setAccounts] = useState<InstagramAccount[]>([]);
  const [campaigns, setCampaigns] = useState<InstagramCampaign[]>([]);
  const [deliveries, setDeliveries] = useState<InstagramDelivery[]>([]);
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

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [st, appsRes, accRes, campRes, delUrl, oauthCfg] = await Promise.all([
        fetch("/api/admin/instagram/status"),
        fetch("/api/admin/instagram/meta-apps"),
        fetch("/api/admin/instagram/accounts"),
        fetch("/api/admin/instagram/campaigns"),
        fetch(
          `/api/admin/instagram/deliveries${
            deliveryFilter ? `?status=${encodeURIComponent(deliveryFilter)}` : ""
          }`,
        ),
        fetch("/api/admin/instagram/oauth/config"),
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
      if (delUrl.ok) {
        const data = (await delUrl.json()) as { deliveries: InstagramDelivery[] };
        setDeliveries(data.deliveries);
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
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Load failed");
    } finally {
      setLoading(false);
    }
  }, [deliveryFilter, toast]);

  useDeferredEffect(() => {
    void load();
  }, [load]);

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
      if (!res.ok) throw new Error("Save failed");
      toast.success("Instagram account saved");
      setAccountForm((prev) => ({ ...prev, accessToken: "" }));
      await load();
    } catch {
      toast.error("Could not save account");
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

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-line bg-panel p-5 sm:p-6">
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
          <AdminActionButton busy={loading} busyLabel="Refreshing…" onClick={() => void load()}>
            Refresh
          </AdminActionButton>
        </div>
      </section>

      <section className="rounded-xl border border-line bg-panel p-5 sm:p-6">
        <h3 className="text-base font-semibold tracking-tight">Meta apps</h3>
        <p className="mt-1 text-sm text-muted">
          Instagram Business Login + Graph API (OpenReply-class). Register OAuth redirect and
          webhooks in Meta → Instagram → API setup (see{" "}
          <code className="text-foreground">docs/INSTAGRAM_META_SETUP.md</code>). Webhook path:{" "}
          <code className="text-foreground">/api/webhooks/meta/[slug]</code>.
        </p>
        {oauthSetup && (
          <div className="mt-3 rounded-lg border border-line bg-black/30 px-3 py-2 text-xs">
            <p className="text-muted">OAuth callback (copy into Meta → Facebook Login → Valid OAuth Redirect URIs)</p>
            <code className="mt-1 block break-all text-foreground">{oauthSetup.redirectUri}</code>
            {oauthSetup.usesTunnel ? (
              <p className="mt-2 text-amber-200/90">
                Tunnel mode (<code>INSTAGRAM_OAUTH_REDIRECT_BASE</code>): Meta hits ngrok; after connect you
                return to{" "}
                <code className="text-foreground">{oauthSetup.adminReturnOrigin ?? "…"}</code> — keep
                that origin in <code>NEXT_PUBLIC_SITE_URL</code> so the admin session cookie matches.
              </p>
            ) : null}
            <p className="mt-2 text-muted">
              Webhooks (same public origin):{" "}
              <code className="text-foreground">{oauthSetup.webhookHint}</code>
            </p>
          </div>
        )}
        {apps.length > 0 && (
          <ul className="mt-3 space-y-2 text-sm">
            {apps.map((app) => (
              <li
                key={app.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-line bg-black/30 px-3 py-2"
              >
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

      <section className="rounded-xl border border-line bg-panel p-5 sm:p-6">
        <h3 className="text-base font-semibold tracking-tight">Instagram account</h3>
        <p className="mt-1 text-sm text-muted">
          Use <strong>Connect Instagram</strong> (Business Login) or paste a long-lived token.{" "}
          Stored <code className="text-foreground">ig_user_id</code> is the professional{" "}
          <code className="text-foreground">user_id</code> (webhook <code className="text-foreground">entry.id</code>).
        </p>
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
            Access token
            <input
              type="password"
              autoComplete="off"
              className="mt-1 w-full rounded-lg border border-line bg-black/40 px-3 py-2"
              value={accountForm.accessToken}
              onChange={(e) => setAccountForm((f) => ({ ...f, accessToken: e.target.value }))}
            />
          </label>
        </div>
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
                  {a.tokenExpiresAt ? ` · expires ${formatWhen(a.tokenExpiresAt)}` : ""}
                </span>
                {a.hasAccessToken && (
                  <button
                    type="button"
                    className="text-xs text-accent underline"
                    onClick={() => void testAccountToken(a.id)}
                  >
                    Test token
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
        <AdminActionButton className="mt-4" onClick={() => void saveAccount()}>
          Save account
        </AdminActionButton>
      </section>

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
              <AdminActionButton onClick={() => void toggleCampaign(c.id, !c.active)}>
                {c.active ? "Deactivate" : "Activate"}
              </AdminActionButton>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl border border-line bg-panel p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-base font-semibold tracking-tight">Delivery log</h3>
          <select
            className="rounded-lg border border-line bg-black/40 px-2 py-1 text-sm"
            value={deliveryFilter}
            onChange={(e) => setDeliveryFilter(e.target.value)}
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
                  <td className="py-2 pr-3">{d.status}</td>
                  <td className="py-2 pr-3">{d.triggerType}</td>
                  <td className="py-2 pr-3">{d.campaignName ?? "—"}</td>
                  <td className="py-2 pr-3">{d.clickCount ?? 0}</td>
                  <td className="py-2 pr-3">{d.recipientUsername ?? d.recipientIgsid ?? "—"}</td>
                  <td className="py-2 pr-3 max-w-[160px] truncate">{d.triggerText ?? "—"}</td>
                  <td className="py-2 text-muted">{d.skipReason ?? d.errorDetail ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {deliveries.length === 0 && (
            <p className="mt-2 text-sm text-muted">No deliveries yet.</p>
          )}
        </div>
      </section>
    </div>
  );
}