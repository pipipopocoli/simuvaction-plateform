"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import worldMap from "@svg-maps/world";
import type { AtlasDelegation } from "@/lib/atlas";
import { toSvgCountryIso2 } from "@/lib/atlas";

const ZOOM_SCALE = 1.14;
const SMALL_COUNTRY_IDS = new Set(["gb", "sg", "sn", "jp"]);
const TOOLTIP_OFFSET_X = 14;
const TOOLTIP_OFFSET_Y = 38;
const TOOLTIP_WIDTH = 170;
const TOOLTIP_HEIGHT = 58;

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

type TooltipState = {
  name: string;
  statusLabel: "Active" | "Inactive";
  x: number;
  y: number;
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

function toStatusLabel(status: AtlasDelegation["status"]): "Active" | "Inactive" {
  return status === "active" ? "Active" : "Inactive";
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
  const [hoveredIso2, setHoveredIso2] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const [isMapVisible, setIsMapVisible] = useState(false);

  const locationIds = useMemo(() => new Set(locations.map((location) => location.id)), [locations]);

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
    const frame = window.requestAnimationFrame(() => setIsMapVisible(true));
    return () => window.cancelAnimationFrame(frame);
  }, []);

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
  }, [
    adaptiveZoom,
    countryBoundsByIso,
    selectedDelegation,
    viewBox.height,
    viewBox.minX,
    viewBox.minY,
    viewBox.width,
    worldBounds,
  ]);

  const tinyCountryMarkers = useMemo(
    () =>
      countryDelegations.filter((delegation) => {
        const iso2 = toSvgCountryIso2(delegation.countryCode).toLowerCase();
        return SMALL_COUNTRY_IDS.has(iso2) && delegation.mapPoint && locationIds.has(iso2);
      }),
    [countryDelegations, locationIds],
  );

  const fallbackPins = useMemo(
    () =>
      countryDelegations.filter((delegation) => {
        const iso2 = toSvgCountryIso2(delegation.countryCode).toLowerCase();
        return !locationIds.has(iso2) && delegation.mapPoint;
      }),
    [countryDelegations, locationIds],
  );

  const tooltipMaxX = Math.max(8, viewportSize.width - TOOLTIP_WIDTH - 8);
  const tooltipMaxY = Math.max(8, viewportSize.height - TOOLTIP_HEIGHT - 8);

  function showTooltip(event: React.PointerEvent<SVGPathElement>, delegation: AtlasDelegation) {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) {
      return;
    }

    const x = clamp(event.clientX - rect.left + TOOLTIP_OFFSET_X, 8, tooltipMaxX);
    const y = clamp(event.clientY - rect.top - TOOLTIP_OFFSET_Y, 8, tooltipMaxY);

    setTooltip({
      name: delegation.name,
      statusLabel: toStatusLabel(delegation.status),
      x,
      y,
    });
  }

  return (
    <div ref={containerRef} className="relative h-full w-full">
      <svg
        viewBox={worldMap.viewBox}
        preserveAspectRatio="xMidYMid meet"
        className={`h-full w-full rounded-xl transition-all duration-300 ease-out ${
          isMapVisible ? "scale-100 opacity-100" : "scale-[0.985] opacity-0"
        }`}
        aria-label="Global delegation map"
        onPointerLeave={() => {
          setHoveredIso2(null);
          setTooltip(null);
        }}
      >
        <defs>
          <linearGradient id="map-ocean-linear" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="var(--map-ocean-start)" />
            <stop offset="100%" stopColor="var(--map-ocean-end)" />
          </linearGradient>
          <radialGradient id="map-ocean-radial" cx="34%" cy="18%" r="78%">
            <stop offset="0%" stopColor="var(--map-ocean-radial)" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
          <radialGradient id="map-vignette" cx="50%" cy="50%" r="66%">
            <stop offset="66%" stopColor="transparent" />
            <stop offset="100%" stopColor="var(--map-vignette)" />
          </radialGradient>
        </defs>

        <rect x={viewBox.minX} y={viewBox.minY} width={viewBox.width} height={viewBox.height} fill="url(#map-ocean-linear)" />
        <rect x={viewBox.minX} y={viewBox.minY} width={viewBox.width} height={viewBox.height} fill="url(#map-ocean-radial)" />

        <g transform={transform} style={{ transition: "transform 220ms ease" }}>
          {locations.map((location) => {
            const delegation = byIso2.get(location.id);
            const selected = delegation?.id === selectedDelegation?.id;
            const hovered = location.id === hoveredIso2;
            const clickable = Boolean(delegation);

            const fillColor = !clickable
              ? "var(--map-country-inactive)"
              : selected
                ? "var(--map-country-selected)"
                : hovered
                  ? "var(--map-country-hover)"
                  : "var(--map-country-active)";

            return (
              <path
                key={location.id}
                ref={(node) => {
                  pathRefs.current[location.id] = node;
                }}
                d={location.path}
                fill={fillColor}
                stroke={selected ? "var(--map-country-stroke-selected)" : "var(--map-country-stroke)"}
                strokeWidth={selected ? 1.7 : 1.05}
                className={clickable ? "cursor-pointer transition-colors duration-150 focus:outline-none" : ""}
                role={clickable ? "button" : undefined}
                tabIndex={clickable ? 0 : -1}
                aria-label={clickable ? `Open ${delegation?.name} delegation` : undefined}
                onPointerEnter={(event) => {
                  if (!delegation) return;
                  setHoveredIso2(location.id);
                  showTooltip(event, delegation);
                }}
                onPointerMove={(event) => {
                  if (!delegation) return;
                  showTooltip(event, delegation);
                }}
                onPointerLeave={() => {
                  if (!delegation) return;
                  setHoveredIso2((current) => (current === location.id ? null : current));
                  setTooltip(null);
                }}
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
                <circle cx={cx} cy={cy} r={4.2} fill="var(--map-country-marker-ring)" />
                <circle
                  cx={cx}
                  cy={cy}
                  r={2.8}
                  fill={isSelected ? "var(--map-country-selected)" : "var(--map-country-active)"}
                />
              </g>
            );
          })}
        </g>

        <rect x={viewBox.minX} y={viewBox.minY} width={viewBox.width} height={viewBox.height} fill="url(#map-vignette)" />
      </svg>

      {tooltip ? (
        <div
          className="pointer-events-none absolute z-30 w-[170px] rounded-md border border-ink-border/80 px-2 py-1 shadow-lg backdrop-blur-sm"
          style={{
            left: tooltip.x,
            top: tooltip.y,
            backgroundColor: "var(--map-tooltip-bg)",
            color: "var(--map-tooltip-text)",
          }}
        >
          <p className="text-xs font-semibold leading-tight">{tooltip.name}</p>
          <p className="mt-0.5 text-[10px] uppercase tracking-[0.1em] opacity-90">{tooltip.statusLabel}</p>
        </div>
      ) : null}

      <div
        className="pointer-events-none absolute bottom-3 right-3 z-20 rounded-lg border border-ink-border/70 px-2.5 py-2 text-[10px] text-ink/85 shadow-sm backdrop-blur-sm"
        style={{ backgroundColor: "var(--map-legend-bg)" }}
      >
        <p className="mb-1 font-semibold uppercase tracking-[0.08em]">Legend</p>
        <div className="grid gap-1">
          <p className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: "var(--map-country-active)" }} />
            Active
          </p>
          <p className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: "var(--map-country-inactive)" }} />
            Inactive
          </p>
          <p className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: "var(--map-country-selected)" }} />
            Selected
          </p>
        </div>
      </div>

      {fallbackPins.map((delegation) => {
        const isSelected = delegation.id === selectedDelegation?.id;
        const markerColor = isSelected ? "var(--map-country-selected)" : "var(--map-country-active)";
        return (
          <button
            key={delegation.id}
            onClick={() => onSelectDelegation(delegation.id)}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${delegation.mapPoint?.xPct}%`, top: `${delegation.mapPoint?.yPct}%` }}
            title={delegation.name}
            aria-label={`Open ${delegation.name} delegation`}
          >
            <span className="relative flex h-4 w-4">
              <span
                className="absolute inline-flex h-full w-full rounded-full opacity-45"
                style={{ backgroundColor: markerColor }}
              />
              <span
                className="relative inline-flex h-4 w-4 rounded-full border-2"
                style={{ backgroundColor: markerColor, borderColor: "var(--map-country-marker-ring)" }}
              />
            </span>
          </button>
        );
      })}
    </div>
  );
}
