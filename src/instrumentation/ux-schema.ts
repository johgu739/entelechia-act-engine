/**
 * ✅ ENTELECHIA: UX Fidelity YAML Schema
 * 
 * Zod schema for validating UX fidelity YAML files.
 * 
 * PRINCIPLE: All UX monitoring configuration must be declarative in FORM.
 * Motion physics, scroll containers, render stability, and purity rules are defined here.
 */

import { z } from 'zod'
import { registry } from '@entelechia/invariant-engine'

/**
 * Motion Physics Schema
 * 
 * Defines animation and transition physics
 */
const MotionPhysicsSchema = z.object({
  easing: z.enum(['linear', 'ease', 'ease-in', 'ease-out', 'ease-in-out', 'cubic-bezier']),
  duration: z.number().min(0), // ms
  spring: z.object({
    tension: z.number().optional(),
    friction: z.number().optional(),
  }).optional(),
})

/**
 * Scroll Container Schema
 * 
 * Defines scroll container configuration (F82: Single Scroll Container)
 */
const ScrollContainerSchema = z.object({
  id: z.string().min(1, 'Scroll container ID is required'),
  type: z.enum(['content', 'sidebar', 'overlay']),
  preservePosition: z.boolean().default(true),
  restoreOnMount: z.boolean().default(true),
  maxJump: z.number().default(1), // Max allowed jump in px
})

/**
 * Render Stability Metric Schema
 * 
 * Defines metrics for tracking render stability
 */
const RenderStabilityMetricSchema = z.object({
  id: z.string().min(1, 'Metric ID is required'),
  name: z.string().min(1, 'Metric name is required'),
  type: z.enum(['calm-signature', 'perceived-stability', 'layout-shift', 'flicker']),
  thresholds: z.object({
    warn: z.number().optional(),
    error: z.number().optional(),
  }).optional(),
  window: z.number().optional(), // Measurement window in ms
})

/**
 * Purity Rule Schema
 * 
 * Defines rules for detecting UX purity violations
 */
const PurityRuleSchema = z.object({
  id: z.string().min(1, 'Rule ID is required'),
  name: z.string().min(1, 'Rule name is required'),
  type: z.enum([
    'double-mount',
    'layout-shift',
    'flicker',
    'scroll-jump',
    'latency-violation',
    'animation-frame-violation',
    'implicit-fetch',
    'setState-from-effect',
    'redundant-api-call',
    'unbounded-rerender',
    'double-focus',
    'magic-number',
    'missing-skeleton',
  ]),
  threshold: z.number().optional(),
  componentClasses: z.array(z.string()).optional(), // Components to monitor
  enabled: z.boolean().default(true),
})

/**
 * Latency Budget Schema
 * 
 * Defines latency budgets for different operations
 */
const LatencyBudgetSchema = z.object({
  routerTransition: z.number().default(20), // ms
  viewModelAssembly: z.number().default(40), // ms
  warmCacheApiRequest: z.number().default(80), // ms
  totalPerceivedLatency: z.number().default(150), // ms
})

/**
 * Typography Flow Schema
 * 
 * Defines typography flow rules
 */
const TypographyFlowSchema = z.object({
  lineHeight: z.number().optional(),
  letterSpacing: z.number().optional(),
  wordSpacing: z.number().optional(),
  maxWidth: z.number().optional(), // Max line width in px
})

/**
 * Critical Render Region Schema
 * 
 * Defines critical render regions (above-the-fold, etc.)
 */
const CriticalRenderRegionSchema = z.object({
  id: z.string().min(1, 'Region ID is required'),
  name: z.string().min(1, 'Region name is required'),
  bounds: z.object({
    top: z.number(),
    left: z.number(),
    width: z.number(),
    height: z.number(),
  }),
  priority: z.enum(['critical', 'high', 'medium', 'low']).default('high'),
})

/**
 * Safe Interaction Zone Schema
 * 
 * Defines safe zones for user interactions
 */
const SafeInteractionZoneSchema = z.object({
  id: z.string().min(1, 'Zone ID is required'),
  name: z.string().min(1, 'Zone name is required'),
  bounds: z.object({
    top: z.number(),
    left: z.number(),
    width: z.number(),
    height: z.number(),
  }),
  minTouchTarget: z.number().default(44), // Minimum touch target size in px
})

/**
 * UX Fidelity YAML Schema
 */
export const UXFidelityYamlSchema = z.object({
  ux: z.object({
    // Motion configuration
    motion: z.object({
      transitions: z.record(z.string(), MotionPhysicsSchema).optional(),
      defaults: z.object({
        duration: z.number().default(200), // ms
        easing: z.enum(['linear', 'ease', 'ease-in', 'ease-out', 'ease-in-out']).default('ease'),
      }).optional(),
    }).optional(),
    
    // Scroll container configuration
    scroll: z.object({
      containers: z.array(ScrollContainerSchema).optional(),
      singleContainer: z.boolean().default(true), // F82: Only one scroll container
    }).optional(),
    
    // Padding and grid (F004: Canonical Padding)
    padding: z.object({
      canonical: z.object({
        x: z.literal(24).optional(), // 24px horizontal
        y: z.literal(16).optional(), // 16px vertical
      }).optional(),
      grid: z.object({
        base: z.number().default(4), // 4px base unit
        scale: z.array(z.number()).optional(), // [4, 8, 12, 16, 24, 32, 48, 64]
      }).optional(),
    }).optional(),
    
    // Render stability metrics
    stability: z.object({
      metrics: z.array(RenderStabilityMetricSchema).optional(),
      calmness: z.object({
        acceptableBounds: z.object({
          min: z.number().optional(),
          max: z.number().optional(),
        }).optional(),
      }).optional(),
    }).optional(),
    
    // Purity rules
    purity: z.object({
      rules: z.array(PurityRuleSchema).optional(),
      sentinel: z.object({
        enabled: z.boolean().default(true),
        logLevel: z.enum(['debug', 'info', 'warn', 'error']).default('error'),
      }).optional(),
    }).optional(),
    
    // Latency budgets
    latency: z.object({
      budgets: LatencyBudgetSchema.optional(),
    }).optional(),
    
    // Typography flow
    typography: z.object({
      flow: TypographyFlowSchema.optional(),
    }).optional(),
    
    // Critical render regions
    criticalRegions: z.array(CriticalRenderRegionSchema).optional(),
    
    // Safe interaction zones
    interactionZones: z.array(SafeInteractionZoneSchema).optional(),
    
    // Invariants
    invariants: z.object({
      invariants: z.array(z.string()).refine(
        (ids) => {
          for (const id of ids) {
            const entry = registry.get(id)
            if (!entry) {
              throw new Error(`Invariant ${id} not found in registry`)
            }
          }
          return true
        },
        { message: 'All invariant IDs must exist in registry' }
      ).optional(),
      enforceAt: z.enum(['build', 'runtime', 'both']).default('both'),
    }).optional(),
  }),
})

export type UXFidelityYaml = z.infer<typeof UXFidelityYamlSchema>

