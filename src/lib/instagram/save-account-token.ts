import {
  exchangeInstagramLongLivedToken,
  getInstagramProfessionalUser,
  subscribeInstagramAccountToWebhooks,
} from "@/lib/instagram/meta-oauth";
import { getMetaAppById } from "@/lib/instagram/repository";

export type SaveInstagramAccountTokenInput = {
  metaAppRowId: string;
  igUserId: string;
  username?: string | null;
  accessToken: string;
  subscribeWebhooks?: boolean;
};

export type SaveInstagramAccountTokenResult = {
  igUserId: string;
  username: string | null;
  accessToken: string;
  tokenExpiresAt: string | null;
  webhookSubscribed: boolean;
};

export async function prepareInstagramAccountToken(
  input: SaveInstagramAccountTokenInput,
): Promise<SaveInstagramAccountTokenResult> {
  const metaApp = await getMetaAppById(input.metaAppRowId);
  if (!metaApp) {
    throw new Error("Meta app not found");
  }

  const trimmed = input.accessToken.trim();
  if (!trimmed) {
    throw new Error("Access token required");
  }

  let accessToken = trimmed;
  let expiresIn: number | null = null;

  try {
    const long = await exchangeInstagramLongLivedToken({
      shortLivedToken: trimmed,
      appSecret: metaApp.appSecret,
    });
    accessToken = long.accessToken;
    expiresIn = long.expiresIn;
  } catch {
    accessToken = trimmed;
  }

  const profile = await getInstagramProfessionalUser(accessToken);
  const webhookIgId = profile.userId;

  if (
    input.igUserId.trim() &&
    input.igUserId.trim() !== webhookIgId
  ) {
    throw new Error(
      `Token is for Instagram user_id ${webhookIgId} but you entered ${input.igUserId}. Use ${webhookIgId} (matches webhooks).`,
    );
  }

  const username =
    input.username?.trim() || profile.username || profile.name || null;

  let webhookSubscribed = false;
  if (input.subscribeWebhooks !== false) {
    try {
      const sub = await subscribeInstagramAccountToWebhooks({
        instagramUserId: webhookIgId,
        accessToken,
      });
      webhookSubscribed = sub.success;
    } catch {
      webhookSubscribed = false;
    }
  }

  const tokenExpiresAt =
    expiresIn != null
      ? new Date(Date.now() + expiresIn * 1000).toISOString()
      : null;

  return {
    igUserId: webhookIgId,
    username,
    accessToken,
    tokenExpiresAt,
    webhookSubscribed,
  };
}