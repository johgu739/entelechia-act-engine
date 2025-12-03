/**
 * ✅ ENTELECHIA: Schema Code Generator
 * 
 * Deterministic code generator for Zod schemas from contract metadata.
 * 
 * PRINCIPLE: Metadata is FORM → Schema code is implementation → Generation is deterministic transformation.
 * 
 * This generator implements Schema Generation Law by generating TypeScript code directly from metadata,
 * not by serializing Zod objects (which is not possible).
 */

import type {
  ContractDefinition,
  SchemaDefinition,
  FieldDefinition,
  FieldConstraint,
  RefinementDefinition,
  ResponseSchemaDefinition,
  FieldType,
  TransformationDefinition,
  FieldMappingDefinition,
} from '@entelechia/contracts/contracts/metadata/types'

/**
 * Generate complete schema file code from contract metadata
 * 
 * This generates TypeScript code that creates Zod schemas.
 * 
 * @param metadata Contract metadata
 * @param imports Additional imports needed (e.g., shared schemas)
 * @returns Complete TypeScript file content
 */
export function generateSchemaCode(
  metadata: ContractDefinition,
  imports: string[] = []
): string {
  const lines: string[] = []
  
  // Header
  lines.push('/**')
  lines.push(` * ✅ ENTELECHIA: ${metadata.name} Contract Schema`)
  lines.push(' * ')
  lines.push(' * Generated from metadata - DO NOT EDIT MANUALLY')
  lines.push(' * ')
  lines.push(` * Domain: ${metadata.domain}`)
  lines.push(` * Version: ${metadata.version}`)
  lines.push(' */')
  lines.push('')
  
  // Imports
  lines.push("import { z } from 'zod'")
  for (const imp of imports) {
    lines.push(imp)
  }
  if (imports.length > 0) {
    lines.push('')
  }
  
  // Generate base schema
  const baseSchemaCode = generateBaseSchemaCode(metadata.baseSchema)
  lines.push(baseSchemaCode)
  lines.push('')
  
  // Generate type
  const baseTypeName = metadata.baseSchema.name.replace('Schema', '')
  lines.push(`export type ${baseTypeName} = z.infer<typeof ${metadata.baseSchema.name}>`)
  lines.push('')
  
  // Generate row schema if exists
  if (metadata.rowSchema) {
    const rowSchemaCode = generateRowSchemaCode(metadata.rowSchema, metadata.baseSchema.name)
    lines.push(rowSchemaCode)
    lines.push('')
    
    const rowTypeName = metadata.rowSchema.name.replace('Schema', '')
    lines.push(`export type ${rowTypeName} = z.infer<typeof ${metadata.rowSchema.name}>`)
    lines.push('')
  }
  
  // Generate response schemas (DETERMINISTIC: sorted by schema name)
  const sortedResponseSchemas = [...metadata.responseSchemas].sort((a, b) => a.name.localeCompare(b.name))
  for (const responseSchema of sortedResponseSchemas) {
    const responseCode = generateResponseSchemaCode(responseSchema, metadata.baseSchema.name)
    lines.push(responseCode)
    lines.push('')
    
    const responseTypeName = responseSchema.name.replace('Schema', '')
    lines.push(`export type ${responseTypeName} = z.infer<typeof ${responseSchema.name}>`)
    lines.push('')
  }
  
  // Generate target schemas from transformations (DETERMINISTIC: sorted by function name)
  const sortedTransformations = [...metadata.transformations].sort((a, b) => a.function.localeCompare(b.function))
  for (const transformation of sortedTransformations) {
    const targetSchemaCode = generateTargetSchemaCode(transformation, metadata)
    if (targetSchemaCode) {
      lines.push(targetSchemaCode)
      lines.push('')
      
      const targetTypeName = transformation.to
      const targetSchemaName = `${transformation.to}Schema`
      lines.push(`export type ${targetTypeName} = z.infer<typeof ${targetSchemaName}>`)
      lines.push('')
    }
  }
  
  return lines.join('\n')
}

/**
 * Generate base schema code
 */
function generateBaseSchemaCode(schema: SchemaDefinition): string {
  const lines: string[] = []
  
  // Schema comment
  if (schema.fields.length > 0) {
    lines.push('/**')
    lines.push(` * ${schema.name}`)
    lines.push(' */')
  }
  
  // Generate object fields (DETERMINISTIC: sorted by field name)
  const fieldLines: string[] = []
  const sortedFields = [...schema.fields].sort((a, b) => a.name.localeCompare(b.name))
  for (const field of sortedFields) {
    const fieldCode = generateFieldCode(field)
    fieldLines.push(`  ${field.name}: ${fieldCode},`)
  }
  
  // Build schema
  lines.push(`export const ${schema.name} = z.object({`)
  lines.push(fieldLines.join('\n'))
  lines.push('})')
  
  return lines.join('\n')
}

