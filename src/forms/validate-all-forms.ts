#!/usr/bin/env tsx
/**
 * ✅ ENTELECHIA: Form YAML Validator (All Forms)
 * 
 * Validates all form YAML files against their contract metadata.
 * 
 * PRINCIPLE: All YAML forms must be valid before generation (ACT).
 * This ensures FORM → ACT → STATE chain integrity.
 */

import { readFileSync, readdirSync, existsSync } from 'fs'
import { join } from 'path'
import { FormYamlSchema } from './yaml-schema.js'
import { validateFormYaml } from './validator.js'
import {
  NodeContractMetadata,
  LedgerEntryContractMetadata,
  WorkspaceContractMetadata,
  BackendLedgerContractMetadata,
  BackendLedgerStateContractMetadata,
  BackendAuthContractMetadata,
  BackendSystemContractMetadata,
  BackendHealthContractMetadata,
  BackendErrorsContractMetadata,
  BackendObservabilityContractMetadata,
  BackendChatContractMetadata,
  BackendDatabaseContractMetadata,
  BackendInternalContractMetadata,
  BackendMiscContractMetadata,
  DashboardContractMetadata,
} from '../../../../entelechia-backend/src/contracts/metadata/index.js'
import type { ContractDefinition } from '@entelechia/shared/contracts/metadata/types'

/**
 * Parse YAML file
 */
async function parseYaml(content: string): Promise<any> {
  try {
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
 * Map contract names to metadata
 */
const METADATA_MAP: Record<string, ContractDefinition> = {
  Node: NodeContractMetadata,
  LedgerEntry: LedgerEntryContractMetadata,
  Workspace: WorkspaceContractMetadata,
  BackendLedger: BackendLedgerContractMetadata,
  BackendLedgerState: BackendLedgerStateContractMetadata,
  BackendAuth: BackendAuthContractMetadata,
  BackendSystem: BackendSystemContractMetadata,
  BackendHealth: BackendHealthContractMetadata,
  BackendErrors: BackendErrorsContractMetadata,
  BackendObservability: BackendObservabilityContractMetadata,
  BackendChat: BackendChatContractMetadata,
  BackendDatabase: BackendDatabaseContractMetadata,
  BackendInternal: BackendInternalContractMetadata,
  BackendMisc: BackendMiscContractMetadata,
  Dashboard: DashboardContractMetadata,
}

/**
 * Validate all form YAML files
 */
async function validateAllForms(yamlDir: string): Promise<void> {
  if (!existsSync(yamlDir)) {
    console.log(`⚠️  Forms directory does not exist: ${yamlDir}`)
    return
  }

  const files = readdirSync(yamlDir)
  const yamlFiles = files.filter(f => f.endsWith('.form.yaml'))

  if (yamlFiles.length === 0) {
    console.log(`⚠️  No form YAML files found in ${yamlDir}`)
    return
  }

  console.log(`[VALIDATION] Found ${yamlFiles.length} form YAML files`)
  console.log('')

  const errors: Array<{ file: string; errors: string[] }> = []

  for (const yamlFile of yamlFiles.sort()) {
    const filePath = join(yamlDir, yamlFile)
    console.log(`[VALIDATION] Validating ${yamlFile}...`)

    try {
      // Parse YAML
      const content = readFileSync(filePath, 'utf-8')
      const yamlData = await parseYaml(content)
      const formYaml = FormYamlSchema.parse(yamlData)

      // Find corresponding metadata
      const contractName = formYaml.form.contract
      const metadata = METADATA_MAP[contractName]

      if (!metadata) {
        errors.push({
          file: yamlFile,
          errors: [`Contract "${contractName}" not found in metadata map`],
        })
        continue
      }

      // Validate against metadata
      validateFormYaml(formYaml, metadata)

      // Check variant exists in formSchemas
      if (!metadata.formSchemas || metadata.formSchemas.length === 0) {
        errors.push({
          file: yamlFile,
          errors: [`Contract "${contractName}" has no formSchemas defined`],
        })
        continue
      }

      const variantExists = metadata.formSchemas.some(
        fs => fs.id === formYaml.form.variant
      )

      if (!variantExists) {
        errors.push({
          file: yamlFile,
          errors: [
            `Variant "${formYaml.form.variant}" not found in formSchemas. Available: ${metadata.formSchemas.map(fs => fs.id).join(', ')}`,
          ],
        })
        continue
      }

      console.log(`  ✅ ${yamlFile} valid`)
    } catch (error: any) {
      errors.push({
        file: yamlFile,
        errors: [error.message || String(error)],
      })
      console.log(`  ❌ ${yamlFile} failed: ${error.message}`)
    }
  }

  console.log('')

  if (errors.length > 0) {
    console.error('[VALIDATION] ❌ Form validation failed:')
    for (const { file, errors: fileErrors } of errors) {
      console.error(`  ${file}:`)
      for (const err of fileErrors) {
        console.error(`    - ${err}`)
      }
    }
    process.exit(1)
  }

  console.log('[VALIDATION] ✅ All form YAML files valid')
}

/**
 * Main execution
 */
async function main() {
  const yamlDir = process.argv[2] || join(process.cwd(), '..', 'entelechia-ui', 'forms')
  await validateAllForms(yamlDir)
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
}

export { validateAllForms }


