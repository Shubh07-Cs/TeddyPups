import type { CSSProperties } from "react";
import type { PoseName } from "@/lib/pup/rig";
import { PupBuddy } from "./PupBuddy";

export type StopAct = "tilt" | "treadmill" | "basket" | "peekaboo" | "lane";

/**
 * A place on the page where Teddy sits. On its own it's a PupBuddy; when the
 * walking Teddy (PupJourney) is active it reads these data-* attributes to plan its route.
 */
export function PupStop({ pose, facing = "right", act, behind = false, lane = false, className = "", style, label }: { pose: PoseName; facing?: "left" | "right"; act?: StopAct; behind?: boolean; lane?: boolean; className?: string; style?: CSSProperties; label?: string }) {
  return (
    <div data-pup-stop data-pose={pose} data-facing={facing} data-act={act} data-behind={behind || undefined} data-lane={lane || undefined} className={`pup-stop ${className}`} style={style}>
      <PupBuddy pose={pose} facing={facing} label={label} asStop />
    </div>
  );
}