/**
 * Generate field code
 */
function generateFieldCode(field: FieldDefinition): string {
  // Canonicalize: default to [] if constraints missing
  const constraints = field.constraints ?? []
  let code = mapFieldTypeToZod(field.type, constraints)
  
  // Apply nullability
  if (field.nullable) {
    code = `${code}.nullable()`
  }
  
  // Apply optionality
  if (field.optional) {
    code = `${code}.optional()`
  }
  
  return code
}

/**
 * Map field type to Zod code string
 */
function mapFieldTypeToZod(type: FieldType, constraints: FieldConstraint[]): string {
  let code = ''
  
  // Base type
  switch (type) {
    case 'uuid':
      code = 'z.string().uuid()'
      break
    case 'string':
      code = 'z.string()'
      break
    case 'number':
      code = 'z.number()'
      break
    case 'boolean':
      code = 'z.boolean()'
      break
    case 'datetime':
    case 'date':
      code = `z.string().refine(
    (val) => {
      const date = new Date(val)
      return !isNaN(date.getTime())
    },
    { message: 'Invalid datetime string' }
  )`
      break
    case 'json':
      code = 'z.any()'
      break
    case 'record':
      code = 'z.record(z.unknown())'
      break
    case 'array':
      code = 'z.array(z.any())' // TODO: Support item schema
      break
    case 'object':
      code = 'z.any()' // TODO: Support nested object schema
      break
    default:
      code = 'z.any()'
  }
  
  // Apply constraints
  for (const constraint of constraints) {
    code = applyConstraintToCode(code, constraint, type)
  }
  
  return code
}

/**
 * Apply constraint to Zod code string
 */
function applyConstraintToCode(
  code: string,
  constraint: FieldConstraint,
  fieldType: FieldType
): string {
  switch (constraint.type) {
    case 'min':
      if (fieldType === 'string' || fieldType === 'number') {
        return `${code}.min(${constraint.value})`
      }
      break
    case 'max':
      if (fieldType === 'string' || fieldType === 'number') {
        return `${code}.max(${constraint.value})`
      }
      break
    case 'email':
      if (fieldType === 'string') {
        return `${code}.email()`
      }
      break
    case 'uuid':
      // Already applied in base type
      break
    case 'int':
      if (fieldType === 'number') {
        return `${code}.int()`
      }
      break
    case 'refine':
      // Refine constraints are handled at field level for datetime
      break
  }
  
  return code
}

/**
 * Generate row schema code with refinements
 */
function generateRowSchemaCode(
  rowSchema: SchemaDefinition,
  baseSchemaName: string
): string {
  const lines: string[] = []
  
  // Schema comment
  lines.push('/**')
  lines.push(` * ${rowSchema.name}`)
  if (rowSchema.extends) {
    lines.push(` * Extends: ${rowSchema.extends}`)
  }
  const refinements = rowSchema.refinements ?? []
  if (refinements.length > 0) {
    lines.push(' * ')
    lines.push(' * Refinements:')
    for (const refinement of refinements) {
      lines.push(` * - ${refinement.invariantId}: ${refinement.invariantName}`)
    }
  }
  lines.push(' */')
  
  // Start with base schema
  let schemaCode = baseSchemaName
  
  // Apply refinements
  for (const refinement of refinements) {
    const refinementCode = generateRefinementCode(refinement)
    schemaCode = `${schemaCode}\n  ${refinementCode}`
  }
  
  lines.push(`export const ${rowSchema.name} = ${schemaCode}`)
  
  return lines.join('\n')
}

/**
 * Generate refinement code
 */
