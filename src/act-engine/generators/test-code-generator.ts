/**
 * ✅ ENTELECHIA: Test Code Generator
 * 
 * Deterministic code generator for test functions from contract metadata.
 * 
 * PRINCIPLE: Metadata is FORM → Test code is implementation → Generation is deterministic transformation.
 * 
 * This generator implements Test Generation Law by generating TypeScript test code directly from metadata.
 */

import type {
  ContractDefinition,
  InvariantDefinition,
  TestCaseDefinition,
  SchemaDefinition,
  FieldDefinition,
} from '@entelechia/shared/contracts/metadata/types'

/**
 * Generate complete test file code from contract metadata
 * 
 * @param metadata Contract metadata
 * @returns Complete TypeScript test file content
 */
export function generateTestCode(
  metadata: ContractDefinition
): string {
  const lines: string[] = []
  
  // Header
  lines.push('/**')
  lines.push(` * ✅ ENTELECHIA: ${metadata.name} Contract Tests`)
  lines.push(' * ')
  lines.push(' * Generated from metadata - DO NOT EDIT MANUALLY')
  lines.push(' * ')
  lines.push(` * Domain: ${metadata.domain}`)
  lines.push(` * Version: ${metadata.version}`)
  lines.push(' */')
  lines.push('')
  
  // Imports
  lines.push("import { describe, it, expect } from 'vitest'")
  lines.push("import { assertBackendContract, ContractViolationError } from '../infra/contract-enforcement.js'")
  
  // Generate schema imports
  const schemaImports = getSchemaImports(metadata)
  if (schemaImports.length > 0) {
    lines.push(`import { ${schemaImports.join(', ')} } from '@entelechia/shared/contracts/${metadata.domain}.contract'`)
  }
  
  // Import row schema if exists
  if (metadata.rowSchema) {
    lines.push(`import { ${metadata.name}RowSchema } from '../contracts/backend-${metadata.domain}.contract.js'`)
  }
  
  lines.push('')
  
  // Mock log file
  lines.push(`const mockLogFile = '/tmp/test-${metadata.domain}.log'`)
  lines.push('')
  
  // Generate test suite
  lines.push(`describe('${metadata.name} Contract Tests', () => {`)
  lines.push('')
  
  // Generate invariant tests
  for (const invariant of metadata.invariants) {
    const invariantTests = generateInvariantTests(invariant, metadata)
    if (invariantTests) {
      lines.push(invariantTests)
      lines.push('')
    }
  }
  
  // Generate schema tests (optional)
  const schemaTests = generateSchemaTests(metadata)
  if (schemaTests) {
    lines.push(schemaTests)
    lines.push('')
  }
  
  lines.push('})')
  
  return lines.join('\n')
}

/**
 * Get schema imports for metadata
 */
function getSchemaImports(metadata: ContractDefinition): string[] {
  const imports: string[] = []
  
  // Base schema
  imports.push(`${metadata.name}Schema`)
  
  // Response schemas
  for (const responseSchema of metadata.responseSchemas) {
    imports.push(responseSchema.name)
  }
  
  return imports
}

/**
 * Generate invariant tests
 */
function generateInvariantTests(
  invariant: InvariantDefinition,
  metadata: ContractDefinition
): string {
  const lines: string[] = []
  
  // Describe block
  lines.push(`  describe('${invariant.id}: ${invariant.name}', () => {`)
  
  // Generate test cases
  if (invariant.testCases && invariant.testCases.length > 0) {
    for (const testCase of invariant.testCases) {
      if (testCase.type === 'violation') {
        const violationTest = generateViolationTest(testCase, invariant, metadata)
        lines.push(violationTest)
        lines.push('')
      } else if (testCase.type === 'valid') {
        const validTest = generateValidTest(testCase, invariant, metadata)
        lines.push(validTest)
        lines.push('')
      } else if (testCase.type === 'edge') {
        const edgeTest = generateEdgeTest(testCase, invariant, metadata)
        lines.push(edgeTest)
        lines.push('')
      }
    }
  } else {
    // Generate default tests if no test cases
    const defaultTests = generateDefaultInvariantTests(invariant, metadata)
    lines.push(defaultTests)
    lines.push('')
  }
  
  lines.push('  })')
  
  return lines.join('\n')
}

/**
 * Generate violation test
 */
