import { ARENA_SCHEDULE_BOUTS, BOUT_MS, RESURRECTION_MS, combatAtTime, validCombatSession } from "./combat.mjs?v=glad-003";
import { validTier } from "./difficulty.mjs?v=glad-002";

const WIN_PRIZES = Object.freeze([12, 20, 32, 48, 68, 92, 122, 158]);

export function arenaReward(grade) {
  if (!validTier(grade)) throw new RangeError("Invalid arena grade");
  return WIN_PRIZES[grade];
}

export function settleArenaPrizes(session, fromElapsed = (session?.prizeCursor ?? 0) * BOUT_MS) {
  if (!session || !validCombatSession(session)) throw new RangeError("Invalid arena session");
  const complete = Math.floor(session.elapsedMs / BOUT_MS);
  const cursor = session.prizeCursor ?? 0;
  if (!Number.isSafeInteger(cursor) || cursor < 0 || cursor > complete)
    throw new RangeError("Invalid arena prize cursor");
  const count = complete - cursor;
  const repeats = Math.floor(count / ARENA_SCHEDULE_BOUTS);
  const extra = count % ARENA_SCHEDULE_BOUTS;
  let victories = 0;
  let downtimeMs = 0;
  const outcomes = new Map();
  function outcomeAt(index) {
    const bout = index % ARENA_SCHEDULE_BOUTS;
    if (!outcomes.has(bout)) outcomes.set(bout,
      combatAtTime({ ...session, prizeCursor: 0, elapsedMs: (bout + 1) * BOUT_MS - 1 }).outcome);
    return outcomes.get(bout);
  }
  const partialDowntime = elapsed => {
    const overlap = Math.max(0, elapsed % BOUT_MS - (BOUT_MS - RESURRECTION_MS));
    return overlap && outcomeAt(Math.floor(elapsed / BOUT_MS)) !== "victory" ? overlap : 0;
  };
  // Any whole schedule has the same tally. Inspect its first positions
  // once, and use those same positions for the partial remaining schedule.
  for (let offset = 0; offset < Math.min(count, ARENA_SCHEDULE_BOUTS); offset++) {
    const tally = repeats + Number(offset < extra);
    if (outcomeAt(cursor + offset) === "victory") victories += tally;
    else downtimeMs += tally * RESURRECTION_MS;
  }
  downtimeMs += partialDowntime(session.elapsedMs) - partialDowntime(fromElapsed);
  return {
    session: { ...session, prizeCursor: complete },
    downtimeMs,
    coins: victories * arenaReward(session.player.difficulty ?? 0)
  };
}
