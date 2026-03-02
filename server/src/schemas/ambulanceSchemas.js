const { z } = require('zod');

const TYPES = ['BLS', 'ALS', 'ICU', 'NEONATAL', 'TRANSPORT'];

const ambulanceSchema = z.object({
  numberPlate: z
    .string()
    .min(1, 'Number plate is required')
    .transform((v) => v.toUpperCase()),
  type: z.enum(TYPES, { required_error: 'Ambulance type is required' }),
  station: z.string().optional(),
  isActive: z.boolean().optional(),
});

const updateAmbulanceSchema = ambulanceSchema.partial();

module.exports = { ambulanceSchema, updateAmbulanceSchema };