function generateViolationTest(
  testCase: TestCaseDefinition,
  invariant: InvariantDefinition,
  metadata: ContractDefinition
): string {
  const lines: string[] = []
  
  // Test description
  lines.push(`    it('should reject ${testCase.description}', () => {`)
  
  // Complete input from test case
  const input = completeInput(testCase.input, metadata.baseSchema)
  const inputString = formatInput(input)
  lines.push(`      const invalidData = ${inputString}`)
  lines.push('      ')
  
  // Get schema and boundary
  const schema = getSchemaForInvariant(invariant, metadata)
  const boundary = getBoundaryForInvariant(invariant)
  const contractName = getContractNameForInvariant(invariant, metadata)
  
  // Expect to throw
  lines.push('      expect(() => {')
  lines.push(`        assertBackendContract(`)
  lines.push(`          ${schema},`)
  lines.push(`          invalidData,`)
  lines.push(`          '${boundary}',`)
  lines.push(`          '${contractName}',`)
  lines.push(`          mockLogFile`)
  lines.push(`        )`)
  lines.push('      }).toThrow(ContractViolationError)')
  
  // Verify error message if provided
  if (testCase.errorMessage) {
    lines.push('      ')
    lines.push('      try {')
    lines.push(`        assertBackendContract(`)
    lines.push(`          ${schema},`)
    lines.push(`          invalidData,`)
    lines.push(`          '${boundary}',`)
    lines.push(`          '${contractName}',`)
    lines.push(`          mockLogFile`)
    lines.push(`        )`)
    lines.push("        expect.fail('Should have thrown ContractViolationError')")
    lines.push('      } catch (error) {')
    lines.push('        expect(error).toBeInstanceOf(ContractViolationError)')
    lines.push(`        expect((error as ContractViolationError).message).toContain('${testCase.errorMessage}')`)
    lines.push('      }')
  }
  
  lines.push('    })')
  
  return lines.join('\n')
}

/**
 * Generate valid test
 */
function generateValidTest(
  testCase: TestCaseDefinition,
  invariant: InvariantDefinition,
  metadata: ContractDefinition
): string {
  const lines: string[] = []
  
  // Test description
  lines.push(`    it('should accept ${testCase.description}', () => {`)
  
  // Complete input from test case
  const input = completeInput(testCase.input, metadata.baseSchema)
  const inputString = formatInput(input)
  lines.push(`      const validData = ${inputString}`)
  lines.push('      ')
  
  // Get schema and boundary
  const schema = getSchemaForInvariant(invariant, metadata)
  const boundary = getBoundaryForInvariant(invariant)
  const contractName = getContractNameForInvariant(invariant, metadata)
  
  // Expect not to throw
  lines.push('      expect(() => {')
  lines.push(`        assertBackendContract(`)
  lines.push(`          ${schema},`)
  lines.push(`          validData,`)
  lines.push(`          '${boundary}',`)
  lines.push(`          '${contractName}',`)
  lines.push(`          mockLogFile`)
  lines.push(`        )`)
  lines.push('      }).not.toThrow()')
  
  lines.push('    })')
  
  return lines.join('\n')
}

/**
 * Generate edge test
 */
function generateEdgeTest(
  testCase: TestCaseDefinition,
  invariant: InvariantDefinition,
  metadata: ContractDefinition
): string {
  const lines: string[] = []
  
  // Test description
  lines.push(`    it('should handle ${testCase.description}', () => {`)
  
  // Complete input from test case
  const input = completeInput(testCase.input, metadata.baseSchema)
  const inputString = formatInput(input)
  lines.push(`      const edgeData = ${inputString}`)
  lines.push('      ')
  
  // Get schema and boundary
  const schema = getSchemaForInvariant(invariant, metadata)
  const boundary = getBoundaryForInvariant(invariant)
  const contractName = getContractNameForInvariant(invariant, metadata)
  
  // Expect based on expected result
  if (testCase.expected === 'fail') {
    lines.push('      expect(() => {')
    lines.push(`        assertBackendContract(`)
    lines.push(`          ${schema},`)
    lines.push(`          edgeData,`)
    lines.push(`          '${boundary}',`)
    lines.push(`          '${contractName}',`)
    lines.push(`          mockLogFile`)
    lines.push(`        )`)
    lines.push('      }).toThrow(ContractViolationError)')
  } else {
    lines.push('      expect(() => {')
    lines.push(`        assertBackendContract(`)
    lines.push(`          ${schema},`)
    lines.push(`          edgeData,`)
    lines.push(`          '${boundary}',`)
    lines.push(`          '${contractName}',`)
    lines.push(`          mockLogFile`)
    lines.push(`        )`)
    lines.push('      }).not.toThrow()')
  }
  
  lines.push('    })')
  
  return lines.join('\n')
}

/**
 * Generate default invariant tests when no test cases provided
 */
function generateDefaultInvariantTests(
  invariant: InvariantDefinition,
  metadata: ContractDefinition
): string {
  const lines: string[] = []
  
  // Generate a basic violation test
  lines.push(`    it('should reject invalid data', () => {`)
  lines.push(`      const invalidData = {}`)
  lines.push('      ')
  lines.push('      expect(() => {')
  lines.push(`        assertBackendContract(`)
  lines.push(`          ${getSchemaForInvariant(invariant, metadata)},`)
  lines.push(`          invalidData,`)
  lines.push(`          '${getBoundaryForInvariant(invariant)}',`)
  lines.push(`          '${getContractNameForInvariant(invariant, metadata)}',`)
  lines.push(`          mockLogFile`)
  lines.push(`        )`)
  lines.push('      }).toThrow(ContractViolationError)')
  lines.push('    })')
  
  return lines.join('\n')
}

