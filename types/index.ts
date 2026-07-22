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

export type SourceType = "shelter" | "foster" | "individual" | "retirement";
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
  source: { type: SourceType; name: string };
  location: { lat: number; lng: number; city: string };
  adoptionFee: number;
  risk: RiskLevel;
  riskReason?: string;
  daysLeft?: number;
  adopted?: boolean;
}

export interface Profile {
  userType: UserType;
  name: string;
  email: string;
  city: string;
  traits: TraitPentagon;
  payment: { brand: string; last4: string; exp: string } | null;
  /** Shown to shelters during a home check. */
  homePhotos: string[];
  /** Pets already living in the home — used for compatibility review. */
  petPhotos: string[];
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
}
