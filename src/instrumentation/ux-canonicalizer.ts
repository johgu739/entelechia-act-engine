/**
 * ✅ ENTELECHIA: UX Fidelity Canonicalizer
 * 
 * Canonicalizes UX fidelity YAML → CanonicalUXFidelityDescriptor
 * Part of ACT Phase 8.3 — UX Fidelity Canonicalization
 */

import type { UXFidelityYaml } from './ux-schema'

/**
 * Canonical UX fidelity descriptor (output of canonicalization)
 */
export interface CanonicalUXFidelityDescriptor {
  motion: {
    transitions: Record<string, CanonicalMotionPhysics>
    defaults: CanonicalMotionDefaults
  }
  scroll: {
    containers: CanonicalScrollContainer[]
    singleContainer: boolean
  }
  padding: {
    canonical: {
      x?: 24
      y?: 16
    }
    grid: {
      base: number
      scale?: number[]
    }
  }
  stability: {
    metrics: CanonicalRenderStabilityMetric[]
    calmness?: {
      acceptableBounds?: {
        min?: number
        max?: number
      }
    }
  }
  purity: {
    rules: CanonicalPurityRule[]
    sentinel: CanonicalSentinelConfig
  }
  latency: {
    budgets: CanonicalLatencyBudgets
  }
  typography: {
    flow?: CanonicalTypographyFlow
  }
  criticalRegions: CanonicalCriticalRegion[]
  interactionZones: CanonicalSafeInteractionZone[]
  invariants: {
    declared: string[]
    enforceAt: 'build' | 'runtime' | 'both'
  }
}

export interface CanonicalMotionPhysics {
  easing: 'linear' | 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'cubic-bezier'
  duration: number
  spring?: {
    tension?: number
    friction?: number
  }
}

export interface CanonicalMotionDefaults {
  duration: number
  easing: 'linear' | 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out'
}

export interface CanonicalScrollContainer {
  id: string
  type: 'content' | 'sidebar' | 'overlay'
  preservePosition: boolean
  restoreOnMount: boolean
  maxJump: number
}

export interface CanonicalRenderStabilityMetric {
  id: string
  name: string
  type: 'calm-signature' | 'perceived-stability' | 'layout-shift' | 'flicker'
  thresholds?: {
    warn?: number
    error?: number
  }
  window?: number
}

export interface CanonicalPurityRule {
  id: string
  name: string
  type: 'double-mount' | 'layout-shift' | 'flicker' | 'scroll-jump' | 'latency-violation' | 'animation-frame-violation' | 'implicit-fetch' | 'setState-from-effect' | 'redundant-api-call' | 'unbounded-rerender' | 'double-focus' | 'magic-number' | 'missing-skeleton'
  threshold?: number
  componentClasses?: string[]
  enabled: boolean
}

export interface CanonicalSentinelConfig {
  enabled: boolean
  logLevel: 'debug' | 'info' | 'warn' | 'error'
}

export interface CanonicalLatencyBudgets {
  routerTransition: number
  viewModelAssembly: number
  warmCacheApiRequest: number
  totalPerceivedLatency: number
}

export interface CanonicalTypographyFlow {
  lineHeight?: number
  letterSpacing?: number
  wordSpacing?: number
  maxWidth?: number
}

export interface CanonicalCriticalRegion {
  id: string
  name: string
  bounds: {
    top: number
    left: number
    width: number
    height: number
  }
  priority: 'critical' | 'high' | 'medium' | 'low'
}

export interface CanonicalSafeInteractionZone {
  id: string
  name: string
  bounds: {
    top: number
    left: number
    width: number
    height: number
  }
  minTouchTarget: number
}

/**
 * Canonicalization result
 */
export interface UXFidelityCanonicalizationResult {
  descriptor: CanonicalUXFidelityDescriptor
  errors: string[]
  warnings: string[]
}

/**
 * Canonicalize UX fidelity YAML
 */
