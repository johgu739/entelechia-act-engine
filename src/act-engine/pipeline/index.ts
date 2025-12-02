/**
 * ✅ ENTELECHIA: ACT Engine Pipeline
 * 
 * Main orchestrator for all ACT transformations.
 * 
 * PRINCIPLE: Single entry point for all FORM → STATE transformations.
 */

import type { ContractDefinition } from '@entelechia/shared/contracts/metadata/types'
import type { ActManifest } from '../manifests/types.js'
import type { ActEngineConfig, PipelineResult } from './types.js'
import { generateActManifest } from '../manifests/index.js'
import { runPhase0Manifests } from './phases/phase-0-manifests.js'
import { runPhase1FormChecks } from './phases/phase-1-form-checks.js'
import { runPhase2ContractValidation } from './phases/phase-2-contract-validation.js'
import { runPhase3InvariantValidation } from './phases/phase-3-invariant-validation.js'
import { runPhase4AclValidation } from './phases/phase-4-acl-validation.js'
import { runPhase5YamlValidation } from './phases/phase-5-yaml-validation.js'
import { runPhase6Canonicalization } from './phases/phase-6-canonicalization.js'
import { runPhase6bNavigationCanonicalization } from './phases/phase-6b-navigation-canonicalization.js'
import { runPhase7_5FunctionalCanonicalization } from './phases/phase-7.5-functional-canonicalization.js'
import { runPhase7_6InvariantEnforcement } from './phases/phase-7.6-invariant-enforcement.js'
import { runPhase7_7FunctionalCanonicalization } from './phases/phase-7.7-functional-canonicalization.js'
import { runPhase7_8CommandCanonicalization } from './phases/phase-7.8-command-canonicalization.js'
import { runPhase7Codegen } from './phases/phase-7-codegen.js'
import { runPhase8DriftCheck } from './phases/phase-8-drift-check.js'
import { runPhase9UiTypecheck } from './phases/phase-9-ui-typecheck.js'
import { runPhase10InvariantRegistry } from './phases/phase-10-invariant-registry.js'
import { runPhase11RuntimeSimulation } from './phases/phase-11-runtime-simulation.js'
import { join } from 'path'
import { readFileSync, existsSync } from 'fs'

/**
 * Get workspace root (where package.json is)
 * ACT Engine CLI runs from workspace root, but backend code runs from entelechia-backend/
 */
function getWorkspaceRoot(): string {
  // If we're running from workspace root (npm run act:recompute), use cwd
  // If we're running from backend (direct tsx), go up one level
  const cwd = process.cwd()
  if (cwd.endsWith('entelechia-backend')) {
    return join(cwd, '..')
  }
  // Check if we're in workspace root by looking for package.json with workspaces
  try {
    const pkgJson = require(join(cwd, 'package.json'))
    if (pkgJson.workspaces) {
      return cwd
    }
  } catch {
    // Fallback: assume workspace root
  }
  return cwd
}

const WORKSPACE_ROOT = getWorkspaceRoot()
const BACKEND_ROOT = join(WORKSPACE_ROOT, 'entelechia-backend')

/**
 * Default ACT Engine configuration
 * 
 * All paths are relative to workspace root (where npm scripts run from)
 */
export const DEFAULT_ACT_CONFIG: ActEngineConfig = {
  // Workspace root
  workspaceRoot: WORKSPACE_ROOT,
  
  // Input paths (relative to workspace root)
  metadataDir: join(BACKEND_ROOT, 'src', 'contracts', 'metadata'),
  yamlDir: join(WORKSPACE_ROOT, 'entelechia-ui', 'forms'),
  invariantEnginePath: join(WORKSPACE_ROOT, 'packages', 'invariant-engine'),
  
  // Output paths (relative to workspace root)
  sharedContractsDir: join(WORKSPACE_ROOT, 'entelechia-shared', 'src', 'contracts'),
  migrationsDir: join(BACKEND_ROOT, 'supabase', 'migrations'),
  servicesDir: join(BACKEND_ROOT, 'src', 'services'),
  routesDir: join(BACKEND_ROOT, 'src', 'routes'),
  testsDir: join(BACKEND_ROOT, 'src', '__tests__'),
  formsOutputDir: join(WORKSPACE_ROOT, 'entelechia-ui', 'src', 'generated', 'forms'),
  invariantMappingOutputDir: join(WORKSPACE_ROOT, 'entelechia-ui', 'src', 'generated', 'invariants'),
  
  // Options
  checkMode: false,
  dryRun: false,
  validateCode: true,
  backupExisting: true,
  
  // Phase control
  skipPhases: [],
}

