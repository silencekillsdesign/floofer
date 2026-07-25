/* Why a pet is at risk — structured, because free text can't teach.
 *
 * Animal-welfare research is consistent on one point: the animals closest to
 * euthanasia are rarely there because of anything they did. They're there
 * because of breed stigma, rental policy, a shelter with no isolation ward, or
 * a length-of-stay clock. An adopter looking at a pit bull with "200+ days"
 * reads a warning about the dog. It isn't one.
 *
 * Each category therefore ships with adopter-facing copy that separates the
 * animal from the circumstance. That's the whole point of the field. */

export type RiskCategory =
  | "breed-bias"
  | "long-stay"
  | "senior"
  | "medical"
  | "capacity"
  | "neonatal"
  | "unsocialized"
  | "behavior"
  | "transport";

export interface RiskCategoryInfo {
  label: string;
  icon: string;
  /** The reframe, in four words or so. Shown as the headline. */
  headline: string;
  /** Why this population is at risk — the part adopters don't know. */
  body: string;
  /** False when risk stems from the animal itself rather than circumstance.
      Drives the "this is about the shelter, not the pet" framing. */
  circumstantial: boolean;
}

export const RISK_CATEGORIES: Record<RiskCategory, RiskCategoryInfo> = {
  "breed-bias": {
    label: "Breed bias",
    icon: "🏷️",
    headline: "Stigma, not temperament",
    body: "Bully-breed dogs account for an estimated 40% or more of shelter dog euthanasias in North America, with Chihuahuas close behind in high-intake regions. Rental breed and weight limits shrink their adopter pool, so they wait longer — and long waits are what trigger space-based deadlines. This is housing policy and public perception, not this dog's behavior.",
    circumstantial: true,
  },
  "long-stay": {
    label: "Long stay",
    icon: "📆",
    headline: "The kennel, not the dog",
    body: "After 60 days and beyond, dogs develop barrier frustration, excessive barking and leash reactivity from overstimulation alone. These behaviors usually fade within weeks in a calm home. Visitors see a dog that looks unadoptable; the dog is reacting to the building.",
    circumstantial: true,
  },
  senior: {
    label: "Senior",
    icon: "🌅",
    headline: "Waits longest, cleared first",
    body: "Adopters worry about vet bills and shorter time together, so pets aged seven and up sit in kennels far longer than young ones — often after losing an owner to death, a move, or financial hardship. In high-volume shelters, length of stay is exactly what triggers space-clearing.",
    circumstantial: true,
  },
  medical: {
    label: "Treatable condition",
    icon: "🩺",
    headline: "Curable, but contagious",
    body: "Kennel cough, ringworm, mange and simple fractures are all treatable. Open-admission shelters frequently lack isolation space or a vet budget, so a curable animal becomes an outbreak risk to a crowded kennel — unless a foster or rescue can quarantine them.",
    circumstantial: true,
  },
  capacity: {
    label: "Space",
    icon: "🏚️",
    headline: "The shelter is full",
    body: "Open-admission shelters must accept every animal brought to them. When intake outpaces adoption, animals are cleared by length of stay rather than by anything they have done.",
    circumstantial: true,
  },
  neonatal: {
    label: "Bottle baby",
    icon: "🍼",
    headline: "Needs a foster tonight",
    body: "Unweaned animals under eight weeks need hand-feeding every two to four hours and controlled warmth. Most open-admission shelters have no overnight medical staff, so neonates without an immediate foster placement are at risk within hours of intake — not days.",
    circumstantial: true,
  },
  unsocialized: {
    label: "Fearful in kennel",
    icon: "🙀",
    headline: "Scared, not unadoptable",
    body: "Animals that shut down or lash out in a loud cage are routinely miscategorised as untreatable, especially where there is no working-animal or return-to-field programme. Behavior in a stressful kennel is a poor predictor of behavior in a home.",
    circumstantial: true,
  },
  behavior: {
    label: "Behavior review",
    icon: "📋",
    headline: "Under assessment",
    body: "Shelter staff are evaluating this animal. Ask what specific behavior was observed, in what context, and what management or training they recommend — a flag is a starting point for a conversation, not a verdict.",
    circumstantial: false,
  },
  transport: {
    label: "Transport deadline",
    icon: "🚐",
    headline: "A window, not a sentence",
    body: "A transfer or transport slot is already booked. Adopting before that date keeps this animal local; missing it usually means relocation to a partner organisation rather than euthanasia.",
    circumstantial: false,
  },
};

export const RISK_CATEGORY_OPTIONS = (
  Object.keys(RISK_CATEGORIES) as RiskCategory[]
).map((v) => ({ value: v, label: `${RISK_CATEGORIES[v].icon} ${RISK_CATEGORIES[v].label}` }));
