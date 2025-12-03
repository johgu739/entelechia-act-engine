/**
 * ✅ ENTELECHIA: Form YAML Schema
 * 
 * Zod schema for validating form YAML files.
 * 
 * PRINCIPLE: YAML only describes UI presentation/layout.
 * All fields must come from metadata.
 */

import { z } from 'zod'
import { registry } from '@entelechia/invariant-engine'
import { ScrollDescriptorSchema } from '../navigation/metadata/scroll-schema.js'

/**
 * Functional Binding Schemas (for YAML)
 * 
 * ✅ PHASE 1: Complete Functional FORM Spec
 * 
 * These schemas enable full functional binding:
 * - dataSource: Binds to projections, stateviews, contracts
 * - mutation: Binds to intents or contract endpoints
 * - capability: ACL requirements
 * - listen: Reactive data subscriptions
 * - conditions: Conditional visibility/enabling
 * - invariants: Invariant declarations
 * - intent: Telos/purpose declaration
 */

/**
 * DataSource Binding Schema
 * 
 * Binds form fields/sections to data sources:
 * - projection: From projectionCapabilities
 * - stateview: From stateView contracts (NodeStateView, SystemStateView)
 * - contract: Direct contract endpoint
 * - computed: Derived/computed value
 */
const DataSourceBindingSchema = z.object({
  type: z.enum(['projection', 'contract', 'stateview', 'computed']),
  source: z.string().min(1, 'DataSource source is required'),
  path: z.string().optional(), // JSONPath to nested value (e.g., "node.label", "system.nodes[0]")
  params: z.record(z.any()).optional(), // Query params for contract endpoints
  // ✅ NEW: Field-level dataSource (for individual fields)
  fieldBinding: z.record(z.string()).optional(), // Maps field names to dataSource paths
})

/**
 * Mutation Binding Schema
 * 
 * Supports two mutation types:
 * 1. intent: Uses intent registry (auth.login, node.create, etc.)
 * 2. contractEndpoint: Direct contract endpoint call
 */
const MutationBindingSchema = z.union([
  // Intent-based mutation (existing)
  z.object({
    type: z.literal('intent'),
    intentId: z.string().min(1, 'intentId is required'),
    payloadTemplate: z.record(z.any()).optional(), // Template with $form.field, $context.* variables
    onSuccess: z.object({
      redirect: z.string().optional(),
      refresh: z.array(z.string()).optional(), // Query keys to invalidate
      event: z.string().optional(), // Event to emit
    }).optional(),
    onError: z.object({
      showError: z.boolean().optional(),
      redirect: z.string().optional(),
    }).optional(),
  }),
  // Contract endpoint mutation (NEW)
  z.object({
    type: z.literal('contractEndpoint'),
    contract: z.string().min(1, 'Contract name is required'),
    endpoint: z.string().min(1, 'Endpoint name is required'),
    method: z.enum(['POST', 'PUT', 'PATCH', 'DELETE']),
    payloadTemplate: z.record(z.any()).optional(), // Template with $form.field, $context.* variables
    onSuccess: z.object({
      redirect: z.string().optional(),
      refresh: z.array(z.string()).optional(),
      event: z.string().optional(),
    }).optional(),
    onError: z.object({
      showError: z.boolean().optional(),
      redirect: z.string().optional(),
    }).optional(),
  }),
])

const CapabilityBindingSchema = z.object({
  requiredAction: z.string(),
  additional: z.array(z.string()).optional(),
  fallback: z.object({
    hide: z.boolean().optional(),
    disable: z.boolean().optional(),
  }).optional(),
})

/**
 * Listen Binding Schema
 * 
 * Reactive subscriptions for form updates:
 * - event: DOM/custom events
 * - projection: Projection updates (from projectionCapabilities)
 * - invariant: Invariant violation events
 * - poll: Polling-based updates
 */
const ListenBindingSchema = z.object({
  type: z.enum(['event', 'projection', 'invariant', 'poll']),
  source: z.string().min(1, 'Listen source is required'),
  name: z.string().optional(), // Event name or projection name
  interval: z.number().optional(), // For poll type (milliseconds)
  handler: z.string().optional(), // Handler function name (generated)
})

/**
 * Condition Binding Schema
 * 
 * Conditional visibility/enabling based on:
 * - Form field values: "$form.field == 'value'"
 * - Context values: "$context.nodeId != null"
 * - User state: "$user.role == 'admin'"
 * - Capabilities: "$capability.VIEW_NODE == true"
 */
