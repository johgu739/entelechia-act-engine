/**
 * ✅ ENTELECHIA: ACT Engine Pipeline Types
 * 
 * Type definitions for pipeline execution and results.
 */

import type { ActManifest } from '../manifests/types.js'

/**
 * Phase execution result
 */
export interface PhaseResult {
  phase: number
  name: string
  success: boolean
  errors: string[]
  warnings: string[]
  duration: number // milliseconds
  artifacts?: string[] // Generated file paths
}

/**
 * Pipeline execution result
 */
export interface PipelineResult {
  success: boolean
  phases: PhaseResult[]
  manifest: ActManifest
  totalDuration: number // milliseconds
  errors: string[]
  warnings: string[]
}

/**
 * Phase executor function signature
 */
export type PhaseExecutor = (
  manifest: ActManifest,
  config: ActEngineConfig
) => Promise<PhaseResult>

/**
 * ACT Engine configuration
 */
export interface ActEngineConfig {
  // Workspace root (for resolving backend paths)
  workspaceRoot: string
  
  // Input paths
  metadataDir: string
  yamlDir: string
  invariantEnginePath: string
  
  // Output paths
  sharedContractsDir: string
  migrationsDir: string
  servicesDir: string
  routesDir: string
  testsDir: string
  formsOutputDir: string
  invariantMappingOutputDir: string
  
  // Options
  checkMode: boolean // CI mode: validate without writing
  dryRun: boolean // Show what would be generated
  validateCode: boolean // Validate generated code syntax
  backupExisting: boolean // Backup before overwrite
  
  // Phase control
  skipPhases?: number[] // Skip specific phases (for debugging)
}


