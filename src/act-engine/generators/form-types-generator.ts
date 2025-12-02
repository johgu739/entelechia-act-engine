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
  lines.push(' * Source: entelechia-backend/src/forms/canonicalizer.ts')
  lines.push(` * Generated: ${new Date().toISOString()}`)
  lines.push(' */')
  lines.push('')
  lines.push('')

  // Generate CanonicalFormDescriptor (exact match from backend)
  lines.push('export interface CanonicalFormDescriptor {')
  lines.push('  contract: string')
  lines.push('  variant: string')
  lines.push('  sections: CanonicalSectionDescriptor[]')
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

