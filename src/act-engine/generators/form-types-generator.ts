/**
 * ✅ ENTELECHIA: Form Types Generator
 * 
 * Generates UI TypeScript types from backend CanonicalFormDescriptor types.
 * 
 * PRINCIPLE: Single source of truth - backend types are FORM, UI types are STATE.
 * 
 * FORM → ACT → STATE:
 * - FORM: Backend CanonicalFormDescriptor types (canonicalizer.ts)
 * - ACT: Generator extracts and transforms types
 * - STATE: Generated UI types file
 */

import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

/**
 * Generate UI types from backend FORM types
 * 
 * Reads backend canonicalizer.ts and extracts type definitions,
 * then generates entelechia-ui/src/generated/forms/types.ts
 */
export function generateFormTypes(
  backendCanonicalizerPath: string,
  outputPath: string
): { path: string; content: string } {
  // Read backend canonicalizer to extract types
  if (!existsSync(backendCanonicalizerPath)) {
    throw new Error(`Canonicalizer file not found: ${backendCanonicalizerPath}`)
  }

  const canonicalizerContent = readFileSync(backendCanonicalizerPath, 'utf-8')

  // Build the generated types file
  const lines: string[] = []

  // Header
  lines.push('/**')
  lines.push(' * ✅ ENTELECHIA: Form Descriptor Types')
  lines.push(' * ')
  lines.push(' * Generated from backend FORM - DO NOT EDIT MANUALLY')
  lines.push(' * ')
  lines.push(' * Source: entelechia-core/src/forms/canonicalizer.ts')
  lines.push(` * Generated: ${new Date().toISOString()}`)
  lines.push(' */')
  lines.push('')
  lines.push('')

  // Generate CanonicalFormDescriptor (exact match from backend)
  lines.push('export interface CanonicalFormDescriptor {')
  lines.push('  contract: string')
  lines.push('  variant: string')
  lines.push('  sections: CanonicalSectionDescriptor[]')
  lines.push('  // ✅ PHASE 3: Invariant metadata')
  lines.push('  invariants: {')
  lines.push('    declared: string[]')
  lines.push('    enforced: Array<{')
  lines.push('      id: string')
  lines.push('      enforceAt: "build" | "runtime" | "both"')
  lines.push('      layer: "ACT" | "RUNTIME" | "BOTH"')
  lines.push('    }>')
  lines.push('  }')
  lines.push('  // ✅ PHASE 3: Invariant-encoded constraints (literal types)')
  lines.push('  scrollContainers: readonly [{')
  lines.push('    id: string')
  lines.push('    type: "form" | "content"')
  lines.push('  }]')
  lines.push('  padding: {')
  lines.push('    x: 24 // ✅ F004: Literal type (canonical padding)')
  lines.push('    y: 16 // ✅ F004: Literal type (canonical padding)')
  lines.push('  }')
  lines.push('  canonicalSpacing: 0 | 4 | 8 | 12 | 16 | 20 | 24 | 32 | 40 | 48 | 64')
  lines.push('  canonicalGrid: 4 // ✅ F86: Literal type (4px grid)')
  lines.push('  // ✅ NEW: Scroll behavior descriptor (from FORM)')
  lines.push('  scrollBehavior?: {')
  lines.push("    kind: 'standard' | 'elastic'")
  lines.push("    elasticity?: 'soft' | 'medium' | 'firm'")
  lines.push("    overscrollBehavior?: 'auto' | 'contain' | 'none'")
  lines.push('    invariants?: string[]')
  lines.push('  }')
  lines.push('  // ✅ PHASE 3: Functional bindings (optional)')
  lines.push('  functional?: {')
  lines.push('    dataSource?: {')
  lines.push('      type: "projection" | "contract" | "stateview" | "computed"')
  lines.push('      source: string')
  lines.push('      path?: string')
  lines.push('      params?: Record<string, any>')
  lines.push('      fieldBinding?: Record<string, string>')
  lines.push('    }')
  lines.push('    mutation?: {')
  lines.push('      type: "intent" | "contractEndpoint"')
  lines.push('      intentId?: string')
  lines.push('      contract?: string')
  lines.push('      endpoint?: string')
  lines.push('      method?: "POST" | "PUT" | "PATCH" | "DELETE"')
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
  lines.push('')

  // Generate CanonicalSectionDescriptor (exact match from backend)
  lines.push('export interface CanonicalSectionDescriptor {')
  lines.push('  id: string')
  lines.push('  title: string')
  lines.push('  fields: CanonicalFieldDescriptor[]')
  lines.push('}')
  lines.push('')
  lines.push('')

  // Generate CanonicalFieldDescriptor (exact match from backend)
  lines.push('export interface CanonicalFieldDescriptor {')
  lines.push('  fieldName: string')
  lines.push('  type: string')
  lines.push('  widget: string')
  lines.push('  required: boolean')
  lines.push('  readonly: boolean')
  lines.push('  label: string')
  lines.push('  description?: string')
  lines.push('  constraints?: {')
  lines.push('    maxLength?: number')
  lines.push('    minLength?: number')
  lines.push('    pattern?: string')
  lines.push('    choices?: string[]')
  lines.push('  }')
  lines.push('}')
  lines.push('')

  const content = lines.join('\n')

  return {
    path: outputPath,
    content,
  }
}

