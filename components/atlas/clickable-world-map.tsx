"use client";

import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import worldMap from "@svg-maps/world";
import type { AtlasDelegation } from "@/lib/atlas";
import { toSvgCountryIso2 } from "@/lib/atlas";

const TOOLTIP_OFFSET_X = 14;
const TOOLTIP_OFFSET_Y = 38;
const TOOLTIP_WIDTH = 170;
const TOOLTIP_HEIGHT = 58;

type MapCenterPoint = {
  xPct: number;
  yPct: number;
};

type ClickableWorldMapProps = {
  delegations: AtlasDelegation[];
  selectedDelegationId: string | null;
  onSelectDelegation: (delegationId: string | null) => void;
  onCountryCentersChange?: (centersByIso: Record<string, MapCenterPoint>) => void;
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
  onCountryCentersChange,
}: ClickableWorldMapProps) {
  const locations = worldMap.locations as WorldLocation[];
  const containerRef = useRef<HTMLDivElement | null>(null);
  const pathRefs = useRef<Record<string, SVGPathElement | null>>({});

  const viewBox = useMemo(() => parseViewBox(worldMap.viewBox), []);
  const [viewportSize, setViewportSize] = useState<ViewportSize>({ width: 0, height: 0 });
  const [countryBoundsByIso, setCountryBoundsByIso] = useState<Map<string, CountryBounds>>(new Map());
  const [hoveredIso2, setHoveredIso2] = useState<string | null>(null);
  const [focusedIso2, setFocusedIso2] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const [isMapVisible, setIsMapVisible] = useState(false);

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

  useEffect(() => {
    if (!onCountryCentersChange) {
      return;
    }

    const next: Record<string, MapCenterPoint> = {};
    for (const [iso2, bounds] of countryBoundsByIso.entries()) {
      next[iso2] = {
        xPct: ((bounds.cx - viewBox.minX) / viewBox.width) * 100,
        yPct: ((bounds.cy - viewBox.minY) / viewBox.height) * 100,
      };
    }

    onCountryCentersChange(next);
  }, [countryBoundsByIso, onCountryCentersChange, viewBox.height, viewBox.minX, viewBox.minY, viewBox.width]);

  const tooltipMaxX = Math.max(8, viewportSize.width - TOOLTIP_WIDTH - 8);
  const tooltipMaxY = Math.max(8, viewportSize.height - TOOLTIP_HEIGHT - 8);

  function showTooltipAt(clientX: number, clientY: number, delegation: AtlasDelegation) {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) {
      return;
    }

    const x = clamp(clientX - rect.left + TOOLTIP_OFFSET_X, 8, tooltipMaxX);
    const y = clamp(clientY - rect.top - TOOLTIP_OFFSET_Y, 8, tooltipMaxY);

    setTooltip({
      name: delegation.name,
      statusLabel: toStatusLabel(delegation.status),
      x,
      y,
    });
  }

  function showTooltip(event: ReactPointerEvent<SVGElement>, delegation: AtlasDelegation) {
    showTooltipAt(event.clientX, event.clientY, delegation);
  }

  return (
    <div ref={containerRef} className="relative h-full w-full overflow-hidden">
      <svg
        viewBox={worldMap.viewBox}
        preserveAspectRatio="xMidYMid meet"
        className={`h-full w-full transition-all duration-500 ease-out ${isMapVisible ? "scale-100 opacity-100" : "scale-[0.985] opacity-0"
          }`}
        aria-label="Global delegation map"
        onPointerLeave={() => {
          setHoveredIso2(null);
          setTooltip(null);
        }}
      >
        <defs>
          <linearGradient id="map-ocean-linear" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#f8f9fc" />
            <stop offset="100%" stopColor="#e9eff7" />
          </linearGradient>

          <filter id="country-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Global Ocea Background */}
        <rect x={viewBox.minX} y={viewBox.minY} width={viewBox.width} height={viewBox.height} fill="url(#map-ocean-linear)" />

        <g>
          {locations.map((location) => {
            const delegation = byIso2.get(location.id);
            const selected = delegation?.id === selectedDelegation?.id;
            const hovered = location.id === hoveredIso2 || location.id === focusedIso2;
            const clickable = Boolean(delegation);

            const fillColor = !clickable
              ? "#d4dceb" // Lighter blue-grey for inactive
              : selected
                ? "#2563eb" // Bright blue for selected
                : hovered
                  ? "#60a5fa" // Hover color
                  : "#1e3a8a"; // Deep primary blue for active

            return (
              <path
                key={location.id}
                ref={(node) => {
                  pathRefs.current[location.id] = node;
                }}
                d={location.path}
                fill={fillColor}
                stroke={"#ffffff"} // Clean white stroke
                strokeWidth={selected ? 1.5 : 0.8}
                filter={selected ? "url(#country-glow)" : undefined}
                className={
                  clickable
                    ? "cursor-pointer transition-[fill,stroke] duration-200 focus:outline-none"
                    : "transition-[fill,stroke] duration-200"
                }
                data-country-shape={clickable ? "true" : undefined}
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
                onFocus={() => {
                  if (!delegation) return;
                  setFocusedIso2(location.id);
                }}
                onBlur={() => {
                  if (!delegation) return;
                  setFocusedIso2((current) => (current === location.id ? null : current));
                }}
              />
            );
          })}

        </g>

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
    </div>
  );
}