/**
 * Run complete ACT Engine pipeline
 */
export async function runActPipeline(
  contracts: ContractDefinition[],
  config: Partial<ActEngineConfig> = {}
): Promise<PipelineResult> {
  const fullConfig: ActEngineConfig = { ...DEFAULT_ACT_CONFIG, ...config }
  const startTime = Date.now()
  const phases: PipelineResult['phases'] = []
  const allErrors: string[] = []
  const allWarnings: string[] = []
  
  // Phase 0: Generate Manifests
  let manifest: ActManifest
  try {
    manifest = await generateActManifest(contracts, fullConfig)
  } catch (error: any) {
    return {
      success: false,
      phases: [],
      manifest: {} as ActManifest,
      totalDuration: Date.now() - startTime,
      errors: [`Manifest generation failed: ${error.message}`],
      warnings: [],
    }
  }
  
  // Phase 0: Run manifest phase (for tracking)
  const phase0 = await runPhase0Manifests(contracts, fullConfig)
  phases.push(phase0)
  allErrors.push(...phase0.errors)
  allWarnings.push(...phase0.warnings)
  
  if (!phase0.success && !fullConfig.skipPhases?.includes(0)) {
    return {
      success: false,
      phases,
      manifest,
      totalDuration: Date.now() - startTime,
      errors: allErrors,
      warnings: allWarnings,
    }
  }
  
  // Phase 1: FORM Completeness Checks
  if (!fullConfig.skipPhases?.includes(1)) {
    const phase1 = await runPhase1FormChecks(contracts, manifest, fullConfig)
    phases.push(phase1)
    allErrors.push(...phase1.errors)
    allWarnings.push(...phase1.warnings)
    
    if (!phase1.success) {
      return {
        success: false,
        phases,
        manifest,
        totalDuration: Date.now() - startTime,
        errors: allErrors,
        warnings: allWarnings,
      }
    }
  }
  
  // Phase 2: Contract Metadata Validation
  if (!fullConfig.skipPhases?.includes(2)) {
    const phase2 = await runPhase2ContractValidation(contracts, manifest, fullConfig)
    phases.push(phase2)
    allErrors.push(...phase2.errors)
    allWarnings.push(...phase2.warnings)
    
    if (!phase2.success) {
      return {
        success: false,
        phases,
        manifest,
        totalDuration: Date.now() - startTime,
        errors: allErrors,
        warnings: allWarnings,
      }
    }
  }
  
  // Phase 3: Invariant Engine Validation
  if (!fullConfig.skipPhases?.includes(3)) {
    const phase3 = await runPhase3InvariantValidation(manifest, fullConfig)
    phases.push(phase3)
    allErrors.push(...phase3.errors)
    allWarnings.push(...phase3.warnings)
    
    if (!phase3.success) {
      return {
        success: false,
        phases,
        manifest,
        totalDuration: Date.now() - startTime,
        errors: allErrors,
        warnings: allWarnings,
      }
    }
  }
  
  // Phase 4: ACL FORM Validation
  if (!fullConfig.skipPhases?.includes(4)) {
    const phase4 = await runPhase4AclValidation(manifest, fullConfig)
    phases.push(phase4)
    allErrors.push(...phase4.errors)
    allWarnings.push(...phase4.warnings)
    
    if (!phase4.success) {
      return {
        success: false,
        phases,
        manifest,
        totalDuration: Date.now() - startTime,
        errors: allErrors,
        warnings: allWarnings,
      }
    }
  }
  
  // Phase 5: YAML Validation
  if (!fullConfig.skipPhases?.includes(5)) {
    const phase5 = await runPhase5YamlValidation(contracts, manifest, fullConfig)
    phases.push(phase5)
    allErrors.push(...phase5.errors)
    allWarnings.push(...phase5.warnings)
    
    if (!phase5.success) {
      return {
        success: false,
        phases,
        manifest,
        totalDuration: Date.now() - startTime,
        errors: allErrors,
        warnings: allWarnings,
      }
    }
  }
  
  // Phase 6: Descriptor Canonicalization
  let descriptors: Map<string, any> | undefined
  if (!fullConfig.skipPhases?.includes(6)) {
    const phase6 = await runPhase6Canonicalization(contracts, manifest, fullConfig)
    phases.push(phase6)
    allErrors.push(...phase6.errors)
    allWarnings.push(...phase6.warnings)
    descriptors = (phase6 as any).descriptors
    
    if (!phase6.success) {
      return {
        success: false,
        phases,
        manifest,
        totalDuration: Date.now() - startTime,
        errors: allErrors,
        warnings: allWarnings,
      }
    }
  }
  
  // Phase 6b: Navigation Canonicalization
  if (!fullConfig.skipPhases?.includes(6.5)) {
    const phase6b = await runPhase6bNavigationCanonicalization(manifest, fullConfig)
    phases.push(phase6b)
    allErrors.push(...phase6b.errors)
    allWarnings.push(...phase6b.warnings)
    
    // Navigation canonicalization is non-blocking (warnings only)
    // Don't fail pipeline if navigation YAML doesn't exist
  }
  
  // Phase 7.5: UI Functional Canonicalization
  let functionalDescriptors: Map<string, any> | undefined
  if (!fullConfig.skipPhases?.includes(7.5)) {
    const phase7_5 = await runPhase7_5FunctionalCanonicalization(contracts, manifest, fullConfig)
    phases.push(phase7_5)
    allErrors.push(...phase7_5.errors)
    allWarnings.push(...phase7_5.warnings)
    functionalDescriptors = (phase7_5 as any).functionalDescriptors
    
    // Functional canonicalization is non-blocking (warnings only)
    // Don't fail pipeline if functional bindings don't exist
  }
  
  // Phase 7.6: Invariant Canonicalization & Enforcement
  // ✅ CRITICAL: This phase MUST run before codegen to reject illegal descriptors
  if (!fullConfig.skipPhases?.includes(7.6)) {
    const phase7_6 = await runPhase7_6InvariantEnforcement(
      manifest,
      fullConfig,
      descriptors
    )
    phases.push(phase7_6)
    allErrors.push(...phase7_6.errors)
    allWarnings.push(...phase7_6.warnings)
    
    // ✅ CRITICAL: Fail pipeline on FIRST invariant violation
    if (!phase7_6.success) {
      return {
        success: false,
        phases,
        manifest,
        totalDuration: Date.now() - startTime,
        errors: allErrors,
        warnings: allWarnings,
      }
    }
  }
  
  // Phase 7.7: Functional Canonicalization (NEW)
  // Validates functional bindings against contract metadata, ActionRegistry, intent registry
  if (!fullConfig.skipPhases?.includes(7.7)) {
    const phase7_7 = await runPhase7_7FunctionalCanonicalization(
      manifest,
      fullConfig,
      contracts
    )
    phases.push(phase7_7)
    allErrors.push(...phase7_7.errors)
    allWarnings.push(...phase7_7.warnings)
    
    // Merge functional descriptors from Phase 7.7 with Phase 7.5
    if ((phase7_7 as any).functionalDescriptors) {
      const phase7_7Descriptors = (phase7_7 as any).functionalDescriptors as Map<string, any>
      if (functionalDescriptors) {
        // Merge: Phase 7.7 takes precedence
        for (const [key, value] of phase7_7Descriptors) {
          functionalDescriptors.set(key, value)
        }
      } else {
        functionalDescriptors = phase7_7Descriptors
      }
    }
    
    // ✅ CRITICAL: Fail pipeline on FIRST functional binding validation error
    if (!phase7_7.success) {
      return {
        success: false,
        phases,
        manifest,
        totalDuration: Date.now() - startTime,
        errors: allErrors,
        warnings: allWarnings,
      }
    }
  }
  
  // Phase 7.8: Command Canonicalization (NEW)
  // Validates commands.yaml against ActionRegistry and IntentRegistry
  let commandDescriptors: Map<string, any> | undefined
  let hotkeyDescriptors: Map<string, any> | undefined
  
  if (!fullConfig.skipPhases?.includes(7.8)) {
    const phase7_8 = await runPhase7_8CommandCanonicalization(manifest, fullConfig)
    phases.push(phase7_8)
    allErrors.push(...phase7_8.errors)
    allWarnings.push(...phase7_8.warnings)
    
    // Extract command and hotkey descriptors
    if ((phase7_8 as any).commandDescriptors) {
      commandDescriptors = (phase7_8 as any).commandDescriptors as Map<string, any>
    }
    if ((phase7_8 as any).hotkeyDescriptors) {
      hotkeyDescriptors = (phase7_8 as any).hotkeyDescriptors as Map<string, any>
    }
    
    // ✅ CRITICAL: Fail pipeline on FIRST command validation error
    if (!phase7_8.success) {
      return {
        success: false,
        phases,
        manifest,
        totalDuration: Date.now() - startTime,
        errors: allErrors,
        warnings: allWarnings,
      }
    }
  }
  
  // Phase 7: Code Generation
  if (!fullConfig.skipPhases?.includes(7)) {
    const phase7 = await runPhase7Codegen(
      contracts,
      manifest,
      fullConfig,
      descriptors,
      functionalDescriptors,
      commandDescriptors,
      hotkeyDescriptors
    )
    phases.push(phase7)
    allErrors.push(...phase7.errors)
    allWarnings.push(...phase7.warnings)
    
    if (!phase7.success) {
      return {
        success: false,
        phases,
        manifest,
        totalDuration: Date.now() - startTime,
        errors: allErrors,
        warnings: allWarnings,
      }
    }
  }
  
  // Phase 8: Drift Check
  if (!fullConfig.skipPhases?.includes(8)) {
    const phase8 = await runPhase8DriftCheck(manifest, fullConfig)
    phases.push(phase8)
    allErrors.push(...phase8.errors)
    allWarnings.push(...phase8.warnings)
    
    // In check mode, drift check failures are warnings (expected drift)
    // In write mode, missing banners after generation are warnings (not critical)
    // Only fail on actual errors (e.g., cannot read files)
    if (!phase8.success && phase8.errors.length > 0 && !fullConfig.checkMode) {
      // Only fail if there are actual errors (not just missing banners)
      const actualErrors = phase8.errors.filter(e => !e.includes('missing generation banner'))
      if (actualErrors.length > 0) {
        return {
          success: false,
          phases,
          manifest,
          totalDuration: Date.now() - startTime,
          errors: allErrors,
          warnings: allWarnings,
        }
      }
    }
  }
  
  // Phase 9: UI Typecheck
  if (!fullConfig.skipPhases?.includes(9)) {
    const phase9 = await runPhase9UiTypecheck(manifest, fullConfig)
    phases.push(phase9)
    allErrors.push(...phase9.errors)
    allWarnings.push(...phase9.warnings)
    
    if (!phase9.success) {
      return {
        success: false,
        phases,
        manifest,
        totalDuration: Date.now() - startTime,
        errors: allErrors,
        warnings: allWarnings,
      }
    }
  }
  
  // Phase 10: Invariant Registry Validation
  if (!fullConfig.skipPhases?.includes(10)) {
    const phase10 = await runPhase10InvariantRegistry(manifest, fullConfig)
    phases.push(phase10)
    allErrors.push(...phase10.errors)
    allWarnings.push(...phase10.warnings)
    
    if (!phase10.success) {
      return {
        success: false,
        phases,
        manifest,
        totalDuration: Date.now() - startTime,
        errors: allErrors,
        warnings: allWarnings,
      }
    }
  }
  
  // Phase 11: Runtime Simulation Tests
  if (!fullConfig.skipPhases?.includes(11)) {
    const phase11 = await runPhase11RuntimeSimulation(manifest, fullConfig)
    phases.push(phase11)
    allErrors.push(...phase11.errors)
    allWarnings.push(...phase11.warnings)
  }
  
  const totalDuration = Date.now() - startTime
  
  return {
    success: allErrors.length === 0,
    phases,
    manifest,
    totalDuration,
    errors: allErrors,
    warnings: allWarnings,
  }
}

