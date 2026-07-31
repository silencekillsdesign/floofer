import type { RiskCategory } from "~/data/riskCategories";
import type { FastPass } from "~/utils/fastPass";
export type { RiskCategory, FastPass };

/** The 5 pentagon axes. Pet side = what the dog needs; user side = what the home offers. */
export interface TraitPentagon {
  /** Pet: energy level · You: household activity level */
  energy: number;
  /** Pet: space needed · You: home space available */
  space: number;
  /** Pet: sociability · You: household busyness (kids, guests, other pets) */
  social: number;
  /** Pet: comfort being alone · You: hours the home is empty */
  independence: number;
  /** Pet: training needs (inverted: high = needs work) · You: handler experience */
  training: number;
}

/** `shelter` is limited-admission (no-kill); `municipal` is open-admission —
    animal control and county pounds, which euthanize for space and hold the
    dogs Floofer exists to surface. Keeping them distinct is the point: an
    adopter needs to know which countdown is real. */
export type SourceType = "shelter" | "municipal" | "foster" | "individual" | "retirement";
export type RiskLevel = "high" | "safe";
export type UserType = SourceType | "adopter";

/** Compatibility scale used by adoption platforms. */
export type YNS = "yes" | "no" | "selective";

export interface Dog {
  /* 1 — core */
  id: string;
  name: string;
  species: "dog"; // cats & more later
  breed: string;
  secondaryBreed?: string;
  age: number; // years; life stage is derived
  sex: "M" | "F";
  size: "small" | "medium" | "large";
  weightLbs: number;

  /* 2 — media */
  photos: string[]; // [0] = primary headshot
  videoUrl?: string;

  /* 3 — compatibility & behavior */
  goodWithDogs: YNS;
  goodWithCats: YNS;
  goodWithKids: "yes" | "no" | "older";
  houseTrained: "yes" | "no" | "in-training";
  crateTrained: boolean;
  traits: TraitPentagon;

  /* 4 — health & medical */
  spayNeuter: "yes" | "no" | "scheduled";
  vaccinated: boolean;
  microchipped: boolean;
  medicalNotes?: string;

  /* 5 — personality bio */
  tagline: string;
  bio: string;
  quirks?: string;
  background?: string;
  idealHome?: string;

  /* 6 — admin & logistics */
  /** Contact details ride along so an adopter can reach the listing org
      without a round-trip through the app. On a countdown that matters. */
  source: {
    type: SourceType;
    name: string;
    website?: string;
    phone?: string;
    email?: string;
    contactName?: string;
  };
  location: { lat: number; lng: number; city: string };
  adoptionFee: number;
  risk: RiskLevel;
  riskReason?: string;
  /** Structured "why" behind the risk. Free text can state a reason; only a
      category can teach an adopter that it isn't about the animal. */
  riskCategory?: RiskCategory;
  /** ISO timestamp for hour-scale emergencies. A neonate's window is measured
      in feeds, not days — "0 days left" and "3 hours left" are different
      decisions. When set, this supersedes daysLeft in the UI. */
  criticalUntil?: string;
  daysLeft?: number;
  adopted?: boolean;

  /** Set when the placement exists and the only missing piece is a driver.
      A dog with a foster 40 miles away and nobody to make the drive is still
      on the list — this is the cheapest save in rescue and the easiest way in
      for someone who can't take an animal home. Origin is the listing's own
      city, so only the far end is stored. */
  transport?: { to: string; when: string };
}

/** A postal address. Shelters need a real one to run a home check or verify a
    landlord — "Chicago, IL" isn't enough to approve a placement. Kept
    structured so it can be validated and, later, geocoded. */
export interface Address {
  street: string;
  street2: string;
  city: string;
  state: string;
  postalCode: string;
}

/** Who to call at an organization. A shelter listing needs a named human and
    a direct line — an adopter with a dog on a countdown cannot wait on a
    generic inbox. */
export interface OrgDetails {
  orgName: string;
  website: string;
  contactName: string;
  contactRole: string;
  contactPhone: string;
  contactEmail: string;
  /** When an animal can physically be collected. Fast-Pass promises a
      two-hour response; that promise is decorative if nobody knows whether
      the door is open. */
  collectionHours: string;
  /** Answered outside those hours. An animal's window doesn't keep office
      hours, and neither does a transport leg that falls through at 9pm. */
  emergencyPhone: string;
  /** Long-term care only: how much room is actually free. A range, not a
      count — an exact number is stale the day after it's typed, and
      "about two" is the honest answer anyway. */
  openings: "" | "none" | "1-2" | "3-5" | "6+";
  /** Takes end-of-life cases. Rare, and the reason a sanctuary is often the
      only call left to make. */
  hospice: boolean;
}

/** "Chicago, IL" — the at-a-glance line used on cards and headers. */
export function cityLine(a: Address): string {
  return [a.city, a.state].filter((s) => s.trim()).join(", ");
}

