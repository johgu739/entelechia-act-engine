/**
 * ✅ ENTELECHIA: Route Code Generator
 * 
 * Deterministic code generator for Fastify routes from contract metadata.
 * 
 * PRINCIPLE: Metadata is FORM → Route code is implementation → Generation is deterministic transformation.
 * 
 * This generator implements Route Generation Law by generating TypeScript code directly from metadata.
 */

import type {
  ContractDefinition,
  EndpointDefinition,
  RequestDefinition,
  DBQueryDefinition,
  ValidationDefinition,
  ResponseDefinition,
  InvariantDefinition,
} from '@entelechia/contracts/contracts/metadata/types'

/**
 * Generate complete route file code from contract metadata
 * 
 * @param metadata Contract metadata
 * @param imports Additional imports needed
 * @returns Complete TypeScript file content
 */
export function generateRouteCode(
  metadata: ContractDefinition,
  imports: string[] = []
): string {
  const lines: string[] = []
  
  // Header
  lines.push('/**')
  lines.push(` * ✅ ENTELECHIA: ${metadata.name} Routes`)
  lines.push(' * ')
  lines.push(' * Generated from metadata - DO NOT EDIT MANUALLY')
  lines.push(' * ')
  lines.push(` * Domain: ${metadata.domain}`)
  lines.push(` * Version: ${metadata.version}`)
  lines.push(' */')
  lines.push('')
  
  // Imports
  lines.push("import { FastifyInstance } from 'fastify'")
  lines.push("import type { ServerConfig } from '../infra/config/loadConfig.js'")
  lines.push("import { writeLog } from '../infra/logging.js'")
  lines.push("import { validateRequest } from '../infra/validation.js'")
  lines.push("import { assertBackendContract } from '../infra/contract-enforcement.js'")
  lines.push("import { createRateLimiter } from '../infra/rate-limit.js'")
  lines.push("import { createSupabaseAdminClient } from '../supabase/client.js'")
  lines.push("import { createGuardedEndpoint } from '../../acl/runtime-acl.js'")
  for (const imp of imports) {
    lines.push(imp)
  }
  if (imports.length > 0) {
    lines.push('')
  }
  
  // Route registration function
  lines.push(`export function register${metadata.name}Routes(fastify: FastifyInstance, config: ServerConfig): void {`)
  lines.push('  const getLogFile = () => config.logFile')
  lines.push('  const getSupabaseClient = () => createSupabaseAdminClient(config)')
  lines.push('')
  
  // Generate rate limiters
  const rateLimiters = new Set<string>()
  for (const endpoint of metadata.endpoints) {
    if (endpoint.rateLimit) {
      const rateLimitKey = `${endpoint.rateLimit.windowMs}_${endpoint.rateLimit.max}`
      if (!rateLimiters.has(rateLimitKey)) {
        rateLimiters.add(rateLimitKey)
        const varName = `${metadata.domain}RateLimit`
        lines.push(`  const ${varName} = createRateLimiter({ windowMs: ${endpoint.rateLimit.windowMs}, max: ${endpoint.rateLimit.max} })`)
      }
    }
  }
  if (rateLimiters.size > 0) {
    lines.push('')
  }
  
  // Generate routes
  for (const endpoint of metadata.endpoints) {
    const routeCode = generateRoute(endpoint, metadata)
    lines.push(routeCode)
    lines.push('')
  }
  
  lines.push('}')
  
  return lines.join('\n')
}

/**
 * Generate single route handler
 */
