/**
 * ✅ ENTELECHIA: Phase 3 — Invariant Engine Validation
 * 
 * Verifies invariant registry completeness.
 */

import type { ActManifest } from '../../manifests/types.js'
import type { ActEngineConfig, PhaseResult } from '../types.js'
import { registry } from '@entelechia/invariant-engine'

/**
 * Required invariants that must exist
 */
const REQUIRED_INVARIANTS = [
  'SYSTEM_STATE.F50', // Total Ontological UI Coherence
  'DOMAIN_LOGIC.F2', // System State View Singular
  'UI_SCROLL.F82', // Single Scroll Container
  'UI_LAYOUT.F57', // Frame Purity Enforced
  'DOMAIN_LOGIC.F76', // Refresh Prompt Required
]

/**
 * Execute Phase 3: Invariant Engine Validation
 */
export async function runPhase3InvariantValidation(
  manifest: ActManifest,
  config: ActEngineConfig
): Promise<PhaseResult> {
  const startTime = Date.now()
  const errors: string[] = []
  const warnings: string[] = []
  
  try {
    const allIds = registry.getAllInvariantIds()
    
    if (allIds.length === 0) {
      errors.push('Invariant engine registry is empty')
    }
    
    // Check required invariants
    for (const id of REQUIRED_INVARIANTS) {
      if (!registry.get(id)) {
        errors.push(`Required invariant ${id} not found in registry`)
      }
    }
    
    // Validate invariant ID format
    for (const id of allIds) {
      if (!/^[A-Z_]+\.F\d+$/.test(id) && !/^[A-Z_]+\.I\d+$/.test(id) && !/^[A-Z_]+\.A\d+/.test(id) && !/^[A-Z_]+\.E\d+/.test(id)) {
        warnings.push(`Invariant ID "${id}" does not match canonical format (CATEGORY.CODE)`)
      }
    }
    
    const duration = Date.now() - startTime
    
    return {
      phase: 3,
      name: 'Invariant Engine Validation',
      success: errors.length === 0,
      errors,
      warnings,
      duration,
    }
  } catch (error: any) {
    const duration = Date.now() - startTime
    
    return {
      phase: 3,
      name: 'Invariant Engine Validation',
      success: false,
      errors: [`Invariant validation failed: ${error.message}`],
      warnings: [],
      duration,
    }
  }
}


