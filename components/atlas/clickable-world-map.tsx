"use client";

import { useMemo } from "react";
import type { AtlasDelegation } from "@/lib/atlas";
import { toSvgCountryIso2 } from "@/lib/atlas";

const VIEWPORT = { width: 1000, height: 500 };
const ZOOM_SCALE = 1.14;

type CountryShape = {
  iso2: string;
  d: string;
  cx: number;
  cy: number;
  isSmall?: boolean;
};

const COUNTRY_SHAPES: CountryShape[] = [
  { iso2: "US", d: "M160 168 L225 165 L260 183 L255 205 L238 220 L200 220 L168 205 Z", cx: 210, cy: 194 },
  { iso2: "CA", d: "M150 123 L210 108 L278 116 L300 138 L276 162 L210 156 L162 148 Z", cx: 225, cy: 135 },
  { iso2: "MX", d: "M205 222 L240 224 L252 242 L238 258 L214 252 L201 238 Z", cx: 226, cy: 239 },
  { iso2: "BR", d: "M356 276 L392 272 L420 296 L410 332 L374 346 L342 324 L344 292 Z", cx: 381, cy: 309 },
  { iso2: "GB", d: "M468 124 L480 120 L488 129 L482 141 L470 140 Z", cx: 478, cy: 131, isSmall: true },
  { iso2: "FR", d: "M496 152 L515 148 L525 162 L519 178 L500 180 L492 166 Z", cx: 508, cy: 165 },
  { iso2: "DE", d: "M520 138 L535 132 L545 147 L538 164 L522 162 L516 148 Z", cx: 530, cy: 149 },
  { iso2: "TR", d: "M564 160 L604 156 L622 165 L602 178 L566 176 Z", cx: 593, cy: 167 },
  { iso2: "SN", d: "M456 224 L470 222 L472 234 L458 238 Z", cx: 464, cy: 230, isSmall: true },
  { iso2: "IN", d: "M650 190 L680 190 L700 220 L680 248 L654 240 L640 214 Z", cx: 671, cy: 218 },
  { iso2: "SG", d: "M752 258 L758 258 L758 264 L752 264 Z", cx: 755, cy: 261, isSmall: true },
  { iso2: "JP", d: "M828 170 L838 164 L848 174 L842 188 L830 188 Z", cx: 838, cy: 177, isSmall: true },
];

const SHAPE_BY_ISO2 = new Map(COUNTRY_SHAPES.map((shape) => [shape.iso2, shape]));

type ClickableWorldMapProps = {
  delegations: AtlasDelegation[];
  selectedDelegationId: string | null;
  onSelectDelegation: (delegationId: string | null) => void;
};

