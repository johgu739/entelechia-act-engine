/**
 * ✅ ENTELECHIA: Service Code Generator
 * 
 * Deterministic code generator for service functions from contract metadata.
 * 
 * PRINCIPLE: Metadata is FORM → Service code is implementation → Generation is deterministic transformation.
 * 
 * This generator implements Service Generation Law by generating TypeScript code directly from metadata.
 */

import type {
  ContractDefinition,
  TransformationDefinition,
  FieldMappingDefinition,
  FieldDefinition,
} from '@entelechia/shared/contracts/metadata/types'

/**
 * Generate complete service file code from contract metadata
 * 
 * @param metadata Contract metadata
 * @returns Complete TypeScript file content
 */
export function generateServiceCode(
  metadata: ContractDefinition
): string {
  const lines: string[] = []
  
  // Header
  lines.push('/**')
  lines.push(` * ✅ ENTELECHIA: ${metadata.name} Service Functions`)
  lines.push(' * ')
  lines.push(' * Generated from metadata - DO NOT EDIT MANUALLY')
  lines.push(' * ')
  lines.push(` * Domain: ${metadata.domain}`)
  lines.push(` * Version: ${metadata.version}`)
  lines.push(' */')
  lines.push('')
  
  // Imports - Note: Schemas are generated in the same file, so no imports needed
  // The transformation functions reference schemas defined above in the same file
  
  // Generate transformation functions
  for (const transformation of metadata.transformations) {
    const transformationCode = generateTransformationFunction(transformation, metadata)
    lines.push(transformationCode)
    lines.push('')
  }
  
  // Generate mock factories for target type (e.g., mockNode)
  const mockFactoryCode = generateMockFactory(metadata)
  if (mockFactoryCode) {
    lines.push(mockFactoryCode)
    lines.push('')
  }
  
  // Generate mock factories for backend type (e.g., mockBackendNode)
  const backendMockFactoryCode = generateBackendMockFactory(metadata)
  if (backendMockFactoryCode) {
    lines.push(backendMockFactoryCode)
    lines.push('')
  }
  
  return lines.join('\n')
}

/**
 * Generate transformation function
 */
function generateTransformationFunction(
  transformation: TransformationDefinition,
  metadata: ContractDefinition
): string {
  const lines: string[] = []
  
  // Function comment
  lines.push('/**')
  lines.push(` * Transform ${transformation.from} to ${transformation.to}`)
  lines.push(` * This is the ONLY place where mapping happens`)
  lines.push(' */')
  
  // Function signature
  const fromVar = transformation.from.charAt(0).toLowerCase() + transformation.from.slice(1)
  lines.push(`export function ${transformation.function}(${fromVar}: ${transformation.from}): ${transformation.to} {`)
  lines.push(`  return ${transformation.to}Schema.parse({`)
  
  // Generate field mappings
  for (let i = 0; i < transformation.mappings.length; i++) {
    const mapping = transformation.mappings[i]
    const mappingCode = generateFieldMapping(mapping, fromVar)
    const isLast = i === transformation.mappings.length - 1
    lines.push(`    ${mappingCode}${isLast ? '' : ','}`)
  }
  
  lines.push('  })')
  lines.push('}')
  
  return lines.join('\n')
}

/**
 * Generate field mapping code
 */
function generateFieldMapping(
  mapping: FieldMappingDefinition,
  fromVar: string
): string {
  // Direct mapping
  if (mapping.from && !mapping.transform) {
    return `${mapping.to}: ${fromVar}.${mapping.from}`
  }
  
  // Transform: parseDate
  if (mapping.transform === 'parseDate' && mapping.from) {
    return `${mapping.to}: new Date(${fromVar}.${mapping.from})`
  }
  
  // Transform: constantNull
  if (mapping.transform === 'constantNull') {
    return `${mapping.to}: null`
  }
  
  // Transform: constantValue
  if (mapping.transform === 'constantValue' && (mapping as any).value !== undefined) {
    return `${mapping.to}: ${JSON.stringify((mapping as any).value)}`
  }
  
  // Default: direct mapping if from exists
  if (mapping.from) {
    return `${mapping.to}: ${fromVar}.${mapping.from}`
  }
  
  // No from field: constant or computed
  return `${mapping.to}: null`
}

/**
 * Generate mock factory function
 */