const ConditionBindingSchema = z.object({
  when: z.string().min(1, 'Condition expression is required'), // Expression string
  show: z.boolean().optional(), // Show/hide element
  enable: z.boolean().optional(), // Enable/disable element
  value: z.any().optional(), // Set value when condition is true
  // ✅ NEW: Multiple conditions (AND/OR logic)
  operator: z.enum(['AND', 'OR']).optional().default('AND'),
})

/**
 * Invariant Binding Schema
 * 
 * Validates invariant IDs against registry and ensures they exist.
 */
const InvariantBindingSchema = z.object({
  invariants: z.array(z.string()).refine(
    (ids) => {
      // Validate all invariant IDs exist in registry
      for (const id of ids) {
        const entry = registry.get(id)
        if (!entry) {
          throw new Error(`Invariant ${id} not found in registry. Available invariants: ${registry.getAllInvariantIds().slice(0, 10).join(', ')}...`)
        }
      }
      return true
    },
    { message: 'All invariant IDs must exist in registry' }
  ),
  enforceAt: z.enum(['build', 'runtime', 'both']).default('both'),
})

const IntentBindingSchema = z.object({
  kind: z.string(),
  description: z.string(),
  category: z.string().optional(),
})

/**
 * Functional Binding Schema
 * 
 * Complete functional binding specification for FORM elements.
 * 
 * Can be applied at:
 * - Form level (applies to entire form)
 * - Section level (applies to section)
 * - Field level (applies to individual field)
 * 
 * ✅ PHASE 1: All functional bindings now supported
 */
const FunctionalBindingSchema = z.object({
  // ✅ Data source binding (for read operations)
  dataSource: DataSourceBindingSchema.optional(),
  
  // ✅ Mutation binding (for write operations)
  mutation: MutationBindingSchema.optional(),
  
  // ✅ Capability binding (ACL requirements)
  capability: CapabilityBindingSchema.optional(),
  
  // ✅ Listen bindings (reactive subscriptions)
  listen: z.union([
    z.array(ListenBindingSchema), // Multiple listeners
    ListenBindingSchema, // Single listener (convenience)
  ]).optional(),
  
  // ✅ Condition bindings (conditional visibility/enabling)
  conditions: z.union([
    z.array(ConditionBindingSchema), // Multiple conditions
    ConditionBindingSchema, // Single condition (convenience)
  ]).optional(),
  
  // ✅ Invariant bindings (invariant declarations)
  invariants: InvariantBindingSchema.optional(),
  
  // ✅ Intent binding (telos/purpose declaration)
  intent: IntentBindingSchema.optional(),
}).refine(
  // ✅ Validation: Must have at least one functional binding
  (data) => {
    return !!(
      data.dataSource ||
      data.mutation ||
      data.capability ||
      data.listen ||
      data.conditions ||
      data.invariants ||
      data.intent
    )
  },
  {
    message: 'Functional binding must have at least one of: dataSource, mutation, capability, listen, conditions, invariants, intent',
  }
)

/**
 * Form YAML Schema
 * 
 * Validates the structure of form YAML files:
 * - contract: Must match metadata.name
 * - variant: Must match a formSchemas[].id
 * - sections: Array of sections with fields
 * - functional: Optional functional bindings (telos)
 */
export const FormYamlSchema = z.object({
  form: z.object({
    contract: z.string().min(1, 'Contract name is required'),
    variant: z.string().min(1, 'Variant ID is required'),
    sections: z.array(
      z.object({
        id: z.string().min(1, 'Section ID is required'),
        title: z.string().min(1, 'Section title is required'),
        fields: z.array(z.string().min(1, 'Field name is required')),
        functional: FunctionalBindingSchema.optional(),
      })
    ).min(1, 'At least one section is required'),
    functional: FunctionalBindingSchema.optional(),
    // ✅ NEW: Form-level invariants (multilayer enforcement)
    invariants: InvariantBindingSchema.optional(),
    // ✅ NEW: Form-level padding (F004: Canonical Padding)
    padding: z.object({
      x: z.literal(24).optional(), // Canonical: 24px horizontal
      y: z.literal(16).optional(), // Canonical: 16px vertical
    }).optional(),
    // ✅ NEW: Scroll container declaration (F82: Single Scroll Container)
    scrollContainer: z.object({
      id: z.string().optional(),
      type: z.enum(['form', 'content']).default('form'),
    }).optional(),
    // ✅ NEW: Scroll behavior descriptor (kind: 'standard' | 'elastic')
    scrollBehavior: ScrollDescriptorSchema.optional(),
  }),
})

export type FormYaml = z.infer<typeof FormYamlSchema>


