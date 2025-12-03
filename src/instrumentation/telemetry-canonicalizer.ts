/**
 * ✅ ENTELECHIA: Telemetry Canonicalizer
 * 
 * Canonicalizes telemetry YAML → CanonicalTelemetryDescriptor
 * Part of ACT Phase 8.1 — Telemetry Canonicalization
 */

import type { TelemetryYaml } from './telemetry-schema'

/**
 * Canonical telemetry descriptor (output of canonicalization)
 */
export interface CanonicalTelemetryDescriptor {
  logging: {
    channels: CanonicalLogChannel[]
    policy: CanonicalLoggingPolicy
  }
  metrics: {
    definitions: CanonicalMetricDefinition[]
    families: CanonicalEventFamily[]
  }
  errors: {
    categories: CanonicalErrorCategory[]
    routing: CanonicalErrorRouting
  }
  privacy: {
    redaction: CanonicalRedactionPolicy
    retention: CanonicalRetentionPolicy
  }
  invariants: {
    declared: string[]
    enforceAt: 'build' | 'runtime' | 'both'
  }
}

export interface CanonicalLogChannel {
  id: string
  name: string
  severity: 'debug' | 'info' | 'warn' | 'error'
  enabled: boolean
  redaction?: {
    fields?: string[]
    patterns?: string[]
  }
}

export interface CanonicalLoggingPolicy {
  allowlist?: string[]
  blocklist?: string[]
  maxBufferSize: number
  saveInterval: number
}

export interface CanonicalMetricDefinition {
  id: string
  name: string
  type: 'timing' | 'counter' | 'gauge' | 'histogram'
  unit?: 'ms' | 'bytes' | 'count' | 'percent'
  buckets?: number[]
  thresholds?: {
    warn?: number
    error?: number
  }
  sampling?: {
    rate?: number
    window?: number
  }
}

export interface CanonicalEventFamily {
  id: string
  name: string
  events: string[]
  rollup?: {
    window?: number
    aggregate?: 'sum' | 'avg' | 'max' | 'min'
  }
}

export interface CanonicalErrorCategory {
  id: string
  name: string
  patterns?: string[]
  routing?: {
    channel?: string
    deduplicate?: boolean
    deduplicationWindow?: number
  }
}

export interface CanonicalErrorRouting {
  defaultChannel?: string
  deduplicationEnabled: boolean
}

export interface CanonicalRedactionPolicy {
  defaultFields?: string[]
  defaultPatterns?: string[]
}

export interface CanonicalRetentionPolicy {
  maxAge?: number
  maxEntries?: number
}

/**
 * Canonicalization result
 */
export interface TelemetryCanonicalizationResult {
  descriptor: CanonicalTelemetryDescriptor
  errors: string[]
  warnings: string[]
}

/**
 * Canonicalize telemetry YAML
 */
export function canonicalizeTelemetry(
  telemetryYaml: TelemetryYaml
): TelemetryCanonicalizationResult {
  const errors: string[] = []
  const warnings: string[] = []
  
  const telemetry = telemetryYaml.telemetry
  
  // Canonicalize logging
  const logging = telemetry.logging ? {
    channels: telemetry.logging.channels.map(ch => ({
      id: ch.id,
      name: ch.name,
      severity: ch.severity,
      enabled: ch.enabled,
      redaction: ch.redaction,
    })),
    policy: {
      allowlist: telemetry.logging.policy?.allowlist,
      blocklist: telemetry.logging.policy?.blocklist,
      maxBufferSize: telemetry.logging.policy?.maxBufferSize ?? 1000,
      saveInterval: telemetry.logging.policy?.saveInterval ?? 5000,
    },
  } : {
    channels: [],
    policy: {
      maxBufferSize: 1000,
      saveInterval: 5000,
    },
  }
  
  // Canonicalize metrics
  const metrics = telemetry.metrics ? {
    definitions: telemetry.metrics.definitions?.map(def => ({
      id: def.id,
      name: def.name,
      type: def.type,
      unit: def.unit,
      buckets: def.buckets,
      thresholds: def.thresholds,
      sampling: def.sampling,
    })) ?? [],
    families: telemetry.metrics.families?.map(fam => ({
      id: fam.id,
      name: fam.name,
      events: fam.events,
      rollup: fam.rollup,
    })) ?? [],
  } : {
    definitions: [],
    families: [],
  }
  
  // Canonicalize errors
  const errorsConfig = telemetry.errors ? {
    categories: telemetry.errors.categories?.map(cat => ({
      id: cat.id,
      name: cat.name,
      patterns: cat.patterns,
      routing: cat.routing,
    })) ?? [],
    routing: {
      defaultChannel: telemetry.errors.routing?.defaultChannel,
      deduplicationEnabled: telemetry.errors.routing?.deduplicationEnabled ?? true,
    },
  } : {
    categories: [],
    routing: {
      deduplicationEnabled: true,
    },
  }
  
  // Canonicalize privacy
  const privacy = telemetry.privacy ? {
    redaction: {
      defaultFields: telemetry.privacy.redaction?.defaultFields,
      defaultPatterns: telemetry.privacy.redaction?.defaultPatterns,
    },
    retention: {
      maxAge: telemetry.privacy.retention?.maxAge,
      maxEntries: telemetry.privacy.retention?.maxEntries,
    },
  } : {
    redaction: {},
    retention: {},
  }
  
  // Canonicalize invariants
  const invariants = {
    declared: telemetry.invariants?.invariants ?? [],
    enforceAt: telemetry.invariants?.enforceAt ?? 'both',
  }
  
  const descriptor: CanonicalTelemetryDescriptor = {
    logging,
    metrics,
    errors: errorsConfig,
    privacy,
    invariants,
  }
  
  return {
    descriptor,
    errors,
    warnings,
  }
}

