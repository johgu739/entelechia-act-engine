/**
 * ✅ ENTELECHIA: Functional Telos Types
 * 
 * Types for functional bindings in UI FORM.
 * 
 * PRINCIPLE: UI elements declare their telos (purpose) and bindings
 * to contracts, ACL, invariants, and data sources declaratively.
 */

/**
 * Data source binding
 * 
 * Declares where data comes from for a UI element.
 */
export interface DataSourceBinding {
  type: 'projection' | 'contract' | 'stateview' | 'computed'
  source: string // e.g., "BackendAuth", "NodeStateView", "Dashboard"
  path?: string // dot notation path in projection/stateview
  params?: Record<string, any> // query params for contract endpoints
}

/**
 * Mutation binding
 * 
 * Declares what mutation is triggered.
 * 
 * PRINCIPLE: FORM → ACT → STATE
 * Supports two mutation types:
 * 1. intent: Uses intent registry (auth.login, node.create, etc.)
 * 2. contractEndpoint: Direct contract endpoint call
 */
export type MutationBinding =
  | {
      type: 'intent'
      intentId: string // e.g., "auth.login", "node.create" - must exist in intent registry
      payloadTemplate?: Record<string, any> // JSON template with $fieldValue, $form.fieldName placeholders
      onSuccess?: {
        redirect?: string // route to navigate to
        refresh?: string[] // data sources to refresh
        event?: string // event to emit
      }
      onError?: {
        showError?: boolean
        redirect?: string
      }
    }
  | {
      type: 'contractEndpoint'
      contract: string // Contract name (must exist in contract metadata)
      endpoint: string // Endpoint name (must exist in contract metadata)
      method: 'POST' | 'PUT' | 'PATCH' | 'DELETE'
      payloadTemplate?: Record<string, any> // JSON template with $fieldValue, $form.fieldName placeholders
      onSuccess?: {
        redirect?: string
        refresh?: string[]
        event?: string
      }
      onError?: {
        showError?: boolean
        redirect?: string
      }
    }

/**
 * Capability binding
 * 
 * Declares ACL requirements for UI element.
 */
export interface CapabilityBinding {
  requiredAction: string // ActionID from ActionRegistry
  additional?: string[] // Additional actions that grant access
  fallback?: {
    hide?: boolean // Hide element if capability missing
    disable?: boolean // Disable element if capability missing
  }
}

/**
 * Listen binding
 * 
 * Declares what events/projections/invariants trigger re-render.
 */
export interface ListenBinding {
  type: 'event' | 'projection' | 'invariant' | 'poll'
  source: string // Contract name, projection name, or invariant category
  name?: string // Event name, projection path, or invariant ID
  interval?: number // For poll type, interval in ms
}

/**
 * Condition binding
 * 
 * Declares show/hide/enable rules as pure FORM.
 */
export interface ConditionBinding {
  when: string // Simple DSL: "env.mode == 'dev'", "user.role in ['admin']", "$form.fieldName == 'value'"
  show?: boolean // Show/hide element
  enable?: boolean // Enable/disable element
  value?: any // Set value conditionally
}

/**
 * Invariant binding
 * 
 * Declares which invariants apply to this UI element.
 */
export interface InvariantBinding {
  invariants: string[] // F-ID or category (e.g., "UI_FORM.F55_UI_FORM_IDENTITY", "UI_SCROLL.F82")
  enforceAt?: 'build' | 'runtime' | 'both' // When to enforce
}

/**
 * Intent binding
 * 
 * Declares the telos (purpose) of this UI element.
 */
export interface IntentBinding {
  kind: string // e.g., "authentication", "navigation", "edit-node", "view-dashboard"
  description: string // Human-readable description
  category?: string // e.g., "auth", "workspace", "system"
}

/**
 * Complete functional binding
 * 
 * All functional aspects of a UI element.
 * 
 * Note: listen and conditions can be single items or arrays (convenience).
 */
export interface FunctionalBinding {
  dataSource?: DataSourceBinding
  mutation?: MutationBinding
  capability?: CapabilityBinding
  listen?: ListenBinding | ListenBinding[] // Single or array (convenience)
  conditions?: ConditionBinding | ConditionBinding[] // Single or array (convenience)
  invariants?: InvariantBinding
  intent?: IntentBinding
}

/**
 * Functional field descriptor
 * 
 * Extends canonical field with functional bindings.
 */
export interface CanonicalFunctionalFieldDescriptor {
  // All fields from CanonicalFieldDescriptor
  fieldName: string
  type: string
  widget: string
  required: boolean
  readonly: boolean
  label: string
  description?: string
  constraints?: {
    maxLength?: number
    minLength?: number
    pattern?: string
    choices?: string[]
  }
  layout?: {
    span?: 1 | 2 | 3
    hidden?: boolean
  }
  
  // Functional bindings
  functional?: FunctionalBinding
}

/**
 * Functional section descriptor
 * 
 * Extends canonical section with functional bindings.
 */
export interface CanonicalFunctionalSectionDescriptor {
  // All fields from CanonicalSectionDescriptor
  id: string
  title: string
  fields: CanonicalFunctionalFieldDescriptor[]
  layout?: {
    columns?: 1 | 2 | 3
    collapsible?: boolean
  }
  
  // Functional bindings (applies to entire section)
  functional?: FunctionalBinding
}

/**
 * Functional form descriptor
 * 
 * Complete functional form descriptor.
 */
export interface CanonicalFunctionalFormDescriptor {
  contract: string
  variant: string
  sections: CanonicalFunctionalSectionDescriptor[]
  
  // Form-level functional bindings
  functional?: FunctionalBinding
}

