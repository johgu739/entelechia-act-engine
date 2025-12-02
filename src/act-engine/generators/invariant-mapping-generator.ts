/**
 * ✅ ENTELECHIA: Invariant Mapping Generator
 * 
 * Generates UI-friendly invariant mapping from invariant engine FORM.
 * 
 * PRINCIPLE: FORM → ACT → STATE
 * - FORM: InvariantRegistry (packages/invariant-engine)
 * - ACT: This generator reads FORM and emits STATE
 * - STATE: Generated mapping file for UI consumption
 * 
 * ✅ STAGE 1: Removes accidental FORM from UI layer
 */

import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import { registry } from '@entelechia/invariant-engine'
import type { InvariantMetadata } from '@entelechia/invariant-engine'

/**
 * Generate invariant mapping for UI
 * 
 * Reads invariant registry (FORM) and generates a TypeScript file
 * with all invariant metadata for UI consumption.
 */
export function generateInvariantMapping(
  outputPath: string
): { path: string; content: string } {
  const allInvariants = registry.getAllInvariantIds()
  
  const lines: string[] = []
  
  // Header
  lines.push('/**')
  lines.push(' * ✅ ENTELECHIA: Invariant Mapping')
  lines.push(' * ')
  lines.push(' * Generated from invariant engine FORM - DO NOT EDIT MANUALLY')
  lines.push(' * ')
  lines.push(' * Source: packages/invariant-engine/src/core/registry.ts')
  lines.push(` * Generated: ${new Date().toISOString()}`)
  lines.push(' * ')
  lines.push(' * This file provides UI-friendly access to invariant metadata.')
  lines.push(' * All invariant IDs and categories come from canonical FORM.')
  lines.push(' */')
  lines.push('')
  
  // Import types
  lines.push("import type { InvariantMetadata, InvariantCategory } from '@entelechia/invariant-engine'")
  lines.push('')
  
  // Generate mapping object
  lines.push('/**')
  lines.push(' * Invariant metadata map')
  lines.push(' * Key: Invariant ID (e.g., "DOMAIN_LOGIC.F2")')
  lines.push(' * Value: Invariant metadata')
  lines.push(' */')
  lines.push('export const INVARIANT_METADATA: Record<string, InvariantMetadata> = {')
  
  for (const id of allInvariants.sort()) {
    const entry = registry.get(id)
    if (!entry) continue
    
    const metadata = entry.metadata
    lines.push(`  '${id}': {`)
    lines.push(`    id: '${metadata.id}',`)
    lines.push(`    category: '${metadata.category}' as InvariantCategory,`)
    lines.push(`    code: '${metadata.code}',`)
    lines.push(`    name: '${metadata.name}',`)
    lines.push(`    description: ${JSON.stringify(metadata.description)},`)
    lines.push(`    severity: '${metadata.severity}',`)
    // Note: enforce is a function, not a boolean - we can't serialize it
    // The generated mapping will have enforce: undefined, runtime code should check registry
    lines.push(`    enforce: undefined,`)
    lines.push('  },')
  }
  
  lines.push('}')
  lines.push('')
  
  // Generate ID constants for backward compatibility
  lines.push('/**')
  lines.push(' * Invariant ID constants')
  lines.push(' * For backward compatibility with existing code')
  lines.push(' */')
  lines.push('export const INVARIANT_IDS: Record<string, string> = {')
  
  for (const id of allInvariants.sort()) {
    const entry = registry.get(id)
    if (!entry) continue
    
    // Generate a constant name from the ID
    const constantName = id.replace(/\./g, '_').replace(/-/g, '_').toUpperCase()
    lines.push(`  ${constantName}: '${id}',`)
  }
  
  lines.push('}')
  lines.push('')
  
  // Generate category groupings
  lines.push('/**')
  lines.push(' * Invariants grouped by category')
  lines.push(' */')
  lines.push('export const INVARIANTS_BY_CATEGORY: Record<InvariantCategory, string[]> = {')
  
  const categories: Record<string, string[]> = {}
  for (const id of allInvariants) {
    const entry = registry.get(id)
    if (!entry) continue
    
    const category = entry.metadata.category
    if (!categories[category]) {
      categories[category] = []
    }
    categories[category].push(id)
  }
  
  for (const [category, ids] of Object.entries(categories)) {
    lines.push(`  '${category}': [`)
    for (const id of ids.sort()) {
      lines.push(`    '${id}',`)
    }
    lines.push('  ],')
  }
  
  lines.push('}')
  lines.push('')
  
  // Helper function to get invariant metadata
  lines.push('/**')
  lines.push(' * Get invariant metadata by ID')
  lines.push(' */')
  lines.push('export function getInvariantMetadata(id: string): InvariantMetadata | undefined {')
  lines.push('  return INVARIANT_METADATA[id]')
  lines.push('}')
  lines.push('')
  
  // Helper function to map old IDs to new canonical IDs
  lines.push('/**')
  lines.push(' * Map legacy invariant ID to canonical ID')
  lines.push(' * For backward compatibility during migration')
  lines.push(' */')
  lines.push('export function mapInvariantId(oldId: string): string {')
  lines.push('  // If already canonical, return as-is')
  lines.push('  if (INVARIANT_METADATA[oldId]) {')
  lines.push('    return oldId')
  lines.push('  }')
  lines.push('  // Try to find by code (e.g., "F2" -> "DOMAIN_LOGIC.F2")')
  lines.push('  for (const [canonicalId, metadata] of Object.entries(INVARIANT_METADATA)) {')
  lines.push('    if (metadata.code === oldId || metadata.code === oldId.replace(/^[A-Z]+_/, "")) {')
  lines.push('      return canonicalId')
  lines.push('    }')
  lines.push('  }')
  lines.push('  // Fallback: return as-is (may be invalid)')
  lines.push('  return oldId')
  lines.push('}')
  lines.push('')
  
  const content = lines.join('\n')
  
  return { path: outputPath, content }
}

