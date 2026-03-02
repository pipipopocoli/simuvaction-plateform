"use client";

import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import worldMap from "@svg-maps/world";
import type { AtlasDelegation } from "@/lib/atlas";
import { toSvgCountryIso2 } from "@/lib/atlas";

const SMALL_COUNTRY_IDS = new Set(["gb", "sg", "sn", "jp"]);
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

          <filter id="hotspot-glow-red" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="hotspot-glow-orange" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Global Ocea Background */}
        <rect x={viewBox.minX} y={viewBox.minY} width={viewBox.width} height={viewBox.height} fill="url(#map-ocean-linear)" />

        {/* Connection Arcs (mockup style) */}
        <path d={`M ${viewBox.width * 0.25} ${viewBox.height * 0.4} Q ${viewBox.width * 0.4} ${viewBox.height * 0.2} ${viewBox.width * 0.55} ${viewBox.height * 0.3}`} fill="none" stroke="rgba(25, 65, 145, 0.4)" strokeWidth="1.5" strokeDasharray="4 4" className="animate-pulse" />
        <path d={`M ${viewBox.width * 0.25} ${viewBox.height * 0.4} Q ${viewBox.width * 0.3} ${viewBox.height * 0.6} ${viewBox.width * 0.4} ${viewBox.height * 0.7}`} fill="none" stroke="rgba(46, 172, 118, 0.4)" strokeWidth="1.5" strokeDasharray="4 4" />
        <path d={`M ${viewBox.width * 0.55} ${viewBox.height * 0.3} Q ${viewBox.width * 0.7} ${viewBox.height * 0.2} ${viewBox.width * 0.8} ${viewBox.height * 0.35}`} fill="none" stroke="rgba(25, 65, 145, 0.4)" strokeWidth="1.5" strokeDasharray="4 4" />

        {/* Decorative Hotspots */}
        <circle cx={viewBox.width * 0.65} cy={viewBox.height * 0.24} r={35} fill="rgba(239, 68, 68, 0.6)" filter="url(#hotspot-glow-red)" className="animate-pulse" style={{ animationDuration: '3s' }} />
        <circle cx={viewBox.width * 0.65} cy={viewBox.height * 0.24} r={8} fill="#ef4444" />

        <circle cx={viewBox.width * 0.6} cy={viewBox.height * 0.38} r={25} fill="rgba(245, 158, 11, 0.5)" filter="url(#hotspot-glow-orange)" className="animate-pulse" style={{ animationDuration: '4s' }} />
        <circle cx={viewBox.width * 0.6} cy={viewBox.height * 0.38} r={6} fill="#f59e0b" />

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

          {tinyCountryMarkers.map((delegation) => {
            const isSelected = delegation.id === selectedDelegation?.id;
            const iso2 = toSvgCountryIso2(delegation.countryCode).toLowerCase();
            const cx = (delegation.mapPoint!.xPct / 100) * viewBox.width;
            const cy = (delegation.mapPoint!.yPct / 100) * viewBox.height;
            return (
              <g
                key={`tiny-${delegation.id}`}
                data-country-shape="true"
                role="button"
                tabIndex={0}
                className="cursor-pointer"
                aria-label={`Open ${delegation.name} delegation`}
                onPointerEnter={(event) => {
                  setHoveredIso2(iso2);
                  showTooltip(event, delegation);
                }}
                onPointerMove={(event) => {
                  showTooltip(event, delegation);
                }}
                onPointerLeave={() => {
                  setHoveredIso2((current) => (current === iso2 ? null : current));
                  setTooltip(null);
                }}
                onClick={() => onSelectDelegation(delegation.id)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onSelectDelegation(delegation.id);
                  }
                }}
                onFocus={() => setFocusedIso2(iso2)}
                onBlur={() => {
                  setFocusedIso2((current) => (current === iso2 ? null : current));
                }}
              >
                <circle cx={cx} cy={cy} r={10} fill="transparent" />
                <circle cx={cx} cy={cy} r={4.6} fill="rgba(255, 255, 255, 0.7)" filter="url(#country-glow)" />
                <circle
                  cx={cx}
                  cy={cy}
                  r={3.2}
                  fill={isSelected || focusedIso2 === iso2 ? "#1d4ed8" : "#2563eb"}
                />
              </g>
            );
          })}

          {fallbackPins.map((delegation) => {
            const isSelected = delegation.id === selectedDelegation?.id;
            const cx = viewBox.minX + (delegation.mapPoint!.xPct / 100) * viewBox.width;
            const cy = viewBox.minY + (delegation.mapPoint!.yPct / 100) * viewBox.height;

            return (
              <g
                key={`fallback-${delegation.id}`}
                data-country-shape="true"
                role="button"
                tabIndex={0}
                className="cursor-pointer"
                aria-label={`Open ${delegation.name} delegation`}
                onPointerEnter={(event) => {
                  showTooltip(event, delegation);
                }}
                onPointerMove={(event) => {
                  showTooltip(event, delegation);
                }}
                onPointerLeave={() => {
                  setTooltip(null);
                }}
                onClick={() => onSelectDelegation(delegation.id)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onSelectDelegation(delegation.id);
                  }
                }}
                onFocus={() => setFocusedIso2(`fallback-${delegation.id}`)}
                onBlur={() => {
                  setFocusedIso2((current) => (current === `fallback-${delegation.id}` ? null : current));
                }}
              >
                <circle cx={cx} cy={cy} r={10} fill="transparent" />
                <circle cx={cx} cy={cy} r={4.6} fill="rgba(255, 255, 255, 0.7)" filter="url(#country-glow)" />
                <circle
                  cx={cx}
                  cy={cy}
                  r={3.2}
                  fill={
                    isSelected || focusedIso2 === `fallback-${delegation.id}`
                      ? "#1d4ed8"
                      : "#2563eb"
                  }
                />
              </g>
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
