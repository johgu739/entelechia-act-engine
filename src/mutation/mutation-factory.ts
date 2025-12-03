/**
 * ✅ ENTELECHIA: Mutation Factory
 * 
 * ACT-layer mutation factory that generates mutation metadata from IntentGraph.
 * 
 * PRINCIPLE: FORM → ACT → STATE → RUNTIME
 * - FORM: IntentGraph YAML defines intents and their mutation hooks
 * - ACT: This factory reads IntentGraph and generates mutation metadata
 * - STATE: Generated mutation metadata (no hooks, just metadata)
 * - RUNTIME: UI consumes metadata to create React Query mutations
 * 
 * ONTOLOGICAL CORRECTNESS:
 * - UI never imports mutation hooks
 * - UI never chooses which mutation to use
 * - ACT-engine determines mutations from IntentGraph
 * - RUNTIME only presents, never creates logic
 */

import type { CanonicalIntentGraphDescriptor } from '../intent-graph/intent-graph-types.js'

/**
 * Mutation metadata (STATE layer)
 * 
 * Contains all information needed to create a mutation in RUNTIME,
 * without requiring hook imports or dynamic hook resolution.
 */
export interface MutationMetadata {
  /** Intent ID from IntentGraph */
  intentId: string
  
  /** Mutation executor path (for dynamic import in RUNTIME, not ACT) */
  mutationHookPath: string
  
  /** Executor function name (e.g., "executeAuthLoginIntent", "executeCreateNodeIntent") */
  mutationHookName?: string
  
  /** Intent description */
  description: string
  
  /** Intent category */
  category: string
  
  /** Intent domain */
  domain: string
  
  /** Whether intent requires authentication */
  requiresAuth: boolean
  
  /** Actions associated with this intent */
  actions: string[]
  
  /** Invariants that must be satisfied */
  invariants: string[]
  
  /** Metrics to track */
  metrics: {
    onStart: string[]
    onSuccess: string[]
    onFailure: string[]
  }
  
  /** ✅ PHASE 1: Payload schema (required fields and types) */
  payloadSchema?: {
    [fieldName: string]: {
      type: string
      required: boolean
    }
  }
  
  /** ✅ PHASE 1: Context requirements (which dependencies executor needs) */
  requiredContext?: {
    [contextKey: string]: boolean
  }
}

/**
 * Mutation factory
 * 
 * Generates mutation metadata from IntentGraph descriptors.
 * This is ACT-layer logic - it reads FORM (IntentGraph) and generates STATE.
 */
export class MutationFactory {
  private intentGraphDescriptors: Map<string, CanonicalIntentGraphDescriptor>
  
  constructor(intentGraphDescriptors: Map<string, CanonicalIntentGraphDescriptor>) {
    this.intentGraphDescriptors = intentGraphDescriptors
  }
  
  /**
   * ✅ ONTOLOGICAL: Determine executor name from intent ID
   * 
   * ACT-layer logic determines which executor function to use.
   * This is not UI logic - it's determined by ACT based on intent structure.
   * 
   * PRINCIPLE: Executors are pure async functions (no hooks)
   * - auth.login → executeAuthLoginIntent
   * - node.create → executeCreateNodeIntent
   * - node.update → executeUpdateNodeIntent
   * - node.delete → executeDeleteNodeIntent
   * 
   * ✅ EXPLICIT EXECUTOR PRIORITY:
   * 1. Use explicit executor from FORM (intent.executor) if provided
   * 2. Fallback to heuristik only if executor not explicitly declared
   * 3. NEVER return hook names (names starting with "use")
   * 
   * @param intentId Intent ID (e.g., "node.create", "auth.login")
   * @param explicitExecutor Explicit executor from FORM (if provided)
   * @param mutationHookPath Path to mutation executor module
   * @returns Executor function name (never a hook)
   */
  private determineExecutorName(
    intentId: string,
    explicitExecutor: string | undefined,
    mutationHookPath: string
  ): string | undefined {
    // ✅ PRIORITY 1: Use explicit executor from FORM if provided
    if (explicitExecutor) {
      // ✅ INVARIANT: Executor must NOT be a hook
      if (explicitExecutor.startsWith('use')) {
        throw new Error(
          `INTENT.F55_EXECUTOR_CANNOT_BE_HOOK: Intent "${intentId}" declares executor "${explicitExecutor}" which is a hook. ` +
          `Executors must be pure async functions (e.g., "executeCreateNodeIntent"), not React hooks.`
        )
      }
      return explicitExecutor
    }
    
    // ✅ PRIORITY 2: Fallback to heuristik only if executor not explicitly declared
    // Pattern: auth.login → executeAuthLoginIntent
    // Pattern: node.create → executeCreateNodeIntent
    // Extract action and domain from intentId
    const parts = intentId.split('.')
    if (parts.length >= 2) {
      const action = parts[1] // "create", "update", "delete", "login"
      const domain = parts[0] // "node", "auth"
      
      // Capitalize first letter of action
      const capitalizedAction = action.charAt(0).toUpperCase() + action.slice(1)
      
      // Generate executor name: execute{Action}{Domain}Intent or execute{Domain}{Action}Intent
      // For workspace mutations: executeCreateNodeIntent, executeUpdateNodeIntent, executeDeleteNodeIntent
      // For auth: executeAuthLoginIntent, executeAuthLogoutIntent
      if (domain === 'node' && ['create', 'update', 'delete'].includes(action)) {
        return `execute${capitalizedAction}NodeIntent`
      } else if (domain === 'auth' && ['login', 'logout'].includes(action)) {
        return `executeAuth${capitalizedAction}Intent`
      }
    }
    
    // Default: no specific executor name (use default export)
    return undefined
  }
  
