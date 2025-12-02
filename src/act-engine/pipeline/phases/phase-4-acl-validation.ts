/**
 * ✅ ENTELECHIA: Phase 4 — ACL FORM Validation
 * 
 * Validates ACL definitions consistency.
 */

import type { ActManifest } from '../../manifests/types.js'
import type { ActEngineConfig, PhaseResult } from '../types.js'
import { join } from 'path'

/**
 * Execute Phase 4: ACL FORM Validation
 */
export async function runPhase4AclValidation(
  manifest: ActManifest,
  config: ActEngineConfig
): Promise<PhaseResult> {
  const startTime = Date.now()
  const errors: string[] = []
  const warnings: string[] = []
  
  try {
    // Dynamic import from backend (ACL is backend-specific)
    const roleCompilerPath = join(config.workspaceRoot, 'entelechia-backend', 'src', 'acl', 'role-compiler.ts')
    const actionRegistryPath = join(config.workspaceRoot, 'entelechia-backend', 'src', 'acl', 'action-registry.ts')
    
    const roleCompilerModule = await import(`file://${roleCompilerPath}`)
    const actionRegistryModule = await import(`file://${actionRegistryPath}`)
    
    const compileRoles = roleCompilerModule.compileRoles
    const ActionRegistry = actionRegistryModule.ActionRegistry
    const validateActionId = actionRegistryModule.validateActionId
    
    // Compile roles to check for issues
    const compilation = compileRoles()
    
    // Check for compilation errors
    if (compilation.conflicts.length > 0) {
      for (const conflict of compilation.conflicts) {
        warnings.push(`Role conflict: ${conflict.role1} vs ${conflict.role2}: ${conflict.reason}`)
      }
    }
    
    if (compilation.redundant.length > 0) {
      warnings.push(`Redundant roles detected: ${compilation.redundant.join(', ')}`)
    }
    
    if (compilation.warnings.length > 0) {
      warnings.push(...compilation.warnings)
    }
    
    // Validate all actions referenced by roles exist
    for (const [role, compiled] of compilation.compiled.entries()) {
      for (const action of compiled.directActions) {
        if (!validateActionId(action)) {
          errors.push(`Role "${role}" references unknown action: ${action}`)
        }
      }
    }
    
    // Check that all actions in registry are valid
    for (const actionId of Object.keys(ActionRegistry)) {
      if (!validateActionId(actionId)) {
        errors.push(`Action "${actionId}" in registry failed validation`)
      }
    }
    
    const duration = Date.now() - startTime
    
    return {
      phase: 4,
      name: 'ACL FORM Validation',
      success: errors.length === 0,
      errors,
      warnings,
      duration,
    }
  } catch (error: any) {
    const duration = Date.now() - startTime
    
    return {
      phase: 4,
      name: 'ACL FORM Validation',
      success: false,
      errors: [`ACL validation failed: ${error.message}`],
      warnings: [],
      duration,
    }
  }
}


