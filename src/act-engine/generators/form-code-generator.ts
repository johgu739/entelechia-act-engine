/**
 * ✅ ENTELECHIA: Form Code Generator
 * 
 * Generates TypeScript form descriptors from YAML + metadata.
 * 
 * PRINCIPLE: Deterministic generation of canonical form descriptors.
 */

import { readFileSync, existsSync, readdirSync } from 'fs'
import { join } from 'path'
import type { ContractDefinition } from '@entelechia/shared/contracts/metadata/types'
import { FormYamlSchema } from '../../forms/yaml-schema.js'
import { validateFormYaml } from '../../forms/validator.js'
import { canonicalizeForm, type CanonicalFormDescriptor } from '../../forms/canonicalizer.js'
import { checkFormLayoutInvariants } from '../../forms/invariants.js'
import { validateFormInvariants } from '../../forms/invariant-validator.js'

/**
 * Parse YAML file
 * 
 * Requires 'yaml' package: npm install yaml
 */
async function parseYaml(content: string): Promise<any> {
  try {
    // Dynamic import for ESM compatibility
    const yaml = await import('yaml')
    return yaml.parse(content)
  } catch (error: any) {
    if (error.code === 'MODULE_NOT_FOUND') {
      throw new Error(
        'YAML parsing requires "yaml" package. Install with: npm install yaml'
      )
    }
    throw error
  }
}

/**
 * Generate form descriptor code
 * 
 * @param contract Contract metadata
 * @param yamlDir Directory containing YAML files
 * @param outputDir Output directory for generated files
 * @returns Generated file paths
 */
export async function generateFormCode(
  contract: ContractDefinition,
  yamlDir: string,
  outputDir: string
): Promise<{ path: string; content: string }[]> {
  const generatedFiles: { path: string; content: string }[] = []

  // Find all YAML files for this contract
  const yamlFiles = findYamlFilesForContract(yamlDir, contract.name)

  for (const yamlFile of yamlFiles) {
    try {
      // Load and parse YAML
      const yamlContent = readFileSync(yamlFile, 'utf-8')
      const yamlData = await parseYaml(yamlContent)
      const formYaml = FormYamlSchema.parse(yamlData)

      // Validate against metadata (STRICT: fail hard on any error)
      try {
        validateFormYaml(formYaml, contract)
      } catch (error: any) {
        throw new Error(
          `Form YAML validation failed for ${contract.name} from ${yamlFile}: ${error.message}`
        )
      }

      // Canonicalize (STRICT: fail hard on any error)
      let canonical
      try {
        canonical = canonicalizeForm(formYaml, contract)
      } catch (error: any) {
        throw new Error(
          `Form canonicalization failed for ${contract.name} from ${yamlFile}: ${error.message}`
        )
      }

      // Check build-time invariants (STRICT: fail hard on any violation)
      try {
        // Check form layout invariants (section ordering, spacing, etc.)
        checkFormLayoutInvariants(canonical, contract)
        // Check form descriptor invariants (widget appropriateness, uniqueness, etc.)
        validateFormInvariants(canonical, contract)
      } catch (error: any) {
        throw new Error(
          `Form layout invariant violation for ${contract.name} from ${yamlFile}: ${error.message}`
        )
      }

      // Generate TypeScript code
      const tsCode = generateFormDescriptorCode(canonical, contract)

      // Determine output path
      const outputPath = join(
        outputDir,
        `${contract.domain}.${formYaml.form.variant}.form.ts`
      )

      generatedFiles.push({
        path: outputPath,
        content: tsCode,
      })
    } catch (error: any) {
      throw new Error(
        `Failed to generate form code for ${contract.name} from ${yamlFile}: ${error.message}`
      )
    }
  }

  return generatedFiles
}

/**
 * Find YAML files for a contract
 * 
 * Looks for files matching: <contract>.<variant>.form.yaml
 */
function findYamlFilesForContract(yamlDir: string, contractName: string): string[] {
  if (!existsSync(yamlDir)) {
    return []
  }

  const files: string[] = []
  const entries = readdirSync(yamlDir, { withFileTypes: true })

  for (const entry of entries) {
    if (entry.isFile() && entry.name.endsWith('.form.yaml')) {
      // Check if it starts with contract name
      const baseName = entry.name.replace('.form.yaml', '')
      const parts = baseName.split('.')
      if (parts[0] === contractName) {
        files.push(join(yamlDir, entry.name))
      }
    }
  }

  return files
}

/**
 * Generate TypeScript code for form descriptor
 */
function generateFormDescriptorCode(
  descriptor: CanonicalFormDescriptor,
  contract: ContractDefinition
): string {
  const lines: string[] = []

  // Header
  lines.push('/**')
  lines.push(` * ✅ ENTELECHIA: ${descriptor.contract} Form Descriptor`)
  lines.push(' * ')
  lines.push(' * Generated from YAML + metadata - DO NOT EDIT MANUALLY')
  lines.push(' * ')
  lines.push(` * Contract: ${descriptor.contract}`)
  lines.push(` * Variant: ${descriptor.variant}`)
  lines.push(` * Generated: ${new Date().toISOString()}`)
  lines.push(' */')
  lines.push('')
  lines.push('export interface CanonicalFormDescriptor {')
  lines.push('  contract: string')
  lines.push('  variant: string')
  lines.push('  sections: CanonicalSectionDescriptor[]')
  lines.push('}')
  lines.push('')
  lines.push('export interface CanonicalSectionDescriptor {')
  lines.push('  id: string')
  lines.push('  title: string')
  lines.push('  fields: CanonicalFieldDescriptor[]')
  lines.push('}')
  lines.push('')
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
  lines.push('export const formDescriptor: CanonicalFormDescriptor = ')

  // Generate descriptor object
  const descriptorJson = JSON.stringify(descriptor, null, 2)
  lines.push(descriptorJson)
  lines.push('')
  lines.push('export default formDescriptor')

  return lines.join('\n')
}

