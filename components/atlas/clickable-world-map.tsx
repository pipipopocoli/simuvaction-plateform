"use client";

import { useMemo } from "react";
import worldMap from "@svg-maps/world";
import type { AtlasDelegation } from "@/lib/atlas";
import { toSvgCountryIso2 } from "@/lib/atlas";

const ZOOM_SCALE = 1.14;
const SMALL_COUNTRY_IDS = new Set(["gb", "sg", "sn", "jp"]);

type ClickableWorldMapProps = {
  delegations: AtlasDelegation[];
  selectedDelegationId: string | null;
  onSelectDelegation: (delegationId: string | null) => void;
};

type ParsedViewBox = {
  minX: number;
  minY: number;
  width: number;
  height: number;
};

type WorldLocation = {
  id: string;
  name: string;
  path: string;
};

function parseViewBox(value: string): ParsedViewBox {
  const [minX = 0, minY = 0, width = 1010, height = 666] = value
    .split(" ")
    .map((part) => Number(part));
  return { minX, minY, width, height };
}

export function ClickableWorldMap({
  delegations,
  selectedDelegationId,
  onSelectDelegation,
}: ClickableWorldMapProps) {
  const locations = worldMap.locations as WorldLocation[];
  const viewBox = useMemo(() => parseViewBox(worldMap.viewBox), []);

  const countryDelegations = useMemo(
    () => delegations.filter((delegation) => delegation.kind === "country"),
    [delegations],
  );

  const byIso2 = useMemo(() => {
    const map = new Map<string, AtlasDelegation>();
    for (const delegation of countryDelegations) {
      const iso2 = toSvgCountryIso2(delegation.countryCode).toLowerCase();
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

  const transform = useMemo(() => {
    if (!selectedDelegation || selectedDelegation.kind !== "country" || !selectedDelegation.mapPoint) {
      return "translate(0 0) scale(1)";
    }

    const focusX = (selectedDelegation.mapPoint.xPct / 100) * viewBox.width;
    const focusY = (selectedDelegation.mapPoint.yPct / 100) * viewBox.height;
    const tx = viewBox.width / 2 - ZOOM_SCALE * focusX;
    const ty = viewBox.height / 2 - ZOOM_SCALE * focusY;

    return `translate(${tx} ${ty}) scale(${ZOOM_SCALE})`;
  }, [selectedDelegation, viewBox.height, viewBox.width]);

  const tinyCountryMarkers = useMemo(
    () =>
      countryDelegations.filter((delegation) => {
        const iso2 = toSvgCountryIso2(delegation.countryCode).toLowerCase();
        return SMALL_COUNTRY_IDS.has(iso2) && delegation.mapPoint;
      }),
    [countryDelegations],
  );

  const fallbackPins = useMemo(
    () =>
      countryDelegations.filter((delegation) => {
        const iso2 = toSvgCountryIso2(delegation.countryCode).toLowerCase();
        return !byIso2.has(iso2) && delegation.mapPoint;
      }),
    [byIso2, countryDelegations],
  );

  return (
    <div className="relative h-full w-full">
      <svg
        viewBox={worldMap.viewBox}
        preserveAspectRatio="xMidYMid meet"
        className="h-full w-full rounded-xl bg-[#e8edf3]"
        aria-label="Global delegation map"
      >
        <g transform={transform} style={{ transition: "transform 220ms ease" }}>
          {locations.map((location) => {
            const delegation = byIso2.get(location.id);
            const selected = delegation?.id === selectedDelegation?.id;
            const clickable = Boolean(delegation);

            return (
              <path
                key={location.id}
                d={location.path}
                fill={clickable ? (selected ? "#10b981" : "#22c55e") : "#9ca3af"}
                stroke={selected ? "#0f172a" : "#eef2f7"}
                strokeWidth={selected ? 1.8 : 0.8}
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
            );
          })}

          {tinyCountryMarkers.map((delegation) => {
            const isSelected = delegation.id === selectedDelegation?.id;
            const cx = (delegation.mapPoint!.xPct / 100) * viewBox.width;
            const cy = (delegation.mapPoint!.yPct / 100) * viewBox.height;
            return (
              <g key={`tiny-${delegation.id}`}>
                <circle cx={cx} cy={cy} r={4.2} fill="#ffffff" />
                <circle cx={cx} cy={cy} r={2.7} fill={isSelected ? "#10b981" : "#22c55e"} />
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
