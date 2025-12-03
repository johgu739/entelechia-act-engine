/**
 * ✅ ENTELECHIA: IntentGraph Canonical Types
 * 
 * TypeScript types for canonical IntentGraph descriptors.
 * 
 * PRINCIPLE: FORM → ACT → STATE → RUNTIME
 * - These types represent the canonical STATE layer structure
 */

/**
 * Payload field definition (canonical)
 */
export interface CanonicalPayloadField {
  type: string
  required: boolean
}

/**
 * Payload schema (canonical)
 */
export type CanonicalPayloadSchema = Record<string, CanonicalPayloadField>

/**
 * Context requirements (canonical)
 */
export type CanonicalRequiredContext = Record<string, boolean>

/**
 * Intent descriptor
 */
export interface CanonicalIntentDescriptor {
  id: string
  description: string
  category: 'auth' | 'workspace' | 'system' | 'navigation' | 'debug' | 'observability'
  domain: string
  requiresAuth: boolean
  mutationHook?: string  // Path to executor module
  executor?: string  // ✅ EXPLICIT: Executor function name (e.g., "executeCreateNodeIntent"). Must NOT be a hook.
  payloadSchema?: CanonicalPayloadSchema  // ✅ PHASE 1: Payload schema (FORM-level contract)
  requiredContext?: CanonicalRequiredContext  // ✅ PHASE 1: Context requirements (FORM-level contract)
  metadata: Record<string, any>
}

/**
 * Intent → Action mapping
 */
export interface CanonicalIntentActionMapping {
  actionIds: string[]
  required: string[]
  optional: string[]
  order: 'parallel' | 'sequential'
}

/**
 * Intent → Invariant mapping
 */
export interface CanonicalIntentInvariantMapping {
  invariantIds: string[]
  enforceAt: 'build' | 'runtime' | 'both'
  onViolation: 'fail' | 'warn' | 'rollback'
}

/**
 * Intent → Metric mapping
 */
export interface CanonicalIntentMetricMapping {
  metricIds: string[]
  onStart: string[]
  onSuccess: string[]
  onFailure: string[]
}

/**
 * Action → Invariant mapping
 */
export interface CanonicalActionInvariantMapping {
  invariantIds: string[]
  enforceAt: 'build' | 'runtime' | 'both'
  onViolation: 'fail' | 'warn' | 'rollback'
}

/**
 * Action → Metric mapping
 */
export interface CanonicalActionMetricMapping {
  metricIds: string[]
  onStart: string[]
  onSuccess: string[]
  onFailure: string[]
}

/**
 * Intent causality edge
 */
export interface CanonicalIntentCausalityEdge {
  from: string
  to: string
  type: 'triggers' | 'enables' | 'requires' | 'compensates'
  condition?: string
}

/**
 * Complete canonical IntentGraph descriptor
 */
export interface CanonicalIntentGraphDescriptor {
  intents: CanonicalIntentDescriptor[]
  intentActions: Map<string, CanonicalIntentActionMapping>
  intentInvariants: Map<string, CanonicalIntentInvariantMapping>
  intentMetrics: Map<string, CanonicalIntentMetricMapping>
  actionInvariants: Map<string, CanonicalActionInvariantMapping>
  actionMetrics: Map<string, CanonicalActionMetricMapping>
  causality: CanonicalIntentCausalityEdge[]
  metadata: {
    version: string
    description: string
    lastUpdated: string
  }
}

