/**
 * ✅ ENTELECHIA: ACT Manifest Generator
 * 
 * Main entry point for generating all ACT manifests.
 */

import type { ContractDefinition } from '@entelechia/shared/contracts/metadata/types'
import type { ActManifest, ContractActManifest, FormActManifest } from './types.js'
import { generateContractManifest } from './contract-manifest.js'
import { generateFormManifestsForContract } from './form-manifest.js'
import { generateInvariantManifest } from './invariant-manifest.js'
import { generateAclManifest } from './acl-manifest.js'
import type { ActEngineConfig } from '../pipeline/types.js'

/**
 * Generate complete ACT manifest
 */
export async function generateActManifest(
  contracts: ContractDefinition[],
  config: ActEngineConfig
): Promise<ActManifest> {
  const contractManifests: ContractActManifest[] = []
  const formManifests: FormActManifest[] = []
  
  // Generate contract manifests
  for (const contract of contracts) {
    const contractManifest = generateContractManifest(contract, {
      metadataDir: config.metadataDir,
      sharedContractsDir: config.sharedContractsDir,
      migrationsDir: config.migrationsDir,
      servicesDir: config.servicesDir,
      routesDir: config.routesDir,
      testsDir: config.testsDir,
      formsOutputDir: config.formsOutputDir,
    })
    
    contractManifests.push(contractManifest)
    
    // Generate form manifests for this contract
    const forms = generateFormManifestsForContract(
      contract,
      config.yamlDir,
      config.formsOutputDir
    )
    
    formManifests.push(...forms)
    
    // Attach forms to contract manifest
    contractManifest.artifacts.forms = forms
  }
  
  // Generate invariant manifest
  const invariantManifest = generateInvariantManifest(config.invariantMappingOutputDir)
  
  // Generate ACL manifest (requires workspace root for backend ACL imports)
  const workspaceRoot = config.workspaceRoot || process.cwd()
  const aclManifest = await generateAclManifest(workspaceRoot)
  
  return {
    contracts: contractManifests,
    forms: formManifests,
    invariants: invariantManifest,
    acl: aclManifest,
    generatedAt: new Date(),
  }
}