function generateRoute(
  endpoint: EndpointDefinition,
  contract: ContractDefinition
): string {
  const lines: string[] = []
  
  // Route comment
  lines.push(`  // ${endpoint.method} ${endpoint.path}`)
  lines.push(`  // ${endpoint.name}`)
  lines.push(`  // Required Action: ${endpoint.required_action || 'PUBLIC_ACCESS'}`)
  
  // Rate limiter
  const rateLimitVar = endpoint.rateLimit 
    ? `${contract.domain}RateLimit`
    : null
  
  const preHandler = rateLimitVar ? `{ preHandler: ${rateLimitVar} }` : '{}'
  
  // ✅ ACL3: ROUTER_WRAPPED_WITH_GUARD
  // All routes must use generated guard wrappers
  // Handler function (without guard)
  const handlerName = `handle${endpoint.name.replace(/\s+/g, '')}`
  lines.push(`  const ${handlerName} = async (request: any, reply: any, session?: any) => {`)
  lines.push('    try {')
  
  // Request validation
  if (endpoint.request) {
    const requestCode = generateRequestValidation(endpoint.request, endpoint)
    lines.push(requestCode)
  }
  
  // DB queries
  if (endpoint.dbQueries.length > 0) {
    for (let i = 0; i < endpoint.dbQueries.length; i++) {
      const query = endpoint.dbQueries[i]
      const queryCode = generateDBQuery(query, endpoint, i)
      lines.push(queryCode)
      if (i < endpoint.dbQueries.length - 1) {
        lines.push('')
      }
    }
  }
  
  // Build projection (for multi-query endpoints)
  if (endpoint.dbQueries.length > 1) {
    lines.push('      // Build projection from multiple queries')
    const projectionCode = generateProjection(endpoint, contract)
    if (projectionCode) {
      lines.push(projectionCode)
      lines.push('')
    }
  }
  
  // Validations (if defined)
  if (endpoint.validations && Array.isArray(endpoint.validations)) {
    for (const validation of endpoint.validations) {
      const validationCode = generateValidation(validation, endpoint, contract)
      if (validationCode) {
        lines.push(validationCode)
        lines.push('')
      }
    }
  }
  
  // Response
  const responseCode = generateResponse(endpoint.response, endpoint)
  lines.push(responseCode)
  
  // Error handling
  lines.push('    } catch (err: any) {')
  lines.push('      writeLog(`[ROUTE] Unexpected error: ${err.message}`, getLogFile())')
  lines.push('      return reply.code(500).send({ ok: false, error: \'Internal server error\', details: err.message })')
  lines.push('    }')
  lines.push('  }')
  lines.push('')
  
  // ✅ ACL3: Wrap handler with guard
  lines.push(`  // ✅ ACL3: Wrapped with guard for action: ${endpoint.required_action || 'PUBLIC_ACCESS'}`)
  lines.push(`  const guardedHandler = createGuardedEndpoint(`)
  lines.push(`    { required_action: ${endpoint.required_action ? `'${endpoint.required_action}'` : 'null'} },`)
  lines.push(`    ${handlerName},`)
  lines.push('    config')
  lines.push('  )')
  lines.push('')
  
  // Register route with guarded handler
  lines.push(`  fastify.${endpoint.method.toLowerCase()}('${endpoint.path}', ${preHandler}, guardedHandler)`)
  
  return lines.join('\n')
}

/**
 * Generate request validation code
 */
function generateRequestValidation(
  request: RequestDefinition,
  endpoint: EndpointDefinition
): string {
  const lines: string[] = []
  
  if (request.params) {
    const schemaName = request.params.name
    lines.push(`      const paramsValidation = validateRequest(${schemaName}, request.params)`)
    lines.push('      if (!paramsValidation.ok) {')
    lines.push('        return reply.code(400).send({ ok: false, error: \'Invalid request\', details: paramsValidation.error })')
    lines.push('      }')
    
    // Extract params
    if (request.params.fields) {
      const paramNames = request.params.fields.map(f => f.name).join(', ')
      lines.push(`      const { ${paramNames} } = paramsValidation.data`)
    }
    lines.push('')
  }
  
  if (request.body) {
    const schemaName = request.body.name
    lines.push(`      const bodyValidation = validateRequest(${schemaName}, request.body)`)
    lines.push('      if (!bodyValidation.ok) {')
    lines.push('        return reply.code(400).send({ ok: false, error: \'Invalid request body\', details: bodyValidation.error })')
    lines.push('      }')
    
    // Extract body fields
    if (request.body.fields) {
      const bodyFields = request.body.fields.map(f => f.name).join(', ')
      lines.push(`      const { ${bodyFields} } = bodyValidation.data`)
    }
    lines.push('')
  }
  
  if (request.query) {
    const schemaName = request.query.name
    lines.push(`      const queryValidation = validateRequest(${schemaName}, request.query)`)
    lines.push('      if (!queryValidation.ok) {')
    lines.push('        return reply.code(400).send({ ok: false, error: \'Invalid query\', details: queryValidation.error })')
    lines.push('      }')
    
    // Extract query fields
    if (request.query.fields) {
      const queryFields = request.query.fields.map(f => f.name).join(', ')
      lines.push(`      const { ${queryFields} } = queryValidation.data`)
    }
    lines.push('')
  }
  
  return lines.join('\n')
}

/**
 * Generate DB query code
 */
