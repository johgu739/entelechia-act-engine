/**
 * ✅ ENTELECHIA: IntentGraph Canonicalizer
 * 
 * Canonicalizes IntentGraph YAML files into CanonicalIntentGraphDescriptor.
 * 
 * PRINCIPLE: FORM → ACT → STATE → RUNTIME
 * - FORM: IntentGraph YAML files
 * - ACT: This canonicalizer validates and transforms
 * - STATE: Generated descriptors
 * - RUNTIME: Hooks consume generated descriptors
 */

import { readFileSync } from 'fs'
import { join, relative, dirname } from 'path'
import { parse } from 'yaml'
import { IntentGraphFileSchema, type IntentGraph, type IntentGraphFile } from './intent-graph-schema.js'
import type { CanonicalIntentGraphDescriptor } from './intent-graph-types.js'

/**
 * Load and parse IntentGraph YAML file
 */
export function loadIntentGraphFile(filePath: string): IntentGraphFile {
  const content = readFileSync(filePath, 'utf-8')
  const parsed = parse(content) as unknown
  
  // Validate against schema
  const validated = IntentGraphFileSchema.parse(parsed)
  return validated
}

/**
 * Validate IntentGraph against external registries
 */
export interface ValidationContext {
  intentIds: Set<string>
  actionIds: Set<string>
  invariantIds: Set<string>
  metricIds: Set<string>
}

export interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

/**
 * Validate IntentGraph against external registries
 */
