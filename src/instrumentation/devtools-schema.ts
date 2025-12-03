/**
 * ✅ ENTELECHIA: DevTools YAML Schema
 * 
 * Zod schema for validating devtools YAML files.
 * 
 * PRINCIPLE: All devtools configuration must be declarative in FORM.
 * Panels, inspectors, graphs, and debug views are defined here.
 */

import { z } from 'zod'
import { registry } from '@entelechia/invariant-engine'

/**
 * Panel Definition Schema
 * 
 * Defines a devtools panel (invariant list, timeline, snapshots, etc.)
 */
const PanelDefinitionSchema = z.object({
  id: z.string().min(1, 'Panel ID is required'),
  title: z.string().min(1, 'Panel title is required'),
  type: z.enum(['list', 'detail', 'timeline', 'snapshots', 'causal', 'coverage', 'violations', 'livefeed']),
  layout: z.object({
    region: z.enum(['sidebar', 'content', 'overlay']),
    width: z.number().optional(), // Width in px or %
    height: z.number().optional(), // Height in px or %
  }).optional(),
  dataSource: z.object({
    type: z.enum(['invariants', 'violations', 'probes', 'snapshots', 'coverage']),
    filter: z.object({
      status: z.enum(['ALL', 'PASS', 'FAIL', 'NEVER_TRIGGERED']).optional(),
      category: z.array(z.string()).optional(),
      severity: z.enum(['low', 'medium', 'high', 'critical']).optional(),
    }).optional(),
  }).optional(),
  grouping: z.object({
    by: z.enum(['category', 'severity', 'status', 'component']).optional(),
    sort: z.enum(['id', 'name', 'status', 'severity']).optional(),
    order: z.enum(['asc', 'desc']).default('asc'),
  }).optional(),
})

/**
 * Inspector Section Schema
 * 
 * Defines a section in the deep inspector
 */
const InspectorSectionSchema = z.object({
  id: z.string().min(1, 'Section ID is required'),
  title: z.string().min(1, 'Section title is required'),
  fields: z.array(z.string()).optional(), // Fields to show
  format: z.enum(['tree', 'table', 'json', 'graph']).default('tree'),
  schema: z.record(z.any()).optional(), // Schema for tree/table structure
})

/**
 * Graph Type Schema
 * 
 * Defines a graph visualization type
 */
const GraphTypeSchema = z.object({
  id: z.string().min(1, 'Graph type ID is required'),
  name: z.string().min(1, 'Graph type name is required'),
  layout: z.enum(['hierarchical', 'force', 'circular', 'linear']),
  nodeTypes: z.array(z.object({
    id: z.string(),
    label: z.string(),
    color: z.string().optional(),
    shape: z.enum(['circle', 'square', 'diamond', 'triangle']).optional(),
  })).optional(),
  edgeTypes: z.array(z.object({
    id: z.string(),
    label: z.string(),
    color: z.string().optional(),
    style: z.enum(['solid', 'dashed', 'dotted']).optional(),
  })).optional(),
})

/**
 * Probe Definition Schema
 * 
 * Defines a probe for deep inspection
 */
const ProbeDefinitionSchema = z.object({
  id: z.string().min(1, 'Probe ID is required'),
  sourceComponent: z.string().optional(),
  sourceFile: z.string().optional(),
  invariantIds: z.array(z.string()).optional(),
  snapshotSchema: z.record(z.any()).optional(),
})

/**
 * Scenario Definition Schema
 * 
 * Defines a test scenario for invariant testing
 */
const ScenarioDefinitionSchema = z.object({
  id: z.string().min(1, 'Scenario ID is required'),
  name: z.string().min(1, 'Scenario name is required'),
  category: z.enum(['navigation', 'continuity', 'auth', 'workspace', 'dashboard', 'general']),
  preConditions: z.record(z.any()).optional(),
  postConditions: z.record(z.any()).optional(),
  expectedViolations: z.array(z.string()).optional(), // Expected invariant IDs
  steps: z.array(z.object({
    action: z.string(),
    params: z.record(z.any()).optional(),
  })).optional(),
})

/**
 * DevTools YAML Schema
 */
export const DevToolsYamlSchema = z.object({
  devtools: z.object({
    // Dashboard configuration
    dashboard: z.object({
      panels: z.array(PanelDefinitionSchema).min(1, 'At least one panel is required'),
      layout: z.object({
        sidebarWidth: z.number().default(320), // px
        refreshInterval: z.number().default(5000), // ms
      }).optional(),
    }).optional(),
    
    // Inspector configuration
    inspector: z.object({
      sections: z.array(InspectorSectionSchema).optional(),
      probeDefinitions: z.array(ProbeDefinitionSchema).optional(),
      snapshotRetention: z.object({
        maxSnapshots: z.number().optional(),
        maxAge: z.number().optional(), // ms
      }).optional(),
    }).optional(),
    
    // Graph visualization configuration
    graphs: z.object({
      types: z.array(GraphTypeSchema).optional(),
    }).optional(),
    
    // Test scenarios
    scenarios: z.object({
      definitions: z.array(ScenarioDefinitionSchema).optional(),
    }).optional(),
    
    // Commands and hotkeys
    commands: z.object({
      enabled: z.boolean().default(true),
      hotkeys: z.record(z.string()).optional(), // Map command ID to hotkey combo
    }).optional(),
    
    // Invariants
    invariants: z.object({
      invariants: z.array(z.string()).refine(
        (ids) => {
          for (const id of ids) {
            const entry = registry.get(id)
            if (!entry) {
              throw new Error(`Invariant ${id} not found in registry`)
            }
          }
          return true
        },
        { message: 'All invariant IDs must exist in registry' }
      ).optional(),
      enforceAt: z.enum(['build', 'runtime', 'both']).default('both'),
    }).optional(),
  }),
})

export type DevToolsYaml = z.infer<typeof DevToolsYamlSchema>

