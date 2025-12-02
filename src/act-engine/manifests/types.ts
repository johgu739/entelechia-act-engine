/**
 * ✅ ENTELECHIA: ACT Manifest Type Definitions
 * 
 * Machine-readable manifests describing FORM → STATE transformations.
 * 
 * These manifests serve:
 * - ACT Engine: Knows what to generate
 * - CI: Validates completeness
 * - Documentation: Shows FORM→STATE mappings
 */

/**
 * Contract ACT Manifest
 * 
 * Describes all artifacts generated from a contract metadata file.
 */
export interface ContractActManifest {
  contract: string
  domain: string
  metadataPath: string
  artifacts: {
    sharedContract?: string // Path to generated shared contract
    migration?: string // Path to generated migration
    service?: string // Path to generated service
    route?: string // Path to generated route
    test?: string // Path to generated test
    forms?: FormActManifest[] // Form descriptors
  }
}

/**
 * Form ACT Manifest
 * 
 * Describes a form descriptor generated from YAML + metadata.
 */
export interface FormActManifest {
  contract: string
  variant: string
  yamlPath: string
  descriptorPath: string
  sections: string[]
  fields: string[]
}

/**
 * Invariant ACT Manifest
 * 
 * Describes invariant mapping generation.
 */
export interface InvariantActManifest {
  registryPath: string
  mappingPath: string
  invariantCount: number
  categories: string[]
}

/**
 * ACL ACT Manifest
 * 
 * Describes ACL capability matrix generation.
 */
export interface AclActManifest {
  actionRegistryPath: string
  roleCompilerPath: string
  roles: string[]
  actions: string[]
  roleActionMappings: Record<string, string[]> // role -> actions[]
}

/**
 * Complete ACT Manifest
 * 
 * Contains all manifests for a complete ACT run.
 */
export interface ActManifest {
  contracts: ContractActManifest[]
  forms: FormActManifest[]
  invariants: InvariantActManifest
  acl: AclActManifest
  generatedAt: Date
}


