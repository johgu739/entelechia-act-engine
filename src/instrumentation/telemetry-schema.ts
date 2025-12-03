/**
 * ✅ ENTELECHIA: Telemetry YAML Schema
 * 
 * Zod schema for validating telemetry YAML files.
 * 
 * PRINCIPLE: All telemetry configuration must be declarative in FORM.
 * Metrics, logging channels, thresholds, and policies are defined here.
 */

import { z } from 'zod'
import { registry } from '@entelechia/invariant-engine'

/**
 * Log Channel Schema
 * 
 * Defines a logging channel (auth, workspace, dashboard, etc.)
 */
const LogChannelSchema = z.object({
  id: z.string().min(1, 'Channel ID is required'),
  name: z.string().min(1, 'Channel name is required'),
  severity: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  enabled: z.boolean().default(true),
  redaction: z.object({
    fields: z.array(z.string()).optional(), // Fields to redact
    patterns: z.array(z.string()).optional(), // Regex patterns to redact
  }).optional(),
})

/**
 * Metric Definition Schema
 * 
 * Defines a performance metric (timing, counter, gauge, etc.)
 */
const MetricDefinitionSchema = z.object({
  id: z.string().min(1, 'Metric ID is required'),
  name: z.string().min(1, 'Metric name is required'),
  type: z.enum(['timing', 'counter', 'gauge', 'histogram']),
  unit: z.enum(['ms', 'bytes', 'count', 'percent']).optional(),
  buckets: z.array(z.number()).optional(), // Histogram buckets
  thresholds: z.object({
    warn: z.number().optional(),
    error: z.number().optional(),
  }).optional(),
  sampling: z.object({
    rate: z.number().min(0).max(1).optional(), // Sampling rate (0-1)
    window: z.number().optional(), // Sampling window in ms
  }).optional(),
})

/**
 * Event Family Schema
 * 
 * Groups related events together
 */
const EventFamilySchema = z.object({
  id: z.string().min(1, 'Event family ID is required'),
  name: z.string().min(1, 'Event family name is required'),
  events: z.array(z.string()).min(1, 'At least one event is required'),
  rollup: z.object({
    window: z.number().optional(), // Rollup window in ms
    aggregate: z.enum(['sum', 'avg', 'max', 'min']).optional(),
  }).optional(),
})

/**
 * Error Category Schema
 * 
 * Defines error classification and routing rules
 */
const ErrorCategorySchema = z.object({
  id: z.string().min(1, 'Error category ID is required'),
  name: z.string().min(1, 'Error category name is required'),
  patterns: z.array(z.string()).optional(), // Regex patterns to match
  routing: z.object({
    channel: z.string().optional(), // Log channel to route to
    deduplicate: z.boolean().default(true),
    deduplicationWindow: z.number().optional(), // Window in ms
  }).optional(),
})

/**
 * Telemetry YAML Schema
 */
export const TelemetryYamlSchema = z.object({
  telemetry: z.object({
    // Logging configuration
    logging: z.object({
      channels: z.array(LogChannelSchema).min(1, 'At least one channel is required'),
      policy: z.object({
        allowlist: z.array(z.string()).optional(), // Allowed log categories
        blocklist: z.array(z.string()).optional(), // Blocked log categories
        maxBufferSize: z.number().default(1000),
        saveInterval: z.number().default(5000), // Save to localStorage interval in ms
      }).optional(),
    }).optional(),
    
    // Metrics configuration
    metrics: z.object({
      definitions: z.array(MetricDefinitionSchema).optional(),
      families: z.array(EventFamilySchema).optional(),
    }).optional(),
    
    // Error handling configuration
    errors: z.object({
      categories: z.array(ErrorCategorySchema).optional(),
      routing: z.object({
        defaultChannel: z.string().optional(),
        deduplicationEnabled: z.boolean().default(true),
      }).optional(),
    }).optional(),
    
    // Privacy and retention
    privacy: z.object({
      redaction: z.object({
        defaultFields: z.array(z.string()).optional(),
        defaultPatterns: z.array(z.string()).optional(),
      }).optional(),
      retention: z.object({
        maxAge: z.number().optional(), // Max age in ms
        maxEntries: z.number().optional(),
      }).optional(),
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

export type TelemetryYaml = z.infer<typeof TelemetryYamlSchema>

