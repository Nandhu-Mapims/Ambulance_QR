const { z } = require('zod');

const responseSchema = z.object({
  key: z.string().min(1),
  value: z.union([z.string(), z.number(), z.boolean(), z.null()]).optional(),
  evidenceUrl: z.string().url().optional().nullable(),
});

const tripMetaSchema = z.object({
  patientId: z.string().optional(),
  tripType: z.enum(['EMERGENCY', 'TRANSFER', 'ROUTINE']).default('EMERGENCY'),
  from: z.string().optional(),
  to: z.string().optional(),
});

const geoSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
});

const createAuditSchema = z.object({
  ambulanceNumberPlate: z
    .string()
    .min(1, 'Ambulance number plate is required')
    .transform((v) => v.toUpperCase()),
  templateId: z.string().min(1, 'Template ID is required'),
  tripMeta: tripMetaSchema.optional(),
  responses: z.array(responseSchema).min(1, 'At least one response is required'),
  geo: geoSchema.optional().nullable(),
});

module.exports = { createAuditSchema };
