// Tiny global store behind the top-of-page loading bar.
//
// The % shown is an estimate: a server-rendered navigation doesn't report
// byte progress, so the bar eases toward 90% while waiting and jumps to 100%
// when the new page (or its data, see hold/release) has actually arrived.

type State = { active: boolean; visible: boolean; percent: number };

let state: State = { active: false, visible: false, percent: 0 };
const listeners = new Set<() => void>();
let trickle: ReturnType<typeof setInterval> | null = null;
let showTimer: ReturnType<typeof setTimeout> | null = null;
let hideTimer: ReturnType<typeof setTimeout> | null = null;
let settleTimer: ReturnType<typeof setTimeout> | null = null;
let holds = 0;

// Instant (prefetched) navigations finish before this — no flash of a bar.
const SHOW_DELAY_MS = 120;

function set(next: Partial<State>) {
  state = { ...state, ...next };
  listeners.forEach((l) => l());
}

function clearTimers() {
  if (trickle) clearInterval(trickle);
  if (showTimer) clearTimeout(showTimer);
  if (hideTimer) clearTimeout(hideTimer);
  trickle = showTimer = hideTimer = null;
}

export const navProgress = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  get: () => state,

  start() {
    if (state.active) return;
    clearTimers();
    set({ active: true, visible: false, percent: 8 });
    showTimer = setTimeout(() => set({ visible: true }), SHOW_DELAY_MS);
    trickle = setInterval(() => {
      // Fast at first, slowing as it approaches 90 — never claims done.
      const p = state.percent;
      set({ percent: Math.min(90, p + Math.max(0.4, (90 - p) * 0.09)) });
    }, 180);
  },

  done() {
    if (!state.active || holds > 0) return;
    clearTimers();
    if (!state.visible) {
      set({ active: false, percent: 0 });
      return;
    }
    set({ percent: 100 });
    hideTimer = setTimeout(() => set({ active: false, visible: false, percent: 0 }), 380);
  },

  // Called when the URL changes. Waits a beat before finishing, because a
  // loading skeleton mounting in that same commit may still call hold().
  settle() {
    if (settleTimer) clearTimeout(settleTimer);
    settleTimer = setTimeout(() => {
      settleTimer = null;
      navProgress.done();
    }, 60);
  },

  // A loading skeleton holds the bar open until its real content replaces it.
  hold() {
    holds += 1;
    if (settleTimer) clearTimeout(settleTimer);
    settleTimer = null;
    navProgress.start();
  },
  release() {
    holds = Math.max(0, holds - 1);
    // Deferred like settle(): a skeleton that unmounts and immediately
    // remounts (React Strict Mode in dev) re-holds before this fires.
    navProgress.settle();
  },
};
