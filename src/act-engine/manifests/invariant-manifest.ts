/**
 * ✅ ENTELECHIA: Invariant Manifest Generator
 * 
 * Generates InvariantActManifest from invariant engine registry.
 */

import { registry } from '@entelechia/invariant-engine'
import type { InvariantActManifest } from './types.js'
import { join } from 'path'

/**
 * Generate invariant manifest
 */
export function generateInvariantManifest(
  invariantMappingOutputDir: string
): InvariantActManifest {
  const allInvariants = registry.getAllInvariantIds()
  const categories = new Set<string>()
  
  // Collect categories
  for (const id of allInvariants) {
    const entry = registry.get(id)
    if (entry) {
      categories.add(entry.metadata.category)
    }
  }
  
  const registryPath = 'packages/invariant-engine/src/core/registry.ts'
  const mappingPath = join(invariantMappingOutputDir, 'invariant-mapping.ts')
  
  return {
    registryPath,
    mappingPath,
    invariantCount: allInvariants.length,
    categories: Array.from(categories).sort(),
  }
}


