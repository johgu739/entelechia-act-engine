/**
 * ✅ ENTELECHIA: Migration Code Generator
 * 
 * Deterministic code generator for SQL migrations from contract metadata.
 * 
 * PRINCIPLE: Metadata is FORM → SQL migration is implementation → Generation is deterministic transformation.
 * 
 * This generator implements Migration Generation Law by generating SQL code directly from metadata.
 */

import type {
  ContractDefinition,
  DBMappingDefinition,
  DBColumnDefinition,
  DBConstraintDefinition,
  DBIndexDefinition,
  DBTriggerDefinition,
  DBForeignKeyDefinition,
} from '@entelechia/contracts/contracts/metadata/types'

/**
 * Generate complete migration file code from contract metadata
 * 
 * @param metadata Contract metadata
 * @param migrationName Migration file name (e.g., "20250123_create_nodes")
 * @returns Complete SQL migration file content
 */
export function generateMigrationCode(
  metadata: ContractDefinition,
  migrationName: string
): string {
  const lines: string[] = []
  
  // Header
  lines.push('-- ============================================================================')
  lines.push(`-- MIGRATION: ${migrationName}`)
  lines.push('-- Generated from metadata - DO NOT EDIT MANUALLY')
  lines.push('-- ')
  lines.push(`-- Contract: ${metadata.name}`)
  lines.push(`-- Domain: ${metadata.domain}`)
  lines.push(`-- Version: ${metadata.version}`)
  lines.push('-- ============================================================================')
  lines.push('')
  
  // Generate migration from dbMapping
  const migrationCode = generateMigration(metadata.dbMapping, metadata)
  lines.push(migrationCode)
  
  return lines.join('\n')
}

/**
 * Generate migration from DB mapping
 */
function generateMigration(
  dbMapping: DBMappingDefinition,
  contract: ContractDefinition
): string {
  const lines: string[] = []
  
  // Step 1: Extensions
  if (requiresLtree(dbMapping)) {
    lines.push('CREATE EXTENSION IF NOT EXISTS ltree;')
    lines.push('')
  }
  
  // Step 2: CREATE TABLE
  const tableCode = generateCreateTable(dbMapping)
  lines.push(tableCode)
  lines.push('')
  
  // Step 3: Column Comments
  const columnComments = generateColumnComments(dbMapping)
  if (columnComments) {
    lines.push(columnComments)
    lines.push('')
  }
  
  // Step 4: Table Comment
  // Generate table comment (can be enhanced with metadata.tableComment in future)
  const tableComment = `Table for ${dbMapping.table} - ${contract.domain} domain`
  lines.push(`COMMENT ON TABLE public.${dbMapping.table} IS '${tableComment}';`)
  lines.push('')
  
  // Step 5: Indexes
  const indexesCode = generateIndexes(dbMapping)
  if (indexesCode) {
    lines.push(indexesCode)
    lines.push('')
  }
  
  // Step 6: Constraints
  const constraintsCode = generateConstraints(dbMapping)
  if (constraintsCode) {
    lines.push(constraintsCode)
  }
  
  // Step 7: Trigger Functions
  const triggerFunctionsCode = generateTriggerFunctions(dbMapping, contract)
  if (triggerFunctionsCode) {
    lines.push(triggerFunctionsCode)
  }
  
  // Step 8: Triggers
  const triggersCode = generateTriggers(dbMapping)
  if (triggersCode) {
    lines.push(triggersCode)
  }
  
  // Step 9: Foreign Keys (if not in CREATE TABLE)
  const foreignKeysCode = generateForeignKeys(dbMapping)
  if (foreignKeysCode) {
    lines.push(foreignKeysCode)
  }
  
  return lines.join('\n')
}

/**
 * Check if ltree extension is required
 */
function requiresLtree(dbMapping: DBMappingDefinition): boolean {
  return dbMapping.columns.some(col => col.type === 'ltree')
}

/**
 * Generate CREATE TABLE statement
 */
