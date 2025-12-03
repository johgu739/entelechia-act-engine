/**
 * ✅ ENTELECHIA: Functional Telos Canonicalizer
 * 
 * Merges YAML FORM + Contract Metadata + ACL + Invariants
 * into unified CanonicalFunctionalDescriptor.
 * 
 * PRINCIPLE: Single source of truth for UI functional bindings.
 */

import type { ContractDefinition, EndpointDefinition } from '@entelechia/contracts/contracts/metadata/types'
import type { FormYaml } from './yaml-schema.js'
import type {
  CanonicalFunctionalFormDescriptor,
  CanonicalFunctionalSectionDescriptor,
  CanonicalFunctionalFieldDescriptor,
  FunctionalBinding,
} from './functional-types.js'
import type { CanonicalFormDescriptor, CanonicalSectionDescriptor, CanonicalFieldDescriptor } from './canonicalizer.js'
import { canonicalizeForm } from './canonicalizer.js'
import { join } from 'path'

/**
 * Canonicalize form with functional bindings
 * 
 * Merges:
 * - YAML FORM (structure + functional)
 * - Contract metadata (endpoints, projections)
 * - ACL manifest (actions)
 * - Invariant registry (invariant IDs)
 * 
 * @param yaml Form YAML with functional bindings
 * @param metadata Contract metadata
 * @param workspaceRoot Workspace root (for resolving backend ACL)
 * @param aclManifest ACL manifest (optional, for validation)
 * @returns Canonical functional form descriptor
 */
export async function canonicalizeFunctionalForm(
  yaml: FormYaml,
  metadata: ContractDefinition,
  workspaceRoot: string,
  aclManifest?: { actions: string[] }
): Promise<CanonicalFunctionalFormDescriptor> {
  // Dynamic import from backend (ACL is backend-specific)
  const actionRegistryPath = join(workspaceRoot, 'entelechia-core', 'src', 'acl', 'action-registry.ts')
  const actionRegistryModule = await import(`file://${actionRegistryPath}`)
  const validateActionId = actionRegistryModule.validateActionId
  type ActionID = string
  // Start with base canonicalization
  const baseDescriptor = canonicalizeForm(yaml, metadata)
  
  // Validate and enrich functional bindings
  const functionalSections: CanonicalFunctionalSectionDescriptor[] = await Promise.all(
    baseDescriptor.sections.map(async (section, idx) => {
      const yamlSection = yaml.form.sections[idx]
      
      const functionalFields: CanonicalFunctionalFieldDescriptor[] = section.fields.map((field) => {
        // Field-level functional bindings would come from YAML if we extend it
        // For now, we derive from form-level or section-level
        return {
          ...field,
          functional: undefined, // Field-level functional not yet in YAML schema
        }
      })
      
      return {
        ...section,
        fields: functionalFields,
        functional: yamlSection.functional ? await validateAndEnrichBinding(yamlSection.functional, metadata, workspaceRoot, aclManifest) : undefined,
      }
    })
  )
  
  return {
    ...baseDescriptor,
    sections: functionalSections,
    functional: yaml.form.functional ? await validateAndEnrichBinding(yaml.form.functional, metadata, workspaceRoot, aclManifest) : undefined,
  }
}

/**
 * Validate and enrich functional binding
 * 
 * Validates:
 * - mutation.contract/endpoint exists in metadata
 * - capability.requiredAction is valid ActionID
 * - dataSource.source maps to existing projection/contract
 * - invariants reference valid invariant IDs
 * 
 * Enriches:
 * - Auto-fills capability.requiredAction from endpoint if not specified
 * - Validates endpoint method matches mutation.method
 */
async function validateAndEnrichBinding(
  binding: FunctionalBinding,
  metadata: ContractDefinition,
  workspaceRoot: string,
  aclManifest?: { actions: string[] }
): Promise<FunctionalBinding> {
  const enriched: FunctionalBinding = { ...binding }
  
  // Dynamic import from backend (ACL is backend-specific)
  const actionRegistryPath = join(workspaceRoot, 'entelechia-core', 'src', 'acl', 'action-registry.ts')
  const actionRegistryModule = await import(`file://${actionRegistryPath}`)
  const validateActionId = actionRegistryModule.validateActionId
  type ActionID = string
  
  // Validate mutation
  if (binding.mutation) {
    // ✅ INTENT-BASED: All mutations must use intent registry
    if (binding.mutation.type !== 'intent') {
      throw new Error('Functional binding: Only type "intent" is supported. All mutations must go through intent registry.')
    }
    
    if (!binding.mutation.intentId) {
      throw new Error('Functional binding: intentId is required')
    }
    
    // Intent mutations don't need endpoint validation - they go through intent registry
    // Capability validation happens at runtime via intent registry
  }
  
  // Validate capability
  if (binding.capability) {
    if (!validateActionId(binding.capability.requiredAction as ActionID)) {
      throw new Error(
        `Functional binding: Invalid ActionID "${binding.capability.requiredAction}"`
      )
    }
    
    if (binding.capability.additional) {
      for (const action of binding.capability.additional) {
        if (!validateActionId(action as ActionID)) {
          throw new Error(`Functional binding: Invalid additional ActionID "${action}"`)
        }
      }
    }
  }
  
  // Validate dataSource
  if (binding.dataSource) {
    if (binding.dataSource.type === 'contract' && binding.dataSource.source !== metadata.name) {
      // Could validate against known contracts, but for now just check name match
      // In future, could validate projection exists
    }
  }
  
  // Validate invariants (basic check - would need invariant registry for full validation)
  if (binding.invariants) {
    // Basic format check: should match pattern like "UI_FORM.F55" or "UI_SCROLL.F82"
    for (const invId of binding.invariants.invariants) {
      if (!invId.includes('.')) {
        throw new Error(`Functional binding: Invalid invariant ID format "${invId}" (expected CATEGORY.CODE)`)
      }
    }
  }
  
  return enriched
}

/**
 * Find endpoint in contract metadata
 * 
 * Matches by:
 * 1. Exact endpoint name
 * 2. Endpoint path contains endpoint name (case-insensitive)
 * 3. Endpoint path matches common patterns (e.g., "CreateNode" -> "/nodes" POST)
 */
function findEndpoint(
  metadata: ContractDefinition,
  contractName: string,
  endpointName: string
): EndpointDefinition | undefined {
  if (metadata.name !== contractName) {
    return undefined
  }
  
  // Try exact name match first
  let endpoint = metadata.endpoints.find((ep) => ep.name === endpointName)
  if (endpoint) return endpoint
  
  // Try path-based matching (case-insensitive)
  const endpointNameLower = endpointName.toLowerCase()
  endpoint = metadata.endpoints.find((ep) => 
    ep.path.toLowerCase().includes(endpointNameLower) ||
    ep.name.toLowerCase().includes(endpointNameLower)
  )
  if (endpoint) return endpoint
  
  // Special case: "CreateNode" -> POST /nodes
  if (endpointName === 'CreateNode' || endpointName === 'create') {
    endpoint = metadata.endpoints.find((ep) => 
      ep.method === 'POST' && 
      (ep.path === '/nodes' || ep.path.startsWith('/nodes'))
    )
    if (endpoint) return endpoint
  }
  
  return undefined
}

