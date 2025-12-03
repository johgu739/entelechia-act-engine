/**
 * ✅ ENTELECHIA: Phase 9.0 — Purity Guards Canonicalization
 * 
 * Loads and canonicalizes all six Purity Guards from FORM.
 * 
 * PRINCIPLE: Fail fast - violations detected at canonicalization time
 * This phase runs AFTER Phase 1.5 (Architecture Guard) and BEFORE Phase 7 (Codegen).
 */

import type { PhaseResult } from '../types.js'
import type { ActEngineConfig } from '../types.js'
import type { ActManifest } from '../../manifests/types.js'
import { loadAllPurityGuards } from '../../../purity-guards/purity-guards-canonicalizer.js'

/**
 * Execute Phase 9.0: Purity Guards Canonicalization
 */
export async function runPhase9_0PurityGuardsCanonicalization(
  manifest: ActManifest,
  config: ActEngineConfig
): Promise<PhaseResult & {
  purityGuards?: Map<string, any>
}> {
  const startTime = Date.now()
  const errors: string[] = []
  const warnings: string[] = []

  try {
    // Load all Purity Guards
    const purityGuards = loadAllPurityGuards(config.workspaceRoot)

    // Validate all guards loaded
    const expectedGuards = ['architectural', 'form', 'act', 'state', 'intent', 'epistemic']
    for (const guardType of expectedGuards) {
      if (!purityGuards.has(guardType)) {
        errors.push(`Missing purity guard: ${guardType}`)
      }
    }

    if (errors.length > 0) {
      return {
        phase: 9.0,
        name: 'Purity Guards Canonicalization',
        success: false,
        errors,
        warnings,
        duration: Date.now() - startTime,
      }
    }

    const duration = Date.now() - startTime

    return {
      phase: 9.0,
      name: 'Purity Guards Canonicalization',
      success: true,
      errors: [],
      warnings,
      duration,
      purityGuards,
    }
  } catch (error: any) {
    const duration = Date.now() - startTime

    return {
      phase: 9.0,
      name: 'Purity Guards Canonicalization',
      success: false,
      errors: [`Purity guards canonicalization failed: ${error.message}`],
      warnings: [],
      duration,
    }
  }
}