function generateDBQuery(
  query: DBQueryDefinition,
  endpoint: EndpointDefinition,
  index: number
): string {
  const lines: string[] = []
  
  // Only add supabase client once per route
  if (index === 0) {
    lines.push('      const supabase = getSupabaseClient()')
    lines.push('')
  }
  
  if (query.type === 'SELECT') {
    // Generate variable name based on query purpose
    const varName = query.conditional ? 'maybeData' : 'data'
    const maybeSingle = query.conditional ? '.maybeSingle()' : ''
    
    lines.push(`      const { ${varName}, error: ${varName}Error } = await supabase`)
    lines.push(`        .from('${query.table}')`)
    lines.push(`        .select('${query.columns.join(', ')}')`)
    
    if (query.where && query.where.length > 0) {
      for (const where of query.where) {
        const valueStr = typeof where.value === 'string' ? where.value : String(where.value || '')
        const value = valueStr.startsWith(':') 
          ? valueStr.substring(1) // Remove ':' prefix for param references
          : JSON.stringify(where.value)
        
        if (where.operator === '=') {
          lines.push(`        .eq('${where.column}', ${value})`)
        } else if (where.operator === '!=') {
          lines.push(`        .neq('${where.column}', ${value})`)
        } else if (where.operator === 'IS NULL') {
          lines.push(`        .is('${where.column}', null)`)
        } else if (where.operator === 'IS NOT NULL') {
          lines.push(`        .not('${where.column}', 'is', null)`)
        }
      }
    }
    
    if (query.orderBy && query.orderBy.length > 0) {
      for (const order of query.orderBy) {
        lines.push(`        .order('${order.column}', { ascending: ${order.direction === 'ASC'} })`)
      }
    }
    
    // Note: limit is not part of DBQueryDefinition, but can be added if needed
    
    lines.push(maybeSingle)
    lines.push('')
    lines.push(`      if (${varName}Error) {`)
    lines.push(`        writeLog(\`[ROUTE] Error fetching from ${query.table}: \${${varName}Error.message}\`, getLogFile())`)
    lines.push(`        return reply.code(500).send({ ok: false, error: 'Database error', details: ${varName}Error.message })`)
    lines.push('      }')
    
    if (query.conditional) {
      lines.push('')
      lines.push(`      if (!${varName}) {`)
      lines.push('        // Handle missing data (conditional query)')
      lines.push('      }')
    }
  } else if (query.type === 'INSERT') {
    lines.push(`      const { data: insertedData, error: insertError } = await supabase`)
    lines.push(`        .from('${query.table}')`)
    lines.push(`        .insert({ ... })`)
    lines.push('        .select()')
    lines.push('        .single()')
    lines.push('')
    lines.push('      if (insertError) {')
    lines.push(`        writeLog(\`[ROUTE] Error inserting into ${query.table}: \${insertError.message}\`, getLogFile())`)
    lines.push('        return reply.code(500).send({ ok: false, error: \'Failed to create\', details: insertError.message })')
    lines.push('      }')
  }
  
  return lines.join('\n')
}

/**
 * Generate validation code
 */
function generateValidation(
  validation: ValidationDefinition,
  endpoint: EndpointDefinition,
  contract: ContractDefinition
): string {
  const lines: string[] = []
  
  if (validation.type === 'db_to_domain') {
    // Determine variable name based on context
    // For GET /nodes/:id, we have multiple queries: node, children, parent
    let varName = 'validated'
    if (endpoint.path === '/nodes/:id') {
      // First validation is node, second is children array, third is parent
      const validationIndex = endpoint.validations.filter(v => v.type === 'db_to_domain').indexOf(validation)
      if (validationIndex === 0) {
        varName = 'validatedNode'
      } else if (validationIndex === 1) {
        varName = 'validatedChildren'
        // Generate array mapping
        lines.push('      const validatedChildren = (children || []).map((child, index) => {')
        lines.push('        return assertBackendContract(')
        lines.push(`          ${validation.schema || 'unknown'},`)
        lines.push('          child,')
        lines.push(`          \`DB → Domain: ${endpoint.path}/children[\${index}]\`,`)
        lines.push(`          '${(validation.schema || 'unknown').replace('Schema', '')}',`)
        lines.push('          getLogFile()')
        lines.push('        )')
        lines.push('      })')
        return lines.join('\n')
      } else if (validationIndex === 2) {
        varName = 'validatedParent'
      }
    } else if (endpoint.path === '/nodes/tree') {
      varName = 'validatedDbNodes'
      // Generate array mapping
      lines.push('      const validatedDbNodes = (nodes || []).map((node, index) => {')
      lines.push('        return assertBackendContract(')
      lines.push(`          ${validation.schema || 'unknown'},`)
      lines.push('          node,')
      lines.push(`          \`DB → Domain: ${endpoint.path}[\${index}]\`,`)
      lines.push(`          '${(validation.schema || 'unknown').replace('Schema', '')}',`)
      lines.push('          getLogFile()')
      lines.push('        )')
      lines.push('      })')
      return lines.join('\n')
    }
    
    if (validation.schema) {
      lines.push(`      const ${varName} = assertBackendContract(`)
      lines.push(`        ${validation.schema},`)
      lines.push(`        data,`)
      lines.push(`        'DB → Domain: ${endpoint.path}',`)
      lines.push(`        '${validation.schema.replace('Schema', '')}',`)
      lines.push('        getLogFile()')
      lines.push('      )')
    }
  } else if (validation.type === 'domain_to_api') {
    if (validation.schema) {
      lines.push(`      const validatedResponse = assertBackendContract(`)
      lines.push(`        ${validation.schema},`)
      lines.push(`        projection,`)
      lines.push(`        'Domain → API: ${endpoint.path}',`)
      lines.push(`        '${validation.schema.replace('Schema', '')}',`)
      lines.push('        getLogFile()')
      lines.push('      )')
    }
  } else if (validation.type === 'relationship') {
    // Find invariant
    const invariant = contract.invariants.find(inv => inv.id === validation.invariantId)
    if (invariant) {
      const relationshipCode = generateRelationshipValidation(invariant, validation, endpoint)
      lines.push(relationshipCode)
    }
  }
  
  return lines.join('\n')
}