export function validateIntentGraph(
  graph: IntentGraph,
  context: ValidationContext
): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  // Validate intents
  for (const intent of graph.intents) {
    // Intent IDs are declared in graph, so they're valid by definition
    // But we can check for duplicates
    const duplicates = graph.intents.filter(i => i.id === intent.id)
    if (duplicates.length > 1) {
      errors.push(`Duplicate intent ID: ${intent.id}`)
    }
  }

  // Validate intent → action mappings
  if (graph.intentActions) {
    for (const mapping of graph.intentActions) {
      // Check intent exists
      const intentExists = graph.intents.some(i => i.id === mapping.intentId)
      if (!intentExists) {
        errors.push(`Intent "${mapping.intentId}" referenced in intentActions but not defined in intents`)
      }

      // Check actions exist in ActionRegistry
      for (const actionId of mapping.actionIds) {
        if (!context.actionIds.has(actionId)) {
          errors.push(`Action "${actionId}" referenced by intent "${mapping.intentId}" does not exist in ActionRegistry`)
        }
      }

      // Check required actions are subset of actionIds
      if (mapping.required) {
        for (const requiredActionId of mapping.required) {
          if (!mapping.actionIds.includes(requiredActionId)) {
            errors.push(`Required action "${requiredActionId}" for intent "${mapping.intentId}" is not in actionIds`)
          }
        }
      }

      // Check optional actions are subset of actionIds
      if (mapping.optional) {
        for (const optionalActionId of mapping.optional) {
          if (!mapping.actionIds.includes(optionalActionId)) {
            errors.push(`Optional action "${optionalActionId}" for intent "${mapping.intentId}" is not in actionIds`)
          }
        }
      }
    }
  }

  // Validate intent → invariant mappings
  if (graph.intentInvariants) {
    for (const mapping of graph.intentInvariants) {
      // Check intent exists
      const intentExists = graph.intents.some(i => i.id === mapping.intentId)
      if (!intentExists) {
        errors.push(`Intent "${mapping.intentId}" referenced in intentInvariants but not defined in intents`)
      }

      // Check invariants exist in invariant-engine
      for (const invariantId of mapping.invariantIds) {
        if (!context.invariantIds.has(invariantId)) {
          errors.push(`Invariant "${invariantId}" referenced by intent "${mapping.intentId}" does not exist in invariant-engine`)
        }
      }
    }
  }

  // Validate intent → metric mappings
  if (graph.intentMetrics) {
    for (const mapping of graph.intentMetrics) {
      // Check intent exists
      const intentExists = graph.intents.some(i => i.id === mapping.intentId)
      if (!intentExists) {
        errors.push(`Intent "${mapping.intentId}" referenced in intentMetrics but not defined in intents`)
      }

      // Check metrics exist in telemetry/metrics.yaml
      for (const metricId of mapping.metricIds) {
        if (!context.metricIds.has(metricId)) {
          warnings.push(`Metric "${metricId}" referenced by intent "${mapping.intentId}" may not exist in telemetry/metrics.yaml (will be validated at runtime)`)
        }
      }

      // Check onSuccess/onFailure/onStart metrics are subset of metricIds
      if (mapping.onSuccess) {
        for (const metricId of mapping.onSuccess) {
          if (!mapping.metricIds.includes(metricId)) {
            errors.push(`onSuccess metric "${metricId}" for intent "${mapping.intentId}" is not in metricIds`)
          }
        }
      }

      if (mapping.onFailure) {
        for (const metricId of mapping.onFailure) {
          if (!mapping.metricIds.includes(metricId)) {
            errors.push(`onFailure metric "${metricId}" for intent "${mapping.intentId}" is not in metricIds`)
          }
        }
      }

      if (mapping.onStart) {
        for (const metricId of mapping.onStart) {
          if (!mapping.metricIds.includes(metricId)) {
            errors.push(`onStart metric "${metricId}" for intent "${mapping.intentId}" is not in metricIds`)
          }
        }
      }
    }
  }

  // Validate action → invariant mappings
  if (graph.actionInvariants) {
    for (const mapping of graph.actionInvariants) {
      // Check action exists in ActionRegistry
      if (!context.actionIds.has(mapping.actionId)) {
        errors.push(`Action "${mapping.actionId}" referenced in actionInvariants does not exist in ActionRegistry`)
      }

      // Check invariants exist in invariant-engine
      for (const invariantId of mapping.invariantIds) {
        if (!context.invariantIds.has(invariantId)) {
          errors.push(`Invariant "${invariantId}" referenced by action "${mapping.actionId}" does not exist in invariant-engine`)
        }
      }
    }
  }

  // Validate action → metric mappings
  if (graph.actionMetrics) {
    for (const mapping of graph.actionMetrics) {
      // Check action exists in ActionRegistry
      if (!context.actionIds.has(mapping.actionId)) {
        errors.push(`Action "${mapping.actionId}" referenced in actionMetrics does not exist in ActionRegistry`)
      }

      // Check metrics exist in telemetry/metrics.yaml
      for (const metricId of mapping.metricIds) {
        if (!context.metricIds.has(metricId)) {
          warnings.push(`Metric "${metricId}" referenced by action "${mapping.actionId}" may not exist in telemetry/metrics.yaml (will be validated at runtime)`)
        }
      }

      // Check onSuccess/onFailure/onStart metrics are subset of metricIds
      if (mapping.onSuccess) {
        for (const metricId of mapping.onSuccess) {
          if (!mapping.metricIds.includes(metricId)) {
            errors.push(`onSuccess metric "${metricId}" for action "${mapping.actionId}" is not in metricIds`)
          }
        }
      }

      if (mapping.onFailure) {
        for (const metricId of mapping.onFailure) {
          if (!mapping.metricIds.includes(metricId)) {
            errors.push(`onFailure metric "${metricId}" for action "${mapping.actionId}" is not in metricIds`)
          }
        }
      }

      if (mapping.onStart) {
        for (const metricId of mapping.onStart) {
          if (!mapping.metricIds.includes(metricId)) {
            errors.push(`onStart metric "${metricId}" for action "${mapping.actionId}" is not in metricIds`)
          }
        }
      }
    }
  }

  // Validate causality edges
  if (graph.causality) {
    for (const edge of graph.causality) {
      // Check from intent exists
      const fromExists = graph.intents.some(i => i.id === edge.from)
      if (!fromExists) {
        errors.push(`Intent "${edge.from}" referenced in causality edge does not exist in intents`)
      }

      // Check to intent exists
      const toExists = graph.intents.some(i => i.id === edge.to)
      if (!toExists) {
        errors.push(`Intent "${edge.to}" referenced in causality edge does not exist in intents`)
      }

      // Check for self-loops (may be intentional, but warn)
      if (edge.from === edge.to) {
        warnings.push(`Self-loop detected in causality edge: ${edge.from} → ${edge.to}`)
      }
    }

    // Check for cycles (simple cycle detection)
    const visited = new Set<string>()
    const recStack = new Set<string>()

    function hasCycle(intentId: string): boolean {
      if (recStack.has(intentId)) {
        return true
      }
      if (visited.has(intentId)) {
        return false
      }

      visited.add(intentId)
      recStack.add(intentId)

      const outgoingEdges = graph.causality?.filter(e => e.from === intentId) || []
      for (const edge of outgoingEdges) {
        if (hasCycle(edge.to)) {
          return true
        }
      }

      recStack.delete(intentId)
      return false
    }

    for (const intent of graph.intents) {
      if (hasCycle(intent.id)) {
        errors.push(`Cycle detected in causality graph involving intent "${intent.id}"`)
        break
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  }
}

/**
 * ✅ ONTOLOGICAL: Transform @/ alias to relative path for dynamic import
 * 
 * FORM declares abstract paths (@/), ACT must concretize for RUNTIME.
 * Dynamic import() cannot use Vite aliases - needs relative paths.
 * 
 * @param mutationHookPath Path from FORM (may contain @/ alias)
 * @param outputDir Output directory for generated files (to calculate relative path)
 * @returns Relative path suitable for dynamic import()
 */
function resolveMutationHookPath(mutationHookPath: string | undefined, outputDir: string): string | undefined {
  if (!mutationHookPath) return undefined
  
  // If path doesn't start with @/, return as-is (already relative or absolute)
  if (!mutationHookPath.startsWith('@/')) {
    return mutationHookPath
  }
  
  // ✅ ONTOLOGICAL: Transform @/ alias to relative path
  // FORM declares: "@/features/auth/intent/use-login"
  // ACT transforms to: "../../features/auth/intent/use-login"
  // 
  // Generated file location: entelechia-ui/src/generated/intent-graph/intent-graph.generated.ts
  // Source file location: entelechia-ui/src/features/auth/intent/use-login.ts
  // 
  // Calculate relative path from generated directory to source directory
  // outputDir: entelechia-ui/src/generated/intent-graph
  // sourceDir: entelechia-ui/src
  // sourcePath: entelechia-ui/src/features/auth/intent/use-login.ts
  
  // Remove @/ prefix
  const pathWithoutAlias = mutationHookPath.replace(/^@\//, '')
  
  // Calculate absolute source path
  // outputDir is: .../entelechia-ui/src/generated/intent-graph
  // We need to go up to: .../entelechia-ui/src
  // Then append: features/auth/intent/use-login.ts
  const sourceDir = dirname(dirname(outputDir)) // Go up from generated/intent-graph to src
  const sourcePath = join(sourceDir, pathWithoutAlias)
  
  // Calculate relative path from outputDir to sourcePath
  let relativePath = relative(outputDir, sourcePath)
  
  // Remove .ts extension if present (dynamic import doesn't need it)
  relativePath = relativePath.replace(/\.ts$/, '')
  
  // Ensure path uses forward slashes (for import statements)
  return relativePath.replace(/\\/g, '/')
}

/**
 * Canonicalize IntentGraph YAML into CanonicalIntentGraphDescriptor
 * 
 * @param graph IntentGraph from FORM
 * @param validationContext Validation context
 * @param outputDir Output directory for generated files (for path resolution)
 */
export function canonicalizeIntentGraph(
  graph: IntentGraph,
  validationContext: ValidationContext,
  outputDir?: string
): CanonicalIntentGraphDescriptor {
  // Build intent descriptors
  const intentDescriptors = graph.intents.map(intent => {
    // ✅ ACT ENFORCEMENT: INTENT.F55_EXECUTOR_CANNOT_BE_HOOK
    // Validate executor at ACT build-time, not RUNTIME
    if (intent.executor && intent.executor.startsWith('use')) {
      throw new Error(
        `INTENT.F55_EXECUTOR_CANNOT_BE_HOOK: Intent "${intent.id}" declares executor "${intent.executor}" which is a hook. ` +
        `Executors must be pure async functions (e.g., "executeCreateNodeIntent"), not React hooks. ` +
        `Fix IntentGraph.yaml to declare correct executor name.`
      )
    }
    
    // ✅ ACT ENFORCEMENT: ACT.F99_REROUTE_DETECTED (prevent missing executor)
    // If intent has mutationHook but no executor, ACT must determine it or fail
    if (intent.mutationHook && !intent.executor) {
      // This is OK - ACT will use heuristik to determine executor
      // But we log a warning that explicit executor is preferred
      console.warn(
        `ACT.F99_WARNING: Intent "${intent.id}" has mutationHook but no explicit executor. ` +
        `ACT will use heuristik, but explicit executor is preferred for determinism.`
      )
    }
    
    // ✅ PHASE 1: Canonicalize payload schema (FORM-level contract)
    const payloadSchema = intent.payloadSchema ? Object.entries(intent.payloadSchema).reduce((acc, [key, field]) => {
      acc[key] = {
        type: field.type,
        required: field.required ?? true,
      }
      return acc
    }, {} as Record<string, { type: string; required: boolean }>) : undefined
    
    // ✅ PHASE 1: Canonicalize context requirements (FORM-level contract)
    const requiredContext = intent.requiredContext ? Object.entries(intent.requiredContext).reduce((acc, [key, required]) => {
      acc[key] = required === true
      return acc
    }, {} as Record<string, boolean>) : undefined
    
    return {
      id: intent.id,
      description: intent.description,
      category: intent.category,
      domain: intent.domain,
      requiresAuth: intent.requiresAuth ?? true,
      // ✅ ONTOLOGICAL: Transform @/ alias to relative path in ACT phase
      mutationHook: outputDir 
        ? resolveMutationHookPath(intent.mutationHook, outputDir)
        : intent.mutationHook, // Fallback: preserve original if outputDir not provided
      // ✅ EXPLICIT: Executor function name from FORM (must NOT be a hook)
      executor: intent.executor,
      // ✅ PHASE 1: Payload schema and context requirements (FORM-level contracts)
      payloadSchema,
      requiredContext,
      metadata: intent.metadata || {},
    }
  })

  // Build intent → action mappings
  const intentActionMappings = new Map<string, {
    actionIds: string[]
    required: string[]
    optional: string[]
    order: 'parallel' | 'sequential'
  }>()

  if (graph.intentActions) {
    for (const mapping of graph.intentActions) {
      intentActionMappings.set(mapping.intentId, {
        actionIds: mapping.actionIds,
        required: mapping.required || [],
        optional: mapping.optional || [],
        order: mapping.order || 'parallel',
      })
    }
  }

  // Build intent → invariant mappings
  const intentInvariantMappings = new Map<string, {
    invariantIds: string[]
    enforceAt: 'build' | 'runtime' | 'both'
    onViolation: 'fail' | 'warn' | 'rollback'
  }>()

  if (graph.intentInvariants) {
    for (const mapping of graph.intentInvariants) {
      intentInvariantMappings.set(mapping.intentId, {
        invariantIds: mapping.invariantIds,
        enforceAt: mapping.enforceAt || 'both',
        onViolation: mapping.onViolation || 'fail',
      })
    }
  }

  // Build intent → metric mappings
  const intentMetricMappings = new Map<string, {
    metricIds: string[]
    onStart: string[]
    onSuccess: string[]
    onFailure: string[]
  }>()

  if (graph.intentMetrics) {
    for (const mapping of graph.intentMetrics) {
      intentMetricMappings.set(mapping.intentId, {
        metricIds: mapping.metricIds,
        onStart: mapping.onStart || [],
        onSuccess: mapping.onSuccess || [],
        onFailure: mapping.onFailure || [],
      })
    }
  }

  // Build action → invariant mappings
  const actionInvariantMappings = new Map<string, {
    invariantIds: string[]
    enforceAt: 'build' | 'runtime' | 'both'
    onViolation: 'fail' | 'warn' | 'rollback'
  }>()

  if (graph.actionInvariants) {
    for (const mapping of graph.actionInvariants) {
      actionInvariantMappings.set(mapping.actionId, {
        invariantIds: mapping.invariantIds,
        enforceAt: mapping.enforceAt || 'both',
        onViolation: mapping.onViolation || 'fail',
      })
    }
  }

  // Build action → metric mappings
  const actionMetricMappings = new Map<string, {
    metricIds: string[]
    onStart: string[]
    onSuccess: string[]
    onFailure: string[]
  }>()

  if (graph.actionMetrics) {
    for (const mapping of graph.actionMetrics) {
      actionMetricMappings.set(mapping.actionId, {
        metricIds: mapping.metricIds,
        onStart: mapping.onStart || [],
        onSuccess: mapping.onSuccess || [],
        onFailure: mapping.onFailure || [],
      })
    }
  }

  // Build causality edges
  const causalityEdges = graph.causality || []

  return {
    intents: intentDescriptors,
    intentActions: intentActionMappings,
    intentInvariants: intentInvariantMappings,
    intentMetrics: intentMetricMappings,
    actionInvariants: actionInvariantMappings,
    actionMetrics: actionMetricMappings,
    causality: causalityEdges,
    metadata: {
      version: graph.metadata?.version || '1.0.0',
      description: graph.metadata?.description || '',
      lastUpdated: graph.metadata?.lastUpdated || '',
    },
  }
}

