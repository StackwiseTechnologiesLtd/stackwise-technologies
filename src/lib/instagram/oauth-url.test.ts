import { afterEach, describe, expect, it } from "vitest";
import {
  instagramAdminReturnOrigin,
  instagramOAuthRedirectBase,
  instagramPublicOrigin,
} from "./oauth-url";

describe("instagramPublicOrigin", () => {
  afterEach(() => {
    delete process.env.INSTAGRAM_OAUTH_REDIRECT_BASE;
    delete process.env.NEXT_PUBLIC_SITE_URL;
  });

  it("uses tunnel env when set", () => {
    process.env.INSTAGRAM_OAUTH_REDIRECT_BASE = "https://abc.ngrok-free.app/";
    expect(instagramPublicOrigin()).toBe("https://abc.ngrok-free.app");
    expect(instagramOAuthRedirectBase()).toBe(
      "https://abc.ngrok-free.app/api/admin/instagram/oauth/callback",
    );
  });

  it("returns admin to NEXT_PUBLIC_SITE_URL when tunnel set", () => {
    process.env.INSTAGRAM_OAUTH_REDIRECT_BASE = "https://abc.ngrok-free.app";
    process.env.NEXT_PUBLIC_SITE_URL = "http://localhost:3002";
    expect(instagramAdminReturnOrigin()).toBe("http://localhost:3002");
  });
});