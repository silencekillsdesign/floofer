/* Play dates — the meet-and-greet, which is where adoptions are actually won
 * or lost. A long-stay dog reads as unadoptable in a kennel and like himself
 * in a yard; the meeting is the whole argument.
 *
 * Scheduling is the friction, so this deliberately avoids exact times.
 * Shelters think in "Saturday morning", not 14:30 — and day parts dodge the
 * timezone problems that a naive datetime picker creates between a phone and
 * a shelter's desktop. The adopter offers a few windows, the shelter picks
 * one. No back-and-forth thread required. */

export type DayPart = "morning" | "afternoon" | "evening";
export type PlayDateState = "requested" | "confirmed" | "declined" | "completed" | "cancelled";

export interface PlayDateSlot {
  /** Local calendar date, YYYY-MM-DD. */
  date: string;
  part: DayPart;
}

export const DAY_PARTS: { value: DayPart; label: string; hint: string }[] = [
  { value: "morning", label: "Morning", hint: "9am – 12pm" },
  { value: "afternoon", label: "Afternoon", hint: "12pm – 5pm" },
  { value: "evening", label: "Evening", hint: "5pm – 8pm" },
];

/** Most a person can offer. Three is enough for a shelter to find one that
    works; more turns a favour into a chore. */
export const MAX_SLOTS = 3;

const pad = (n: number) => String(n).padStart(2, "0");

/** Local calendar date — never toISOString(), which is UTC and rolls the day
    over in the evening for anyone west of Greenwich. */
export function localDate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** The next `count` days, starting today. */
export function upcomingDays(count = 7, from = new Date()): { date: string; weekday: string; day: number; month: string }[] {
  const out = [];
  for (let i = 0; i < count; i++) {
    const d = new Date(from.getFullYear(), from.getMonth(), from.getDate() + i);
    out.push({
      date: localDate(d),
      weekday: d.toLocaleDateString(undefined, { weekday: "short" }),
      day: d.getDate(),
      month: d.toLocaleDateString(undefined, { month: "short" }),
    });
  }
  return out;
}

export const slotKey = (s: PlayDateSlot) => `${s.date}:${s.part}`;

export function formatSlot(s: PlayDateSlot): string {
  const [y, m, d] = s.date.split("-").map(Number);
  const when = new Date(y, (m ?? 1) - 1, d ?? 1);
  const day = when.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" });
  return `${day}, ${s.part}`;
}

/** A slot whose day has already passed can't be confirmed. Compared by
    calendar date rather than timestamp so "today, evening" stays offerable
    all day. */
export function isSlotPast(s: PlayDateSlot, now = new Date()): boolean {
  return s.date < localDate(now);
}

export const STATE_UI: Record<PlayDateState, { label: string; tone: "wait" | "good" | "bad" | "done" }> = {
  requested: { label: "Awaiting the shelter", tone: "wait" },
  confirmed: { label: "Confirmed", tone: "good" },
  declined: { label: "Couldn't make those times", tone: "bad" },
  completed: { label: "Met", tone: "done" },
  cancelled: { label: "Cancelled", tone: "bad" },
};
