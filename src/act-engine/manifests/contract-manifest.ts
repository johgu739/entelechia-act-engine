/**
 * ✅ ENTELECHIA: Contract Manifest Generator
 * 
 * Generates ContractActManifest from contract metadata.
 */

import type { ContractDefinition } from '@entelechia/shared/contracts/metadata/types'
import type { ContractActManifest } from './types.js'
import { join } from 'path'

/**
 * Generate contract manifest from metadata
 */
export function generateContractManifest(
  contract: ContractDefinition,
  config: {
    metadataDir: string
    sharedContractsDir: string
    migrationsDir: string
    servicesDir: string
    routesDir: string
    testsDir: string
    formsOutputDir: string
  }
): ContractActManifest {
  const metadataPath = join(config.metadataDir, `${contract.domain}.contract.metadata.ts`)
  const sharedContractPath = join(config.sharedContractsDir, `${contract.domain}.contract.ts`)
  const migrationPath = contract.dbMapping
    ? join(config.migrationsDir, `${contract.domain}.sql`)
    : undefined
  const servicePath = contract.transformations.length > 0
    ? join(config.servicesDir, `${contract.domain}.service.ts`)
    : undefined
  const routePath = contract.endpoints.length > 0
    ? join(config.routesDir, `${contract.domain}.ts`)
    : undefined
  const testPath = join(config.testsDir, `${contract.domain}.contract.test.ts`)
  
  // Form manifests will be generated separately
  const forms: string[] = []
  if (contract.formSchemas) {
    for (const formSchema of contract.formSchemas) {
      forms.push(`${contract.name}.${formSchema.id}`)
    }
  }
  
  return {
    contract: contract.name,
    domain: contract.domain,
    metadataPath,
    artifacts: {
      sharedContract: sharedContractPath,
      migration: migrationPath,
      service: servicePath,
      route: routePath,
      test: testPath,
      // Forms will be populated by form manifest generator
    },
  }
}


