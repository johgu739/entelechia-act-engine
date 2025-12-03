/**
 * ✅ ENTELECHIA: IntentGraph FORM Schema
 * 
 * Zod schemas for validating IntentGraph YAML files.
 * 
 * PRINCIPLE: FORM → ACT → STATE → RUNTIME
 * - FORM: IntentGraph YAML files define intent → action → invariant → metric relationships
 * - ACT: This schema validates and canonicalizes IntentGraph
 * - STATE: Generated descriptors provide type-safe graph traversal
 * - RUNTIME: Hooks consume generated descriptors for intent execution
 */

import { z } from 'zod'

/**
 * Intent ID schema (must match IntentRegistry format)
 */
export const IntentIdSchema = z.string().min(1).describe('Intent ID (e.g., "auth.login", "node.create")')

/**
 * Action ID schema (must match ActionRegistry format)
 */
export const ActionIdSchema = z.string().min(1).describe('Action ID (e.g., "LOGIN", "CREATE_NODE")')

/**
 * Invariant ID schema (must match invariant-engine format: CATEGORY.CODE)
 */
export const InvariantIdSchema = z.string().regex(/^[A-Z_]+\.F\d+$/, 'Must match format CATEGORY.CODE (e.g., "UI_LAYOUT.F82")').describe('Invariant ID')

/**
 * Metric ID schema (must match telemetry/metrics.yaml)
 */
export const MetricIdSchema = z.string().min(1).describe('Metric ID (e.g., "workspace-load", "api-request")')

/**
 * Payload field schema (for FORM-level contract definition)
 */
export const PayloadFieldSchema = z.object({
  type: z.string().describe('Type of the field (e.g., "string", "string | null", "number")'),
  required: z.boolean().optional().default(true).describe('Whether this field is required'),
})

/**
 * Payload schema (for FORM-level contract definition)
 */
export const PayloadSchema = z.record(PayloadFieldSchema).describe('Payload schema defining required fields and types')

/**
 * Context requirements schema (for FORM-level contract definition)
 */
export const RequiredContextSchema = z.record(z.boolean()).describe('Context requirements (e.g., { queryClient: true, cacheNode: true })')

/**
 * Intent definition schema
 */
export const IntentDefinitionSchema = z.object({
  id: IntentIdSchema,
  description: z.string().min(1).describe('Human-readable description'),
  category: z.enum(['auth', 'workspace', 'system', 'navigation', 'debug', 'observability']).describe('Intent category'),
  domain: z.string().min(1).describe('Domain (e.g., "nodes", "ledger", "system")'),
  requiresAuth: z.boolean().optional().default(true).describe('Whether intent requires authentication'),
  mutationHook: z.string().optional().describe('Path to mutation executor module (e.g., "@/features/auth/intent/use-login")'),
  executor: z.string().optional().describe('Explicit executor function name (e.g., "executeAuthLoginIntent", "executeCreateNodeIntent"). Must NOT start with "use" (hooks are not executors).'),
  payloadSchema: PayloadSchema.optional().describe('✅ PHASE 1: Payload schema defining required fields and types (FORM-level contract)'),
  requiredContext: RequiredContextSchema.optional().describe('✅ PHASE 1: Context requirements (e.g., { queryClient: true, cacheNode: true }) (FORM-level contract)'),
  metadata: z.record(z.any()).optional().describe('Additional metadata'),
})

export type IntentDefinition = z.infer<typeof IntentDefinitionSchema>

/**
 * Intent → Action mapping schema
 */
export const IntentActionMappingSchema = z.object({
  intentId: IntentIdSchema,
  actionIds: z.array(ActionIdSchema).min(1).describe('Actions triggered by this intent'),
  required: z.array(ActionIdSchema).optional().describe('Required actions (must all succeed)'),
  optional: z.array(ActionIdSchema).optional().describe('Optional actions (may fail)'),
  order: z.enum(['parallel', 'sequential']).optional().default('parallel').describe('Execution order'),
})

export type IntentActionMapping = z.infer<typeof IntentActionMappingSchema>

/**
 * Intent → Invariant mapping schema
 */
