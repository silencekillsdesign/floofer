import { describe, it, expect } from "vitest";
import {
  MAX_SLOTS, formatSlot, isSlotPast, localDate, slotKey, upcomingDays,
} from "~/utils/playDates";

describe("localDate", () => {
  /* The same UTC trap as the risk deadline: west of Greenwich, toISOString()
     rolls to tomorrow during the evening, which would offer a window on a day
     the adopter never picked. */
  it("uses the local calendar day, not the UTC one", () => {
    const eveningChicago = new Date("2026-08-01T20:30:00-05:00"); // 01:30Z on the 2nd
    expect(eveningChicago.toISOString().slice(0, 10)).toBe("2026-08-02"); // the trap
    expect(localDate(eveningChicago)).toBe("2026-08-01");
  });

  it("zero-pads", () => {
    expect(localDate(new Date(2026, 0, 5))).toBe("2026-01-05");
  });
});

describe("upcomingDays", () => {
  it("starts today and runs forward", () => {
    const from = new Date(2026, 7, 1);
    const days = upcomingDays(7, from);
    expect(days).toHaveLength(7);
    expect(days[0].date).toBe("2026-08-01");
    expect(days[6].date).toBe("2026-08-07");
  });

  it("rolls over a month boundary", () => {
    const days = upcomingDays(3, new Date(2026, 6, 30));
    expect(days.map((d) => d.date)).toEqual(["2026-07-30", "2026-07-31", "2026-08-01"]);
  });

  it("rolls over a year boundary", () => {
    const days = upcomingDays(2, new Date(2026, 11, 31));
    expect(days.map((d) => d.date)).toEqual(["2026-12-31", "2027-01-01"]);
  });
});

describe("slotKey", () => {
  it("distinguishes parts of the same day", () => {
    const a = slotKey({ date: "2026-08-01", part: "morning" });
    const b = slotKey({ date: "2026-08-01", part: "evening" });
    expect(a).not.toBe(b);
  });

  it("is stable for the same slot", () => {
    expect(slotKey({ date: "2026-08-01", part: "morning" }))
      .toBe(slotKey({ date: "2026-08-01", part: "morning" }));
  });
});

describe("isSlotPast", () => {
  const now = new Date(2026, 7, 5, 18, 0); // 6pm on the 5th

  /* Compared by calendar date, so a shelter can still confirm "today,
     morning" late in the day rather than the option vanishing at noon. */
  it("keeps every window on the current day offerable", () => {
    expect(isSlotPast({ date: "2026-08-05", part: "morning" }, now)).toBe(false);
    expect(isSlotPast({ date: "2026-08-05", part: "evening" }, now)).toBe(false);
  });

  it("marks yesterday as past", () => {
    expect(isSlotPast({ date: "2026-08-04", part: "evening" }, now)).toBe(true);
  });

  it("leaves future days alone", () => {
    expect(isSlotPast({ date: "2026-08-06", part: "morning" }, now)).toBe(false);
  });
});

describe("formatSlot", () => {
  it("reads like something a person would say", () => {
    const s = formatSlot({ date: "2026-08-01", part: "morning" });
    expect(s).toMatch(/morning$/);
    expect(s).toMatch(/Aug/);
  });

  /* Parsed as local parts, never as a UTC timestamp — otherwise the label can
     name a different day than the one that was picked. */
  it("names the day that was actually chosen", () => {
    expect(formatSlot({ date: "2026-08-01", part: "evening" })).toContain("Saturday");
  });
});

describe("request limits", () => {
  it("caps offered windows at three", () => {
    expect(MAX_SLOTS).toBe(3);
  });
});
