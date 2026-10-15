import { describe, expect, it } from "vitest";
import { bookingUrl, MEETING_ALWAYS_INVITEE } from "@/lib/booking";

describe("bookingUrl", () => {
  it("prefills the default meeting guest on Cal.com links", () => {
    const url = new URL(bookingUrl());
    expect(url.hostname).toContain("cal.com");
    expect(url.searchParams.getAll("guests")).toContain(MEETING_ALWAYS_INVITEE);
  });

  it("appends extra guests after the default invitee", () => {
    const url = new URL(bookingUrl(["client@example.com"]));
    const guests = url.searchParams.getAll("guests");
    expect(guests[0]).toBe(MEETING_ALWAYS_INVITEE);
    expect(guests).toContain("client@example.com");
  });
});