/**
 * Generate schema tests
 */
function generateSchemaTests(metadata: ContractDefinition): string {
  const lines: string[] = []
  
  lines.push('  describe(\'Schema Code Generator\', () => {')
  lines.push('    it(\'generates base schema code from metadata\', () => {')
  lines.push('      const code = generateSchemaCode(metadata)')
  lines.push(`      expect(code).toContain('export const ${metadata.baseSchema.name}')`)
  lines.push("      expect(code).toContain('z.object({')")
  
  // Check for all fields
  for (const field of metadata.baseSchema.fields) {
    lines.push(`      expect(code).toContain('${field.name}:')`)
  }
  
  lines.push('    })')
  lines.push('')
  
  // Row schema test
  if (metadata.rowSchema) {
    lines.push('    it(\'generates row schema with refinements\', () => {')
    lines.push('      const code = generateSchemaCode(metadata)')
    lines.push(`      expect(code).toContain('export const ${metadata.rowSchema.name}')`)
    lines.push("      expect(code).toContain('.refine(')")
    lines.push('    })')
    lines.push('')
  }
  
  // Response schema tests
  for (const responseSchema of metadata.responseSchemas) {
    lines.push(`    it('generates ${responseSchema.name}', () => {`)
    lines.push('      const code = generateSchemaCode(metadata)')
    lines.push(`      expect(code).toContain('export const ${responseSchema.name}')`)
    lines.push('    })')
    lines.push('')
  }
  
  lines.push('  })')
  
  return lines.join('\n')
}

/**
 * Complete input with missing required fields from schema
 */
function completeInput(
  input: Record<string, unknown>,
  schema: SchemaDefinition
): Record<string, unknown> {
  const completed: Record<string, unknown> = { ...input }
  
  // Add missing required fields from schema
  for (const field of schema.fields) {
    if (!(field.name in completed) && !field.optional && !field.nullable) {
      // Generate default value
      completed[field.name] = generateDefaultValue(field)
    }
  }
  
  return completed
}

/**
 * Format input as TypeScript code
 */
function formatInput(input: Record<string, unknown>): string {
  // Convert to JSON and format
  const json = JSON.stringify(input, null, 6)
  // Replace with proper indentation
  return json.split('\n').map((line, index) => {
    if (index === 0) return line
    return '      ' + line
  }).join('\n')
}

/**
 * Get schema name for invariant
 */
function getSchemaForInvariant(
  invariant: InvariantDefinition,
  metadata: ContractDefinition
): string {
  // Check enforcement points
  if (invariant.enforcement?.schema) {
    // Use row schema if available
    if (metadata.rowSchema) {
      return `${metadata.name}RowSchema`
    }
    // Otherwise use base schema
    return `${metadata.name}Schema`
  }
  
  // Default to base schema
  return `${metadata.name}Schema`
}

/**
 * Get boundary for invariant
 */
function getBoundaryForInvariant(invariant: InvariantDefinition): string {
  // Check enforcement points
  if (invariant.enforcement?.schema) {
    return 'DB → Domain: test'
  } else if (invariant.enforcement?.route) {
    return 'Domain → API: test'
  } else if (invariant.enforcement?.db) {
    return 'DB: test'
  }
  
  // Default boundary
  return 'Test: test'
}

/**
 * Get contract name for invariant
 */
function getContractNameForInvariant(
  invariant: InvariantDefinition,
  metadata: ContractDefinition
): string {
  // Use invariant ID as contract name
  return `${metadata.name}${invariant.id}`
}

/**
 * Generate default value for a field
 */
function generateDefaultValue(field: FieldDefinition): unknown {
  // UUID fields
  if (field.type === 'uuid') {
    return '550e8400-e29b-41d4-a716-446655440000'
  }
  
  // String fields
  if (field.type === 'string') {
    return `Example ${field.name}`
  }
  
  // Date/datetime fields
  if (field.type === 'datetime' || field.type === 'date') {
    return '2025-01-01T00:00:00Z'
  }
  
  // Number fields
  if (field.type === 'number') {
    if (field.name === 'depth') {
      return 0
    }
    return 0
  }
  
  // Integer fields (check dbType for int)
  if (field.dbType === 'int' || field.dbType === 'integer') {
    return 0
  }
  
  // Boolean fields
  if (field.type === 'boolean') {
    return false
  }
  
  // Nullable fields
  if (field.nullable) {
    return null
  }
  
  // Path fields (ltree - check dbType)
  if (field.dbType === 'ltree' || field.name === 'path') {
    return 'root'
  }
  
  // Default: null
  return null
}






