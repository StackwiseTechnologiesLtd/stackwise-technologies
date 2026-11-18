import { describe, expect, it } from "vitest";
import { formatTime24, formatTimeLabel, from12Hour, parseTime24, to12Hour } from "@/lib/calendar/time";

describe("calendar time helpers", () => {
  it("round-trips 24h storage", () => {
    expect(formatTime24(from12Hour(11, true), 28)).toBe("23:28");
    expect(formatTimeLabel("23:28")).toBe("11:28 PM");
  });

  it("parses HH:mm", () => {
    expect(parseTime24("09:05")).toEqual({ hours: 9, minutes: 5 });
    expect(parseTime24("")).toBeNull();
  });

  it("converts 12h edge cases", () => {
    expect(to12Hour(0)).toEqual({ hour12: 12, pm: false });
    expect(to12Hour(12)).toEqual({ hour12: 12, pm: true });
  });
});