import { describe, expect, it } from "vitest";
import {
  adoptionCompleteness,
  applyFilters,
  defaultFilters,
  lifeStage,
  milesFrom,
  scoreMatch,
} from "~/composables/useStore";
import { DOGS } from "~/data/dogs";
import type { Dog, Filters, Profile, TraitPentagon } from "~/types";

const dog = (id: string) => DOGS.find((d) => d.id === id)!;
const pct = (d: Dog, user: TraitPentagon) => scoreMatch(d.traits, user);

const HOME_LIKE = (over: Partial<TraitPentagon> = {}): TraitPentagon => ({
  energy: 5, space: 5, social: 5, independence: 5, training: 5, ...over,
});

describe("scoreMatch", () => {
  it("returns a percentage between 0 and 100", () => {
    for (const d of DOGS) {
      const p = pct(d, HOME_LIKE());
      expect(p).toBeGreaterThanOrEqual(0);
      expect(p).toBeLessThanOrEqual(100);
    }
  });

  it("scores a perfectly aligned home at 100", () => {
    const d = dog("scout");
    expect(scoreMatch(d.traits, { ...d.traits })).toBe(100);
  });

  it("prefers an active home for a high-energy dog over a couch-potato home", () => {
    const scout = dog("scout"); // energy 9
    const active = pct(scout, HOME_LIKE({ energy: 9 }));
    const sedentary = pct(scout, HOME_LIKE({ energy: 1 }));
    expect(active).toBeGreaterThan(sedentary);
  });

  it("treats training as inverted — a project dog needs an experienced handler", () => {
    const koda = dog("koda"); // training 7 = needs work
    const pro = pct(koda, HOME_LIKE({ training: 10 }));
    const novice = pct(koda, HOME_LIKE({ training: 1 }));
    expect(pro).toBeGreaterThan(novice);
  });
});

describe("applyFilters", () => {
  const f = (over: Partial<Filters> = {}): Filters => ({ ...defaultFilters(), ...over });
  const match = (d: Dog) => pct(d, HOME_LIKE());

  it("returns everything by default", () => {
    expect(applyFilters(DOGS, f(), match)).toHaveLength(DOGS.length);
  });

  it("filters to at-risk dogs only", () => {
    const out = applyFilters(DOGS, f({ urgency: "high" }), match);
    expect(out.length).toBeGreaterThan(0);
    expect(out.every((d) => d.risk === "high")).toBe(true);
  });

  it("treats maxAge 15 as no cap", () => {
    const capped = applyFilters(DOGS, f({ maxAge: 3 }), match);
    const uncapped = applyFilters(DOGS, f({ maxAge: 15 }), match);
    expect(uncapped.length).toBeGreaterThan(capped.length);
    expect(capped.every((d) => d.age <= 3)).toBe(true);
  });

  it("excludes dogs explicitly bad with cats when filtering for cats", () => {
    const out = applyFilters(DOGS, f({ goodWith: ["cats"] }), match);
    expect(out.every((d) => d.goodWithCats !== "no")).toBe(true);
  });

  it("combines filters conjunctively", () => {
    const out = applyFilters(DOGS, f({ urgency: "high", size: "large" }), match);
    expect(out.every((d) => d.risk === "high" && d.size === "large")).toBe(true);
  });

  it("filters by source type", () => {
    const out = applyFilters(DOGS, f({ sources: ["foster"] }), match);
    expect(out.length).toBeGreaterThan(0);
    expect(out.every((d) => d.source.type === "foster")).toBe(true);
  });
});

describe("milesFrom / lifeStage", () => {
  it("computes a sane distance from the Chicago home base", () => {
    expect(milesFrom(dog("waffles"))).toBe(0); // the Loop itself
    expect(milesFrom(dog("tank"))).toBeGreaterThan(20); // Naperville
  });

  it("derives life stage from age", () => {
    expect(lifeStage({ age: 0.5 } as Dog)).toBe("Puppy");
    expect(lifeStage({ age: 2 } as Dog)).toBe("Young");
    expect(lifeStage({ age: 5 } as Dog)).toBe("Adult");
    expect(lifeStage({ age: 9 } as Dog)).toBe("Senior");
  });
});

describe("adoptionCompleteness", () => {
  const blank = (): Profile => ({
    userType: "adopter",
    name: "Test", email: "t@example.com", phone: "", city: "Chicago, IL",
    traits: HOME_LIKE(),
    payment: null, homePhotos: [], petPhotos: [], documents: [],
    adoption: {
      employment: { employer: "", occupation: "", years: "" },
      isStudent: false, isMilitary: false, firstTimeOwner: false,
      household: { residents: 1, childrenAges: "", allergies: "", caregiver: "" },
      housing: {
        dwelling: "", ownership: "", landlordName: "", landlordPhone: "",
        petsAllowed: "", fencedYard: "", hoursAlone: 4, keptWhenAlone: "", traffic: "",
      },
      vet: {
        currentPets: "", pastPets: "", petsVaccinated: "", petsFixed: "",
        vetName: "", vetPhone: "", allowReferenceCheck: false, financiallyPrepared: false,
      },
    },
  });

  it("starts at 0% and lists what's missing", () => {
    const { pct, missing } = adoptionCompleteness(blank());
    expect(pct).toBe(0);
    expect(missing).toContain("Vet reference");
  });

  it("waives landlord details for homeowners", () => {
    const p = blank();
    p.adoption.housing.ownership = "own";
    const { missing } = adoptionCompleteness(p);
    expect(missing).not.toContain("Landlord contact");
    expect(missing).not.toContain("Pets allowed");
  });

  it("still requires landlord details for renters", () => {
    const p = blank();
    p.adoption.housing.ownership = "rent";
    expect(adoptionCompleteness(p).missing).toContain("Landlord contact");
  });

  it("waives vet history for first-time owners", () => {
    const p = blank();
    p.adoption.firstTimeOwner = true;
    const { missing } = adoptionCompleteness(p);
    expect(missing).not.toContain("Vet reference");
    expect(missing).not.toContain("Current or past pets");
  });

  it("reaches 100% once every requirement is satisfied", () => {
    const p = blank();
    p.phone = "(773) 555-0142";
    p.adoption.household.caregiver = "Me";
    p.adoption.housing = {
      ...p.adoption.housing, dwelling: "house", ownership: "own",
      fencedYard: "yes", keptWhenAlone: "Free roam indoors",
    };
    p.adoption.employment.employer = "Floofer";
    p.adoption.vet = {
      ...p.adoption.vet, currentPets: "Miso the cat",
      vetName: "Lakeview Animal Clinic", vetPhone: "(773) 555-0142",
      allowReferenceCheck: true, financiallyPrepared: true,
    };
    expect(adoptionCompleteness(p).pct).toBe(100);
  });
});