function generateMockFactory(metadata: ContractDefinition): string {
  if (metadata.transformations.length === 0) {
    return ''
  }
  
  const transformation = metadata.transformations[0]
  const toType = transformation.to
  
  const lines: string[] = []
  
  // Function comment
  lines.push('/**')
  lines.push(` * Mock factory for ${toType} (Stripe-style)`)
  lines.push(' * Generates valid test data from schema')
  lines.push(' * ')
  lines.push(' * Uses crypto.randomUUID() in browser, falls back to simple UUID v4 generator in Node')
  lines.push(' */')
  
  // Function signature
  lines.push(`export function mock${toType}(overrides?: Partial<${toType}>): ${toType} {`)
  lines.push('  const now = new Date()')
  lines.push('  // Use crypto.randomUUID() if available, otherwise generate UUID v4')
  lines.push('  const uuid = (typeof globalThis !== \'undefined\' && globalThis.crypto?.randomUUID)')
  lines.push('    ? globalThis.crypto.randomUUID()')
  lines.push('    : (typeof window !== \'undefined\' && window.crypto?.randomUUID)')
  lines.push('    ? window.crypto.randomUUID()')
  lines.push('    : \'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx\'.replace(/[xy]/g, (c) => {')
  lines.push('        const r = (Math.random() * 16) | 0')
  lines.push('        const v = c === \'x\' ? r : (r & 0x3) | 0x8')
  lines.push('        return v.toString(16)')
  lines.push('      })')
  lines.push('  ')
  lines.push(`  return ${toType}Schema.parse({`)
  
  // Generate default values from schema
  // Use transformation mappings to determine which fields to include
  const fieldMap = new Map<string, FieldDefinition>()
  for (const field of metadata.baseSchema.fields) {
    fieldMap.set(field.name, field)
  }
  
  // Generate fields based on transformation mappings (target schema)
  // We need to reverse-engineer target schema fields from mappings
  const targetFields: string[] = []
  for (const mapping of transformation.mappings) {
    if (!targetFields.includes(mapping.to)) {
      targetFields.push(mapping.to)
    }
  }
  
  for (let i = 0; i < targetFields.length; i++) {
    const fieldName = targetFields[i]
    const defaultValue = generateDefaultValueForField(fieldName, transformation.mappings)
    lines.push(`    ${fieldName}: ${defaultValue},`)
  }
  
  lines.push('    ...overrides,')
  lines.push('  })')
  lines.push('}')
  
  return lines.join('\n')
}

/**
 * Generate default value for a field
 */
function generateDefaultValueForField(
  fieldName: string,
  mappings: FieldMappingDefinition[]
): string {
  // Find mapping for this field
  const mapping = mappings.find(m => m.to === fieldName)
  
  if (!mapping) {
    return 'null'
  }
  
  // If it's a constant null, return null
  if (mapping.transform === 'constantNull') {
    return 'null'
  }
  
  // If it's a date field (from parseDate transform), return now
  if (mapping.transform === 'parseDate') {
    return 'now'
  }
  
  // If it's an ID field (from 'id' mapping), return uuid
  if (fieldName === 'id' || fieldName.toLowerCase().includes('id')) {
    return 'uuid'
  }
  
  // If it's a date field (from createdAt/updatedAt), return now
  if (fieldName.toLowerCase().includes('at') || fieldName.toLowerCase().includes('date')) {
    return 'now'
  }
  
  // If it's a string field, generate example string
  if (mapping.from && mapping.from.includes('name') || fieldName === 'content') {
    return `\`Example ${fieldName} \${Math.random().toString(36).substring(7)}\``
  }
  
  // Default: null
  return 'null'
}

/**
 * Generate mock factory for Backend type (if needed)
 */
export function generateBackendMockFactory(
  metadata: ContractDefinition
): string {
  if (metadata.transformations.length === 0) {
    return ''
  }
  
  const transformation = metadata.transformations[0]
  const fromType = transformation.from
  
  const lines: string[] = []
  
  // Function comment
  lines.push('/**')
  lines.push(` * Mock factory for ${fromType}`)
  lines.push(' */')
  
  // Function signature
  lines.push(`export function mock${fromType}(overrides?: Partial<${fromType}>): ${fromType} {`)
  lines.push('  const now = new Date().toISOString()')
  lines.push('  // Use crypto.randomUUID() if available, otherwise generate UUID v4')
  lines.push('  const uuid = (typeof globalThis !== \'undefined\' && globalThis.crypto?.randomUUID)')
  lines.push('    ? globalThis.crypto.randomUUID()')
  lines.push('    : (typeof window !== \'undefined\' && window.crypto?.randomUUID)')
  lines.push('    ? window.crypto.randomUUID()')
  lines.push('    : \'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx\'.replace(/[xy]/g, (c) => {')
  lines.push('        const r = (Math.random() * 16) | 0')
  lines.push('        const v = c === \'x\' ? r : (r & 0x3) | 0x8')
  lines.push('        return v.toString(16)')
  lines.push('      })')
  lines.push('  ')
  lines.push(`  return ${fromType}Schema.parse({`)
  
  // Generate default values from baseSchema (Backend schema)
  for (let i = 0; i < metadata.baseSchema.fields.length; i++) {
    const field = metadata.baseSchema.fields[i]
    const defaultValue = generateDefaultValue(field)
    lines.push(`    ${field.name}: ${defaultValue},`)
  }
  
  lines.push('    ...overrides,')
  lines.push('  })')
  lines.push('}')
  
  return lines.join('\n')
}

/**
 * Generate default value for a field definition
 */
function generateDefaultValue(field: FieldDefinition): string {
  // UUID fields
  if (field.type === 'uuid') {
    return 'uuid'
  }
  
  // String fields
  if (field.type === 'string') {
    return `\`Example ${field.name} \${Math.random().toString(36).substring(7)}\``
  }
  
  // Date/datetime fields
  if (field.type === 'datetime' || field.type === 'date') {
    return 'now'
  }
  
  // Number fields
  if (field.type === 'number') {
    if (field.name === 'depth') {
      return '0'
    }
    return '0'
  }
  
  // Integer fields (check dbType for int)
  if (field.dbType === 'int' || field.dbType === 'integer') {
    return '0'
  }
  
  // Boolean fields
  if (field.type === 'boolean') {
    return 'false'
  }
  
  // Nullable fields
  if (field.nullable) {
    return 'null'
  }
  
  // Path fields (ltree - check dbType)
  if (field.dbType === 'ltree' || field.name === 'path') {
    return "'/'"
  }
  
  // Default: null
  return 'null'
}






