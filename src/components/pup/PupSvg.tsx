import type { CSSProperties } from "react";
import { BLUSH, COLLAR, CREAM, EYE_Y, FLOOR, FUR, FUR_SHADE, H, INK, LEGS, PATHS, POSES, solve, toes, W, type PoseName } from "@/lib/pup/rig";

const line = { stroke: INK, strokeWidth: 3.4, strokeLinejoin: "round", strokeLinecap: "round" } as const;
const outline = { ...line, fill: "none" } as const;

function Leg({ part, d, len, fill, transform, opacity }: { part: string; d: string; len: number; fill: string; transform: string; opacity?: number }) {
  return (
    <g data-p={part} transform={transform} opacity={opacity}>
      <path d={`${d}Z`} fill={fill} />
      <path d={d} {...outline} />
      <path d={toes(len)} {...outline} strokeWidth={2.4} />
    </g>
  );
}

function Eyes() {
  return (
    <>
      <ellipse cx={194} cy={EYE_Y} rx={7.4} ry={8.6} fill={INK} />
      <ellipse cx={230} cy={EYE_Y} rx={7.4} ry={8.6} fill={INK} />
      <circle cx={196.6} cy={EYE_Y - 3.4} r={2.7} fill="#fff" />
      <circle cx={232.6} cy={EYE_Y - 3.4} r={2.7} fill="#fff" />
      <circle cx={192} cy={EYE_Y + 3.2} r={1.2} fill="#fff" />
      <circle cx={228} cy={EYE_Y + 3.2} r={1.2} fill="#fff" />
    </>
  );
}

/**
 * Teddy, the TeddyPups mascot, as a rigged SVG. Every moving part carries a
 * `data-p` name so PupDriver can animate it by writing attributes directly.
 */
export function PupSvg({ pose = "sit", facing = "right", className, label, style }: { pose?: PoseName; facing?: "left" | "right"; className?: string; label?: string; style?: CSSProperties }) {
  const f = solve(POSES[pose]);
  const flip = facing === "left" ? `translate(${W} 0) scale(-1 1)` : undefined;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={className} style={{ overflow: "visible", ...style }} role={label ? "img" : undefined} aria-label={label} aria-hidden={!label || undefined} focusable="false">
      <g data-p="root" transform={flip}>
        <ellipse data-p="shadow" {...PATHS.shadow} fill={INK} opacity={f.shadowOpacity} transform={f.shadow} style={{ transformBox: "fill-box", transformOrigin: "center" }} />
        <g data-p="body" transform={f.body} opacity={f.side}>
          <Leg part="bf" d={LEGS.backFar} len={FLOOR - 192} fill={FUR_SHADE} transform={f.bf} opacity={f.backLegs} />
          <Leg part="ff" d={LEGS.frontFar} len={FLOOR - 192} fill={FUR_SHADE} transform={f.ff} />
          <g data-p="tail" transform={f.tail}>
            <path d={PATHS.tailStem} {...outline} strokeWidth={9} />
            <path d={PATHS.tailStem} stroke={FUR} strokeWidth={4} fill="none" strokeLinecap="round" />
            <path d={PATHS.tail} fill={FUR} {...line} />
          </g>
          <Leg part="bn" d={LEGS.back} len={FLOOR - 194} fill={FUR} transform={f.bn} opacity={f.backLegs} />
          <path d={PATHS.body} fill={FUR} {...line} />
          <path d={PATHS.chest} fill={FUR} {...line} />
          <Leg part="fn" d={LEGS.front} len={FLOOR - 194} fill={FUR} transform={f.fn} />
        </g>
        <g data-p="haunch" opacity={f.haunchOpacity} transform={f.haunch}>
          <path d={PATHS.haunch} fill={FUR} {...line} />
          <path d={PATHS.haunchPaw} fill={FUR} {...line} />
          <path d="M132 222v5M139 222v5" {...outline} strokeWidth={2.4} />
        </g>
        <g data-p="head" transform={f.head}>
          <path d={PATHS.collar} fill={COLLAR} {...line} strokeWidth={3} />
          <path d={PATHS.tag} fill={CREAM} {...line} strokeWidth={2.4} />
          <path data-p="earL" d={PATHS.earL} fill={FUR_SHADE} {...line} transform={f.earL} />
          <path data-p="earR" d={PATHS.earR} fill={FUR_SHADE} {...line} transform={f.earR} />
          <path d={PATHS.head} fill={FUR} {...line} />
          <path d={PATHS.topknot} fill={FUR} {...line} strokeWidth={3} />
          <path d={PATHS.muzzle} fill={CREAM} />
          <circle cx={181} cy={116} r={7} fill={BLUSH} opacity={0.85} />
          <circle cx={243} cy={116} r={7} fill={BLUSH} opacity={0.85} />
          <g data-p="eyes" transform={f.eyes}>
            <g data-p="open" opacity={f.openEyes}>
              <g data-p="blink" transform={f.blink}>
                <Eyes />
              </g>
            </g>
          </g>
          <path data-p="happy" d="M186.5 101 Q194 91.5 201.5 101 M222.5 101 Q230 91.5 237.5 101" {...outline} opacity={f.happyEyes} />
          <path data-p="shut" d="M186.5 97 Q194 103.5 201.5 97 M222.5 97 Q230 103.5 237.5 97" {...outline} opacity={f.shutEyes} />
          <path d={PATHS.nose} fill={INK} />
          <path d={PATHS.mouth} {...outline} strokeWidth={3} />
          <path data-p="tongue" d={PATHS.tongue} fill="#e98c8c" stroke={INK} strokeWidth={2.2} strokeLinejoin="round" opacity={f.tongue} />
          <g data-p="mouth" opacity={f.mouth}>
            <path d={PATHS.mouthOpen} fill="#6b2a1c" {...line} strokeWidth={2.6} />
            <path d="M206.5 133.5 Q212 130 217.5 133.5 Q215 138 212 138 Q209 138 206.5 133.5 Z" fill="#e98c8c" />
          </g>
        </g>
        <g data-p="ledge" opacity={f.ledge}>
          <path d={PATHS.ledgePaws} fill={FUR} {...line} />
          <path d={PATHS.ledgeToes} {...outline} strokeWidth={2.4} />
        </g>
      </g>
    </svg>
  );
}
