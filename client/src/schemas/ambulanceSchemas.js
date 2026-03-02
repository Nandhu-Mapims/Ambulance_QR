import { z } from 'zod';

export const ambulanceSchema = z.object({
  registrationNumber: z.string().min(1, 'Registration number is required'),
  vehicleType: z.enum(['BLS', 'ALS', 'CCT', 'MCI'], {
    required_error: 'Vehicle type is required',
    invalid_type_error: 'Select a valid vehicle type',
  }),
  status: z.enum(['available', 'dispatched', 'maintenance', 'offline']).optional(),
  location: z.string().optional(),
  notes: z.string().optional(),
});