export function ClickableWorldMap({
  delegations,
  selectedDelegationId,
  onSelectDelegation,
}: ClickableWorldMapProps) {
  const countryDelegations = useMemo(
    () => delegations.filter((delegation) => delegation.kind === "country"),
    [delegations],
  );

  const byIso2 = useMemo(() => {
    const map = new Map<string, AtlasDelegation>();
    for (const delegation of countryDelegations) {
      const iso2 = toSvgCountryIso2(delegation.countryCode);
      if (!map.has(iso2)) {
        map.set(iso2, delegation);
      }
    }
    return map;
  }, [countryDelegations]);

  const selectedDelegation = useMemo(
    () => delegations.find((delegation) => delegation.id === selectedDelegationId) ?? null,
    [delegations, selectedDelegationId],
  );

  const selectedShape = useMemo(() => {
    if (!selectedDelegation || selectedDelegation.kind !== "country") {
      return null;
    }
    return SHAPE_BY_ISO2.get(toSvgCountryIso2(selectedDelegation.countryCode)) ?? null;
  }, [selectedDelegation]);

  const transform = useMemo(() => {
    if (!selectedShape) {
      return "translate(0 0) scale(1)";
    }
    const tx = VIEWPORT.width / 2 - ZOOM_SCALE * selectedShape.cx;
    const ty = VIEWPORT.height / 2 - ZOOM_SCALE * selectedShape.cy;
    return `translate(${tx} ${ty}) scale(${ZOOM_SCALE})`;
  }, [selectedShape]);

  const fallbackPins = useMemo(
    () =>
      countryDelegations.filter((delegation) => {
        const iso2 = toSvgCountryIso2(delegation.countryCode);
        return !SHAPE_BY_ISO2.has(iso2) && delegation.mapPoint;
      }),
    [countryDelegations],
  );

  return (
    <div className="relative h-full w-full">
      <svg
        viewBox={`0 0 ${VIEWPORT.width} ${VIEWPORT.height}`}
        preserveAspectRatio="xMidYMid meet"
        className="h-full w-full rounded-xl bg-[#e8edf3]"
        aria-label="Global delegation map"
      >
        <g transform={transform} style={{ transition: "transform 220ms ease" }}>
          <g fill="#9ca3af" stroke="#eef2f7" strokeWidth="1.2" opacity="0.95">
            <path d="M118 140 L305 126 L347 156 L337 238 L180 252 L124 208 Z" />
            <path d="M332 248 L445 260 L438 354 L354 362 L316 318 Z" />
            <path d="M458 130 L640 116 L718 170 L702 278 L618 338 L524 328 L468 248 L446 170 Z" />
            <path d="M694 170 L812 170 L856 226 L822 272 L738 276 L704 236 Z" />
            <path d="M774 300 L902 306 L940 356 L904 404 L816 408 L764 360 Z" />
            <path d="M486 258 L566 264 L594 336 L536 392 L468 350 L462 292 Z" />
          </g>

          {COUNTRY_SHAPES.map((shape) => {
            const delegation = byIso2.get(shape.iso2);
            const selected = delegation?.id === selectedDelegation?.id;
            const clickable = Boolean(delegation);
            const fill = clickable ? (selected ? "#10b981" : "#22c55e") : "#9ca3af";

            return (
              <g key={shape.iso2}>
                <path
                  data-iso={shape.iso2}
                  d={shape.d}
                  fill={fill}
                  stroke={selected ? "#0f172a" : "#ffffff"}
                  strokeWidth={selected ? 2.2 : 1.2}
                  className={clickable ? "cursor-pointer transition-colors duration-150 hover:fill-[#16a34a]" : ""}
                  role={clickable ? "button" : undefined}
                  tabIndex={clickable ? 0 : -1}
                  aria-label={clickable ? `Open ${delegation?.name} delegation` : undefined}
                  onClick={() => {
                    if (delegation) {
                      onSelectDelegation(delegation.id);
                    }
                  }}
                  onKeyDown={(event) => {
                    if (!delegation) return;
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      onSelectDelegation(delegation.id);
                    }
                  }}
                />
                {clickable && shape.isSmall ? (
                  <>
                    <circle cx={shape.cx} cy={shape.cy} r={5} fill="#ffffff" />
                    <circle cx={shape.cx} cy={shape.cy} r={3} fill={selected ? "#10b981" : "#22c55e"} />
                  </>
                ) : null}
              </g>
            );
          })}
        </g>
      </svg>

      {fallbackPins.map((delegation) => (
        <button
          key={delegation.id}
          onClick={() => onSelectDelegation(delegation.id)}
          className="absolute -translate-x-1/2 -translate-y-1/2"
          style={{ left: `${delegation.mapPoint?.xPct}%`, top: `${delegation.mapPoint?.yPct}%` }}
          title={delegation.name}
          aria-label={`Open ${delegation.name} delegation`}
        >
          <span className="relative flex h-4 w-4">
            <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-500/55" />
            <span className="relative inline-flex h-4 w-4 rounded-full border-2 border-white bg-emerald-500" />
          </span>
        </button>
      ))}
    </div>
  );
}
