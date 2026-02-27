"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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

type CountryBounds = {
  x: number;
  y: number;
  width: number;
  height: number;
  cx: number;
  cy: number;
};

type ViewportSize = {
  width: number;
  height: number;
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

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
  const containerRef = useRef<HTMLDivElement | null>(null);
  const pathRefs = useRef<Record<string, SVGPathElement | null>>({});

  const viewBox = useMemo(() => parseViewBox(worldMap.viewBox), []);
  const [viewportSize, setViewportSize] = useState<ViewportSize>({ width: 0, height: 0 });
  const [countryBoundsByIso, setCountryBoundsByIso] = useState<Map<string, CountryBounds>>(new Map());

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

  useEffect(() => {
    const element = containerRef.current;
    if (!element || typeof ResizeObserver === "undefined") {
      return;
    }

    const observer = new ResizeObserver((entries) => {
      const first = entries[0];
      if (!first) return;
      const { width, height } = first.contentRect;
      setViewportSize((current) =>
        current.width === width && current.height === height ? current : { width, height },
      );
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const next = new Map<string, CountryBounds>();
      for (const location of locations) {
        const node = pathRefs.current[location.id];
        if (!node) continue;
        const box = node.getBBox();
        next.set(location.id, {
          x: box.x,
          y: box.y,
          width: box.width,
          height: box.height,
          cx: box.x + box.width / 2,
          cy: box.y + box.height / 2,
        });
      }
      setCountryBoundsByIso(next);
    });

    return () => window.cancelAnimationFrame(frame);
  }, [locations, viewportSize.height, viewportSize.width]);

  const worldBounds = useMemo(() => {
    if (countryBoundsByIso.size === 0) return null;
    const values = Array.from(countryBoundsByIso.values());
    const minX = Math.min(...values.map((value) => value.x));
    const minY = Math.min(...values.map((value) => value.y));
    const maxX = Math.max(...values.map((value) => value.x + value.width));
    const maxY = Math.max(...values.map((value) => value.y + value.height));
    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    };
  }, [countryBoundsByIso]);

  const adaptiveZoom = useMemo(() => {
    if (viewportSize.width === 0 || viewportSize.height === 0) {
      return ZOOM_SCALE;
    }
    const ratio = viewportSize.width / viewportSize.height;
    if (ratio < 1.25) return 1.08;
    if (ratio > 2.15) return 1.18;
    return ZOOM_SCALE;
  }, [viewportSize.height, viewportSize.width]);

  const transform = useMemo(() => {
    if (!selectedDelegation || selectedDelegation.kind !== "country" || !selectedDelegation.mapPoint) {
      return "translate(0 0) scale(1)";
    }

    const selectedIso = toSvgCountryIso2(selectedDelegation.countryCode).toLowerCase();
    const fromShape = countryBoundsByIso.get(selectedIso);
    const focusX = fromShape
      ? fromShape.cx
      : viewBox.minX + (selectedDelegation.mapPoint.xPct / 100) * viewBox.width;
    const focusY = fromShape
      ? fromShape.cy
      : viewBox.minY + (selectedDelegation.mapPoint.yPct / 100) * viewBox.height;

    const content = worldBounds ?? {
      x: viewBox.minX,
      y: viewBox.minY,
      width: viewBox.width,
      height: viewBox.height,
    };

    let tx = viewBox.minX + viewBox.width / 2 - adaptiveZoom * focusX;
    let ty = viewBox.minY + viewBox.height / 2 - adaptiveZoom * focusY;

    const minTx = viewBox.minX + viewBox.width - (content.x + content.width) * adaptiveZoom;
    const maxTx = viewBox.minX - content.x * adaptiveZoom;
    const minTy = viewBox.minY + viewBox.height - (content.y + content.height) * adaptiveZoom;
    const maxTy = viewBox.minY - content.y * adaptiveZoom;

    tx = clamp(tx, minTx, maxTx);
    ty = clamp(ty, minTy, maxTy);

    return `translate(${tx} ${ty}) scale(${adaptiveZoom})`;
  }, [adaptiveZoom, countryBoundsByIso, selectedDelegation, viewBox.height, viewBox.minX, viewBox.minY, viewBox.width, worldBounds]);

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
    <div ref={containerRef} className="relative h-full w-full">
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
                ref={(node) => {
                  pathRefs.current[location.id] = node;
                }}
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
