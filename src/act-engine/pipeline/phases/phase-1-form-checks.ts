/**
 * ✅ ENTELECHIA: Phase 1 — FORM Completeness Checks
 * 
 * Verifies all FORM sources are complete and valid.
 */

import type { ActManifest } from '../../manifests/types.js'
import type { ActEngineConfig, PhaseResult } from '../types.js'
import { validateFormCompleteness } from '../../validators/form-completeness.js'
import type { ContractDefinition } from '@entelechia/shared/contracts/metadata/types'

/**
 * Execute Phase 1: FORM Completeness Checks
 */
export async function runPhase1FormChecks(
  contracts: ContractDefinition[],
  manifest: ActManifest,
  config: ActEngineConfig
): Promise<PhaseResult> {
  const startTime = Date.now()
  
  try {
    const result = await validateFormCompleteness(
      contracts,
      config.yamlDir,
      config.formsOutputDir
    )
    
    const duration = Date.now() - startTime
    
    if (!result.passed) {
      return {
        phase: 1,
        name: 'FORM Completeness Checks',
        success: false,
        errors: result.errors,
        warnings: result.warnings,
        duration,
      }
    }
    
    return {
      phase: 1,
      name: 'FORM Completeness Checks',
      success: true,
      errors: [],
      warnings: result.warnings,
      duration,
    }
  } catch (error: any) {
    const duration = Date.now() - startTime
    
    return {
      phase: 1,
      name: 'FORM Completeness Checks',
      success: false,
      errors: [`FORM completeness check failed: ${error.message}`],
      warnings: [],
      duration,
    }
  }
}


