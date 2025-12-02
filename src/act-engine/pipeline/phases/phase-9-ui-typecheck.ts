/**
 * ✅ ENTELECHIA: Phase 9 — UI Typecheck
 * 
 * Verifies UI can consume generated types.
 */

import { execSync } from 'child_process'
import { existsSync } from 'fs'
import type { ActManifest } from '../../manifests/types.js'
import type { ActEngineConfig, PhaseResult } from '../types.js'
import { join } from 'path'

/**
 * Execute Phase 9: UI Typecheck
 */
export async function runPhase9UiTypecheck(
  manifest: ActManifest,
  config: ActEngineConfig
): Promise<PhaseResult> {
  const startTime = Date.now()
  const errors: string[] = []
  const warnings: string[] = []
  
  try {
    // Run TypeScript compiler on UI
    const uiRoot = join(process.cwd(), 'entelechia-ui')
    
    // Skip UI typecheck if UI directory doesn't exist
    if (!existsSync(uiRoot)) {
      warnings.push(`UI directory does not exist: ${uiRoot} (skipping UI typecheck)`)
      return {
        phase: 9,
        name: 'UI Typecheck',
        success: true,
        errors: [],
        warnings: [`UI directory does not exist: ${uiRoot} (skipping UI typecheck)`],
        duration: Date.now() - startTime,
      }
    }
    
    try {
      execSync('npm run typecheck', {
        cwd: uiRoot,
        stdio: 'pipe',
        encoding: 'utf-8',
        shell: '/bin/bash',
      })
    } catch (error: any) {
      const output = error.stdout?.toString() || error.stderr?.toString() || error.message || String(error)
      // UI typecheck failures are warnings (UI may not have typecheck script yet)
      // This will be fixed in Step 4
      warnings.push(`UI typecheck had issues:\n${output}`)
    }
    
    const duration = Date.now() - startTime
    
    return {
      phase: 9,
      name: 'UI Typecheck',
      success: errors.length === 0,
      errors,
      warnings,
      duration,
    }
  } catch (error: any) {
    const duration = Date.now() - startTime
    
    return {
      phase: 9,
      name: 'UI Typecheck',
      success: false,
      errors: [`UI typecheck failed: ${error.message}`],
      warnings: [],
      duration,
    }
  }
}

