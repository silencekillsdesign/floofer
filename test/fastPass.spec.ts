import { describe, it, expect } from "vitest";
import type { Profile } from "~/types";
import { fastPassChecks, fastPassStatus, canAnswer, hoursUntil } from "~/utils/fastPass";

/** A profile that satisfies every readiness check. */
const ready = (over: Partial<Profile> = {}): Profile =>
  ({
    userType: "adopter",
    name: "Test", email: "t@e.com", phone: "312-555-0142", city: "Chicago, IL",
    traits: { energy: 5, space: 5, social: 5, independence: 5, training: 5 },
    payment: null,
    homePhotos: ["data:image/jpeg;base64,x"],
    petPhotos: [],
    documents: [],
    adoption: {
      employment: { employer: "", occupation: "", years: "" },
      isStudent: false, isMilitary: false, firstTimeOwner: false,
      household: { residents: 2, children: [], allergies: "", caregiver: "Test" },
      housing: {
        dwelling: "house", ownership: "own", landlordName: "", landlordPhone: "",
        petsAllowed: "", fencedYard: "yes", hoursAlone: 4, keptWhenAlone: "", traffic: "light",
      },
      vet: {
        pets: [], petsVaccinated: "", petsFixed: "",
        vetName: "Dr Ruiz", vetPhone: "312-555-0199",
        allowReferenceCheck: true, financiallyPrepared: true,
      },
    },
    fastPass: { capabilities: ["bottle-feeding"], responseWindow: "2h" },
    ...over,
  }) as Profile;

describe("fastPassChecks", () => {
  it("passes every check for a complete profile", () => {
    expect(fastPassChecks(ready()).every((c) => c.done)).toBe(true);
  });

  it("accepts a renter only with a landlord contact AND pets allowed", () => {
    const renterNoProof = ready();
    renterNoProof.adoption.housing.ownership = "rent";
    const housing = (p: Profile) =>
      fastPassChecks(p).find((c) => c.label === "Housing cleared for pets")!.done;
    expect(housing(renterNoProof)).toBe(false);

    const renterProven = ready();
    renterProven.adoption.housing.ownership = "rent";
    renterProven.adoption.housing.landlordPhone = "312-555-0100";
    renterProven.adoption.housing.petsAllowed = "yes";
    expect(housing(renterProven)).toBe(true);
  });

  /* Permission granted after the call is needed is permission granted too late. */
  it("requires reference-check permission in advance", () => {
    const p = ready();
    p.adoption.vet.allowReferenceCheck = false;
    expect(fastPassChecks(p).find((c) => c.label === "Reference check pre-authorised")!.done).toBe(false);
  });

  it("every incomplete check explains why it matters", () => {
    const bare = ready({ phone: "", homePhotos: [], fastPass: undefined });
    const undone = fastPassChecks(bare).filter((c) => !c.done);
    expect(undone.length).toBeGreaterThan(0);
    expect(undone.every((c) => c.why.trim().length > 0)).toBe(true);
  });
});

describe("fastPassStatus", () => {
  it("is pending once complete but unverified", () => {
    expect(fastPassStatus(ready())).toBe("pending");
  });

  it("is verified with a recent verification", () => {
    const p = ready();
    p.fastPass!.verifiedAt = new Date(Date.now() - 30 * 86_400_000).toISOString();
    expect(fastPassStatus(p)).toBe("verified");
  });

  /* Circumstances change — a two-year-old home check is not a home check. */
  it("expires verification after a year", () => {
    const p = ready();
    p.fastPass!.verifiedAt = new Date(Date.now() - 400 * 86_400_000).toISOString();
    expect(fastPassStatus(p)).toBe("expired");
  });

  it("is incomplete when a requirement is missing, even if verified", () => {
    const p = ready({ phone: "" });
    p.fastPass!.verifiedAt = new Date().toISOString();
    expect(fastPassStatus(p)).toBe("incomplete");
  });
});

describe("canAnswer", () => {
  const verified = () => {
    const p = ready();
    p.fastPass!.verifiedAt = new Date().toISOString();
    return p;
  };

  it("matches a capability to the risk it answers", () => {
    expect(canAnswer(verified(), "neonatal")).toBe(true);
  });

  it("declines a risk none of the capabilities cover", () => {
    expect(canAnswer(verified(), "senior")).toBe(false);
  });

  /* Being unverified must never route an emergency to someone. */
  it("declines when not yet verified", () => {
    expect(canAnswer(ready(), "neonatal")).toBe(false);
  });

  it("declines while paused, without losing verification", () => {
    const p = verified();
    p.fastPass!.pausedUntil = new Date(Date.now() + 5 * 86_400_000).toISOString();
    expect(canAnswer(p, "neonatal")).toBe(false);
    expect(fastPassStatus(p)).toBe("verified");
  });

  it("resumes once the pause has elapsed", () => {
    const p = verified();
    p.fastPass!.pausedUntil = new Date(Date.now() - 86_400_000).toISOString();
    expect(canAnswer(p, "neonatal")).toBe(true);
  });
});

describe("hoursUntil", () => {
  it("counts whole hours remaining", () => {
    const t = new Date(Date.now() + 3.7 * 3_600_000).toISOString();
    expect(hoursUntil(t)).toBe(3);
  });

  /* A passed window reads as out of time, never as negative hours. */
  it("clamps a passed window to zero", () => {
    expect(hoursUntil(new Date(Date.now() - 5 * 3_600_000).toISOString())).toBe(0);
  });

  it("returns NaN for an unparseable timestamp", () => {
    expect(Number.isNaN(hoursUntil("not-a-time"))).toBe(true);
  });
});