function generateCreateTable(dbMapping: DBMappingDefinition): string {
  const lines: string[] = []
  
  lines.push(`CREATE TABLE IF NOT EXISTS public.${dbMapping.table} (`)
  
  const columnDefs: string[] = []
  
  // Generate column definitions
  for (const column of dbMapping.columns) {
    let colDef = `    ${column.name} ${column.type}`
    
    if (!column.nullable) {
      colDef += ' NOT NULL'
    }
    
    if (column.default) {
      colDef += ` DEFAULT ${column.default}`
    }
    
    if (column.primaryKey) {
      colDef += ' PRIMARY KEY'
    }
    
    if (column.unique && !column.primaryKey) {
      colDef += ' UNIQUE'
    }
    
    // Check if column has foreign key
    const fk = dbMapping.foreignKeys.find(f => f.column === column.name)
    if (fk) {
      colDef += ` REFERENCES public.${fk.references.table}(${fk.references.column})`
      if (fk.onDelete) {
        colDef += ` ON DELETE ${fk.onDelete}`
      }
      if (fk.onUpdate) {
        colDef += ` ON UPDATE ${fk.onUpdate}`
      }
    }
    
    columnDefs.push(colDef)
  }
  
  lines.push(columnDefs.join(',\n'))
  lines.push(');')
  
  return lines.join('\n')
}

/**
 * Generate column comments
 */
function generateColumnComments(dbMapping: DBMappingDefinition): string {
  const lines: string[] = []
  
  for (const column of dbMapping.columns) {
    if (column.comment) {
      lines.push(`COMMENT ON COLUMN public.${dbMapping.table}.${column.name} IS '${column.comment}';`)
    }
  }
  
  return lines.join('\n')
}

/**
 * Generate indexes
 */
function generateIndexes(dbMapping: DBMappingDefinition): string {
  const lines: string[] = []
  
  for (const index of dbMapping.indexes) {
    let indexDef = `CREATE INDEX IF NOT EXISTS ${index.name} ON public.${dbMapping.table}`
    
    if (index.type) {
      indexDef += ` USING ${index.type}`
    }
    
    indexDef += ` (${index.columns.join(', ')})`
    
    if (index.where) {
      indexDef += ` WHERE ${index.where}`
    }
    
    lines.push(indexDef + ';')
    
    if (index.comment) {
      lines.push(`COMMENT ON INDEX ${index.name} IS '${index.comment}';`)
    }
  }
  
  return lines.join('\n')
}

/**
 * Generate constraints
 */
function generateConstraints(dbMapping: DBMappingDefinition): string {
  const lines: string[] = []
  
  for (const constraint of dbMapping.constraints) {
    lines.push(`-- Constraint: ${constraint.name} (${constraint.invariantId})`)
    lines.push('DO $$')
    lines.push('BEGIN')
    lines.push('  IF NOT EXISTS (')
    lines.push('    SELECT 1 FROM information_schema.table_constraints')
    lines.push(`    WHERE table_name = '${dbMapping.table}'`)
    lines.push(`    AND constraint_name = '${constraint.name}'`)
    lines.push('    AND table_schema = \'public\'')
    lines.push('  ) THEN')
    lines.push(`    ALTER TABLE public.${dbMapping.table}`)
    lines.push(`    ADD CONSTRAINT ${constraint.name}`)
    lines.push(`    ${constraint.sql};`)
    lines.push('')
    
    if (constraint.comment) {
      lines.push(`    COMMENT ON CONSTRAINT ${constraint.name} ON public.${dbMapping.table} IS`)
      lines.push(`      '${constraint.comment}';`)
    }
    
    lines.push('  END IF;')
    lines.push('END $$;')
    lines.push('')
  }
  
  return lines.join('\n')
}

/**
 * Generate trigger functions
 */
