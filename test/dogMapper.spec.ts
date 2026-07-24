import { describe, it, expect } from "vitest";
import { daysUntil, photoUrlFor, mapDogRow, todayLocalISO } from "~/utils/dogMapper";
import type { DogRow } from "~/types/db";

const at = (iso: string) => new Date(`${iso}T00:00:00Z`);

describe("daysUntil", () => {
  it("counts whole days to a future deadline", () => {
    expect(daysUntil("2026-08-01", at("2026-07-23"))).toBe(9);
  });

  it("returns 0 on the deadline itself", () => {
    expect(daysUntil("2026-07-23", at("2026-07-23"))).toBe(0);
  });

  it("goes negative once the deadline has passed", () => {
    expect(daysUntil("2026-07-20", at("2026-07-23"))).toBe(-3);
  });

  /* A deadline must not shift by a day because of the viewer's clock — a dog
     shown "1 day" in Chicago and "2 days" in Tokyo is a correctness bug, and
     on this app it is a bug about a euthanasia date. */
  it("is stable across timezones and time of day", () => {
    const lateLocalEvening = new Date("2026-07-23T23:30:00-07:00"); // 06:30Z on the 24th
    const earlyUtcMorning = new Date("2026-07-24T00:30:00Z");
    expect(daysUntil("2026-08-01", lateLocalEvening)).toBe(
      daysUntil("2026-08-01", earlyUtcMorning),
    );
  });

  it("rejects a malformed date rather than inventing a number", () => {
    expect(Number.isNaN(daysUntil("not-a-date"))).toBe(true);
  });
});

describe("todayLocalISO", () => {
  /* The bug this exists to prevent: west of Greenwich, toISOString() rolls
     over to tomorrow during the evening, so a shelter setting a deadline at
     8pm would be told today is already in the past. */
  it("uses the local calendar date, not the UTC one", () => {
    const eveningChicago = new Date("2026-07-23T20:30:00-05:00"); // 01:30Z on the 24th
    expect(eveningChicago.toISOString().slice(0, 10)).toBe("2026-07-24"); // the trap
    expect(todayLocalISO(eveningChicago)).toBe("2026-07-23");
  });

  it("zero-pads months and days", () => {
    expect(todayLocalISO(new Date(2026, 0, 5))).toBe("2026-01-05");
  });
});

describe("photoUrlFor", () => {
  it("builds a public storage URL", () => {
    expect(photoUrlFor("https://abc.supabase.co", "org1/dog1/a.jpg")).toBe(
      "https://abc.supabase.co/storage/v1/object/public/pet-photos/org1/dog1/a.jpg",
    );
  });

  it("tolerates a trailing slash on the project URL", () => {
    expect(photoUrlFor("https://abc.supabase.co/", "x.jpg")).toContain(
      ".co/storage/v1/object/public/pet-photos/x.jpg",
    );
  });

  it("passes absolute URLs through untouched", () => {
    const url = "https://images.dog.ceo/breeds/beagle/n02088364_11136.jpg";
    expect(photoUrlFor("https://abc.supabase.co", url)).toBe(url);
  });
});

const row = (over: Partial<DogRow> = {}): DogRow => ({
  id: "d1", org_id: "o1", name: "Scout", breed: "Border Collie", secondary_breed: null,
  age: 3, sex: "F", size: "medium", weight_lbs: 42,
  good_with_dogs: "yes", good_with_cats: "selective", good_with_kids: "yes",
  house_trained: "yes", crate_trained: true,
  traits: { energy: 9, space: 6, social: 7, independence: 4, training: 3 },
  spay_neuter: "yes", vaccinated: true, microchipped: true, medical_notes: null,
  tagline: "Needs a job", bio: "Herding dog.", quirks: null, background: null, ideal_home: null,
  city: "Chicago, IL", lat: 41.9, lng: -87.7, adoption_fee: 150,
  risk: "safe", risk_reason: null, risk_review_date: null, status: "available",
  orgs: {
    id: "o1", name: "Cook County Animal Care & Control", type: "municipal",
    city: "Chicago, IL", lat: 41.9, lng: -87.7, contact_email: null, contact_phone: null,
  },
  dog_photos: [],
  ...over,
});

const url = (p: string) => photoUrlFor("https://abc.supabase.co", p);

describe("mapDogRow", () => {
  it("orders photos by position, not insertion", () => {
    const d = mapDogRow(
      row({
        dog_photos: [
          { id: "p3", dog_id: "d1", storage_path: "c.jpg", position: 2 },
          { id: "p1", dog_id: "d1", storage_path: "a.jpg", position: 0 },
          { id: "p2", dog_id: "d1", storage_path: "b.jpg", position: 1 },
        ],
      }),
      url,
    );
    expect(d.photos.map((p) => p.slice(-5))).toEqual(["a.jpg", "b.jpg", "c.jpg"]);
  });

  it("carries the org through as the source", () => {
    const d = mapDogRow(row(), url);
    expect(d.source).toEqual({ type: "municipal", name: "Cook County Animal Care & Control" });
  });

  it("leaves daysLeft undefined when no deadline is set", () => {
    expect(mapDogRow(row(), url).daysLeft).toBeUndefined();
  });

  it("clamps an overdue deadline to 0 rather than showing negative days", () => {
    const d = mapDogRow(row({ risk: "high", risk_reason: "Capacity", risk_review_date: "2020-01-01" }), url);
    expect(d.daysLeft).toBe(0);
  });

  it("marks adopted from status, so the card can disable itself", () => {
    expect(mapDogRow(row({ status: "adopted" }), url).adopted).toBe(true);
    expect(mapDogRow(row({ status: "available" }), url).adopted).toBe(false);
  });
});