  /**
   * Get mutation metadata for an intent
   * 
   * @param intentId Intent ID (e.g., "auth.login", "node.create")
   * @returns Mutation metadata or null if intent not found
   */
  getMutationMetadata(intentId: string): MutationMetadata | null {
    // Search through all IntentGraph descriptors
    for (const descriptor of this.intentGraphDescriptors.values()) {
      const intent = descriptor.intents.find(i => i.id === intentId)
      
      if (intent) {
        // Get actions for this intent
        const actionMapping = descriptor.intentActions.get(intentId)
        const actions = actionMapping?.actionIds || []
        
        // Get invariants for this intent
        const invariantMapping = descriptor.intentInvariants.get(intentId)
        const invariants = invariantMapping?.invariantIds || []
        
        // Get metrics for this intent
        const metricMapping = descriptor.intentMetrics.get(intentId)
        const metrics = {
          onStart: metricMapping?.onStart || [],
          onSuccess: metricMapping?.onSuccess || [],
          onFailure: metricMapping?.onFailure || [],
        }
        
        // ✅ ONTOLOGICAL: Determine executor name (ACT-layer logic)
        // Priority: explicit executor from FORM > heuristik > undefined
        const mutationHookPath = intent.mutationHook || ''
        const executorName = this.determineExecutorName(
          intentId,
          intent.executor,  // ✅ EXPLICIT: From FORM
          mutationHookPath
        )
        
        // ✅ ACT ENFORCEMENT: INTENT.F55_EXECUTOR_CANNOT_BE_HOOK (build-time)
        // Fail ACT pipeline if executor is a hook
        if (executorName && executorName.startsWith('use')) {
          throw new Error(
            `INTENT.F55_EXECUTOR_CANNOT_BE_HOOK: Intent "${intentId}" has executor "${executorName}" which is a hook. ` +
            `Executors must be pure async functions (e.g., "executeCreateNodeIntent"), not React hooks. ` +
            `Fix IntentGraph.yaml to declare correct executor name.`
          )
        }
        
        // ✅ ACT ENFORCEMENT: ACT.F99_REROUTE_DETECTED (prevent missing executor)
        // If mutationHook exists but executor is missing, ACT must fail (no RUNTIME compensation)
        if (mutationHookPath && !executorName) {
          throw new Error(
            `ACT.F99_REROUTE_DETECTED: Intent "${intentId}" has mutationHook "${mutationHookPath}" but no executor name could be determined. ` +
            `Either declare explicit executor in IntentGraph.yaml or ensure heuristik can determine executor name. ` +
            `RUNTIME cannot compensate - ACT must produce correct STATE.`
          )
        }
        
        return {
          intentId: intent.id,
          mutationHookPath,
          mutationHookName: executorName,  // ✅ RENAMED: This is executor name, not hook name
          description: intent.description,
          category: intent.category,
          domain: intent.domain,
          requiresAuth: intent.requiresAuth,
          actions,
          invariants,
          metrics,
          // ✅ PHASE 1: Include payload schema and context requirements from FORM
          payloadSchema: intent.payloadSchema,
          requiredContext: intent.requiredContext,
        }
      }
    }
    
    return null
  }
  
  /**
   * Get all mutation metadata
   * 
   * @returns Map of intentId → mutation metadata
   */
  getAllMutationMetadata(): Map<string, MutationMetadata> {
    const metadata = new Map<string, MutationMetadata>()
    
    for (const descriptor of this.intentGraphDescriptors.values()) {
      for (const intent of descriptor.intents) {
        if (intent.mutationHook) {
          const mutationMetadata = this.getMutationMetadata(intent.id)
          if (mutationMetadata) {
            metadata.set(intent.id, mutationMetadata)
          }
        }
      }
    }
    
    return metadata
  }
  
  /**
   * Check if intent exists
   * 
   * @param intentId Intent ID
   * @returns True if intent exists
   */
  hasIntent(intentId: string): boolean {
    return this.getMutationMetadata(intentId) !== null
  }
}