export function canonicalizeUXFidelity(
  uxFidelityYaml: UXFidelityYaml
): UXFidelityCanonicalizationResult {
  const errors: string[] = []
  const warnings: string[] = []
  
  const ux = uxFidelityYaml.ux
  
  // Canonicalize motion
  const motion = ux.motion ? {
    transitions: ux.motion.transitions ?? {},
    defaults: {
      duration: ux.motion.defaults?.duration ?? 200,
      // ✅ TYPE SAFETY: Cast easing to CanonicalMotionDefaults easing type
      easing: (ux.motion.defaults?.easing ?? 'ease') as 'linear' | 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out',
    },
  } : {
    transitions: {},
    defaults: {
      duration: 200,
      easing: 'ease' as const,
    },
  }
  
  // Canonicalize scroll
  const scroll = ux.scroll ? {
    containers: ux.scroll.containers?.map(container => ({
      id: container.id,
      type: container.type,
      preservePosition: container.preservePosition,
      restoreOnMount: container.restoreOnMount,
      maxJump: container.maxJump,
    })) ?? [],
    singleContainer: ux.scroll.singleContainer ?? true,
  } : {
    containers: [],
    singleContainer: true,
  }
  
  // Canonicalize padding
  const padding = ux.padding ? {
    canonical: {
      x: ux.padding.canonical?.x,
      y: ux.padding.canonical?.y,
    },
    grid: {
      base: ux.padding.grid?.base ?? 4,
      scale: ux.padding.grid?.scale,
    },
  } : {
    canonical: {},
    grid: {
      base: 4,
    },
  }
  
  // Canonicalize stability
  const stability = ux.stability ? {
    metrics: ux.stability.metrics?.map(metric => ({
      id: metric.id,
      name: metric.name,
      type: metric.type,
      thresholds: metric.thresholds,
      window: metric.window,
    })) ?? [],
    calmness: ux.stability.calmness,
  } : {
    metrics: [],
  }
  
  // Canonicalize purity
  const purity = ux.purity ? {
    rules: ux.purity.rules?.map(rule => ({
      id: rule.id,
      name: rule.name,
      type: rule.type,
      threshold: rule.threshold,
      componentClasses: rule.componentClasses,
      enabled: rule.enabled,
    })) ?? [],
    sentinel: {
      enabled: ux.purity.sentinel?.enabled ?? true,
      // ✅ TYPE SAFETY: Cast logLevel to CanonicalSentinelConfig logLevel type
      logLevel: (ux.purity.sentinel?.logLevel ?? 'error') as 'debug' | 'info' | 'warn' | 'error',
    },
  } : {
    rules: [],
    sentinel: {
      enabled: true,
      logLevel: 'error' as const,
    },
  }
  
  // Canonicalize latency
  const latency = {
    budgets: ux.latency?.budgets ? {
      routerTransition: ux.latency.budgets.routerTransition,
      viewModelAssembly: ux.latency.budgets.viewModelAssembly,
      warmCacheApiRequest: ux.latency.budgets.warmCacheApiRequest,
      totalPerceivedLatency: ux.latency.budgets.totalPerceivedLatency,
    } : {
      routerTransition: 20,
      viewModelAssembly: 40,
      warmCacheApiRequest: 80,
      totalPerceivedLatency: 150,
    },
  }
  
  // Canonicalize typography
  const typography = {
    flow: ux.typography?.flow,
  }
  
  // Canonicalize critical regions
  const criticalRegions = ux.criticalRegions?.map(region => ({
    id: region.id,
    name: region.name,
    bounds: region.bounds,
    priority: region.priority,
  })) ?? []
  
  // Canonicalize interaction zones
  const interactionZones = ux.interactionZones?.map(zone => ({
    id: zone.id,
    name: zone.name,
    bounds: zone.bounds,
    minTouchTarget: zone.minTouchTarget,
  })) ?? []
  
  // Canonicalize invariants
  const invariants = {
    declared: ux.invariants?.invariants ?? [],
    enforceAt: ux.invariants?.enforceAt ?? 'both',
  }
  
  const descriptor: CanonicalUXFidelityDescriptor = {
    motion,
    scroll,
    padding,
    stability,
    purity,
    latency,
    typography,
    criticalRegions,
    interactionZones,
    invariants,
  }
  
  return {
    descriptor,
    errors,
    warnings,
  }
}

