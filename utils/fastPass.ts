/* Fast-Pass — pre-vetting, because approval is slower than the deadline.
 *
 * The standard adoption path is: see the animal, apply, wait for a landlord
 * check and a vet reference, get approved. Three to ten days. A neonatal
 * kitten without a foster is at risk within hours of intake; a dog on a
 * space-clearing list often has one working day. The approval process is
 * itself a cause of death.
 *
 * Fast-Pass moves every slow step earlier. An adopter gets verified once,
 * declares what kind of emergency they can absorb and how fast they can move,
 * and is then reachable the moment an animal's window opens. Nothing here
 * speeds up vetting — it just refuses to start it during an emergency. */

import type { Profile } from "~/types";

export type FastPassStatus = "none" | "incomplete" | "pending" | "verified" | "expired";

/** What kind of emergency a household can actually absorb. Deliberately
    specific: "willing to help" is not dispatchable information. */
export type Capability =
  | "bottle-feeding"
  | "medical-isolation"
  | "kennel-decompression"
  | "senior-hospice"
  | "transport";

export interface CapabilityInfo {
  label: string;
  icon: string;
  /** The commitment in plain terms, so nobody opts in by accident. */
  ask: string;
  /** Which risk categories this capability answers. */
  answers: string[];
}

export const CAPABILITIES: Record<Capability, CapabilityInfo> = {
  "bottle-feeding": {
    label: "Bottle feeding",
    icon: "🍼",
    ask: "Hand-feeding every 2–4 hours, including overnight, for several weeks. The single scarcest capability in rescue.",
    answers: ["neonatal"],
  },
  "medical-isolation": {
    label: "Medical isolation",
    icon: "🩺",
    ask: "A separate room where a contagious but treatable animal can recover without exposing other pets.",
    answers: ["medical"],
  },
  "kennel-decompression": {
    label: "Decompression space",
    icon: "🌿",
    ask: "A quiet home and two weeks of low expectations while a shelter-stressed dog comes back to itself.",
    answers: ["long-stay", "unsocialized", "breed-bias"],
  },
  "senior-hospice": {
    label: "Senior & hospice",
    icon: "🌅",
    ask: "Comfort care for an animal in its last months, knowing how that ends.",
    answers: ["senior"],
  },
  transport: {
    label: "Transport",
    icon: "🚐",
    ask: "Driving an animal to a foster, a rescue partner, or a vet at short notice.",
    answers: ["transport", "capacity"],
  },
};

/** How quickly this household can physically collect an animal. */
export type ResponseWindow = "2h" | "same-day" | "24h" | "48h";

export const RESPONSE_WINDOWS: { value: ResponseWindow; label: string }[] = [
  { value: "2h", label: "Within 2 hours" },
  { value: "same-day", label: "Same day" },
  { value: "24h", label: "Within 24 hours" },
  { value: "48h", label: "Within 48 hours" },
];

export interface FastPass {
  capabilities: Capability[];
  responseWindow: ResponseWindow;
  /** Set by a partner org once documents and references check out. */
  verifiedAt?: string;
  verifiedBy?: string;
  /** Paused by the adopter — travelling, full, or otherwise unavailable. */
  pausedUntil?: string;
}

/** Verification is re-checked annually; circumstances change. */
const VERIFICATION_VALID_DAYS = 365;

export interface ReadinessCheck {
  label: string;
  done: boolean;
  /** Why an emergency placement needs this specific thing. */
  why: string;
}

/** Everything that has to be true before a shelter can hand over an animal in
    an emergency. Each item exists because it would otherwise be chased at the
    worst possible moment. */
export function fastPassChecks(p: Profile): ReadinessCheck[] {
  const a = p.adoption;
  const fp = p.fastPass;
  const housingProven =
    a.housing.ownership === "own" ||
    (!!a.housing.landlordPhone.trim() && a.housing.petsAllowed === "yes");

  return [
    {
      label: "Reachable by phone",
      done: !!p.phone.trim(),
      why: "Email is too slow when the window is hours.",
    },
    {
      label: "Housing cleared for pets",
      done: housingProven,
      why: "A landlord call is the single slowest step in a normal approval.",
    },
    {
      label: "Vet reference on file",
      done: !!a.vet.vetName.trim() && !!a.vet.vetPhone.trim(),
      why: "Rescues verify how previous animals were cared for. Chasing it costs a day.",
    },
    {
      label: "Reference check pre-authorised",
      done: a.vet.allowReferenceCheck,
      why: "Permission granted in advance means calls can happen before you're asked.",
    },
    {
      label: "Home photos uploaded",
      done: p.homePhotos.length > 0,
      why: "Stands in for a home visit that cannot be scheduled in time.",
    },
    {
      label: "At least one capability declared",
      done: !!fp?.capabilities.length,
      why: "Shelters dispatch by capability, not by good intentions.",
    },
  ];
}

export function fastPassStatus(p: Profile): FastPassStatus {
  const fp = p.fastPass;
  const checks = fastPassChecks(p);
  const allDone = checks.every((c) => c.done);

  if (!fp?.capabilities.length && !checks.some((c) => c.done)) return "none";
  if (!allDone) return "incomplete";
  if (!fp?.verifiedAt) return "pending";

  const ageDays = (Date.now() - new Date(fp.verifiedAt).getTime()) / 86_400_000;
  if (Number.isNaN(ageDays)) return "pending";
  return ageDays > VERIFICATION_VALID_DAYS ? "expired" : "verified";
}

/** Can this household answer this particular emergency, right now? */
export function canAnswer(p: Profile, riskCategory?: string): boolean {
  if (!riskCategory) return false;
  if (fastPassStatus(p) !== "verified") return false;
  const fp = p.fastPass;
  if (!fp) return false;
  if (fp.pausedUntil && new Date(fp.pausedUntil).getTime() > Date.now()) return false;
  return fp.capabilities.some((c) => CAPABILITIES[c].answers.includes(riskCategory));
}

/** Hours left on an hour-scale window. Days are the wrong unit for a neonate:
    "0 days" and "3 hours" mean very different things to someone deciding
    whether to get in the car tonight. */
export function hoursUntil(iso: string, now = new Date()): number {
  const ms = new Date(iso).getTime() - now.getTime();
  if (Number.isNaN(ms)) return Number.NaN;
  return Math.max(0, Math.floor(ms / 3_600_000));
}
