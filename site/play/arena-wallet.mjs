import { ARENA_SCHEDULE_BOUTS, BOUT_MS, combatAtTime, validCombatSession } from "./combat.mjs?v=glad-002";
import { validTier } from "./difficulty.mjs?v=arena-v1";

const WIN_PRIZES = Object.freeze([12, 20, 32, 48, 68, 92, 122, 158]);

export function arenaReward(grade) {
  if (!validTier(grade)) throw new RangeError("Invalid arena grade");
  return WIN_PRIZES[grade];
}

export function settleArenaPrizes(session) {
  if (!session || !validCombatSession(session)) throw new RangeError("Invalid arena session");
  const complete = Math.floor(session.elapsedMs / BOUT_MS);
  const cursor = session.prizeCursor ?? 0;
  if (!Number.isSafeInteger(cursor) || cursor < 0 || cursor > complete)
    throw new RangeError("Invalid arena prize cursor");
  const count = complete - cursor;
  const repeats = Math.floor(count / ARENA_SCHEDULE_BOUTS);
  const extra = count % ARENA_SCHEDULE_BOUTS;
  let victories = 0;
  // Any whole schedule has the same tally. Inspect its first positions
  // once, and use those same positions for the partial remaining schedule.
  for (let offset = 0; offset < Math.min(count, ARENA_SCHEDULE_BOUTS); offset++) {
    const bout = (cursor + offset) % ARENA_SCHEDULE_BOUTS;
    const resolved = combatAtTime({ ...session, prizeCursor: 0, elapsedMs: (bout + 1) * BOUT_MS - 1 });
    if (resolved.outcome === "victory") victories += repeats + Number(offset < extra);
  }
  return {
    session: { ...session, prizeCursor: complete },
    coins: victories * arenaReward(session.player.difficulty ?? 0)
  };
}