/** Full postal address, one line per part, for records and home checks. */
export function formatAddress(a: Address): string[] {
  const last = [cityLine(a), a.postalCode].filter((s) => s.trim()).join(" ");
  return [a.street, a.street2, last].map((s) => s.trim()).filter(Boolean);
}

/** One child in the household. Age is the only field that affects matching —
    a dog flagged "good with older kids" is a different answer at 4 than 14. */
export interface HouseholdChild {
  id: string;
  age: number;
}

/** One pet, current or previous. Kept as records rather than prose: a rescue
    scanning "Rex, lab mix, passed of old age in 2022" can't tell one pet from
    three, and neither can the app. */
export interface HouseholdPet {
  id: string;
  name: string;
  kind: string;
  stillWithMe: boolean;
  /** Where they are now, when they're no longer with you. This is the field
      rescues actually read — it's how they learn what happens to your animals. */
  note: string;
}

/** How long a home can hold an animal. Anything under a week is still worth
    having — a weekend covers the gap between a euthanasia list and a
    transport run. */
export type FosterDuration = "" | "days" | "2-4-weeks" | "2-months" | "open";

/** Medication a foster is willing to give. The line between "oral" and
    "injections" decides whether a treatable animal is placeable at all. */
export type FosterMedical = "" | "none" | "oral" | "injections";

/** What a household is open to. Adoption is the happy ending; fostering is
    what buys the time to reach it. Foster capacity — not adopter demand — is
    what caps how many animals a rescue can pull off a list, so this has to be
    askable of every adopter, not hidden behind a separate account type. */
export interface PlacementOffer {
  adopt: boolean;
  foster: boolean;
  /** Animals at once. */
  capacity: number;
  duration: FosterDuration;
  medical: FosterMedical;
  /** A room that closes — the prerequisite for a contagious-but-treatable
      animal, and for a dog that can't meet resident pets yet. */
  separateSpace: boolean;
}

/* Adoption-application details, modeled on a standard humane-society dog
   adoption form. Only pre-adoption facts live here — per-dog questions
   (why this dog, signatures) belong to the application moment. */
export interface AdoptionDetails {
  /** Adopt, foster, or both. Lives here because a rescue reads the same
      household facts either way — vaccinations, landlord, hours alone — and
      making people fill them in twice is how you lose a foster. */
  openTo: PlacementOffer;
  employment: { employer: string; occupation: string; years: string };
  isStudent: boolean;
  isMilitary: boolean;
  firstTimeOwner: boolean;
  household: {
    residents: number;
    children: HouseholdChild[];
    allergies: string;
    caregiver: string;
  };
  housing: {
    dwelling: "" | "house" | "apartment" | "condo" | "farm" | "other";
    ownership: "" | "own" | "rent" | "family";
    landlordName: string;
    landlordPhone: string;
    petsAllowed: "" | "yes" | "no" | "unsure";
    fencedYard: "" | "yes" | "no";
    hoursAlone: number;
    keptWhenAlone: string;
    traffic: "" | "light" | "moderate" | "heavy";
  };
  vet: {
    /** Current and previous animals in one list — they're the same kind of
        record, and splitting them made people re-enter the same pet twice. */
    pets: HouseholdPet[];
    petsVaccinated: "" | "yes" | "no";
    petsFixed: "" | "yes" | "no";
    vetName: string;
    vetPhone: string;
    allowReferenceCheck: boolean;
    financiallyPrepared: boolean;
  };
}

export interface StoredDoc {
  name: string;
  date: string;
  size: string;
  /** Seeded demo records can't be deleted-then-missed; uploads can. */
  builtin?: boolean;
}

export interface Profile {
  userType: UserType;
  /** Set when signed in as org staff — which organization's listings they
      manage. Absent for adopters and for the demo (no-backend) build. */
  orgId?: string;
  name: string;
  email: string;
  phone: string;
  address: Address;
  /** Populated for organisations; ignored for adopters and private rehomers. */
  org: OrgDetails;
  traits: TraitPentagon;
  payment: { brand: string; last4: string; exp: string } | null;
  /** Shown to shelters during a home check. */
  homePhotos: string[];
  /** Pets already living in the home — used for compatibility review. */
  petPhotos: string[];
  adoption: AdoptionDetails;
  documents: StoredDoc[];
  /** Pre-vetting so an emergency placement doesn't start the approval clock. */
  fastPass?: FastPass;
  /** ISO date the adopter finished onboarding; absent = they haven't yet.
      Skipping still stamps it — nobody should meet the wizard twice. */
  onboardedAt?: string;
}

export interface Filters {
  breed: string;
  size: "all" | "small" | "medium" | "large";
  sex: "all" | "M" | "F";
  /** 15 means "15+" — no upper cap. */
  maxAge: number;
  maxMiles: number;
  minMatch: number;
  /** "high" = at-risk only. */
  urgency: "all" | "high";
  goodWith: ("dogs" | "cats" | "kids")[];
  houseTrained: boolean;
  fixed: boolean;
  vaccinated: boolean;
  /** empty = all sources. */
  sources: SourceType[];
  /** empty = every risk reason. */
  riskCategories: RiskCategory[];
}
