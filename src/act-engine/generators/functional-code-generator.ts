/**
 * ✅ ENTELECHIA: Functional Code Generator
 * 
 * Generates TypeScript functional descriptors from canonical functional forms.
 * 
 * PRINCIPLE: Deterministic generation of functional form descriptors.
 */

import type { CanonicalFunctionalFormDescriptor } from '../../forms/functional-types.js'
import type { ContractDefinition } from '@entelechia/shared/contracts/metadata/types'

/**
 * Generate functional form descriptor TypeScript code
 */
export function generateFunctionalFormDescriptorCode(
  functionalDescriptor: CanonicalFunctionalFormDescriptor,
  contract: ContractDefinition
): string {
  const lines: string[] = []
  
  // Header
  lines.push('/**')
  lines.push(` * ✅ ENTELECHIA: ${functionalDescriptor.contract} Functional Form Descriptor`)
  lines.push(' * ')
  lines.push(' * Generated from YAML + Contract Metadata + ACL + Invariants')
  lines.push(' * DO NOT EDIT MANUALLY')
  lines.push(' * ')
  lines.push(` * Contract: ${functionalDescriptor.contract}`)
  lines.push(` * Variant: ${functionalDescriptor.variant}`)
  lines.push(` * Generated: ${new Date().toISOString()}`)
  lines.push(' * ')
  lines.push(' * This file is STATE - it is generated from FORM.')
  lines.push(' * Any manual edits will be overwritten.')
  lines.push(' */')
  lines.push('')
  
  // Import types - generate inline types instead of importing from backend
  // (Backend types are not accessible from UI, so we generate them inline)
  lines.push('// Functional descriptor types (generated inline)')
  lines.push('// Note: Full types are defined in backend, but we generate minimal types here for UI')
  lines.push('')
  
  // Generate minimal type definition inline (for UI consumption)
  lines.push('// Minimal type definition for UI (full types in backend)')
  lines.push('export interface CanonicalFunctionalFormDescriptor {')
  lines.push('  contract: string')
  lines.push('  variant: string')
  lines.push('  sections: Array<{')
  lines.push('    id: string')
  lines.push('    title: string')
  lines.push('    fields: Array<{')
  lines.push('      fieldName: string')
  lines.push('      type: string')
  lines.push('      widget: string')
  lines.push('      required: boolean')
  lines.push('      readonly: boolean')
  lines.push('      label: string')
  lines.push('      description?: string')
  lines.push('    }>')
  lines.push('  }>')
  lines.push('  functional?: {')
  lines.push('    // ✅ PHASE 3: Complete functional binding spec')
  lines.push('    dataSource?: {')
  lines.push('      type: "projection" | "contract" | "stateview" | "computed"')
  lines.push('      source: string')
  lines.push('      path?: string')
  lines.push('      params?: Record<string, any>')
  lines.push('      fieldBinding?: Record<string, string>')
  lines.push('    }')
  lines.push('    mutation?: {')
  lines.push('      type: "intent" | "contractEndpoint"')
  lines.push('      intentId?: string // Required for type: "intent"')
  lines.push('      contract?: string // Required for type: "contractEndpoint"')
  lines.push('      endpoint?: string // Required for type: "contractEndpoint"')
  lines.push('      method?: "POST" | "PUT" | "PATCH" | "DELETE" // Required for type: "contractEndpoint"')
  lines.push('      payloadTemplate?: Record<string, any>')
  lines.push('      onSuccess?: {')
  lines.push('        redirect?: string')
  lines.push('        refresh?: string[]')
  lines.push('        event?: string')
  lines.push('      }')
  lines.push('      onError?: {')
  lines.push('        showError?: boolean')
  lines.push('        redirect?: string')
  lines.push('      }')
  lines.push('    }')
  lines.push('    capability?: {')
  lines.push('      requiredAction: string')
  lines.push('      additional?: string[]')
  lines.push('      fallback?: {')
  lines.push('        hide?: boolean')
  lines.push('        disable?: boolean')
  lines.push('      }')
  lines.push('    }')
  lines.push('    listen?: Array<{')
  lines.push('      type: "event" | "projection" | "invariant" | "poll"')
  lines.push('      source: string')
  lines.push('      name?: string')
  lines.push('      interval?: number')
  lines.push('      handler?: string')
  lines.push('    }> | {')
  lines.push('      type: "event" | "projection" | "invariant" | "poll"')
  lines.push('      source: string')
  lines.push('      name?: string')
  lines.push('      interval?: number')
  lines.push('      handler?: string')
  lines.push('    }')
  lines.push('    conditions?: Array<{')
  lines.push('      when: string')
  lines.push('      show?: boolean')
  lines.push('      enable?: boolean')
  lines.push('      value?: any')
  lines.push('      operator?: "AND" | "OR"')
  lines.push('    }> | {')
  lines.push('      when: string')
  lines.push('      show?: boolean')
  lines.push('      enable?: boolean')
  lines.push('      value?: any')
  lines.push('      operator?: "AND" | "OR"')
  lines.push('    }')
  lines.push('    invariants?: {')
  lines.push('      invariants: string[]')
  lines.push('      enforceAt?: "build" | "runtime" | "both"')
  lines.push('    }')
  lines.push('    intent?: {')
  lines.push('      kind: string')
  lines.push('      description: string')
  lines.push('      category?: string')
  lines.push('    }')
  lines.push('  }')
  lines.push('}')
  lines.push('')
  
  // Generate descriptor object as TypeScript literal
  lines.push('export const functionalFormDescriptor: CanonicalFunctionalFormDescriptor = ')
  
  // Generate descriptor object (use JSON.stringify for now, but format as TypeScript)
  const descriptorJson = JSON.stringify(functionalDescriptor, null, 2)
  // Replace JSON quotes with TypeScript-compatible format
  const tsLiteral = descriptorJson.replace(/"([^"]+)":/g, '$1:')
  lines.push(tsLiteral)
  lines.push('')
  lines.push('export default functionalFormDescriptor')
  
  return lines.join('\n')
}

