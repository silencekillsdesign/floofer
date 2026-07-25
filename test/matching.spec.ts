import { describe, expect, it } from "vitest";
import {
  adoptionCompleteness,
  applyFilters,
  defaultFilters,
  HOME,
  lifeStage,
  migrateProfile,
  milesBetween,
  milesFrom,
  scoreMatch,
} from "~/composables/useStore";
import { CITY_OPTIONS, DOGS } from "~/data/dogs";
import type { Dog, Filters, Profile, TraitPentagon } from "~/types";
import { cityLine, formatAddress } from "~/types";

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

  /* The populations that wait longest are the reason the app exists, so an
     adopter has to be able to ask for them specifically. */
  it("filters to a single risk reason", () => {
    const out = applyFilters(DOGS, f({ riskCategories: ["breed-bias"] }), match);
    expect(out.length).toBeGreaterThan(0);
    expect(out.every((d) => d.riskCategory === "breed-bias")).toBe(true);
  });

  it("treats an empty risk-reason filter as every reason", () => {
    const all = applyFilters(DOGS, f(), match);
    const explicit = applyFilters(DOGS, f({ riskCategories: [] }), match);
    expect(explicit.length).toBe(all.length);
  });

  /* Every at-risk dog must carry a category, or the pet page has no reframe to
     show and the countdown reverts to an unexplained warning. */
  it("gives every at-risk dog a category to explain it", () => {
    const uncategorised = DOGS.filter((d) => d.risk === "high" && !d.riskCategory);
    expect(uncategorised.map((d) => d.name)).toEqual([]);
  });

  it("separates open-admission shelters from no-kill ones", () => {
    const municipal = applyFilters(DOGS, f({ sources: ["municipal"] }), match);
    expect(municipal.length).toBeGreaterThan(0);
    expect(municipal.every((d) => d.source.type === "municipal")).toBe(true);
    expect(municipal.some((d) => d.source.type === "shelter")).toBe(false);
  });

  /* The distinction only earns its keep if the countdown lives on the side
     that actually euthanizes — a no-kill shelter with a death clock is the
     data bug this source type exists to prevent. */
  it("puts every euthanasia countdown on an open-admission shelter", () => {
    const noKillWithClock = DOGS.filter(
      (d) => d.source.type === "shelter" && d.risk === "high" && d.riskReason?.includes("capacity"),
    );
    expect(noKillWithClock).toEqual([]);
  });
});

/* Onboarding's "use my location" resolves coordinates to a listed area. Getting
   this wrong drops someone into the wrong city's deck without telling them. */
describe("milesBetween / nearest area", () => {
  const nearest = (lat: number, lng: number) =>
    CITY_OPTIONS.map((c) => ({ c, mi: milesBetween({ lat, lng }, c) }))
      .sort((a, b) => a.mi - b.mi)[0];

  it("is zero for the same point", () => {
    expect(milesBetween(HOME, HOME)).toBe(0);
  });

  it("is symmetric", () => {
    const a = { lat: 41.88, lng: -87.63 };
    const b = { lat: 42.05, lng: -87.69 };
    expect(milesBetween(a, b)).toBeCloseTo(milesBetween(b, a), 6);
  });

  it("matches a known distance — the Loop to Evanston is about 12 miles", () => {
    const mi = milesBetween(HOME, { lat: 42.0451, lng: -87.6877 });
    expect(mi).toBeGreaterThan(10);
    expect(mi).toBeLessThan(14);
  });

  it("resolves coordinates to the closest listed area", () => {
    // Standing in Evanston
    expect(nearest(42.0451, -87.6877).c.city).toBe("Evanston");
    // Standing in Naperville
    expect(nearest(41.7658, -88.1535).c.city).toBe("Naperville");
  });

  /* Someone in Denver must not be silently filed under Naperville. */
  it("puts a far-away coordinate outside the service radius", () => {
    const denver = nearest(39.7392, -104.9903);
    expect(denver.mi).toBeGreaterThan(60);
  });

  it("keeps every listed area inside the service radius of at least one match", () => {
    for (const c of CITY_OPTIONS) {
      expect(nearest(c.lat, c.lng).mi).toBeLessThan(1);
    }
  });
});

