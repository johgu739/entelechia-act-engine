/**
 * ✅ ENTELECHIA: Generation Banner Templates
 * 
 * Standardized banners for all generated files.
 * Ensures STATE files are clearly marked as generated.
 */

export interface BannerOptions {
  source: string // e.g., "metadata", "YAML + metadata", "invariant-engine"
  contract?: string
  domain?: string
  variant?: string
  type?: string // e.g., "navigation", "form", "contract"
  artifact?: string // e.g., "ui-realms", "navigation-shells"
  generatedAt?: Date
}

/**
 * Generate standard generation banner
 */
export function generateBanner(options: BannerOptions): string {
  const {
    source,
    contract,
    domain,
    variant,
    type,
    artifact,
    generatedAt = new Date(),
  } = options

  const lines: string[] = []
  lines.push('/**')
  lines.push(' * ✅ ENTELECHIA: Generated File')
  lines.push(' * ')
  lines.push(` * Generated from ${source} - DO NOT EDIT MANUALLY`)
  lines.push(' * ')
  
  if (contract) {
    lines.push(` * Contract: ${contract}`)
  }
  if (domain) {
    lines.push(` * Domain: ${domain}`)
  }
  if (variant) {
    lines.push(` * Variant: ${variant}`)
  }
  if (type) {
    lines.push(` * Type: ${type}`)
  }
  if (artifact) {
    lines.push(` * Artifact: ${artifact}`)
  }
  
  lines.push(` * Generated: ${generatedAt.toISOString()}`)
  lines.push(' * ')
  lines.push(' * This file is STATE - it is generated from FORM.')
  lines.push(' * Any manual edits will be overwritten.')
  lines.push(' */')
  
  return lines.join('\n')
}

/**
 * Banner for contract schemas
 */
export function contractBanner(contract: string, domain: string, generatedAt?: Date): string {
  return generateBanner({
    source: 'metadata',
    contract,
    domain,
    generatedAt,
  })
}

/**
 * Banner for form descriptors
 */
export function formBanner(contract: string, variant: string, generatedAt?: Date): string {
  return generateBanner({
    source: 'YAML + metadata',
    contract,
    variant,
    generatedAt,
  })
}

/**
 * Banner for invariant mapping
 */
export function invariantMappingBanner(generatedAt?: Date): string {
  return generateBanner({
    source: 'invariant-engine',
    generatedAt,
  })
}

/**
 * Banner for form types
 */
export function formTypesBanner(generatedAt?: Date): string {
  return generateBanner({
    source: 'canonicalizer.ts (descriptor interfaces)',
    generatedAt,
  })
}