function generateTriggerFunctions(
  dbMapping: DBMappingDefinition,
  contract: ContractDefinition
): string {
  const lines: string[] = []
  
  for (const trigger of dbMapping.triggers) {
    const functionBody = generateTriggerFunctionBody(trigger, dbMapping, contract)
    
    lines.push(`-- Trigger Function: ${trigger.function} (${trigger.invariantId || 'N/A'})`)
    lines.push(`CREATE OR REPLACE FUNCTION public.${trigger.function}()`)
    lines.push('RETURNS TRIGGER')
    lines.push('LANGUAGE plpgsql')
    lines.push('AS $$')
    lines.push('BEGIN')
    lines.push(functionBody)
    lines.push('  RETURN NEW;')
    lines.push('END;')
    lines.push('$$;')
    lines.push('')
    
    if (trigger.comment) {
      lines.push(`COMMENT ON FUNCTION public.${trigger.function}() IS '${trigger.comment}';`)
      lines.push('')
    }
  }
  
  return lines.join('\n')
}

/**
 * Generate trigger function body
 */
function generateTriggerFunctionBody(
  trigger: DBTriggerDefinition,
  dbMapping: DBMappingDefinition,
  contract: ContractDefinition
): string {
  // B9.1: updated_at trigger
  if (trigger.invariantId === 'B9.1' && trigger.function.includes('updated_at')) {
    return '  NEW.updated_at = now();'
  }
  
  // B11.2: Cycle detection trigger (if needed)
  if (trigger.invariantId === 'B11.2') {
    // This would require more complex logic, but for now return placeholder
    return '  -- Cycle detection logic (B11.2)'
  }
  
  // Default: return empty body (should be provided in metadata)
  return '  -- Trigger function body'
}

/**
 * Generate triggers
 */
function generateTriggers(dbMapping: DBMappingDefinition): string {
  const lines: string[] = []
  
  for (const trigger of dbMapping.triggers) {
    lines.push(`DROP TRIGGER IF EXISTS ${trigger.name} ON public.${trigger.table};`)
    lines.push(`CREATE TRIGGER ${trigger.name}`)
    lines.push(`  ${trigger.timing} ${trigger.events.join(' OR ')} ON public.${trigger.table}`)
    lines.push(`  FOR EACH ROW EXECUTE FUNCTION public.${trigger.function}();`)
    lines.push('')
  }
  
  return lines.join('\n')
}

/**
 * Generate foreign keys (if not already in CREATE TABLE)
 */
function generateForeignKeys(dbMapping: DBMappingDefinition): string {
  const lines: string[] = []
  
  // Foreign keys are already handled in CREATE TABLE
  // This function is for adding foreign keys separately if needed
  
  for (const fk of dbMapping.foreignKeys) {
    // Check if FK is already in CREATE TABLE (inline)
    const column = dbMapping.columns.find(c => c.name === fk.column)
    if (column) {
      // FK is already in CREATE TABLE, skip
      continue
    }
    
    // Add FK separately
    lines.push(`-- Foreign Key: ${fk.column}`)
    lines.push('DO $$')
    lines.push('BEGIN')
    lines.push('  IF NOT EXISTS (')
    lines.push('    SELECT 1 FROM information_schema.table_constraints')
    lines.push(`    WHERE table_name = '${dbMapping.table}'`)
    lines.push(`    AND constraint_name = 'fk_${dbMapping.table}_${fk.column}'`)
    lines.push('    AND constraint_type = \'FOREIGN KEY\'')
    lines.push('  ) THEN')
    lines.push(`    ALTER TABLE public.${dbMapping.table}`)
    lines.push(`    ADD CONSTRAINT fk_${dbMapping.table}_${fk.column}`)
    lines.push(`    FOREIGN KEY (${fk.column})`)
    lines.push(`    REFERENCES public.${fk.references.table}(${fk.references.column})`)
    if (fk.onDelete) {
      lines.push(`    ON DELETE ${fk.onDelete}`)
    }
    if (fk.onUpdate) {
      lines.push(`    ON UPDATE ${fk.onUpdate}`)
    }
    lines.push('    ;')
    lines.push('  END IF;')
    lines.push('END $$;')
    lines.push('')
  }
  
  return lines.join('\n')
}