function generateRefinementCode(refinement: RefinementDefinition): string {
  // Clean up function string for code generation
  const functionCode = refinement.function
    .replace(/\n/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  
  return `.refine(
    ${functionCode},
    {
      message: ${JSON.stringify(refinement.message)},
      path: ${JSON.stringify(refinement.path)},
    }
  )`
}

/**
 * Generate response schema code
 */
function generateResponseSchemaCode(
  responseSchema: ResponseSchemaDefinition,
  baseSchemaName: string
): string {
  const lines: string[] = []
  
  // Schema comment
  lines.push('/**')
  lines.push(` * ${responseSchema.name}`)
  if (responseSchema.usedIn.length > 0) {
    lines.push(' * ')
    lines.push(' * Used in:')
    for (const endpoint of responseSchema.usedIn) {
      lines.push(` * - ${endpoint}`)
    }
  }
  lines.push(' */')
  
  const structure = responseSchema.structure
  
  if (structure.type === 'object' && structure.fields) {
    const fieldLines: string[] = []
    
    for (const field of structure.fields) {
      let fieldCode = ''
      
      if (field.type === 'array') {
        // Array field - need item schema reference
        if (structure.itemSchema) {
          fieldCode = `z.array(${structure.itemSchema})`
        } else {
          // Default to base schema for arrays (common case: children: z.array(BackendNodeSchema))
          fieldCode = `z.array(${baseSchemaName})`
        }
      } else if (field.type === 'object') {
        // Object field - reference base schema (common case: node: BackendNodeSchema)
        fieldCode = baseSchemaName
      } else {
        // Primitive type
        fieldCode = mapFieldTypeToZod(field.type as FieldType, [])
      }
      
      // Apply nullability
      if (field.nullable) {
        fieldCode = `${fieldCode}.nullable()`
      }
      
      // Apply optionality
      if (field.optional) {
        fieldCode = `${fieldCode}.optional()`
      }
      
      fieldLines.push(`  ${field.name}: ${fieldCode},`)
    }
    
    lines.push(`export const ${responseSchema.name} = z.object({`)
    lines.push(fieldLines.join('\n'))
    lines.push('})')
  } else if (structure.type === 'array') {
    // Array response - wrap in object with array field
    const itemSchema = structure.itemSchema || baseSchemaName
    // Infer field name from schema name (e.g., GetNodeTreeResponseSchema -> nodes)
    const fieldName = responseSchema.name
      .replace('ResponseSchema', '')
      .replace('Schema', '')
      .replace(/([A-Z])/g, (match, p1, offset) => offset > 0 ? '_' + p1.toLowerCase() : p1.toLowerCase())
      .replace(/^get_/, '')
      .replace(/_response$/, '')
      .replace(/_/g, '')
    const pluralFieldName = fieldName.endsWith('s') ? fieldName : `${fieldName}s`
    lines.push(`export const ${responseSchema.name} = z.object({`)
    lines.push(`  ${pluralFieldName}: z.array(${itemSchema}),`)
    lines.push('})')
  } else {
    throw new Error(`Unknown response structure type: ${structure.type}`)
  }
  
  return lines.join('\n')
}

/**
 * Generate target schema code from transformation
 * 
 * Creates a Zod schema for the target type (e.g., NodeSchema) based on transformation mappings
 */
function generateTargetSchemaCode(
  transformation: TransformationDefinition,
  metadata: ContractDefinition
): string | null {
  const lines: string[] = []
  const targetSchemaName = `${transformation.to}Schema`
  
  // Schema comment
  lines.push('/**')
  lines.push(` * ${transformation.to} format (what UI consumes)`)
  lines.push(` * Maps backend format to UI-friendly format`)
  lines.push(' */')
  
  // Generate object fields from transformation mappings
  const fieldLines: string[] = []
  for (const mapping of transformation.mappings) {
    const fieldCode = generateTargetFieldCode(mapping, metadata)
    if (fieldCode) {
      fieldLines.push(`  ${mapping.to}: ${fieldCode},`)
    }
  }
  
  // Build schema
  lines.push(`export const ${targetSchemaName} = z.object({`)
  lines.push(fieldLines.join('\n'))
  lines.push('})')
  
  return lines.join('\n')
}

/**
 * Generate field code for target schema from transformation mapping
 */
function generateTargetFieldCode(
  mapping: FieldMappingDefinition,
  metadata: ContractDefinition
): string | null {
  // Constant null fields (e.g., deletedAt)
  if (mapping.transform === 'constantNull') {
    return 'z.date().nullable()'
  }
  
  // Find source field in baseSchema
  if (!mapping.from) {
    return null // Skip if no source field
  }
  
  const sourceField = metadata.baseSchema.fields.find(f => f.name === mapping.from)
  if (!sourceField) {
    return null // Skip if source field not found
  }
  
  // Map field type based on transform
  let code = ''
  
  if (mapping.transform === 'parseDate') {
    // Transform datetime string → Date
    code = 'z.date()'
  } else {
    // Direct mapping - use same type as source
    code = mapFieldTypeToZod(sourceField.type, sourceField.constraints ?? [])
    
    // Apply nullability (preserve from source)
    if (sourceField.nullable) {
      code = `${code}.nullable()`
    }
  }
  
  return code
}