describe("address formatting", () => {
  const a = (over = {}) => ({
    street: "1600 N Milwaukee Ave", street2: "Apt 3F",
    city: "Chicago", state: "IL", postalCode: "60622", ...over,
  });

  it("renders a city line", () => {
    expect(cityLine(a())).toBe("Chicago, IL");
  });

  it("omits an empty state rather than leaving a dangling comma", () => {
    expect(cityLine(a({ state: "" }))).toBe("Chicago");
  });

  it("builds a postal address one line per part", () => {
    expect(formatAddress(a())).toEqual(["1600 N Milwaukee Ave", "Apt 3F", "Chicago, IL 60622"]);
  });

  it("skips blank lines so a partial address still reads", () => {
    expect(formatAddress(a({ street2: "", postalCode: "" }))).toEqual([
      "1600 N Milwaukee Ave", "Chicago, IL",
    ]);
  });

  it("returns nothing at all for an empty address", () => {
    expect(formatAddress({ street: "", street2: "", city: "", state: "", postalCode: "" })).toEqual([]);
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

/* Shared by the completeness and migration suites. */
const blank = (): Profile => ({
    userType: "adopter",
    name: "Test", email: "t@example.com", phone: "",
    address: { street: "1 Test St", street2: "", city: "Chicago", state: "IL", postalCode: "60601" },
    org: { orgName: "", website: "", contactName: "", contactRole: "", contactPhone: "", contactEmail: "" },
    traits: HOME_LIKE(),
    payment: null, homePhotos: [], petPhotos: [], documents: [],
    adoption: {
      employment: { employer: "", occupation: "", years: "" },
      isStudent: false, isMilitary: false, firstTimeOwner: false,
      household: { residents: 1, children: [], allergies: "", caregiver: "" },
      housing: {
        dwelling: "", ownership: "", landlordName: "", landlordPhone: "",
        petsAllowed: "", fencedYard: "", hoursAlone: 4, keptWhenAlone: "", traffic: "",
      },
      vet: {
        pets: [], petsVaccinated: "", petsFixed: "",
        vetName: "", vetPhone: "", allowReferenceCheck: false, financiallyPrepared: false,
      },
  },
});

describe("adoptionCompleteness", () => {
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
      ...p.adoption.vet,
      pets: [{ id: "p1", name: "Miso", kind: "Cat", stillWithMe: true, note: "" }],
      vetName: "Lakeview Animal Clinic", vetPhone: "(773) 555-0142",
      allowReferenceCheck: true, financiallyPrepared: true,
    };
    expect(adoptionCompleteness(p).pct).toBe(100);
  });
});

/* Children and pets used to be free text. Nobody should lose what they typed
   because the field became a list. */
describe("migrateProfile", () => {
  const legacy = (household: any, vet: any) => {
    const p = blank();
    Object.assign(p.adoption.household, household);
    Object.assign(p.adoption.vet, vet);
    return migrateProfile(p);
  };

  it("splits written ages into separate children", () => {
    const p = legacy({ childrenAges: "6 and 11" }, {});
    expect(p.adoption.household.children.map((c) => c.age)).toEqual([6, 11]);
  });

  it("handles a single age and commas alike", () => {
    expect(legacy({ childrenAges: "4" }, {}).adoption.household.children).toHaveLength(1);
    expect(legacy({ childrenAges: "2, 5, 9" }, {}).adoption.household.children).toHaveLength(3);
  });

  it("keeps current and past pets on the right side of the line", () => {
    const p = legacy({}, { currentPets: "Miso the cat", pastPets: "Rex, lab mix, passed 2022" });
    const pets = p.adoption.vet.pets;
    expect(pets.some((x) => x.stillWithMe && /Miso/.test(x.name))).toBe(true);
    expect(pets.some((x) => !x.stillWithMe && /Rex/.test(x.name))).toBe(true);
  });

  it("preserves text it can't parse rather than dropping it", () => {
    const p = legacy({}, { currentPets: "a very old tortoise, name unknown" });
    expect(p.adoption.vet.pets.length).toBeGreaterThan(0);
    expect(p.adoption.vet.pets[0].name).toContain("tortoise");
  });

  it("leaves an already-migrated profile alone", () => {
    const p = blank();
    p.adoption.household.children = [{ id: "x", age: 8 }];
    const out = migrateProfile(p);
    expect(out.adoption.household.children).toEqual([{ id: "x", age: 8 }]);
  });

  it("splits a legacy city string into city and state", () => {
    const p = blank();
    delete (p as any).address;
    (p as any).city = "Evanston, IL";
    const out = migrateProfile({ ...p, address: { street: "", street2: "", city: "", state: "", postalCode: "" } } as any);
    expect(out.address.city).toBe("Evanston");
    expect(out.address.state).toBe("IL");
    expect((out as any).city).toBeUndefined();
  });

  it("keeps a bare city when no state was given", () => {
    const p: any = { ...blank(), city: "Chicago" };
    p.address = { street: "", street2: "", city: "", state: "IL", postalCode: "" };
    const out = migrateProfile(p);
    expect(out.address.city).toBe("Chicago");
    expect(out.address.state).toBe("IL");
  });

  it("drops the legacy fields once migrated", () => {
    const p = legacy({ childrenAges: "7" }, { currentPets: "Miso" });
    const raw = p.adoption as any;
    expect(raw.household.childrenAges).toBeUndefined();
    expect(raw.vet.currentPets).toBeUndefined();
  });
});
