import { useEffect, useState } from "react";

/**
 * How much work this device can comfortably do per frame.
 *
 * The principle here is to scale fidelity, never to remove features: every
 * visitor gets the same site with the same sections and the same behaviour, and
 * weaker hardware simply gets a lighter version of the same visuals. A phone
 * still gets the physics scene, just with fewer bodies, no ambient-occlusion
 * pass and a capped pixel ratio.
 */
export type DeviceTier = "high" | "medium" | "low";

type NavigatorWithHints = Navigator & {
  deviceMemory?: number;
  connection?: { saveData?: boolean; effectiveType?: string };
};

export function detectDeviceTier(): DeviceTier {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return "high";
  }

  const nav = navigator as NavigatorWithHints;

  // Explicit user and network signals win outright. Someone who has asked for
  // reduced motion, or turned on data saver, has told us what they want.
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return "low";
  if (nav.connection?.saveData) return "low";
  if (/(^|-)2g$/.test(nav.connection?.effectiveType ?? "")) return "low";

  // hardwareConcurrency is near-universal; deviceMemory is Chromium-only, so
  // both fall back to mid-range assumptions rather than optimistic ones.
  const cores = nav.hardwareConcurrency ?? 4;
  const memory = nav.deviceMemory ?? 4;
  // A coarse pointer means a touch device, where the GPU is typically far
  // weaker than the core count alone suggests.
  const isTouch = window.matchMedia("(pointer: coarse)").matches;

  if (cores <= 2 || memory <= 2) return "low";
  if (cores <= 4 || memory <= 4 || isTouch) return "medium";
  return "high";
}

/** Quality settings for the physics scene, derived from the tier. */
export function sceneQuality(tier: DeviceTier) {
  switch (tier) {
    case "low":
      return { sphereCount: 10, dpr: 1 as const, shadows: false, ambientOcclusion: false };
    case "medium":
      return { sphereCount: 18, dpr: [1, 1.5] as [number, number], shadows: true, ambientOcclusion: false };
    default:
      return { sphereCount: 30, dpr: [1, 2] as [number, number], shadows: true, ambientOcclusion: true };
  }
}

/**
 * Reads the tier once and publishes it as a class on <html> so stylesheets can
 * respond too (see the tier-low blur reductions in index.css). Re-evaluates if
 * the visitor changes their reduced-motion preference.
 */
export function useDeviceTier(): DeviceTier {
  const [tier, setTier] = useState<DeviceTier>(detectDeviceTier);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setTier(detectDeviceTier());
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("tier-high", "tier-medium", "tier-low");
    root.classList.add(`tier-${tier}`);
  }, [tier]);

  return tier;
}