export const IntentInvariantMappingSchema = z.object({
  intentId: IntentIdSchema,
  invariantIds: z.array(InvariantIdSchema).min(1).describe('Invariants that must hold for intent to succeed'),
  enforceAt: z.enum(['build', 'runtime', 'both']).optional().default('both').describe('When to enforce invariants'),
  onViolation: z.enum(['fail', 'warn', 'rollback']).optional().default('fail').describe('Behavior on violation'),
})

export type IntentInvariantMapping = z.infer<typeof IntentInvariantMappingSchema>

/**
 * Intent → Metric mapping schema
 */
export const IntentMetricMappingSchema = z.object({
  intentId: IntentIdSchema,
  metricIds: z.array(MetricIdSchema).min(1).describe('Metrics to track for intent execution'),
  onSuccess: z.array(MetricIdSchema).optional().describe('Metrics to track on success'),
  onFailure: z.array(MetricIdSchema).optional().describe('Metrics to track on failure'),
  onStart: z.array(MetricIdSchema).optional().describe('Metrics to track on start'),
})

export type IntentMetricMapping = z.infer<typeof IntentMetricMappingSchema>

/**
 * Action → Invariant mapping schema
 */
export const ActionInvariantMappingSchema = z.object({
  actionId: ActionIdSchema,
  invariantIds: z.array(InvariantIdSchema).min(1).describe('Invariants that must hold for action to succeed'),
  enforceAt: z.enum(['build', 'runtime', 'both']).optional().default('both').describe('When to enforce invariants'),
  onViolation: z.enum(['fail', 'warn', 'rollback']).optional().default('fail').describe('Behavior on violation'),
})

export type ActionInvariantMapping = z.infer<typeof ActionInvariantMappingSchema>

/**
 * Action → Metric mapping schema
 */
export const ActionMetricMappingSchema = z.object({
  actionId: ActionIdSchema,
  metricIds: z.array(MetricIdSchema).min(1).describe('Metrics to track for action execution'),
  onSuccess: z.array(MetricIdSchema).optional().describe('Metrics to track on success'),
  onFailure: z.array(MetricIdSchema).optional().describe('Metrics to track on failure'),
  onStart: z.array(MetricIdSchema).optional().describe('Metrics to track on start'),
})

export type ActionMetricMapping = z.infer<typeof ActionMetricMappingSchema>

/**
 * Intent causality edge schema (for temporal/episodic structure)
 */
export const IntentCausalityEdgeSchema = z.object({
  from: IntentIdSchema.describe('Source intent ID'),
  to: IntentIdSchema.describe('Target intent ID'),
  type: z.enum(['triggers', 'enables', 'requires', 'compensates']).describe('Causality type'),
  condition: z.string().optional().describe('Condition for causality (e.g., "onSuccess", "onFailure")'),
})

export type IntentCausalityEdge = z.infer<typeof IntentCausalityEdgeSchema>

/**
 * Complete IntentGraph schema
 */
export const IntentGraphSchema = z.object({
  intents: z.array(IntentDefinitionSchema).min(1).describe('Intent definitions'),
  intentActions: z.array(IntentActionMappingSchema).optional().describe('Intent → Action mappings'),
  intentInvariants: z.array(IntentInvariantMappingSchema).optional().describe('Intent → Invariant mappings'),
  intentMetrics: z.array(IntentMetricMappingSchema).optional().describe('Intent → Metric mappings'),
  actionInvariants: z.array(ActionInvariantMappingSchema).optional().describe('Action → Invariant mappings'),
  actionMetrics: z.array(ActionMetricMappingSchema).optional().describe('Action → Metric mappings'),
  causality: z.array(IntentCausalityEdgeSchema).optional().describe('Intent causality edges (for episodes)'),
  metadata: z.object({
    version: z.string().optional().default('1.0.0'),
    description: z.string().optional(),
    lastUpdated: z.string().optional(),
  }).optional(),
})

export type IntentGraph = z.infer<typeof IntentGraphSchema>

/**
 * IntentGraph YAML file schema (root level)
 */
export const IntentGraphFileSchema = z.object({
  intentGraph: IntentGraphSchema,
})

export type IntentGraphFile = z.infer<typeof IntentGraphFileSchema>

