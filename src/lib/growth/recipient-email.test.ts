import { describe, expect, it } from "vitest";
import { checkRecipientEmailSyntax } from "./recipient-email";

describe("checkRecipientEmailSyntax", () => {
  it("accepts normal addresses", () => {
    expect(checkRecipientEmailSyntax("jesse@easyclickwebdesign.com").ok).toBe(true);
  });

  it("rejects placeholders and image filenames", () => {
    expect(checkRecipientEmailSyntax("yourorg@gmail.com").ok).toBe(false);
    expect(checkRecipientEmailSyntax("board@yourdomain.org").ok).toBe(false);
    expect(
      checkRecipientEmailSyntax("foo-featured-500x383@2x.webp").ok,
    ).toBe(false);
  });

  it("rejects malformed addresses", () => {
    expect(checkRecipientEmailSyntax("not-an-email").ok).toBe(false);
  });
});
