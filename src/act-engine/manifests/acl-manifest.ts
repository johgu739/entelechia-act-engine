/**
 * ✅ ENTELECHIA: ACL Manifest Generator
 * 
 * Generates AclActManifest from ACL FORM sources.
 * 
 * NOTE: ACL compilation is backend-specific, so we load it dynamically
 * from backend when generating manifests.
 */

import type { AclActManifest } from './types.js'
import { join } from 'path'

/**
 * Generate ACL manifest
 * 
 * @param workspaceRoot Workspace root path (for resolving backend paths)
 */
export async function generateAclManifest(workspaceRoot: string): Promise<AclActManifest> {
  const actionRegistryPath = join(workspaceRoot, 'entelechia-backend', 'src', 'acl', 'action-registry.ts')
  const roleCompilerPath = join(workspaceRoot, 'entelechia-backend', 'src', 'acl', 'role-compiler.ts')
  
  // Dynamic import from backend (ACL is backend-specific)
  const actionRegistryModule = await import(`file://${actionRegistryPath}`)
  const roleCompilerModule = await import(`file://${roleCompilerPath}`)
  
  const ActionRegistry = actionRegistryModule.ActionRegistry
  const compileRoles = roleCompilerModule.compileRoles
  
  // Get all actions
  const actions = Object.keys(ActionRegistry) as string[]
  
  // Get all roles from compilation
  const compilation = compileRoles()
  const roles = Array.from(compilation.compiled.keys()).sort() as string[]
  
  // Build role→action mappings
  const roleActionMappings: Record<string, string[]> = {}
  for (const [role, compiled] of compilation.compiled.entries()) {
    roleActionMappings[role] = Array.from(compiled.transitiveActions).sort() as string[]
  }
  
  return {
    actionRegistryPath,
    roleCompilerPath,
    roles,
    actions: Array.from(actions).sort() as string[],
    roleActionMappings,
  }
}

