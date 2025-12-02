/**
 * ✅ ENTELECHIA: Phase 2 — Contract Metadata Validation
 * 
 * Validates contract metadata structure.
 */

import type { ActManifest } from '../../manifests/types.js'
import type { ActEngineConfig, PhaseResult } from '../types.js'
import type { ContractDefinition } from '@entelechia/shared/contracts/metadata/types'
import { join } from 'path'

/**
 * Execute Phase 2: Contract Metadata Validation
 */
export async function runPhase2ContractValidation(
  contracts: ContractDefinition[],
  manifest: ActManifest,
  config: ActEngineConfig
): Promise<PhaseResult> {
  const startTime = Date.now()
  
  try {
    // Dynamic import from backend (metadata validator is backend-specific)
    const metadataValidatorPath = join(config.workspaceRoot, 'entelechia-backend', 'src', 'contracts', 'metadata', 'metadata-validator.ts')
    const metadataValidatorModule = await import(`file://${metadataValidatorPath}`)
    const validateAllMetadata = metadataValidatorModule.validateAllMetadata
    
    validateAllMetadata(contracts)
    
    const duration = Date.now() - startTime
    
    return {
      phase: 2,
      name: 'Contract Metadata Validation',
      success: true,
      errors: [],
      warnings: [],
      duration,
    }
  } catch (error: any) {
    const duration = Date.now() - startTime
    
    return {
      phase: 2,
      name: 'Contract Metadata Validation',
      success: false,
      errors: [`Metadata validation failed: ${error.message}`],
      warnings: [],
      duration,
    }
  }
}


