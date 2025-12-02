/**
 * ✅ ENTELECHIA: Phase 0 — Generate Manifests
 * 
 * Generates machine-readable manifests describing all FORM → STATE transformations.
 */

import type { ContractDefinition } from '@entelechia/shared/contracts/metadata/types'
import type { ActManifest } from '../../manifests/types.js'
import type { ActEngineConfig, PhaseResult } from '../types.js'
import { generateActManifest } from '../../manifests/index.js'

/**
 * Execute Phase 0: Generate Manifests
 */
export async function runPhase0Manifests(
  contracts: ContractDefinition[],
  config: ActEngineConfig
): Promise<PhaseResult> {
  const startTime = Date.now()
  const errors: string[] = []
  const warnings: string[] = []
  
  try {
    // Generate complete manifest
    const manifest = await generateActManifest(contracts, config)
    
    const duration = Date.now() - startTime
    
    return {
      phase: 0,
      name: 'Generate Manifests',
      success: true,
      errors,
      warnings,
      duration,
    }
  } catch (error: any) {
    const duration = Date.now() - startTime
    errors.push(`Manifest generation failed: ${error.message}`)
    
    return {
      phase: 0,
      name: 'Generate Manifests',
      success: false,
      errors,
      warnings,
      duration,
    }
  }
}


