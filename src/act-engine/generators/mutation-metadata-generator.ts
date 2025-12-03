/**
 * ✅ ENTELECHIA: Mutation Metadata Generator
 * 
 * Generates mutation metadata STATE from IntentGraph.
 * 
 * PRINCIPLE: FORM → ACT → STATE → RUNTIME
 * - FORM: IntentGraph YAML defines intents
 * - ACT: This generator creates mutation metadata
 * - STATE: Generated mutation-metadata.generated.ts
 * - RUNTIME: UI consumes metadata to create mutations
 */

import type { CanonicalIntentGraphDescriptor } from '../../intent-graph/intent-graph-types.js'
import { MutationFactory } from '../../mutation/mutation-factory.js'

/**
 * Generate mutation-metadata.generated.ts
 */
export function generateMutationMetadataCode(
  intentGraphDescriptors: Map<string, CanonicalIntentGraphDescriptor>
): string {
  const lines: string[] = []

  lines.push('/**')
  lines.push(' * ✅ ENTELECHIA: Mutation Metadata')
  lines.push(' * ')
  lines.push(' * Generated from IntentGraph - DO NOT EDIT MANUALLY')
  lines.push(' * ')
  lines.push(` * Generated: ${new Date().toISOString()}`)
  lines.push(' * ')
  lines.push(' * This file is STATE - it is generated from FORM (IntentGraph).')
  lines.push(' * UI consumes this metadata to create mutations.')
  lines.push(' * ')
  lines.push(' * ONTOLOGICAL PRINCIPLE:')
  lines.push(' * - UI never imports mutation hooks')
  lines.push(' * - UI never chooses which mutation to use')
  lines.push(' * - ACT-engine determines executors from IntentGraph')
  lines.push(' * - Executors are pure async functions (no hooks)')
  lines.push(' * - RUNTIME only presents, never creates logic')
  lines.push(' */')
  lines.push('')
  
  // Create mutation factory
  const factory = new MutationFactory(intentGraphDescriptors)
  const allMetadata = factory.getAllMutationMetadata()
  
  // Generate mutation metadata registry
  lines.push('export interface MutationMetadata {')
  lines.push('  intentId: string')
  lines.push('  mutationHookPath: string')
  lines.push('  mutationHookName?: string // Executor function name (e.g., "executeAuthLoginIntent", "executeCreateNodeIntent")')
  lines.push('  description: string')
  lines.push('  category: string')
  lines.push('  domain: string')
  lines.push('  requiresAuth: boolean')
  lines.push('  actions: string[]')
  lines.push('  invariants: string[]')
  lines.push('  metrics: {')
  lines.push('    onStart: string[]')
  lines.push('    onSuccess: string[]')
  lines.push('    onFailure: string[]')
  lines.push('  }')
  lines.push('  // ✅ PHASE 1: Payload schema (FORM-level contract)')
  lines.push('  payloadSchema?: {')
  lines.push('    [fieldName: string]: {')
  lines.push('      type: string')
  lines.push('      required: boolean')
  lines.push('    }')
  lines.push('  }')
  lines.push('  // ✅ PHASE 1: Context requirements (FORM-level contract)')
  lines.push('  requiredContext?: {')
  lines.push('    [contextKey: string]: boolean')
  lines.push('  }')
  lines.push('}')
  lines.push('')
  
  lines.push('export const mutationMetadataRegistry = new Map<string, MutationMetadata>(')
  lines.push('  [')
  
  const entries: string[] = []
  for (const [intentId, metadata] of allMetadata.entries()) {
    const metadataJson = JSON.stringify(metadata, null, 2)
    entries.push(`    [${JSON.stringify(intentId)}, ${metadataJson} as MutationMetadata]`)
  }
  
  lines.push(entries.join(',\n'))
  lines.push('  ]')
  lines.push(')')
  lines.push('')
  
  // Generate helper functions
  lines.push('export function getMutationMetadata(intentId: string): MutationMetadata | undefined {')
  lines.push('  return mutationMetadataRegistry.get(intentId)')
  lines.push('}')
  lines.push('')
  
  lines.push('export function hasMutationMetadata(intentId: string): boolean {')
  lines.push('  return mutationMetadataRegistry.has(intentId)')
  lines.push('}')
  lines.push('')
  
  lines.push('export function getAllMutationMetadata(): MutationMetadata[] {')
  lines.push('  return Array.from(mutationMetadataRegistry.values())')
  lines.push('}')
  lines.push('')
  
  return lines.join('\n')
}

