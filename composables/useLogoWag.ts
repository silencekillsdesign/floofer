/* Shared trigger for the logo's tail wag.
   The header owns the only visible logo, but the moments worth celebrating
   (a like, a sent application) fire from the deck, the bio page and the
   message sheet. Routing them through one piece of state means the animation
   can never be wired up in one place and forgotten in another. */

/* Module scope so a rapid second like resets the same timer instead of racing
   a stale one. Only ever touched on the client (see the guard in wag). */
let settleTimer: ReturnType<typeof setTimeout> | null = null;

/** One full wag cycle, matching the keyframe duration in FlooferLogo.vue.
    Stopping on a whole cycle leaves the tail at 0deg, so it lands at rest
    instead of snapping back from mid-swing. */
const CYCLE_MS = 1150;

export function useLogoWag() {
  const wagging = useState<boolean>("floofer-wagging", () => false);

  /** Wag for `cycles` full swings, then settle. Calling again while wagging
      extends it rather than restarting, so fast swiping stays fluid. */
  function wag(cycles = 1) {
    if (!import.meta.client) return;
    wagging.value = true;
    if (settleTimer) clearTimeout(settleTimer);
    settleTimer = setTimeout(() => {
      wagging.value = false;
      settleTimer = null;
    }, CYCLE_MS * cycles);
  }

  return { wagging, wag };
}
