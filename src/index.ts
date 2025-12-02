/**
 * ✅ ENTELECHIA: ACT Engine
 * 
 * Main exports for @entelechia/act-engine package.
 */

export { runActPipeline, DEFAULT_ACT_CONFIG } from './act-engine/pipeline/index.js'
export type { ActEngineConfig, PipelineResult } from './act-engine/pipeline/types.js'
export type { ActManifest } from './act-engine/manifests/types.js'

// Form canonicalization
export { canonicalizeForm } from './forms/canonicalizer.js'
export type { CanonicalFormDescriptor, CanonicalSectionDescriptor, CanonicalFieldDescriptor } from './forms/canonicalizer.js'
export { canonicalizeFunctionalForm } from './forms/functional-canonicalizer.js'
export type { CanonicalFunctionalFormDescriptor } from './forms/functional-types.js'
export { FormYamlSchema } from './forms/yaml-schema.js'
export type { FormYaml } from './forms/yaml-schema.js'

// Navigation
export * from './navigation/metadata/loader.js'
export * from './navigation/metadata/types.js'

