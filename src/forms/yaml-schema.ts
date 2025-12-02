/**
 * ✅ ENTELECHIA: Form YAML Schema
 * 
 * Zod schema for validating form YAML files.
 * 
 * PRINCIPLE: YAML only describes UI presentation/layout.
 * All fields must come from metadata.
 */

import { z } from 'zod'

/**
 * Functional Binding Schemas (for YAML)
 */

const DataSourceBindingSchema = z.object({
  type: z.enum(['projection', 'contract', 'stateview', 'computed']),
  source: z.string(),
  path: z.string().optional(),
  params: z.record(z.any()).optional(),
})

const MutationBindingSchema = z.object({
  type: z.literal('intent'),
  intentId: z.string().min(1, 'intentId is required'),
  payloadTemplate: z.record(z.any()).optional(),
  onSuccess: z.object({
    redirect: z.string().optional(),
    refresh: z.array(z.string()).optional(),
    event: z.string().optional(),
  }).optional(),
  onError: z.object({
    showError: z.boolean().optional(),
    redirect: z.string().optional(),
  }).optional(),
})

const CapabilityBindingSchema = z.object({
  requiredAction: z.string(),
  additional: z.array(z.string()).optional(),
  fallback: z.object({
    hide: z.boolean().optional(),
    disable: z.boolean().optional(),
  }).optional(),
})

const ListenBindingSchema = z.object({
  type: z.enum(['event', 'projection', 'invariant', 'poll']),
  source: z.string(),
  name: z.string().optional(),
  interval: z.number().optional(),
})

const ConditionBindingSchema = z.object({
  when: z.string(),
  show: z.boolean().optional(),
  enable: z.boolean().optional(),
  value: z.any().optional(),
})

const InvariantBindingSchema = z.object({
  invariants: z.array(z.string()),
  enforceAt: z.enum(['build', 'runtime', 'both']).optional(),
})

const IntentBindingSchema = z.object({
  kind: z.string(),
  description: z.string(),
  category: z.string().optional(),
})

const FunctionalBindingSchema = z.object({
  dataSource: DataSourceBindingSchema.optional(),
  mutation: MutationBindingSchema.optional(),
  capability: CapabilityBindingSchema.optional(),
  listen: z.array(ListenBindingSchema).optional(),
  conditions: z.array(ConditionBindingSchema).optional(),
  invariants: InvariantBindingSchema.optional(),
  intent: IntentBindingSchema.optional(),
})

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
  }),
})

export type FormYaml = z.infer<typeof FormYamlSchema>


