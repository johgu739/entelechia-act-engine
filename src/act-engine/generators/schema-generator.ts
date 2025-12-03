/**
 * ✅ ENTELECHIA: Schema Generator
 * 
 * Deterministic generator for Zod schemas from contract metadata.
 * 
 * PRINCIPLE: Metadata is FORM → Schema is implementation → Generation is deterministic transformation.
 * 
 * This generator implements Schema Generation Law:
 * - Deterministic: Same metadata → same schema, always
 * - Total: Covers all metadata constructions
 * - No duplication: Each construction generated once
 * - No special cases: Uniform procedure for all types
 */

import { z } from 'zod'
import type {
  ContractDefinition,
  SchemaDefinition,
  FieldDefinition,
  FieldConstraint,
  RefinementDefinition,
  ResponseSchemaDefinition,
  FieldType,
} from '@entelechia/contracts/contracts/metadata/types'

/**
 * Datetime validation function
 * Used for all datetime fields
 */
const validateDatetime = (val: string): boolean => {
  const date = new Date(val)
  return !isNaN(date.getTime())
}

/**
 * Generate Zod schema from contract metadata
 * 
 * This is the main entry point for schema generation.
 * 
 * @param metadata Contract metadata
 * @returns Generated Zod schema
 */
export function generateSchema(metadata: ContractDefinition): z.ZodObject<any> {
  // Step 1: Generate base schema
  const baseSchema = generateBaseSchema(metadata.baseSchema)
  
  // Step 2: Generate row schema if exists
  if (metadata.rowSchema) {
    return generateRowSchema(metadata.rowSchema, baseSchema)
  }
  
  return baseSchema
}

/**
 * Generate base schema from schema definition
 * 
 * Step 1 of Schema Generation Law
 */
function generateBaseSchema(schema: SchemaDefinition): z.ZodObject<any> {
  const fields: Record<string, z.ZodTypeAny> = {}
  
  for (const field of schema.fields) {
    // Step 2: Map field type
    let zodType = mapFieldType(field)
    
    // Step 3: Apply constraints (canonicalize: default to [] if missing)
    zodType = applyConstraints(zodType, field.constraints ?? [])
    
    // Step 4: Apply nullability
    if (field.nullable) {
      zodType = zodType.nullable()
    }
    
    // Step 5: Apply optionality
    if (field.optional) {
      zodType = zodType.optional()
    }
    
    fields[field.name] = zodType
  }
  
  return z.object(fields)
}

/**
 * Generate row schema with refinements
 * 
 * Step 6-7 of Schema Generation Law
 */
function generateRowSchema(
  rowSchema: SchemaDefinition,
  baseSchema: z.ZodObject<any>
): z.ZodObject<any> {
  // Step 7: Extend base schema if needed
  // For now, we assume rowSchema extends baseSchema (no new fields)
  let schema = baseSchema
  
  // Step 6: Apply refinements (canonicalize: default to [] if missing)
  const refinements = rowSchema.refinements ?? []
  for (const refinement of refinements) {
    // Convert function string to actual function
    const refinementFunction = createRefinementFunction(refinement.function)
    
    schema = schema.refine(
      refinementFunction,
      {
        message: refinement.message,
        path: refinement.path,
      }
    ) as unknown as typeof schema
  }
  
  return schema
}

/**
 * Map field type to Zod type
 * 
 * Step 2 of Schema Generation Law
 */
function mapFieldType(field: FieldDefinition): z.ZodTypeAny {
  switch (field.type) {
    case 'uuid':
      return z.string().uuid()
    
    case 'string':
      return z.string()
    
    case 'number':
      return z.number()
    
    case 'boolean':
      return z.boolean()
    
    case 'datetime':
      return z.string().refine(validateDatetime, {
        message: 'Invalid datetime string',
      })
    
    case 'json':
      return z.any()
    
    case 'record':
      return z.record(z.unknown())
    
    case 'array':
      // For arrays, we need item schema - this is a limitation
      // In practice, arrays reference other schemas
      return z.array(z.any())
    
    case 'object':
      // For objects, we need nested schema - this is a limitation
      // In practice, objects reference other schemas
      return z.any()
    
    default:
      throw new Error(`Unknown field type: ${field.type}`)
  }
}

/**
 * Apply constraints to Zod type
 * 
 * Step 3 of Schema Generation Law
 */
function applyConstraints(
  zodType: z.ZodTypeAny,
  constraints: FieldConstraint[]
): z.ZodTypeAny {
  let result = zodType
  
  for (const constraint of constraints) {
    switch (constraint.type) {
      case 'min':
        if (result instanceof z.ZodString) {
          result = result.min(constraint.value as number)
        } else if (result instanceof z.ZodNumber) {
          result = result.min(constraint.value as number)
        }
        break
      
      case 'max':
        if (result instanceof z.ZodString) {
          result = result.max(constraint.value as number)
        } else if (result instanceof z.ZodNumber) {
          result = result.max(constraint.value as number)
        }
        break
      
      case 'email':
        if (result instanceof z.ZodString) {
          result = result.email()
        }
        break
      
      case 'uuid':
        // UUID constraint is already applied in mapFieldType
        // This is a no-op but kept for completeness
        break
      
      case 'int':
        if (result instanceof z.ZodNumber) {
          result = result.int()
        }
        break
      
      case 'refine':
        // Refine constraints are handled at field level
        // This case is for custom refine functions
        if (constraint.refineFunction) {
          const refineFunction = getRefineFunction(constraint.refineFunction)
          result = result.refine(refineFunction, {
            message: constraint.message || 'Validation failed',
          })
        }
        break
    }
  }
  
  return result
}

