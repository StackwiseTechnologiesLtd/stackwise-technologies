import { describe, expect, it } from "vitest";
import { pickFacebookPage } from "./meta-oauth";

describe("pickFacebookPage", () => {
  const pages = [
    {
      pageId: "111",
      pageName: "A",
      pageAccessToken: "t1",
      igUserId: "ig1",
      igUsername: "a",
    },
    {
      pageId: "222",
      pageName: "B",
      pageAccessToken: "t2",
      igUserId: "ig2",
      igUsername: "b",
    },
  ];

  it("returns null when empty", () => {
    expect(pickFacebookPage([], null)).toBeNull();
  });

  it("picks preferred page", () => {
    expect(pickFacebookPage(pages, "222")?.igUserId).toBe("ig2");
  });

  it("auto-picks single page", () => {
    expect(pickFacebookPage([pages[0]!], null)?.pageId).toBe("111");
  });

  it("returns null when multiple and no preference", () => {
    expect(pickFacebookPage(pages, null)).toBeNull();
  });
});