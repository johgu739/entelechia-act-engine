/**
 * ✅ ENTELECHIA: IntentGraph Code Generator
 * 
 * Generates TypeScript IntentGraph descriptors from canonical IntentGraph.
 * 
 * PRINCIPLE: Deterministic generation of IntentGraph descriptors.
 */

import type { CanonicalIntentGraphDescriptor } from '../../intent-graph/intent-graph-types.js'

/**
 * Generate intent-graph.generated.ts
 */
export function generateIntentGraphCode(
  intentGraphDescriptors: Map<string, CanonicalIntentGraphDescriptor>
): string {
  const lines: string[] = []

  lines.push('/**')
  lines.push(' * ✅ ENTELECHIA: IntentGraph Descriptors')
  lines.push(' * ')
  lines.push(' * Generated from intent-graph/*.yaml - DO NOT EDIT MANUALLY')
  lines.push(' * ')
  lines.push(` * Generated: ${new Date().toISOString()}`)
  lines.push(' * ')
  lines.push(' * This file is STATE - it is generated from FORM.')
  lines.push(' * Any manual edits will be overwritten.')
  lines.push(' */')
  lines.push('')
  lines.push('// Types are defined inline (no external import needed)')
  lines.push('// CanonicalIntentGraphDescriptor structure is embedded in the generated code')
  lines.push('')
  
  // Generate registry
  lines.push('export const intentGraphRegistry = new Map<string, CanonicalIntentGraphDescriptor>(')
  lines.push('  [')

  const entries: string[] = []
  for (const [key, descriptor] of intentGraphDescriptors.entries()) {
    // Convert Maps to objects for JSON serialization
    const descriptorForJson = {
      intents: descriptor.intents,
      intentActions: Object.fromEntries(descriptor.intentActions),
      intentInvariants: Object.fromEntries(descriptor.intentInvariants),
      intentMetrics: Object.fromEntries(descriptor.intentMetrics),
      actionInvariants: Object.fromEntries(descriptor.actionInvariants),
      actionMetrics: Object.fromEntries(descriptor.actionMetrics),
      causality: descriptor.causality,
      metadata: descriptor.metadata,
    }
    const descriptorJson = JSON.stringify(descriptorForJson, null, 2)
    entries.push(`    [${JSON.stringify(key)}, ${descriptorJson} as any]`)
  }

  lines.push(entries.join(',\n'))
  lines.push('  ]')
  lines.push(')')
  lines.push('')
  
  // Convert objects back to Maps after deserialization
  lines.push('// Convert objects back to Maps')
  lines.push('for (const [, descriptor] of intentGraphRegistry.entries()) {')
  lines.push('  descriptor.intentActions = new Map(Object.entries(descriptor.intentActions))')
  lines.push('  descriptor.intentInvariants = new Map(Object.entries(descriptor.intentInvariants))')
  lines.push('  descriptor.intentMetrics = new Map(Object.entries(descriptor.intentMetrics))')
  lines.push('  descriptor.actionInvariants = new Map(Object.entries(descriptor.actionInvariants))')
  lines.push('  descriptor.actionMetrics = new Map(Object.entries(descriptor.actionMetrics))')
  lines.push('}')
  lines.push('')
  
  // Generate getter functions
  lines.push('export function getIntentGraphDescriptor(key: string): CanonicalIntentGraphDescriptor | undefined {')
  lines.push('  return intentGraphRegistry.get(key)')
  lines.push('}')
  lines.push('')
  lines.push('export function getAllIntentGraphDescriptors(): CanonicalIntentGraphDescriptor[] {')
  lines.push('  return Array.from(intentGraphRegistry.values())')
  lines.push('}')
  lines.push('')
  
  // Generate helper functions for graph traversal
  lines.push('// Graph traversal helpers')
  lines.push('')
  lines.push('export function getIntentsForAction(actionId: string): string[] {')
  lines.push('  const intentIds: string[] = []')
  lines.push('  for (const descriptor of intentGraphRegistry.values()) {')
  lines.push('    for (const [intentId, mapping] of descriptor.intentActions.entries()) {')
  lines.push('      if (mapping.actionIds.includes(actionId)) {')
  lines.push('        intentIds.push(intentId)')
  lines.push('      }')
  lines.push('    }')
  lines.push('  }')
  lines.push('  return intentIds')
  lines.push('}')
  lines.push('')
  
  lines.push('export function getActionsForIntent(intentId: string): string[] {')
  lines.push('  for (const descriptor of intentGraphRegistry.values()) {')
  lines.push('    const mapping = descriptor.intentActions.get(intentId)')
  lines.push('    if (mapping) {')
  lines.push('      return mapping.actionIds')
  lines.push('    }')
  lines.push('  }')
  lines.push('  return []')
  lines.push('}')
  lines.push('')
  
  lines.push('export function getInvariantsForIntent(intentId: string): string[] {')
  lines.push('  for (const descriptor of intentGraphRegistry.values()) {')
  lines.push('    const mapping = descriptor.intentInvariants.get(intentId)')
  lines.push('    if (mapping) {')
  lines.push('      return mapping.invariantIds')
  lines.push('    }')
  lines.push('  }')
  lines.push('  return []')
  lines.push('}')
  lines.push('')
  
  lines.push('export function getMetricsForIntent(intentId: string): string[] {')
  lines.push('  for (const descriptor of intentGraphRegistry.values()) {')
  lines.push('    const mapping = descriptor.intentMetrics.get(intentId)')
  lines.push('    if (mapping) {')
  lines.push('      return mapping.metricIds')
  lines.push('    }')
  lines.push('  }')
  lines.push('  return []')
  lines.push('}')
  lines.push('')
  
  lines.push('export function getInvariantsForAction(actionId: string): string[] {')
  lines.push('  for (const descriptor of intentGraphRegistry.values()) {')
  lines.push('    const mapping = descriptor.actionInvariants.get(actionId)')
  lines.push('    if (mapping) {')
  lines.push('      return mapping.invariantIds')
  lines.push('    }')
  lines.push('  }')
  lines.push('  return []')
  lines.push('}')
  lines.push('')
  
  lines.push('export function getMetricsForAction(actionId: string): string[] {')
  lines.push('  for (const descriptor of intentGraphRegistry.values()) {')
  lines.push('    const mapping = descriptor.actionMetrics.get(actionId)')
  lines.push('    if (mapping) {')
  lines.push('      return mapping.metricIds')
  lines.push('    }')
  lines.push('  }')
  lines.push('  return []')
  lines.push('}')
  lines.push('')
  
  lines.push('export function getCausalityEdges(intentId: string): Array<{ to: string; type: string; condition?: string }> {')
  lines.push('  const edges: Array<{ to: string; type: string; condition?: string }> = []')
  lines.push('  for (const descriptor of intentGraphRegistry.values()) {')
  lines.push('    for (const edge of descriptor.causality) {')
  lines.push('      if (edge.from === intentId) {')
  lines.push('        edges.push({ to: edge.to, type: edge.type, condition: edge.condition })')
  lines.push('      }')
  lines.push('    }')
  lines.push('  }')
  lines.push('  return edges')
  lines.push('}')
  lines.push('')
  
  // Generate Intent Registry functions (for backward compatibility)
  lines.push('// Intent Registry (generated from IntentGraph)')
  lines.push('import type { UseMutationResult } from "@tanstack/react-query"')
  lines.push('')
  lines.push('export type IntentMutationHook<TData = any, TVariables = any> = () => UseMutationResult<TData, Error, TVariables>')
  lines.push('')
  lines.push('export interface IntentRegistryEntry<TData = any, TVariables = any> {')
  lines.push('  intentId: string')
  lines.push('  hook: IntentMutationHook<TData, TVariables>')
  lines.push('  description: string')
  lines.push('  category: string')
  lines.push('  domain: string')
  lines.push('  requiresAuth: boolean')
  lines.push('}')
  lines.push('')
  lines.push('export async function resolveIntentMutation(intentId: string): Promise<IntentMutationHook> {')
  lines.push('  // Find intent descriptor')
  lines.push('  let intentDescriptor: any = null')
  lines.push('  for (const descriptor of intentGraphRegistry.values()) {')
  lines.push('    intentDescriptor = descriptor.intents.find((i: any) => i.id === intentId)')
  lines.push('    if (intentDescriptor) break')
  lines.push('  }')
  lines.push('  ')
  lines.push('  if (!intentDescriptor) {')
  lines.push('    throw new Error(`Intent "${intentId}" not found in IntentGraph`)')
  lines.push('  }')
  lines.push('  ')
  lines.push('  if (!intentDescriptor.mutationHook) {')
  lines.push('    throw new Error(`Intent "${intentId}" does not have a mutationHook defined`)')
  lines.push('  }')
  lines.push('  ')
  lines.push('  // Dynamic import of mutation hook')
  lines.push('  const hookModule = await import(intentDescriptor.mutationHook)')
  lines.push('  const hook = hookModule.default || hookModule[Object.keys(hookModule)[0]]')
  lines.push('  ')
  lines.push('  if (!hook) {')
  lines.push('    throw new Error(`Could not find mutation hook in module: ${intentDescriptor.mutationHook}`)')
  lines.push('  }')
  lines.push('  ')
  lines.push('  return hook as IntentMutationHook')
  lines.push('}')
  lines.push('')
  lines.push('export function getIntentEntry(intentId: string): IntentRegistryEntry | undefined {')
  lines.push('  // Find intent descriptor')
  lines.push('  for (const descriptor of intentGraphRegistry.values()) {')
  lines.push('    const intent = descriptor.intents.find((i: any) => i.id === intentId)')
  lines.push('    if (intent) {')
  lines.push('      return {')
  lines.push('        intentId: intent.id,')
  lines.push('        hook: () => { throw new Error("Hook must be resolved via resolveIntentMutation") },')
  lines.push('        description: intent.description,')
  lines.push('        category: intent.category,')
  lines.push('        domain: intent.domain,')
  lines.push('        requiresAuth: intent.requiresAuth,')
  lines.push('      }')
  lines.push('    }')
  lines.push('  }')
  lines.push('  return undefined')
  lines.push('}')
  lines.push('')
  lines.push('// Legacy INTENT_REGISTRY export (for backward compatibility)')
  lines.push('export const INTENT_REGISTRY: Record<string, IntentRegistryEntry> = {}')
  lines.push('// Note: INTENT_REGISTRY is now generated from IntentGraph')
  lines.push('// Use resolveIntentMutation() or getIntentEntry() instead')
  lines.push('')

  return lines.join('\n')
}

