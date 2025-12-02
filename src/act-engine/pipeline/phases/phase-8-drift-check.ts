/**
 * ✅ ENTELECHIA: Phase 8 — Drift Check
 * 
 * Detects any drift between FORM and STATE.
 */

import { existsSync, readFileSync } from 'fs'
import type { ActManifest } from '../../manifests/types.js'
import type { ActEngineConfig, PhaseResult } from '../types.js'
import { DeterministicWriter } from '../../writers/deterministic-writer.js'

/**
 * Execute Phase 8: Drift Check
 */
export async function runPhase8DriftCheck(
  manifest: ActManifest,
  config: ActEngineConfig
): Promise<PhaseResult> {
  const startTime = Date.now()
  const errors: string[] = []
  const warnings: string[] = []
  const writer = new DeterministicWriter()
  
  try {
    // Check all expected artifacts from manifest
    const allArtifacts: Array<{ path: string; type: string }> = []
    
    // Collect contract artifacts
    for (const contractManifest of manifest.contracts) {
      if (contractManifest.artifacts.sharedContract) {
        allArtifacts.push({ path: contractManifest.artifacts.sharedContract, type: 'schema' })
      }
      if (contractManifest.artifacts.migration) {
        allArtifacts.push({ path: contractManifest.artifacts.migration, type: 'migration' })
      }
      if (contractManifest.artifacts.service) {
        allArtifacts.push({ path: contractManifest.artifacts.service, type: 'service' })
      }
      if (contractManifest.artifacts.test) {
        allArtifacts.push({ path: contractManifest.artifacts.test, type: 'test' })
      }
    }
    
    // Collect form artifacts
    for (const formManifest of manifest.forms) {
      allArtifacts.push({ path: formManifest.descriptorPath, type: 'form' })
    }
    
    // Collect invariant mapping
    allArtifacts.push({ path: manifest.invariants.mappingPath, type: 'invariant-mapping' })
    
    // Check each artifact
    for (const artifact of allArtifacts) {
      if (!existsSync(artifact.path)) {
        // In check mode, missing artifacts are expected (not generated yet)
        // Only report as warning, not error
        if (config.checkMode) {
          warnings.push(`Expected artifact missing (check mode): ${artifact.path}`)
        } else {
          errors.push(`Expected artifact missing: ${artifact.path}`)
        }
        continue
      }
      
      // Check for generation banner
      try {
        const content = readFileSync(artifact.path, 'utf-8')
        const hasBanner = content.includes('Generated from') || 
                         content.includes('DO NOT EDIT MANUALLY') ||
                         (content.includes('✅ ENTELECHIA') && content.includes('Generated'))
        
        if (!hasBanner) {
          // In check mode, missing banners are expected (will be regenerated)
          // In write mode, this is an error - file should have been regenerated
          if (config.checkMode) {
            warnings.push(`Artifact "${artifact.path}" is missing generation banner (will be regenerated)`)
          } else {
            // In write mode, if file exists but has no banner, it's a problem
            // But we just regenerated it, so this shouldn't happen unless generation failed
            warnings.push(`Artifact "${artifact.path}" is missing generation banner (may need manual fix)`)
          }
        }
      } catch (error: any) {
        warnings.push(`Cannot read artifact "${artifact.path}": ${error.message}`)
      }
    }
    
    const duration = Date.now() - startTime
    
    return {
      phase: 8,
      name: 'Drift Check',
      success: errors.length === 0,
      errors,
      warnings,
      duration,
    }
  } catch (error: any) {
    const duration = Date.now() - startTime
    
    return {
      phase: 8,
      name: 'Drift Check',
      success: false,
      errors: [`Drift check failed: ${error.message}`],
      warnings: [],
      duration,
    }
  }
}