/**
 * Generate relationship validation code
 */
function generateRelationshipValidation(
  invariant: InvariantDefinition,
  validation: ValidationDefinition,
  endpoint: EndpointDefinition
): string {
  const lines: string[] = []
  
  if (invariant.id === 'B7.1') {
    // Parent/Child Depth Consistency
    lines.push('      // ✅ B7.1: Parent/child depth consistency')
    lines.push('      if (validatedParent && validatedNode.parent_id) {')
    lines.push('        if (validatedParent.depth + 1 !== validatedNode.depth) {')
    lines.push('          throw new Error(')
    lines.push('            `Parent/child depth mismatch: parent ${validatedParent.id} has depth=${validatedParent.depth}, ` +')
    lines.push('            `but child ${validatedNode.id} has depth=${validatedNode.depth} (expected ${validatedParent.depth + 1})`')
    lines.push('          )')
    lines.push('        }')
    lines.push('      }')
    lines.push('      ')
    lines.push('      // ✅ B7.1: Children depth consistency')
    lines.push('      for (const child of validatedChildren) {')
    lines.push('        if (validatedNode.depth + 1 !== child.depth) {')
    lines.push('          throw new Error(')
    lines.push('            `Parent/child depth mismatch: parent ${validatedNode.id} has depth=${validatedNode.depth}, ` +')
    lines.push('            `but child ${child.id} has depth=${child.depth} (expected ${validatedNode.depth + 1})`')
    lines.push('          )')
    lines.push('        }')
    lines.push('      }')
  } else if (invariant.id === 'B8.2') {
    // Path Ancestry Consistency
    lines.push('      // ✅ B8.2: Path ancestry consistency')
    lines.push('      if (validatedParent && validatedNode.parent_id) {')
    lines.push('        if (!validatedNode.path.startsWith(validatedParent.path)) {')
    lines.push('          throw new Error(')
    lines.push('            `Path ancestry mismatch: child path="${validatedNode.path}" does not start with parent path="${validatedParent.path}"`')
    lines.push('          )')
    lines.push('        }')
    lines.push('      }')
    lines.push('      ')
    lines.push('      // ✅ B8.2: Children path ancestry consistency')
    lines.push('      for (const child of validatedChildren) {')
    lines.push('        if (!child.path.startsWith(validatedNode.path)) {')
    lines.push('          throw new Error(')
    lines.push('            `Path ancestry mismatch: child path="${child.path}" does not start with parent path="${validatedNode.path}"`')
    lines.push('          )')
    lines.push('        }')
    lines.push('      }')
  }
  
  return lines.join('\n')
}

/**
 * Generate projection building code
 */
function generateProjection(
  endpoint: EndpointDefinition,
  contract: ContractDefinition
): string {
  // For GET /nodes/:id, build projection from node, parent, children
  if (endpoint.path === '/nodes/:id' && endpoint.dbQueries.length === 3) {
    const lines: string[] = []
    lines.push('      const projection = {')
    lines.push('        node: validatedNode,')
    lines.push('        parent: validatedParent,')
    lines.push('        children: validatedChildren,')
    lines.push('      }')
    return lines.join('\n')
  }
  
  // For GET /nodes/tree, build projection from nodes array
  if (endpoint.path === '/nodes/tree' && endpoint.dbQueries.length === 1) {
    const lines: string[] = []
    lines.push('      const projection = {')
    lines.push('        nodes: validatedDbNodes,')
    lines.push('      }')
    return lines.join('\n')
  }
  
  // Default: use data directly
  return ''
}

/**
 * Generate response code
 */
function generateResponse(
  response: ResponseDefinition,
  endpoint: EndpointDefinition
): string {
  const wrapper = response.structure.wrapper || 'ok_data'
  
  if (wrapper === 'ok_data') {
    return '      return reply.send({ ok: true, data: validatedResponse })'
  } else {
    return '      return reply.send(validatedResponse)'
  }
}