/**
 * Create refinement function from string
 * 
 * Converts refinement function string to actual JavaScript function
 */
function createRefinementFunction(functionString: string): (data: any) => boolean {
  // Use Function constructor to create function from string
  // This is safe because we control the metadata source
  try {
    return new Function('return ' + functionString)() as (data: any) => boolean
  } catch (error) {
    throw new Error(`Invalid refinement function: ${functionString}. Error: ${error}`)
  }
}

/**
 * Get refine function by name
 * 
 * Maps refine function names to actual functions
 */
function getRefineFunction(name: string): (val: any) => boolean {
  switch (name) {
    case 'validateDatetime':
      return validateDatetime
    default:
      throw new Error(`Unknown refine function: ${name}`)
  }
}

/**
 * Generate response schema from response schema definition
 * 
 * Step 8 of Schema Generation Law
 */
export function generateResponseSchema(
  responseSchema: ResponseSchemaDefinition,
  schemaRegistry: Map<string, z.ZodTypeAny>
): z.ZodTypeAny {
  const structure = responseSchema.structure
  
  if (structure.type === 'object') {
    const fields: Record<string, z.ZodTypeAny> = {}
    
    if (structure.fields) {
      for (const field of structure.fields) {
        let zodType: z.ZodTypeAny
        
        if (field.type === 'array' && structure.itemSchema) {
          const itemSchema = schemaRegistry.get(structure.itemSchema)
          if (!itemSchema) {
            throw new Error(`Schema not found: ${structure.itemSchema}`)
          }
          zodType = z.array(itemSchema)
        } else if (field.type === 'object') {
          // Reference to another schema
          zodType = z.any() // Placeholder - would need schema reference
        } else {
          zodType = mapFieldTypeFromStructure(field.type)
        }
        
        if (field.nullable) {
          zodType = zodType.nullable()
        }
        
        if (field.optional) {
          zodType = zodType.optional()
        }
        
        fields[field.name] = zodType
      }
    }
    
    return z.object(fields)
  }
  
  if (structure.type === 'array') {
    if (structure.itemSchema) {
      const itemSchema = schemaRegistry.get(structure.itemSchema)
      if (!itemSchema) {
        throw new Error(`Schema not found: ${structure.itemSchema}`)
      }
      return z.array(itemSchema)
    }
    return z.array(z.any())
  }
  
  throw new Error(`Unknown response structure type: ${structure.type}`)
}

/**
 * Map field type from structure to Zod type
 * Helper for response schema generation
 */
function mapFieldTypeFromStructure(type: string): z.ZodTypeAny {
  switch (type) {
    case 'uuid':
      return z.string().uuid()
    case 'string':
      return z.string()
    case 'number':
      return z.number()
    case 'boolean':
      return z.boolean()
    case 'datetime':
      return z.string().refine(validateDatetime, {
        message: 'Invalid datetime string',
      })
    case 'json':
    case 'any':
      return z.any()
    case 'record':
      return z.record(z.string())
    case 'array':
      return z.array(z.any())
    case 'object':
      return z.any()
    default:
      return z.any()
  }
}

/**
 * Generate TypeScript type export
 * 
 * Generates: export type ${SchemaName} = z.infer<typeof ${SchemaName}Schema>
 */
export function generateTypeExport(schemaName: string): string {
  return `export type ${schemaName} = z.infer<typeof ${schemaName}Schema>`
}

/**
 * Generate complete schema file
 * 
 * Generates complete TypeScript file with schema and type exports
 */
export function generateSchemaFile(
  metadata: ContractDefinition,
  schemaRegistry: Map<string, z.ZodTypeAny>
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
  lines.push("import { z } from 'zod'")
  lines.push('')
  
  // Generate base schema
  const baseSchema = generateSchema(metadata)
  const baseSchemaName = metadata.baseSchema.name
  lines.push(`export const ${baseSchemaName} = ${schemaToString(baseSchema)}`)
  lines.push('')
  
  // Generate type
  lines.push(generateTypeExport(baseSchemaName.replace('Schema', '')))
  lines.push('')
  
  // Generate row schema if exists
  if (metadata.rowSchema) {
    const rowSchema = generateRowSchema(metadata.rowSchema, baseSchema)
    const rowSchemaName = metadata.rowSchema.name
    lines.push(`export const ${rowSchemaName} = ${schemaToString(rowSchema)}`)
    lines.push('')
    lines.push(generateTypeExport(rowSchemaName.replace('Schema', '')))
    lines.push('')
  }
  
  // Generate response schemas
  for (const responseSchema of metadata.responseSchemas) {
    const responseZodSchema = generateResponseSchema(responseSchema, schemaRegistry)
    lines.push(`export const ${responseSchema.name} = ${schemaToString(responseZodSchema)}`)
    lines.push('')
    lines.push(generateTypeExport(responseSchema.name.replace('Schema', '')))
    lines.push('')
  }
  
  return lines.join('\n')
}

/**
 * Convert Zod schema to string representation
 * 
 * This is a simplified version - full implementation would need
 * to traverse the schema AST and generate code
 */
function schemaToString(schema: z.ZodTypeAny): string {
  // This is a placeholder - full implementation would generate
  // the actual Zod schema code
  // For now, we return a placeholder
  return 'z.any() // TODO: Generate full schema code'
}






