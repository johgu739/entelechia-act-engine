/**
 * ✅ ENTELECHIA: DevTools Canonicalizer
 * 
 * Canonicalizes devtools YAML → CanonicalDevToolsDescriptor
 * Part of ACT Phase 8.2 — DevTools Canonicalization
 */

import type { DevToolsYaml } from './devtools-schema'

/**
 * Canonical devtools descriptor (output of canonicalization)
 */
export interface CanonicalDevToolsDescriptor {
  dashboard: {
    panels: CanonicalPanelDefinition[]
    layout: CanonicalDashboardLayout
  }
  inspector: {
    sections: CanonicalInspectorSection[]
    probeDefinitions: CanonicalProbeDefinition[]
    snapshotRetention: CanonicalSnapshotRetention
  }
  graphs: {
    types: CanonicalGraphType[]
  }
  scenarios: {
    definitions: CanonicalScenarioDefinition[]
  }
  commands: {
    enabled: boolean
    hotkeys: Record<string, string>
  }
  invariants: {
    declared: string[]
    enforceAt: 'build' | 'runtime' | 'both'
  }
}

export interface CanonicalPanelDefinition {
  id: string
  title: string
  type: 'list' | 'detail' | 'timeline' | 'snapshots' | 'causal' | 'coverage' | 'violations' | 'livefeed'
  layout?: {
    region: 'sidebar' | 'content' | 'overlay'
    width?: number
    height?: number
  }
  dataSource?: {
    type: 'invariants' | 'violations' | 'probes' | 'snapshots' | 'coverage'
    filter?: {
      status?: 'ALL' | 'PASS' | 'FAIL' | 'NEVER_TRIGGERED'
      category?: string[]
      severity?: 'low' | 'medium' | 'high' | 'critical'
    }
  }
  grouping?: {
    by?: 'category' | 'severity' | 'status' | 'component'
    sort?: 'id' | 'name' | 'status' | 'severity'
    order?: 'asc' | 'desc'
  }
}

export interface CanonicalDashboardLayout {
  sidebarWidth: number
  refreshInterval: number
}

export interface CanonicalInspectorSection {
  id: string
  title: string
  fields?: string[]
  format: 'tree' | 'table' | 'json' | 'graph'
  schema?: Record<string, any>
}

export interface CanonicalProbeDefinition {
  id: string
  sourceComponent?: string
  sourceFile?: string
  invariantIds?: string[]
  snapshotSchema?: Record<string, any>
}

export interface CanonicalSnapshotRetention {
  maxSnapshots?: number
  maxAge?: number
}

export interface CanonicalGraphType {
  id: string
  name: string
  layout: 'hierarchical' | 'force' | 'circular' | 'linear'
  nodeTypes?: Array<{
    id: string
    label: string
    color?: string
    shape?: 'circle' | 'square' | 'diamond' | 'triangle'
  }>
  edgeTypes?: Array<{
    id: string
    label: string
    color?: string
    style?: 'solid' | 'dashed' | 'dotted'
  }>
}

export interface CanonicalScenarioDefinition {
  id: string
  name: string
  category: 'navigation' | 'continuity' | 'auth' | 'workspace' | 'dashboard' | 'general'
  preConditions?: Record<string, any>
  postConditions?: Record<string, any>
  expectedViolations?: string[]
  steps?: Array<{
    action: string
    params?: Record<string, any>
  }>
}

/**
 * Canonicalization result
 */
export interface DevToolsCanonicalizationResult {
  descriptor: CanonicalDevToolsDescriptor
  errors: string[]
  warnings: string[]
}

/**
 * Canonicalize devtools YAML
 */
export function canonicalizeDevTools(
  devtoolsYaml: DevToolsYaml
): DevToolsCanonicalizationResult {
  const errors: string[] = []
  const warnings: string[] = []
  
  const devtools = devtoolsYaml.devtools
  
  // Canonicalize dashboard
  const dashboard = devtools.dashboard ? {
    panels: devtools.dashboard.panels.map(panel => ({
      id: panel.id,
      title: panel.title,
      type: panel.type,
      layout: panel.layout,
      dataSource: panel.dataSource,
      grouping: panel.grouping,
    })),
    layout: {
      sidebarWidth: devtools.dashboard.layout?.sidebarWidth ?? 320,
      refreshInterval: devtools.dashboard.layout?.refreshInterval ?? 5000,
    },
  } : {
    panels: [],
    layout: {
      sidebarWidth: 320,
      refreshInterval: 5000,
    },
  }
  
  // Canonicalize inspector
  const inspector = devtools.inspector ? {
    sections: devtools.inspector.sections?.map(sec => ({
      id: sec.id,
      title: sec.title,
      fields: sec.fields,
      format: sec.format,
      schema: sec.schema,
    })) ?? [],
    probeDefinitions: devtools.inspector.probeDefinitions?.map(probe => ({
      id: probe.id,
      sourceComponent: probe.sourceComponent,
      sourceFile: probe.sourceFile,
      invariantIds: probe.invariantIds,
      snapshotSchema: probe.snapshotSchema,
    })) ?? [],
    snapshotRetention: {
      maxSnapshots: devtools.inspector.snapshotRetention?.maxSnapshots,
      maxAge: devtools.inspector.snapshotRetention?.maxAge,
    },
  } : {
    sections: [],
    probeDefinitions: [],
    snapshotRetention: {},
  }
  
  // Canonicalize graphs
  const graphs = {
    types: devtools.graphs?.types?.map(graph => ({
      id: graph.id,
      name: graph.name,
      layout: graph.layout,
      nodeTypes: graph.nodeTypes,
      edgeTypes: graph.edgeTypes,
    })) ?? [],
  }
  
  // Canonicalize scenarios
  const scenarios = {
    definitions: devtools.scenarios?.definitions?.map(scenario => ({
      id: scenario.id,
      name: scenario.name,
      category: scenario.category,
      preConditions: scenario.preConditions,
      postConditions: scenario.postConditions,
      expectedViolations: scenario.expectedViolations,
      steps: scenario.steps,
    })) ?? [],
  }
  
  // Canonicalize commands
  const commands = {
    enabled: devtools.commands?.enabled ?? true,
    hotkeys: devtools.commands?.hotkeys ?? {},
  }
  
  // Canonicalize invariants
  const invariants = {
    declared: devtools.invariants?.invariants ?? [],
    enforceAt: devtools.invariants?.enforceAt ?? 'both',
  }
  
  const descriptor: CanonicalDevToolsDescriptor = {
    dashboard,
    inspector,
    graphs,
    scenarios,
    commands,
    invariants,
  }
  
  return {
    descriptor,
    errors,
    warnings,
  }
}

